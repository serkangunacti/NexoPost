import { NextResponse } from "next/server";

// GET /api/social/configured
// Returns which platforms have their API credentials configured via env vars.
// This is safe to expose — we only reveal whether variables are SET, not their values.
export async function GET() {
  const checks: Record<string, boolean> = {
    twitter: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    instagram: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    tiktok: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
  };

  const configured = Object.entries(checks)
    .filter(([, ok]) => ok)
    .map(([platform]) => platform);

  return NextResponse.json({ configured });
}
