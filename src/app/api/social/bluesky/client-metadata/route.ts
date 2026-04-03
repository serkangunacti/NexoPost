import { NextResponse } from "next/server";
import { getBlueskyClientMetadata } from "@/lib/blueskyOAuth";

export async function GET() {
  return NextResponse.json(getBlueskyClientMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
