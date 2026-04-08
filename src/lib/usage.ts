import type { Prisma, PrismaClient, PublicationJob, WorkspaceDailyUsage, WorkspaceUsagePeriod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canPlanConnectPlatform,
  canPlanPublishToPlatform,
  getDailyPlatformCap,
  getPlanConfig,
  isPlanId,
  type PlanId,
} from "@/lib/plans";
import type { SubscriptionRecord } from "@/lib/subscription";

type TxClient = Prisma.TransactionClient | PrismaClient;

type WorkspacePlanContext = {
  plan: ReturnType<typeof getPlanConfig>;
  subscription: SubscriptionRecord;
  workspaceStatus: "ACTIVE" | "PAUSED" | "ARCHIVED";
};

type ReserveResult =
  | {
      ok: true;
      usagePeriod: WorkspaceUsagePeriod;
      dailyUsage: WorkspaceDailyUsage | null;
      xSpendChargeCents: number;
    }
  | {
      ok: false;
      reason: "BLOCKED_PLAN_ACCESS" | "BLOCKED_DAILY_CAP" | "BLOCKED_QUOTA" | "BLOCKED_X_BUDGET";
      message: string;
      usagePeriod: WorkspaceUsagePeriod | null;
      dailyUsage: WorkspaceDailyUsage | null;
    };

type BlockReason = "BLOCKED_PLAN_ACCESS" | "BLOCKED_DAILY_CAP" | "BLOCKED_QUOTA" | "BLOCKED_X_BUDGET";

const DEFAULT_X_RATE_CARD: Record<string, number> = {
  tweet_media_publish: 20,
  tweet_text_publish: 8,
};

function isSubscriptionRecord(value: unknown): value is SubscriptionRecord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.plan === "string" && typeof candidate.startedAt === "string";
}

function getUtcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseJsonObject(value: unknown): Record<string, number> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => typeof item === "number")
      .map(([key, item]) => [key, item as number]);
    return Object.fromEntries(entries);
  }

  if (typeof value === "string") {
    try {
      return parseJsonObject(JSON.parse(value));
    } catch {
      return {};
    }
  }

  return {};
}

function normalizeSubscription(raw: unknown, fallbackPlan: string): SubscriptionRecord {
  if (isSubscriptionRecord(raw) && isPlanId(raw.plan)) {
    return {
      ...raw,
      currentPeriodEnd: raw.currentPeriodEnd ?? raw.expiresAt ?? null,
      currentPeriodStart: raw.currentPeriodStart ?? raw.startedAt ?? null,
      expiresAt: raw.expiresAt ?? raw.currentPeriodEnd ?? null,
    };
  }

  const normalizedPlan: PlanId = isPlanId(fallbackPlan) ? fallbackPlan : "free";
  const now = new Date();
  return {
    billingCycle: "monthly",
    currentPeriodEnd: normalizedPlan === "free" ? null : now.toISOString(),
    currentPeriodStart: normalizedPlan === "free" ? null : now.toISOString(),
    expiresAt: normalizedPlan === "free" ? null : now.toISOString(),
    hasUsedTrial: normalizedPlan !== "free",
    phase: normalizedPlan === "free" ? "free" : "paid",
    plan: normalizedPlan,
    startedAt: now.toISOString(),
  };
}

function getEffectivePlanId(subscription: SubscriptionRecord): PlanId {
  if (subscription.phase === "free" || subscription.plan === "free") {
    return "free";
  }

  const expiration = subscription.currentPeriodEnd ?? subscription.expiresAt;
  if (!expiration) {
    return subscription.plan;
  }

  return new Date(expiration).getTime() > Date.now() ? subscription.plan : "free";
}

function getPeriodBounds(subscription: SubscriptionRecord, now = new Date()) {
  const start = subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart) : now;
  const end = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : now;
  return {
    start,
    end,
  };
}

async function getWorkspacePlanContext(workspaceId: string): Promise<WorkspacePlanContext> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      owner: {
        select: {
          subscription: true,
          userType: true,
        },
      },
      status: true,
    },
  });

  const ownerPlanId = workspace?.owner?.userType ?? "free";
  const subscription = normalizeSubscription(workspace?.owner?.subscription, ownerPlanId);
  const effectivePlanId = getEffectivePlanId(subscription);
  return {
    plan: getPlanConfig(effectivePlanId),
    subscription,
    workspaceStatus: workspace?.status ?? "ACTIVE",
  };
}

export async function getWorkspacePlan(workspaceId: string) {
  return getWorkspacePlanContext(workspaceId);
}

export async function assertWorkspaceCanConnectPlatform(workspaceId: string, platform: string) {
  const { plan } = await getWorkspacePlanContext(workspaceId);
  return canPlanConnectPlatform(plan.id, platform);
}

async function getActiveXRateCard() {
  const activeCards = await prisma.xRateCard.findMany({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  const costTable = { ...DEFAULT_X_RATE_CARD };
  for (const card of activeCards) {
    costTable[card.code] = card.estimatedCostCents;
  }

  return costTable;
}

function getEstimatedXCharge(platform: string, mediaUrls: string[], xRateCard: Record<string, number>) {
  if (platform !== "twitter") return 0;
  return mediaUrls.length > 0 ? xRateCard.tweet_media_publish : xRateCard.tweet_text_publish;
}

async function ensureUsagePeriod(
  tx: TxClient,
  workspaceId: string,
  context: WorkspacePlanContext
) {
  const { start, end } = getPeriodBounds(context.subscription);

  return tx.workspaceUsagePeriod.upsert({
    where: {
      workspaceId_periodStart_periodEnd: {
        workspaceId,
        periodStart: start,
        periodEnd: end,
      },
    },
    create: {
      workspaceId,
      plan: context.plan.id,
      billingCycle: context.subscription.billingCycle,
      periodStart: start,
      periodEnd: end,
      platformJobsIncluded: context.plan.monthlyPlatformJobs,
      xSpendCapCents: context.plan.xSpendCapCents,
      perPlatformMonthlyCounts: {},
    },
    update: {
      plan: context.plan.id,
      billingCycle: context.subscription.billingCycle,
      platformJobsIncluded: context.plan.monthlyPlatformJobs,
      xSpendCapCents: context.plan.xSpendCapCents,
    },
  });
}

async function incrementBlockedUsage(
  tx: TxClient,
  input: {
    workspaceId: string;
    platform: string;
    usagePeriod: WorkspaceUsagePeriod | null;
    reason: BlockReason;
    xBlockedCents?: number;
  }
) {
  if (input.usagePeriod) {
    await tx.workspaceUsagePeriod.update({
      where: { id: input.usagePeriod.id },
      data: {
        platformJobsBlocked: { increment: input.reason === "BLOCKED_QUOTA" ? 1 : 0 },
        xSpendBlockedCents: { increment: input.reason === "BLOCKED_X_BUDGET" ? input.xBlockedCents ?? 0 : 0 },
      },
    });
  }

  if (input.reason === "BLOCKED_DAILY_CAP") {
    const dayStart = getUtcDayStart();
    await tx.workspaceDailyUsage.upsert({
      where: {
        workspaceId_date_platform: {
          workspaceId: input.workspaceId,
          date: dayStart,
          platform: input.platform,
        },
      },
      create: {
        workspaceId: input.workspaceId,
        date: dayStart,
        platform: input.platform,
        blockedJobs: 1,
      },
      update: {
        blockedJobs: { increment: 1 },
      },
    });
  }
}

export async function reservePublicationUsage(
  tx: TxClient,
  input: {
    job: PublicationJob;
    mediaUrls: string[];
  }
): Promise<ReserveResult> {
  if (input.job.quotaChargedAt) {
    const context = await getWorkspacePlanContext(input.job.workspaceId);
    const usagePeriod = await ensureUsagePeriod(tx, input.job.workspaceId, context);
    const dailyUsage = getDailyPlatformCap(context.plan.id, input.job.platform)
      ? await tx.workspaceDailyUsage.findUnique({
          where: {
            workspaceId_date_platform: {
              workspaceId: input.job.workspaceId,
              date: getUtcDayStart(),
              platform: input.job.platform,
            },
          },
        })
      : null;
    return {
      ok: true,
      usagePeriod,
      dailyUsage,
      xSpendChargeCents: input.job.xSpendChargedCents,
    };
  }

  const context = await getWorkspacePlanContext(input.job.workspaceId);
  const usagePeriod = await ensureUsagePeriod(tx, input.job.workspaceId, context);

  if (context.workspaceStatus !== "ACTIVE") {
    await incrementBlockedUsage(tx, {
      workspaceId: input.job.workspaceId,
      platform: input.job.platform,
      usagePeriod,
      reason: "BLOCKED_PLAN_ACCESS",
    });
    return {
      ok: false,
      reason: "BLOCKED_PLAN_ACCESS",
      message: `This workspace is ${context.workspaceStatus.toLowerCase()} and cannot publish right now.`,
      usagePeriod,
      dailyUsage: null,
    };
  }

  if (!canPlanPublishToPlatform(context.plan.id, input.job.platform)) {
    await incrementBlockedUsage(tx, {
      workspaceId: input.job.workspaceId,
      platform: input.job.platform,
      usagePeriod,
      reason: "BLOCKED_PLAN_ACCESS",
    });
    return {
      ok: false,
      reason: "BLOCKED_PLAN_ACCESS",
      message: `${context.plan.label} cannot publish to ${input.job.platform}.`,
      usagePeriod,
      dailyUsage: null,
    };
  }

  const dailyCap = getDailyPlatformCap(context.plan.id, input.job.platform);
  let dailyUsage: WorkspaceDailyUsage | null = null;
  if (dailyCap !== null) {
    const dayStart = getUtcDayStart();
    dailyUsage = await tx.workspaceDailyUsage.upsert({
      where: {
        workspaceId_date_platform: {
          workspaceId: input.job.workspaceId,
          date: dayStart,
          platform: input.job.platform,
        },
      },
      create: {
        workspaceId: input.job.workspaceId,
        date: dayStart,
        platform: input.job.platform,
      },
      update: {},
    });

    if (dailyUsage.usedJobs >= dailyCap) {
      await incrementBlockedUsage(tx, {
        workspaceId: input.job.workspaceId,
        platform: input.job.platform,
        usagePeriod,
        reason: "BLOCKED_DAILY_CAP",
      });
      return {
        ok: false,
        reason: "BLOCKED_DAILY_CAP",
        message: `${input.job.platform} hit its daily publish cap for this workspace.`,
        usagePeriod,
        dailyUsage,
      };
    }
  }

  if (
    context.plan.monthlyPlatformJobs !== null &&
    usagePeriod.platformJobsUsed + input.job.quotaChargeUnits + 1 > context.plan.monthlyPlatformJobs
  ) {
    await incrementBlockedUsage(tx, {
      workspaceId: input.job.workspaceId,
      platform: input.job.platform,
      usagePeriod,
      reason: "BLOCKED_QUOTA",
    });
    return {
      ok: false,
      reason: "BLOCKED_QUOTA",
      message: "Monthly platform job quota reached for this workspace.",
      usagePeriod,
      dailyUsage,
    };
  }

  const xRateCard = await getActiveXRateCard();
  const xChargeCents = getEstimatedXCharge(input.job.platform, input.mediaUrls, xRateCard);
  if (
    context.plan.xSpendCapCents !== null &&
    xChargeCents > 0 &&
    usagePeriod.xSpendUsedCents + xChargeCents > context.plan.xSpendCapCents
  ) {
    await incrementBlockedUsage(tx, {
      workspaceId: input.job.workspaceId,
      platform: input.job.platform,
      usagePeriod,
      reason: "BLOCKED_X_BUDGET",
      xBlockedCents: xChargeCents,
    });
    return {
      ok: false,
      reason: "BLOCKED_X_BUDGET",
      message: "Included X publishing capacity has been reached for this billing period.",
      usagePeriod,
      dailyUsage,
    };
  }

  const perPlatformMonthlyCounts = parseJsonObject(usagePeriod.perPlatformMonthlyCounts);
  perPlatformMonthlyCounts[input.job.platform] = (perPlatformMonthlyCounts[input.job.platform] ?? 0) + 1;

  const nextUsage = await tx.workspaceUsagePeriod.update({
    where: { id: usagePeriod.id },
    data: {
      platformJobsUsed: { increment: 1 },
      xSpendUsedCents: { increment: xChargeCents },
      perPlatformMonthlyCounts: perPlatformMonthlyCounts as unknown as Prisma.InputJsonValue,
    },
  });

  if (dailyUsage) {
    dailyUsage = await tx.workspaceDailyUsage.update({
      where: { id: dailyUsage.id },
      data: {
        usedJobs: { increment: 1 },
      },
    });
  }

  await tx.publicationJob.update({
    where: { id: input.job.id },
    data: {
      quotaChargedAt: new Date(),
      quotaChargeUnits: 1,
      xSpendChargedCents: xChargeCents,
    },
  });

  return {
    ok: true,
    usagePeriod: nextUsage,
    dailyUsage,
    xSpendChargeCents: xChargeCents,
  };
}
