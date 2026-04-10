import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { requireSessionUser } from "@/lib/authz";
import { toErrorResponse } from "@/lib/http";

// GET /api/social/configured
// Returns which platforms have their API credentials configured via env vars.
// This is safe to expose — we only reveal whether variables are SET, not their values.
export async function GET() {
  try {
    await requireSessionUser();

    const checks: Record<string, boolean> = {
      twitter: !!(env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET),
      linkedin: !!(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),
      facebook: !!(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET),
      instagram: !!(env.INSTAGRAM_APP_ID && env.INSTAGRAM_APP_SECRET),
      tiktok: !!(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET),
      youtube: !!(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET),
      pinterest: !!(env.PINTEREST_CLIENT_ID && env.PINTEREST_CLIENT_SECRET),
      bluesky: true,
    };

    const configured = Object.entries(checks)
      .filter(([, ok]) => ok)
      .map(([platform]) => platform);

    return NextResponse.json({ configured }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
