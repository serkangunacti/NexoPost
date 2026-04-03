import { env } from "@/lib/env";

// ── Social OAuth Types ─────────────────────────────────────────────────────────

export interface SocialTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;       // Unix ms timestamp
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  scope?: string;
  connectedAt: string;      // ISO date
  // Facebook/Instagram extras
  pageId?: string;
  pageName?: string;
  pageAccessToken?: string;
}

/** Per-user token store: { clientId → { platform → TokenData } } */
export type SocialTokens = Record<string, Record<string, SocialTokenData>>;

// ── Supported platforms ────────────────────────────────────────────────────────

export const SUPPORTED_PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export function isSupportedPlatform(p: string): p is SupportedPlatform {
  return (SUPPORTED_PLATFORMS as readonly string[]).includes(p);
}

// ── OAuth config per platform ──────────────────────────────────────────────────

export interface PlatformOAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  usePKCE: boolean;
  clientId: string | undefined;
  clientSecret: string | undefined;
}

export function getPlatformConfig(platform: SupportedPlatform): PlatformOAuthConfig {
  const base: Record<SupportedPlatform, PlatformOAuthConfig> = {
    twitter: {
      authUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
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
      scopes: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      usePKCE: false,
      clientId: env.FACEBOOK_APP_ID,
      clientSecret: env.FACEBOOK_APP_SECRET,
    },
    instagram: {
      // Instagram uses the Meta/Facebook OAuth app — same credentials
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
      scopes: [
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list",
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_comments",
      ],
      usePKCE: false,
      clientId: env.FACEBOOK_APP_ID,
      clientSecret: env.FACEBOOK_APP_SECRET,
    },
    tiktok: {
      authUrl: "https://www.tiktok.com/v2/auth/authorize/",
      tokenUrl: "https://open.tiktok.com/v2/oauth/token/",
      scopes: ["user.info.basic", "video.publish", "video.upload"],
      usePKCE: true,
      clientId: env.TIKTOK_CLIENT_KEY,
      clientSecret: env.TIKTOK_CLIENT_SECRET,
    },
  };
  return base[platform];
}

// ── PKCE helpers ───────────────────────────────────────────────────────────────

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

// ── OAuth state helpers ────────────────────────────────────────────────────────

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

// ── Callback URL builder ───────────────────────────────────────────────────────

export function getCallbackUrl(platform: SupportedPlatform): string {
  const base = env.appBaseUrl.replace(/\/$/, "");
  return `${base}/api/social/callback/${platform}`;
}
