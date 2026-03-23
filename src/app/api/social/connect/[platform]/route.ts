import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  isSupportedPlatform,
  getPlatformConfig,
  generateCodeVerifier,
  generateCodeChallenge,
  encodeState,
  getCallbackUrl,
} from "@/lib/socialAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (!isSupportedPlatform(platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = request.nextUrl.searchParams.get("clientId") ?? "";
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const config = getPlatformConfig(platform);
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

  // PKCE for Twitter/X and TikTok
  const response = NextResponse.redirect(url.toString());
  response.cookies.set("oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  if (config.usePKCE) {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");

    // Rebuild redirect with PKCE params
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
}
