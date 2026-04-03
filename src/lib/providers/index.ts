import type { SocialAccount } from "@prisma/client";

export const CORE_LAUNCH_PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
] as const;

export type ProviderPlatform = (typeof CORE_LAUNCH_PLATFORMS)[number];

export type ProviderPublishInput = {
  content: string;
  mediaUrls: string[];
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
  validateMedia(input: { content: string; mediaUrls: string[] }): Promise<ProviderValidationResult>;
  publishNow(input: ProviderPublishInput): Promise<ProviderPublishResult>;
  schedule(input: ProviderPublishInput & { scheduledFor: Date }): Promise<ProviderPublishResult>;
  deleteScheduled(input: { remoteId: string; socialAccount: SocialAccount }): Promise<void>;
  fetchAccount(account: SocialAccount): Promise<Record<string, unknown>>;
  fetchAnalytics(account: SocialAccount): Promise<Record<string, unknown>>;
}

class ProviderNotReadyError extends Error {
  constructor(platform: ProviderPlatform) {
    super(`${platform} provider is scaffolded but not fully enabled yet.`);
  }
}

function buildValidationRules(platform: ProviderPlatform, input: { content: string; mediaUrls: string[] }) {
  const issues: string[] = [];

  const contentLengthLimits: Record<ProviderPlatform, number> = {
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    tiktok: 2200,
    youtube: 5000,
    pinterest: 500,
  };

  const maxMediaCount: Record<ProviderPlatform, number> = {
    twitter: 4,
    linkedin: 9,
    facebook: 10,
    instagram: 10,
    tiktok: 1,
    youtube: 1,
    pinterest: 1,
  };

  if (input.content.length > contentLengthLimits[platform]) {
    issues.push(`Caption exceeds ${platform} limit of ${contentLengthLimits[platform]} characters.`);
  }

  if (input.mediaUrls.length > maxMediaCount[platform]) {
    issues.push(`${platform} allows up to ${maxMediaCount[platform]} media items in this workflow.`);
  }

  return issues;
}

function createScaffoldedAdapter(platform: ProviderPlatform): ProviderAdapter {
  return {
    platform,
    async connect() {
      throw new ProviderNotReadyError(platform);
    },
    async refreshToken(account) {
      return account;
    },
    async validateMedia(input) {
      const issues = buildValidationRules(platform, input);
      return {
        ok: issues.length === 0,
        issues,
      };
    },
    async publishNow() {
      throw new ProviderNotReadyError(platform);
    },
    async schedule() {
      throw new ProviderNotReadyError(platform);
    },
    async deleteScheduled() {
      throw new ProviderNotReadyError(platform);
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

const adapters = CORE_LAUNCH_PLATFORMS.reduce<Record<ProviderPlatform, ProviderAdapter>>((acc, platform) => {
  acc[platform] = createScaffoldedAdapter(platform);
  return acc;
}, {} as Record<ProviderPlatform, ProviderAdapter>);

export function isProviderPlatform(value: string): value is ProviderPlatform {
  return CORE_LAUNCH_PLATFORMS.includes(value as ProviderPlatform);
}

export function getProviderAdapter(platform: string) {
  if (!isProviderPlatform(platform)) {
    throw new Error(`Unsupported provider platform: ${platform}`);
  }

  return adapters[platform];
}
