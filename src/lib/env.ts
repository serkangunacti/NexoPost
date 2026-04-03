import { z } from "zod";

const envSchema = z.object({
  APP_BASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXOPOST_APP_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  TWITTER_CLIENT_ID: z.string().min(1).optional(),
  TWITTER_CLIENT_SECRET: z.string().min(1).optional(),
  LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
  LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
  FACEBOOK_APP_ID: z.string().min(1).optional(),
  FACEBOOK_APP_SECRET: z.string().min(1).optional(),
  INSTAGRAM_APP_ID: z.string().min(1).optional(),
  INSTAGRAM_APP_SECRET: z.string().min(1).optional(),
  THREADS_APP_ID: z.string().min(1).optional(),
  THREADS_APP_SECRET: z.string().min(1).optional(),
  TIKTOK_CLIENT_KEY: z.string().min(1).optional(),
  TIKTOK_CLIENT_SECRET: z.string().min(1).optional(),
  YOUTUBE_CLIENT_ID: z.string().min(1).optional(),
  YOUTUBE_CLIENT_SECRET: z.string().min(1).optional(),
  PINTEREST_CLIENT_ID: z.string().min(1).optional(),
  PINTEREST_CLIENT_SECRET: z.string().min(1).optional(),
  SUPERADMIN_EMAILS: z.string().optional(),
});

const parsed = envSchema.parse({
  APP_BASE_URL:
    process.env.APP_BASE_URL ??
    process.env.NEXOPOST_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000",
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXOPOST_APP_URL: process.env.NEXOPOST_APP_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID,
  INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
  THREADS_APP_ID: process.env.THREADS_APP_ID,
  THREADS_APP_SECRET: process.env.THREADS_APP_SECRET,
  TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  PINTEREST_CLIENT_ID: process.env.PINTEREST_CLIENT_ID,
  PINTEREST_CLIENT_SECRET: process.env.PINTEREST_CLIENT_SECRET,
  SUPERADMIN_EMAILS: process.env.SUPERADMIN_EMAILS,
});

export const env = {
  ...parsed,
  appBaseUrl: parsed.APP_BASE_URL,
} as const;
