import { env } from "@/lib/env";

export interface SocialTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  scope?: string;
  connectedAt: string;
  pageId?: string;
  pageName?: string;
  pageAccessToken?: string;
  metadata?: Record<string, unknown>;
}

export type MetaPageOption = {
  id: string;
  name: string;
  accessToken?: string;
};

export type SocialTokens = Record<string, Record<string, SocialTokenData>>;

export const SUPPORTED_PLATFORMS = [
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

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export function isSupportedPlatform(p: string): p is SupportedPlatform {
  return (SUPPORTED_PLATFORMS as readonly string[]).includes(p);
}

export interface PlatformOAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  usePKCE: boolean;
  clientId: string | undefined;
  clientSecret: string | undefined;
  connectionMode?: "oauth" | "custom";
  extraAuthParams?: Record<string, string>;
}

export function getPlatformConfig(platform: SupportedPlatform): PlatformOAuthConfig {
  const metaScopes = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"];

  const base: Record<SupportedPlatform, PlatformOAuthConfig> = {
    twitter: {
      authUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access", "media.write"],
      usePKCE: true,
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
    },
    linkedin: {
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      scopes: ["openid", "profile", "email", "w_member_social"],
      usePKCE: false,
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
    },
    facebook: {
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
      scopes: [...metaScopes, "business_management"],
      usePKCE: false,
      clientId: env.FACEBOOK_APP_ID,
      clientSecret: env.FACEBOOK_APP_SECRET,
    },
    instagram: {
      authUrl: "https://www.instagram.com/oauth/authorize",
      tokenUrl: "https://api.instagram.com/oauth/access_token",
      scopes: [
        "instagram_business_basic",
        "instagram_business_content_publish",
      ],
      usePKCE: false,
      clientId: env.INSTAGRAM_APP_ID,
      clientSecret: env.INSTAGRAM_APP_SECRET,
      extraAuthParams: {
        force_reauth: "true",
      },
    },
    tiktok: {
      authUrl: "https://www.tiktok.com/v2/auth/authorize/",
      tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
      scopes: ["user.info.basic", "video.publish", "video.upload"],
      usePKCE: true,
      clientId: env.TIKTOK_CLIENT_KEY,
      clientSecret: env.TIKTOK_CLIENT_SECRET,
    },
    youtube: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ],
      usePKCE: true,
      clientId: env.YOUTUBE_CLIENT_ID,
      clientSecret: env.YOUTUBE_CLIENT_SECRET,
    },
    pinterest: {
      authUrl: "https://www.pinterest.com/oauth/",
      tokenUrl: "https://api.pinterest.com/v5/oauth/token",
      scopes: ["boards:read", "boards:write", "pins:read", "pins:write", "user_accounts:read"],
      usePKCE: false,
      clientId: env.PINTEREST_CLIENT_ID,
      clientSecret: env.PINTEREST_CLIENT_SECRET,
    },
    threads: {
      authUrl: "https://threads.net/oauth/authorize",
      tokenUrl: "https://graph.threads.net/oauth/access_token",
      scopes: [
        "threads_basic",
        "threads_content_publish",
      ],
      usePKCE: false,
      clientId: env.THREADS_APP_ID,
      clientSecret: env.THREADS_APP_SECRET,
    },
    bluesky: {
      authUrl: "",
      tokenUrl: "",
      scopes: [],
      usePKCE: false,
      clientId: env.APP_BASE_URL,
      clientSecret: undefined,
      connectionMode: "oauth",
    },
  };

  return base[platform];
}

export function generateCodeVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64url(arr);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64url(new Uint8Array(digest));
}

function base64url(bytes: Uint8Array): string {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export interface OAuthState {
  userId: string;
  clientId: string;
  platform: SupportedPlatform;
  nonce: string;
}

export function encodeState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeState(raw: string): OAuthState | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as OAuthState;
  } catch {
    return null;
  }
}

export function getCallbackUrl(platform: SupportedPlatform): string {
  const base = env.appBaseUrl.replace(/\/$/, "");
  return `${base}/api/social/callback/${platform}`;
}

export function getBlueskyServiceUrl() {
  return "https://bsky.social";
}
