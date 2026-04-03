import type { SocialAccount } from "@prisma/client";
import { getBlueskyServiceUrl } from "@/lib/socialAuth";
import { preparePlatformMedia, type PreparedMediaAsset } from "@/lib/mediaPreparation";

export const CORE_LAUNCH_PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "threads",
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
    threads: 500,
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
    threads: 10,
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

  const ownerUrn = input.socialAccount.externalAccountId.startsWith("urn:")
    ? input.socialAccount.externalAccountId
    : `urn:li:person:${input.socialAccount.externalAccountId}`;

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
  const images = input.preparedMedia.filter((asset) => asset.kind === "image").slice(0, 4);
  const embeds: Array<{ image: { $type: string; ref: Record<string, unknown>; mimeType: string; size: number }; alt: string }> = [];

  for (const image of images) {
    const binary = await fetchArrayBuffer(image.preparedUrl);
    const uploadResponse = await fetch(`${getBlueskyServiceUrl()}/xrpc/com.atproto.repo.uploadBlob`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.socialAccount.accessToken}`,
        "Content-Type": "image/jpeg",
      },
      body: Buffer.from(binary),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Bluesky image upload error: ${await uploadResponse.text()}`);
    }

    const blob = await uploadResponse.json() as { blob: { ref: Record<string, unknown>; mimeType: string; size: number } };
    embeds.push({
      image: {
        $type: "blob",
        ref: blob.blob.ref,
        mimeType: blob.blob.mimeType,
        size: blob.blob.size,
      },
      alt: input.content.slice(0, 1000),
    });
  }

  const response = await fetch(`${getBlueskyServiceUrl()}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.socialAccount.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text: input.content,
        createdAt: new Date().toISOString(),
        ...(embeds.length > 0
          ? {
              embed: {
                $type: "app.bsky.embed.images",
                images: embeds,
              },
            }
          : {}),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Bluesky publish error: ${await response.text()}`);
  }

  const data = await response.json() as { uri?: string };
  return {
    remoteId: data.uri,
    remoteUrl: data.uri,
    payload: { provider: "bluesky", response: data },
  };
}

function createAdapter(
  platform: ProviderPlatform,
  publishImpl: (input: ProviderPublishInput) => Promise<ProviderPublishResult>,
  options?: { publishReady?: boolean }
): ProviderAdapter {
  return {
    platform,
    async connect() {
      return;
    },
    async refreshToken(account) {
      return account;
    },
    async normalizeContent(input) {
      const prepared = preparePlatformMedia(platform, input.mediaUrls);
      return {
        content: input.content.trim(),
        mediaUrls: prepared.assets.map((asset) => asset.preparedUrl),
        preparedMedia: prepared.assets,
        warnings: prepared.issues,
      };
    },
    async validateMedia(input) {
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
  youtube: createAdapter("youtube", async () => {
    throw new ProviderNotReadyError("youtube", "YouTube upload is queued for the next provider release slice.");
  }, { publishReady: false }),
  pinterest: createAdapter("pinterest", publishPinterest),
  threads: createAdapter("threads", async () => {
    throw new ProviderNotReadyError("threads", "Threads publish is in the Meta rollout tranche right after account connection.");
  }, { publishReady: false }),
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
