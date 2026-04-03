import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createBlueskySession,
  encodeState,
  generateCodeChallenge,
  generateCodeVerifier,
  getBlueskyProfile,
  getCallbackUrl,
  getPlatformConfig,
  isSupportedPlatform,
  type SocialTokenData,
  type SocialTokens,
} from "@/lib/socialAuth";
import { requireWorkspaceAccess } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { assertWorkspaceCanConnectPlatform } from "@/lib/usage";
import { logAuditEvent } from "@/lib/audit";
import { parseLegacyConnectedAccounts, parseLegacySocialTokens, upsertSocialAccountFromToken } from "@/lib/workspaces";

async function saveCustomToken(
  userId: string,
  clientId: string,
  platform: string,
  tokenEntry: SocialTokenData
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { socialTokens: true, connectedAccounts: true },
  });

  const existing = parseLegacySocialTokens(user?.socialTokens) as SocialTokens;
  const connectedAccounts = parseLegacyConnectedAccounts(user?.connectedAccounts);

  const updated: SocialTokens = {
    ...existing,
    [clientId]: {
      ...(existing[clientId] ?? {}),
      [platform]: tokenEntry,
    },
  };

  connectedAccounts[clientId] = Array.from(new Set([...(connectedAccounts[clientId] ?? []), platform]));

  await prisma.user.update({
    where: { id: userId },
    data: {
      socialTokens: updated as unknown as Prisma.InputJsonValue,
      connectedAccounts: connectedAccounts as unknown as Prisma.InputJsonValue,
    },
  });

  await upsertSocialAccountFromToken(clientId, platform, tokenEntry);
  await logAuditEvent({
    action: "social.connected",
    entityType: "social_account",
    entityId: `${clientId}:${platform}`,
    userId,
    workspaceId: clientId,
    payload: {
      platform,
      accountId: tokenEntry.accountId,
      connectionMode: "custom",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;

    if (!isSupportedPlatform(platform)) {
      throw new ApiError(400, "Unsupported platform");
    }

    const config = getPlatformConfig(platform);
    if (config.connectionMode === "custom") {
      throw new ApiError(405, `${platform} uses a custom connection flow.`);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const clientId = request.nextUrl.searchParams.get("clientId") ?? "";
    if (!clientId) {
      throw new ApiError(400, "clientId required");
    }

    await requireWorkspaceAccess(clientId);
    const canConnect = await assertWorkspaceCanConnectPlatform(clientId, platform);
    if (!canConnect) {
      throw new ApiError(403, `${platform} is not available on the active plan.`);
    }

    const rateLimit = checkRateLimit({
      key: `social:connect:${session.user.id}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many connection attempts. Please try again shortly.");
    }

    if (!config.clientId) {
      return NextResponse.redirect(
        new URL(`/connections?error=not_configured&platform=${platform}`, request.url)
      );
    }

    const nonce = crypto.randomUUID();
    const state = encodeState({
      userId: session.user.id,
      clientId,
      platform,
      nonce,
    });

    const callbackUrl = getCallbackUrl(platform);
    const url = new URL(config.authUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", callbackUrl);
    url.searchParams.set("scope", config.scopes.join(" "));
    url.searchParams.set("state", state);

    const response = NextResponse.redirect(url.toString());
    response.cookies.set("oauth_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    if (config.usePKCE) {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");

      const pkceResponse = NextResponse.redirect(url.toString());
      pkceResponse.cookies.set("oauth_nonce", nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });
      pkceResponse.cookies.set("oauth_pkce", verifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });
      return pkceResponse;
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return NextResponse.redirect(
          new URL(`/connections?error=plan_locked&detail=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return toErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    if (platform !== "bluesky") {
      throw new ApiError(405, "Custom connection is only available for Bluesky.");
    }

    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, "Authentication required");
    }

    const body = await request.json() as {
      clientId?: string;
      handle?: string;
      appPassword?: string;
    };

    const clientId = body.clientId?.trim() ?? "";
    const handle = body.handle?.trim() ?? "";
    const appPassword = body.appPassword?.trim() ?? "";

    if (!clientId || !handle || !appPassword) {
      throw new ApiError(400, "clientId, handle, and appPassword are required");
    }

    await requireWorkspaceAccess(clientId);
    const canConnect = await assertWorkspaceCanConnectPlatform(clientId, platform);
    if (!canConnect) {
      throw new ApiError(403, `${platform} is not available on the active plan.`);
    }

    const rateLimit = checkRateLimit({
      key: `social:connect:${session.user.id}:bluesky`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many connection attempts. Please try again shortly.");
    }

    const createdSession = await createBlueskySession({
      identifier: handle,
      password: appPassword,
    });
    const profile = await getBlueskyProfile(createdSession.accessJwt, createdSession.did);

    const tokenEntry: SocialTokenData = {
      accessToken: createdSession.accessJwt,
      refreshToken: createdSession.refreshJwt,
      accountId: profile.did,
      accountName: profile.displayName || profile.handle,
      accountAvatar: profile.avatar,
      connectedAt: new Date().toISOString(),
      metadata: {
        did: createdSession.did,
        handle: profile.handle,
      },
    };

    await saveCustomToken(session.user.id, clientId, platform, tokenEntry);

    return NextResponse.json({
      ok: true,
      accountName: tokenEntry.accountName,
      platform,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
