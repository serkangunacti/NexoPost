import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  isSupportedPlatform,
  getPlatformConfig,
  decodeState,
  getCallbackUrl,
  type SocialTokens,
  type SocialTokenData,
  type SupportedPlatform,
} from "@/lib/socialAuth";
import { logAuditEvent } from "@/lib/audit";
import { parseLegacyConnectedAccounts, upsertSocialAccountFromToken } from "@/lib/workspaces";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const redirectBase = new URL("/connections", request.url);

  if (!isSupportedPlatform(platform)) {
    redirectBase.searchParams.set("error", "unsupported_platform");
    return NextResponse.redirect(redirectBase.toString());
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const rawState = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    redirectBase.searchParams.set("error", oauthError);
    return NextResponse.redirect(redirectBase.toString());
  }

  if (!code || !rawState) {
    redirectBase.searchParams.set("error", "missing_params");
    return NextResponse.redirect(redirectBase.toString());
  }

  // Verify state nonce
  const state = decodeState(rawState);
  const nonceCookie = request.cookies.get("oauth_nonce")?.value;
  if (!state || !nonceCookie || state.nonce !== nonceCookie || state.platform !== platform) {
    redirectBase.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(redirectBase.toString());
  }

  const config = getPlatformConfig(platform);
  if (!config.clientId || !config.clientSecret) {
    redirectBase.searchParams.set("error", "not_configured");
    return NextResponse.redirect(redirectBase.toString());
  }

  try {
    // Exchange code → tokens
    const tokenData = await exchangeCodeForTokens(platform, code, config.clientId, config.clientSecret, request);
    // Fetch account profile
    const profile = await fetchProfile(platform, tokenData.accessToken, config.clientId, config.clientSecret, tokenData);
    // Persist to DB
    await saveTokens(state.userId, state.clientId, platform, { ...tokenData, ...profile });

    // Clear OAuth cookies
    const successRedirect = NextResponse.redirect(
      new URL(`/connections?success=${platform}`, request.url).toString()
    );
    successRedirect.cookies.delete("oauth_nonce");
    successRedirect.cookies.delete("oauth_pkce");
    return successRedirect;
  } catch (err) {
    console.error(`[social-callback:${platform}]`, err);
    const errorMessage = err instanceof Error ? encodeURIComponent(err.message.slice(0, 100)) : "unknown";
    redirectBase.searchParams.set("error", "token_exchange_failed");
    redirectBase.searchParams.set("detail", errorMessage);
    const errResponse = NextResponse.redirect(redirectBase.toString());
    errResponse.cookies.delete("oauth_nonce");
    errResponse.cookies.delete("oauth_pkce");
    return errResponse;
  }
}

// ── Token exchange ─────────────────────────────────────────────────────────────

async function exchangeCodeForTokens(
  platform: SupportedPlatform,
  code: string,
  clientId: string,
  clientSecret: string,
  request: NextRequest
): Promise<Pick<SocialTokenData, "accessToken" | "refreshToken" | "expiresAt" | "scope">> {
  const config = getPlatformConfig(platform);
  const callbackUrl = getCallbackUrl(platform);

  if (platform === "twitter") {
    // Twitter uses Basic Auth + PKCE
    const verifier = request.cookies.get("oauth_pkce")?.value ?? "";
    const body = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
      code_verifier: verifier,
    });
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body,
    });
    if (!res.ok) throw new Error(`Twitter token error: ${await res.text()}`);
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      scope: data.scope,
    };
  }

  if (platform === "tiktok") {
    const verifier = request.cookies.get("oauth_pkce")?.value ?? "";
    const body = new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
      code_verifier: verifier,
    });
    const res = await fetch(config.tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!res.ok) throw new Error(`TikTok token error: ${await res.text()}`);
    const data = await res.json() as { data?: { access_token: string; refresh_token?: string; expires_in?: number; scope?: string } };
    const d = data.data;
    if (!d) throw new Error("TikTok: empty token response");
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiresAt: d.expires_in ? Date.now() + d.expires_in * 1000 : undefined,
      scope: d.scope,
    };
  }

  // LinkedIn, Facebook, Instagram — standard POST with client credentials
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`${platform} token error: ${await res.text()}`);
  const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    scope: data.scope,
  };
}

// ── Profile fetch ──────────────────────────────────────────────────────────────

async function fetchProfile(
  platform: SupportedPlatform,
  accessToken: string,
  _clientId: string,
  _clientSecret: string,
  _tokenData: Pick<SocialTokenData, "accessToken" | "refreshToken" | "expiresAt" | "scope">
): Promise<Partial<SocialTokenData>> {
  if (platform === "twitter") {
    const res = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Twitter profile error: ${await res.text()}`);
    const data = await res.json() as { data: { id: string; name: string; username: string; profile_image_url?: string } };
    return {
      accountId: data.data.id,
      accountName: `@${data.data.username}`,
      accountAvatar: data.data.profile_image_url,
    };
  }

  if (platform === "linkedin") {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`LinkedIn profile error: ${await res.text()}`);
    const data = await res.json() as { sub: string; name: string; email?: string; picture?: string };
    return {
      accountId: data.sub,
      accountName: data.name,
      accountAvatar: data.picture,
    };
  }

  if (platform === "facebook" || platform === "instagram") {
    // Get user info
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,picture.width(200)&access_token=${accessToken}`
    );
    if (!meRes.ok) throw new Error(`Meta profile error: ${await meRes.text()}`);
    const me = await meRes.json() as { id: string; name: string; picture?: { data?: { url?: string } } };

    // Get managed Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    const pages = pagesRes.ok
      ? (await pagesRes.json() as { data?: Array<{ id: string; name: string; access_token: string }> }).data ?? []
      : [];
    const firstPage = pages[0];

    return {
      accountId: me.id,
      accountName: me.name,
      accountAvatar: me.picture?.data?.url,
      pageId: firstPage?.id,
      pageName: firstPage?.name,
      pageAccessToken: firstPage?.access_token,
    };
  }

  if (platform === "tiktok") {
    const res = await fetch("https://open.tiktok.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`TikTok profile error: ${await res.text()}`);
    const data = await res.json() as { data?: { user?: { open_id: string; display_name: string; avatar_url?: string } } };
    const user = data.data?.user;
    if (!user) throw new Error("TikTok: empty profile");
    return {
      accountId: user.open_id,
      accountName: user.display_name,
      accountAvatar: user.avatar_url,
    };
  }

  return {};
}

// ── Persist tokens ─────────────────────────────────────────────────────────────

async function saveTokens(
  userId: string,
  clientId: string,
  platform: SupportedPlatform,
  data: Partial<SocialTokenData> & { accessToken: string }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { socialTokens: true, connectedAccounts: true },
  });
  const existing = (user?.socialTokens ?? {}) as unknown as SocialTokens;
  const connectedAccounts = parseLegacyConnectedAccounts(user?.connectedAccounts);

  const tokenEntry: SocialTokenData = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
    accountId: data.accountId ?? "unknown",
    accountName: data.accountName ?? platform,
    accountAvatar: data.accountAvatar,
    scope: data.scope,
    pageId: data.pageId,
    pageName: data.pageName,
    pageAccessToken: data.pageAccessToken,
    connectedAt: new Date().toISOString(),
  };

  const updated: SocialTokens = {
    ...existing,
    [clientId]: {
      ...(existing[clientId] ?? {}),
      [platform]: tokenEntry,
    },
  };

  connectedAccounts[clientId] = Array.from(
    new Set([...(connectedAccounts[clientId] ?? []), platform])
  );

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
    },
  });
}
