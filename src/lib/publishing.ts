import type { Prisma, PublicationJob, SocialAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getProviderAdapter } from "@/lib/providers";
import { buildPostPlatformConfig, normalizePostPlatformConfig, type PostPlatformConfig } from "@/lib/postPlatformConfig";
import { findConnectedAccount, getWorkspaceSocialAccounts } from "@/lib/workspaces";
import { reservePublicationUsage } from "@/lib/usage";

type PostPayload = {
  content: string;
  platforms: string[];
  status: "Scheduled" | "Published" | "Draft";
  date: string;
  time: string;
  autoOptimize: boolean;
  mediaUrls: string[];
  platformConfig: PostPlatformConfig;
  scheduledAt?: string | null;
};

type SavePostInput = {
  postId?: string;
  userId: string;
  workspaceId: string;
  payload: PostPayload;
};

function getPostMediaKind(url: string) {
  return /\.(mp4|mov|webm|avi)(\?.*)?$/i.test(url) ? "video" : "image";
}

async function syncPostRelations(
  tx: Prisma.TransactionClient,
  postId: string,
  payload: PostPayload
) {
  const normalizedConfig = normalizePostPlatformConfig(
    payload.platformConfig,
    payload.platforms,
    payload.mediaUrls
  );

  await tx.postVariant.deleteMany({ where: { postId } });
  await tx.mediaAsset.deleteMany({ where: { postId } });

  if (payload.mediaUrls.length > 0) {
    await tx.mediaAsset.createMany({
      data: payload.mediaUrls.map((url, index) => ({
        postId,
        kind: getPostMediaKind(url),
        url,
        sortOrder: index,
      })),
    });
  }

  await tx.postVariant.createMany({
    data: payload.platforms.map((platform) => ({
      postId,
      platform,
      content: normalizedConfig.textByPlatform[platform] ?? payload.content,
      mediaUrls: normalizedConfig.mediaByPlatform[platform] ?? [],
    })),
  });
}

async function replacePublicationJobs(
  tx: Prisma.TransactionClient,
  postId: string,
  workspaceId: string,
  payload: PostPayload
) {
  await tx.publicationResult.deleteMany({ where: { postId } });
  await tx.publicationJob.deleteMany({
    where: {
      postId,
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
  });

  if (payload.status === "Draft") {
    return;
  }

  const normalizedConfig = normalizePostPlatformConfig(
    payload.platformConfig,
    payload.platforms,
    payload.mediaUrls
  );

  await tx.publicationJob.createMany({
    data: payload.platforms.map((platform) => ({
      postId,
      workspaceId,
      platform,
      status: "PENDING",
      scheduledFor:
        payload.status === "Scheduled" && payload.scheduledAt
          ? new Date(payload.scheduledAt)
          : new Date(),
      payload: buildPostPlatformConfig(
        [platform],
        {
          [platform]: normalizedConfig.textByPlatform[platform] ?? payload.content,
        },
        {
          [platform]: normalizedConfig.mediaByPlatform[platform] ?? [],
        }
      ) as unknown as Prisma.InputJsonValue,
    })),
  });
}

export async function savePostGraph({ postId, userId, workspaceId, payload }: SavePostInput) {
  return prisma.$transaction(async (tx) => {
    const savedPost = postId
      ? await tx.post.update({
          where: { id: postId },
          data: {
            content: payload.content,
            platforms: payload.platforms,
            platformConfig: payload.platformConfig as Prisma.InputJsonValue,
            status: payload.status,
            date: payload.date,
            time: payload.time,
            autoOptimize: payload.autoOptimize,
            mediaUrls: payload.mediaUrls,
            scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
            workspaceId,
          },
        })
      : await tx.post.create({
          data: {
            userId,
            workspaceId,
            content: payload.content,
            platforms: payload.platforms,
            platformConfig: payload.platformConfig as Prisma.InputJsonValue,
            status: payload.status,
            date: payload.date,
            time: payload.time,
            autoOptimize: payload.autoOptimize,
            mediaUrls: payload.mediaUrls,
            scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
          },
        });

    await syncPostRelations(tx, savedPost.id, payload);
    await replacePublicationJobs(tx, savedPost.id, workspaceId, payload);

    await logAuditEvent({
      action: postId ? "post.updated" : "post.created",
      entityType: "post",
      entityId: savedPost.id,
      userId,
      workspaceId,
      payload: {
        status: payload.status,
        platforms: payload.platforms,
      },
    });

    return savedPost;
  });
}

async function finalizePostStatus(tx: Prisma.TransactionClient, postId: string) {
  const jobs = await tx.publicationJob.findMany({
    where: { postId },
    select: { status: true },
  });

  if (jobs.length === 0) {
    return;
  }

  const allSucceeded = jobs.every((job) => job.status === "SUCCEEDED");
  const allFailed = jobs.every((job) => job.status === "FAILED");
  const hasBlocked = jobs.some((job) =>
    ["BLOCKED_QUOTA", "BLOCKED_X_BUDGET", "BLOCKED_PLAN_ACCESS", "BLOCKED_DAILY_CAP"].includes(job.status)
  );
  const hasMixedTerminal =
    jobs.some((job) => job.status === "SUCCEEDED") &&
    jobs.some((job) => job.status === "FAILED");

  await tx.post.update({
    where: { id: postId },
    data: {
      status: allSucceeded
        ? "Published"
        : allFailed
          ? "Failed"
          : hasMixedTerminal
            ? "Partial"
            : hasBlocked
              ? "Scheduled"
              : "Scheduled",
    },
  });
}

async function getJobPayload(job: PublicationJob) {
  const rawPayload = job.payload && typeof job.payload === "object" ? (job.payload as Record<string, unknown>) : {};
  const config = normalizePostPlatformConfig(rawPayload, [job.platform], []);
  return {
    content: config.textByPlatform[job.platform] ?? "",
    mediaUrls: config.mediaByPlatform[job.platform] ?? [],
  };
}

async function markJobFailed(
  tx: Prisma.TransactionClient,
  job: PublicationJob,
  message: string
) {
  await tx.publicationJob.update({
    where: { id: job.id },
    data: {
      status: "FAILED",
      attempts: { increment: 1 },
      finishedAt: new Date(),
      lastError: message,
    },
  });

  await tx.publicationResult.upsert({
    where: { jobId: job.id },
    create: {
      jobId: job.id,
      postId: job.postId,
      workspaceId: job.workspaceId,
      platform: job.platform,
      status: "FAILED",
      errorMessage: message,
    },
    update: {
      status: "FAILED",
      errorMessage: message,
    },
  });

  await finalizePostStatus(tx, job.postId);
}

async function markJobBlocked(
  tx: Prisma.TransactionClient,
  job: PublicationJob,
  status: "BLOCKED_QUOTA" | "BLOCKED_X_BUDGET" | "BLOCKED_PLAN_ACCESS" | "BLOCKED_DAILY_CAP",
  message: string
) {
  await tx.publicationJob.update({
    where: { id: job.id },
    data: {
      status,
      finishedAt: new Date(),
      lastError: message,
    },
  });

  await tx.publicationResult.upsert({
    where: { jobId: job.id },
    create: {
      jobId: job.id,
      postId: job.postId,
      workspaceId: job.workspaceId,
      platform: job.platform,
      status,
      errorMessage: message,
    },
    update: {
      status,
      errorMessage: message,
    },
  });

  await finalizePostStatus(tx, job.postId);
}

export async function runPublicationJob(jobId: string) {
  const job = await prisma.publicationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return { status: "missing" as const };
  }

  const socialAccounts = await getWorkspaceSocialAccounts(job.workspaceId);
  const socialAccount = findConnectedAccount(socialAccounts, job.platform);

  return prisma.$transaction(async (tx) => {
    await tx.publicationJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    const payload = await getJobPayload(job);

    if (!socialAccount) {
      await markJobFailed(tx, job, `${job.platform} is not connected for this workspace.`);
      return { status: "failed" as const };
    }

    const adapter = getProviderAdapter(job.platform);
    const validation = await adapter.validateMedia(payload);

    if (!validation.ok) {
      await markJobFailed(tx, job, validation.issues.join(" "));
      return { status: "failed" as const };
    }

    const usageReservation = await reservePublicationUsage(tx, {
      job,
      mediaUrls: payload.mediaUrls,
    });

    if (!usageReservation.ok) {
      await markJobBlocked(tx, job, usageReservation.reason, usageReservation.message);
      return { status: "blocked" as const, reason: usageReservation.reason };
    }

    try {
      const published = await adapter.publishNow({
        ...payload,
        postId: job.postId,
        socialAccount: socialAccount as SocialAccount,
        workspaceId: job.workspaceId,
      });

      await tx.publicationJob.update({
        where: { id: job.id },
        data: {
          status: "SUCCEEDED",
          finishedAt: new Date(),
          lastError: null,
        },
      });

      await tx.publicationResult.upsert({
        where: { jobId: job.id },
        create: {
          jobId: job.id,
          postId: job.postId,
          workspaceId: job.workspaceId,
          platform: job.platform,
          status: "SUCCEEDED",
          remoteId: published.remoteId,
          remoteUrl: published.remoteUrl,
          payload: published.payload as Prisma.InputJsonValue | undefined,
        },
        update: {
          status: "SUCCEEDED",
          remoteId: published.remoteId,
          remoteUrl: published.remoteUrl,
          payload: published.payload as Prisma.InputJsonValue | undefined,
          errorMessage: null,
        },
      });

      await finalizePostStatus(tx, job.postId);
      return { status: "succeeded" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publishing failed";
      await markJobFailed(tx, job, message);
      return { status: "failed" as const };
    }
  });
}

export async function runDuePublicationJobs(limit = 20) {
  const now = new Date();
  const jobs = await prisma.publicationJob.findMany({
    where: {
      status: "PENDING",
      OR: [
        { scheduledFor: null },
        { scheduledFor: { lte: now } },
      ],
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });

  const results = [];

  for (const job of jobs) {
    results.push(await runPublicationJob(job.id));
  }

  return {
    checkedAt: now.toISOString(),
    processed: jobs.length,
    results,
  };
}
