import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { type SocialTokens } from "@/lib/socialAuth";

// GET /api/users/[id]/social-tokens
// Returns social tokens for the user (tokens themselves are redacted for client safety)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { socialTokens: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Redact access tokens before sending to the client
  const raw = (user.socialTokens ?? {}) as SocialTokens;
  const redacted: Record<string, Record<string, object>> = {};
  for (const [clientId, platforms] of Object.entries(raw)) {
    redacted[clientId] = {};
    for (const [platform, token] of Object.entries(platforms)) {
      const { accessToken: _a, refreshToken: _r, pageAccessToken: _p, ...safe } = token;
      redacted[clientId][platform] = safe;
    }
  }

  return NextResponse.json(redacted);
}

// DELETE /api/users/[id]/social-tokens?clientId=xxx&platform=xxx
// Removes a specific platform connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientId = request.nextUrl.searchParams.get("clientId");
  const platform = request.nextUrl.searchParams.get("platform");

  if (!clientId || !platform) {
    return NextResponse.json({ error: "clientId and platform required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { socialTokens: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tokens = (user.socialTokens ?? {}) as SocialTokens;
  if (tokens[clientId]) {
    delete tokens[clientId][platform];
    if (Object.keys(tokens[clientId]).length === 0) {
      delete tokens[clientId];
    }
  }

  await prisma.user.update({
    where: { id },
    data: { socialTokens: tokens as Prisma.InputJsonValue },
  });

  return NextResponse.json({ ok: true });
}
