import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  encodeState,
  generateCodeChallenge,
  generateCodeVerifier,
  getCallbackUrl,
  getPlatformConfig,
  isSupportedPlatform,
} from "@/lib/socialAuth";
import { getBlueskyAuthorizeUrl } from "@/lib/blueskyOAuth";
import { requireWorkspaceAccess } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiError, toErrorResponse } from "@/lib/http";
import { assertWorkspaceCanConnectPlatform } from "@/lib/usage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;

    if (!isSupportedPlatform(platform)) {
      throw new ApiError(400, "Unsupported platform");
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

    if (platform === "bluesky") {
      const handle = request.nextUrl.searchParams.get("handle")?.trim() ?? "";
      if (!handle) {
        throw new ApiError(400, "Bluesky handle is required");
      }

      const rateLimit = checkRateLimit({
        key: `social:connect:${session.user.id}:bluesky`,
        limit: 10,
        windowMs: 60_000,
      });

      if (!rateLimit.ok) {
        throw new ApiError(429, "Too many connection attempts. Please try again shortly.");
      }

      const state = encodeState({
        userId: session.user.id,
        clientId,
        platform,
        nonce: crypto.randomUUID(),
      });
      const url = await getBlueskyAuthorizeUrl(handle, state);
      return NextResponse.redirect(url);
    }

    const config = getPlatformConfig(platform);
    if (config.connectionMode === "custom") {
      throw new ApiError(405, `${platform} uses a custom connection flow.`);
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
  void request;
  void params;
  return toErrorResponse(new ApiError(405, "Use the OAuth connection flow for this provider."));
}
