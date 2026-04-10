import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runDuePublicationJobs } from "@/lib/publishing";

// Vercel Cron calls this endpoint on schedule.
// It processes due publication jobs instead of flipping post status blindly.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDuePublicationJobs(25);

  return NextResponse.json({
    ...result,
    appBaseUrl: env.appBaseUrl,
  });
}
