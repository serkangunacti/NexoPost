import type { SocialAccount } from "@prisma/client";
import { restoreBlueskyOAuthAgent } from "@/lib/blueskyOAuth";
import { env } from "@/lib/env";
import { preparePlatformMedia, type PreparedMediaAsset } from "@/lib/mediaPreparation";
import { prisma } from "@/lib/prisma";

export const CORE_LAUNCH_PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "bluesky",
] as const;

export type ProviderPlatform = (typeof CORE_LAUNCH_PLATFORMS)[number];

export type ProviderNormalizedContent = {
  content: string;
  mediaUrls: string[];
  preparedMedia: PreparedMediaAsset[];
  warnings: string[];
};

export type ProviderPublishInput = {
  content: string;
  mediaUrls: string[];
  preparedMedia: PreparedMediaAsset[];
  postId: string;
  socialAccount: SocialAccount;
  workspaceId: string;
};

export type ProviderPublishResult = {
  remoteId?: string;
  remoteUrl?: string;
  payload?: Record<string, unknown>;
};

export type ProviderValidationResult = {
  ok: boolean;
  issues: string[];
};

export interface ProviderAdapter {
  platform: ProviderPlatform;
  connect(): Promise<void>;
  refreshToken(account: SocialAccount): Promise<SocialAccount>;
  normalizeContent(input: { content: string; mediaUrls: string[] }): Promise<ProviderNormalizedContent>;
  validateMedia(input: ProviderNormalizedContent): Promise<ProviderValidationResult>;
  publishNow(input: ProviderPublishInput): Promise<ProviderPublishResult>;
  schedule(input: ProviderPublishInput & { scheduledFor: Date }): Promise<ProviderPublishResult>;
  deleteScheduled(input: { remoteId: string; socialAccount: SocialAccount }): Promise<void>;
  fetchAccount(account: SocialAccount): Promise<Record<string, unknown>>;
  fetchAnalytics(account: SocialAccount): Promise<Record<string, unknown>>;
}

class ProviderNotReadyError extends Error {
  constructor(platform: ProviderPlatform, detail = "Provider is connected but publish support is still in rollout.") {
    super(`${platform}: ${detail}`);
  }
}

function parseMetadata(account: SocialAccount) {
  if (account.metadata && typeof account.metadata === "object" && !Array.isArray(account.metadata)) {
    return account.metadata as Record<string, unknown>;
  }

  if (typeof account.metadata === "string") {
    try {
      const parsed = JSON.parse(account.metadata);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  return {};
}

async function fetchArrayBuffer(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch media asset: ${response.status}`);
  }
  return response.arrayBuffer();
}

function guessMimeType(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.includes(".mov")) return "video/quicktime";
  if (normalized.includes(".webm")) return "video/webm";
  if (normalized.includes(".m4v")) return "video/x-m4v";
  return "video/mp4";
}

function buildYouTubeTitle(content: string) {
  const collapsed = content.replace(/\s+/g, " ").trim();
  const withoutTags = collapsed.replace(/[<>]/g, "");
  const firstLine = withoutTags.split("\n").map((line) => line.trim()).find(Boolean) ?? "NexoPost Short";
  return firstLine.slice(0, 100);
}

function buildYouTubeDescription(content: string) {
  return content.replace(/[<>]/g, "").trim().slice(0, 4900);
}

function buildValidationRules(platform: ProviderPlatform, input: ProviderNormalizedContent) {
  const issues = [...input.warnings];

  const contentLengthLimits: Record<ProviderPlatform, number> = {
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    tiktok: 2200,
    youtube: 5000,
    pinterest: 500,
    bluesky: 300,
  };

  const maxMediaCount: Record<ProviderPlatform, number> = {
    twitter: 4,
    linkedin: 1,
    facebook: 10,
    instagram: 10,
    tiktok: 1,
    youtube: 1,
    pinterest: 1,
    bluesky: 4,
  };

  if (input.content.length > contentLengthLimits[platform]) {
    issues.push(`Caption exceeds ${platform} limit of ${contentLengthLimits[platform]} characters.`);
  }

  if (input.preparedMedia.length > maxMediaCount[platform]) {
    issues.push(`${platform} allows up to ${maxMediaCount[platform]} media items in this workflow.`);
  }

  return issues;
}

function getMetaAccessToken(account: SocialAccount) {
  return account.pageAccessToken ?? account.accessToken ?? "";
}

async function publishTwitter(input: ProviderPublishInput): Promise<ProviderPublishResult> {
  if (input.preparedMedia.length > 0) {
    throw new ProviderNotReadyError("twitter", "Media upload will be added after the first text-only launch slice.");
  }

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.socialAccount.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: input.content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Twitter publish error: ${await response.text()}`);
  }

  const data = await response.json() as { data?: { id: string; text: string } };
  return {
    remoteId: data.data?.id,
    remoteUrl: data.data?.id ? `https://x.com/i/web/status/${data.data.id}` : undefined,
    payload: { provider: "twitter", response: data },
  };
}

async function publishLinkedIn(input: ProviderPublishInput): Promise<ProviderPublishResult> {
  if (input.preparedMedia.length > 0) {
    throw new ProviderNotReadyError("linkedin", "Media publishing is staged after the text-first release.");
  }

  const metadata = parseMetadata(input.socialAccount);
  const selectedTarget = typeof metadata.selectedPublishTarget === "string"
    ? metadata.selectedPublishTarget
    : undefined;
  const ownerUrn = selectedTarget
    ?? (input.socialAccount.externalAccountId.startsWith("urn:")
      ? input.socialAccount.externalAccountId
      : `urn:li:person:${input.socialAccount.externalAccountId}`);

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.socialAccount.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: ownerUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: input.content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn publish error: ${await response.text()}`);
  }

  const resource = response.headers.get("x-restli-id") ?? undefined;
  return {
    remoteId: resource,
    payload: { provider: "linkedin", resource },
  };
}

async function uploadFacebookPhoto(url: string, account: SocialAccount) {
  const response = await fetch(`https://graph.facebook.com/v19.0/${account.pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      published: "false",
      url,
      access_token: getMetaAccessToken(account),
    }),
  });

  if (!response.ok) {
    throw new Error(`Facebook photo upload error: ${await response.text()}`);
  }

  return response.json() as Promise<{ id: string }>;
}

async function publishFacebook(input: ProviderPublishInput): Promise<ProviderPublishResult> {
  const token = getMetaAccessToken(input.socialAccount);
  if (!token || !input.socialAccount.pageId) {
    throw new Error("Facebook page token is missing for this connection.");
  }

  if (input.preparedMedia.some((asset) => asset.kind === "video")) {
    if (input.preparedMedia.length > 1) {
      throw new Error("Facebook video publishing currently supports a single video asset per post.");
    }

    const response = await fetch(`https://graph.facebook.com/v19.0/${input.socialAccount.pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        description: input.content,
        file_url: input.preparedMedia[0].preparedUrl,
        access_token: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Facebook video publish error: ${await response.text()}`);
    }

    const data = await response.json() as { id?: string };
    return {
      remoteId: data.id,
      payload: { provider: "facebook", response: data },
    };
  }

  if (input.preparedMedia.length === 1) {
    const response = await fetch(`https://graph.facebook.com/v19.0/${input.socialAccount.pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        caption: input.content,
        url: input.preparedMedia[0].preparedUrl,
        access_token: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Facebook photo publish error: ${await response.text()}`);
    }

    const data = await response.json() as { id?: string; post_id?: string };
    return {
      remoteId: data.post_id ?? data.id,
      payload: { provider: "facebook", response: data },
    };
  }

  if (input.preparedMedia.length > 1) {
    const uploaded = await Promise.all(input.preparedMedia.map((asset) => uploadFacebookPhoto(asset.preparedUrl, input.socialAccount)));
    const response = await fetch(`https://graph.facebook.com/v19.0/${input.socialAccount.pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message: input.content,
        attached_media: JSON.stringify(uploaded.map((item) => ({ media_fbid: item.id }))),
        access_token: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Facebook multi-photo publish error: ${await response.text()}`);
    }

    const data = await response.json() as { id?: string };
    return {
      remoteId: data.id,
      payload: { provider: "facebook", response: data },
    };
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${input.socialAccount.pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      message: input.content,
      access_token: token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Facebook text publish error: ${await response.text()}`);
  }

  const data = await response.json() as { id?: string };
  return {
    remoteId: data.id,
    payload: { provider: "facebook", response: data },
  };
}

async function resolveInstagramBusinessId(account: SocialAccount) {
  const metadata = parseMetadata(account);
  const directInstagramUserId = typeof metadata.instagramUserId === "string" ? metadata.instagramUserId : undefined;
  if (directInstagramUserId) {
    return directInstagramUserId;
  }

  if (!account.pageId) {
    throw new Error("Instagram connection is missing a linked Facebook page.");
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${account.pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(getMetaAccessToken(account))}`);
  if (!response.ok) {
    throw new Error(`Instagram account lookup error: ${await response.text()}`);
  }

  const data = await response.json() as { instagram_business_account?: { id?: string } };
  const igUserId = data.instagram_business_account?.id;
  if (!igUserId) {
    throw new Error("No Instagram business account is linked to the selected Facebook page.");
  }
  return igUserId;
}

async function publishInstagram(input: ProviderPublishInput): Promise<ProviderPublishResult> {
  const token = getMetaAccessToken(input.socialAccount);
  if (!token) {
    throw new Error("Instagram publish token is missing.");
  }

  const igUserId = await resolveInstagramBusinessId(input.socialAccount);

  const createContainer = async (params: Record<string, string>) => {
    const response = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...params,
        access_token: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Instagram media container error: ${await response.text()}`);
    }

    return response.json() as Promise<{ id: string }>;
  };

  let creationId: string;

  if (input.preparedMedia.length === 0) {
    throw new Error("Instagram publishing requires at least one image or video asset.");
  }

  if (input.preparedMedia.length === 1) {
    const asset = input.preparedMedia[0];
    const params: Record<string, string> =
      asset.kind === "video"
        ? { media_type: "REELS", video_url: asset.preparedUrl, caption: input.content }
        : { image_url: asset.preparedUrl, caption: input.content };
    creationId = (await createContainer(params)).id;
  } else {
    const children = await Promise.all(
      input.preparedMedia.map((asset) =>
        createContainer(
          asset.kind === "video"
            ? { media_type: "REELS", video_url: asset.preparedUrl, is_carousel_item: "true" }
            : { image_url: asset.preparedUrl, is_carousel_item: "true" }
        )
      )
    );

    creationId = (await createContainer({
      media_type: "CAROUSEL",
      children: children.map((child) => child.id).join(","),
      caption: input.content,
    })).id;
  }

  const publishResponse = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      creation_id: creationId,
      access_token: token,
    }),
  });

  if (!publishResponse.ok) {
    throw new Error(`Instagram publish error: ${await publishResponse.text()}`);
  }

  const data = await publishResponse.json() as { id?: string };
  return {
    remoteId: data.id,
    payload: { provider: "instagram", creationId, response: data },
  };
}

async function publishPinterest(input: ProviderPublishInput): Promise<ProviderPublishResult> {
  const metadata = parseMetadata(input.socialAccount);
  const boardId = typeof metadata.boardId === "string" ? metadata.boardId : "";

  if (!boardId) {
    throw new Error("Pinterest connection is missing a target board.");
  }

  const asset = input.preparedMedia[0];
  if (!asset) {
    throw new Error("Pinterest publishing requires an image or video asset.");
  }

  const mediaSource =
    asset.kind === "video"
      ? { source_type: "video_url", url: asset.preparedUrl }
      : { source_type: "image_url", url: asset.preparedUrl };

  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.socialAccount.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: input.content.slice(0, 100),
      description: input.content,
      media_source: mediaSource,
      link: typeof metadata.defaultLink === "string" ? metadata.defaultLink : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinterest publish error: ${await response.text()}`);
  }

  const data = await response.json() as { id?: string };
  return {
    remoteId: data.id,
    payload: { provider: "pinterest", response: data },
  };
}

async function publishBluesky(input: ProviderPublishInput): Promise<ProviderPublishResult> {
  const metadata = parseMetadata(input.socialAccount);
  const did = typeof metadata.did === "string" ? metadata.did : input.socialAccount.externalAccountId;
  const agent = await restoreBlueskyOAuthAgent(did);
  const images = input.preparedMedia.filter((asset) => asset.kind === "image").slice(0, 4);
  const embeds: Array<{ image: Record<string, unknown>; alt: string }> = [];

  for (const image of images) {
    const binary = await fetchArrayBuffer(image.preparedUrl);
    const uploadResponse = await agent.uploadBlob(Buffer.from(binary), {
      encoding: "image/jpeg",
    });
    embeds.push({
      image: {
        ...uploadResponse.data.blob,
      },
      alt: input.content.slice(0, 1000),
    });
  }

  const response = await agent.post({
    text: input.content,
    ...(embeds.length > 0
      ? {
          embed: {
            $type: "app.bsky.embed.images",
            images: embeds,
          } as never,
        }
      : {}),
  });
  return {
    remoteId: response.uri,
    remoteUrl: response.uri,
    payload: { provider: "bluesky", response },
  };
}

async function refreshYouTubeAccount(account: SocialAccount) {
  if (!account.refreshToken || !env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) {
    return account;
  }

  const expiresAt = account.tokenExpiresAt?.getTime() ?? 0;
  const refreshThreshold = Date.now() + 5 * 60 * 1000;
  if (expiresAt > refreshThreshold && account.accessToken) {
    return account;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube refresh error: ${await response.text()}`);
  }

  const payload = await response.json() as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };

  if (!payload.access_token) {
    throw new Error("YouTube refresh did not return an access token.");
  }

  const updated = await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? account.refreshToken,
      tokenExpiresAt: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : null,
    },
  });

  return updated;
}

async function publishYouTube(input: ProviderPublishInput): Promise<ProviderPublishResult> {
  const video = input.preparedMedia[0];

  if (!video || video.kind !== "video") {
    throw new Error("YouTube Shorts publishing requires exactly one video asset.");
  }

  const account = await refreshYouTubeAccount(input.socialAccount);
  const binary = Buffer.from(await fetchArrayBuffer(video.preparedUrl));
  const mimeType = guessMimeType(video.preparedUrl);
  const title = buildYouTubeTitle(input.content);
  const description = buildYouTubeDescription(input.content);

  const initResponse = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(binary.byteLength),
      "X-Upload-Content-Type": mimeType,
    },
    body: JSON.stringify({
      snippet: {
        title,
        description,
        categoryId: "22",
      },
      status: {
        privacyStatus: "private",
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!initResponse.ok) {
    throw new Error(`YouTube upload session error: ${await initResponse.text()}`);
  }

  const uploadUrl = initResponse.headers.get("location");
  if (!uploadUrl) {
    throw new Error("YouTube upload session did not return a resumable upload URL.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(binary.byteLength),
      "Content-Type": mimeType,
    },
    body: binary,
  });

  if (!uploadResponse.ok) {
    throw new Error(`YouTube upload error: ${await uploadResponse.text()}`);
  }

  const data = await uploadResponse.json() as { id?: string; status?: { privacyStatus?: string } };
  return {
    remoteId: data.id,
    remoteUrl: data.id ? `https://www.youtube.com/watch?v=${data.id}` : undefined,
    payload: {
      provider: "youtube",
      title,
      privacyStatus: data.status?.privacyStatus ?? "private",
      shortsOnly: true,
    },
  };
}

function createAdapter(
  platform: ProviderPlatform,
  publishImpl: (input: ProviderPublishInput) => Promise<ProviderPublishResult>,
  options?: {
    publishReady?: boolean;
    refreshImpl?: (account: SocialAccount) => Promise<SocialAccount>;
    normalizeImpl?: (input: { content: string; mediaUrls: string[] }) => Promise<ProviderNormalizedContent>;
    validateImpl?: (input: ProviderNormalizedContent) => Promise<ProviderValidationResult>;
  }
): ProviderAdapter {
  return {
    platform,
    async connect() {
      return;
    },
    async refreshToken(account) {
      return options?.refreshImpl ? options.refreshImpl(account) : account;
    },
    async normalizeContent(input) {
      if (options?.normalizeImpl) {
        return options.normalizeImpl(input);
      }
      const prepared = preparePlatformMedia(platform, input.mediaUrls);
      return {
        content: input.content.trim(),
        mediaUrls: prepared.assets.map((asset) => asset.preparedUrl),
        preparedMedia: prepared.assets,
        warnings: prepared.issues,
      };
    },
    async validateMedia(input) {
      if (options?.validateImpl) {
        return options.validateImpl(input);
      }
      const issues = buildValidationRules(platform, input);
      if (options?.publishReady === false) {
        issues.push(`${platform} publish adapter is in controlled rollout. Connection works, publish is not enabled for this provider yet.`);
      }
      return { ok: issues.length === 0, issues };
    },
    async publishNow(input) {
      if (options?.publishReady === false) {
        throw new ProviderNotReadyError(platform);
      }
      return publishImpl(input);
    },
    async schedule(input) {
      return publishImpl(input);
    },
    async deleteScheduled() {
      return;
    },
    async fetchAccount(account) {
      return {
        id: account.externalAccountId,
        platform,
        displayName: account.displayName,
      };
    },
    async fetchAnalytics() {
      return {
        platform,
        source: "internal",
        metrics: {},
      };
    },
  };
}

const adapters: Record<ProviderPlatform, ProviderAdapter> = {
  twitter: createAdapter("twitter", publishTwitter),
  linkedin: createAdapter("linkedin", publishLinkedIn),
  facebook: createAdapter("facebook", publishFacebook),
  instagram: createAdapter("instagram", publishInstagram),
  tiktok: createAdapter("tiktok", async () => {
    throw new ProviderNotReadyError("tiktok", "TikTok publish requires Content Posting API approval and is staged after connection rollout.");
  }, { publishReady: false }),
  youtube: createAdapter("youtube", publishYouTube, {
    publishReady: true,
    refreshImpl: refreshYouTubeAccount,
    normalizeImpl: async (input) => {
      const prepared = preparePlatformMedia("youtube", input.mediaUrls);
      return {
        content: input.content.trim(),
        mediaUrls: prepared.assets.map((asset) => asset.preparedUrl),
        preparedMedia: prepared.assets,
        warnings: [
          ...prepared.issues,
          "YouTube Shorts uploads are currently created as private by default in NexoPost.",
        ],
      };
    },
    validateImpl: async (input) => {
      const issues = buildValidationRules("youtube", input);
      if (input.preparedMedia.length !== 1) {
        issues.push("YouTube Shorts currently requires exactly one video asset.");
      }
      if (input.preparedMedia.some((asset) => asset.kind !== "video")) {
        issues.push("YouTube Shorts only accepts a single video in the current release.");
      }
      return { ok: issues.length === 0, issues };
    },
  }),
  pinterest: createAdapter("pinterest", publishPinterest),
  bluesky: createAdapter("bluesky", publishBluesky),
};

export function isProviderPlatform(value: string): value is ProviderPlatform {
  return CORE_LAUNCH_PLATFORMS.includes(value as ProviderPlatform);
}

export function getProviderAdapter(platform: string) {
  if (!isProviderPlatform(platform)) {
    throw new Error(`Unsupported provider platform: ${platform}`);
  }

  return adapters[platform];
}
