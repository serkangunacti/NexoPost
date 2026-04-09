"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, AlertCircle, Loader2, Link2, Unlink, Building2, ExternalLink, ShieldCheck, Send } from "lucide-react";
import { SiX, SiFacebook, SiInstagram, SiPinterest, SiTiktok, SiYoutube, SiBluesky, SiThreads } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import { canPlanConnectPlatform, type PlanId } from "@/lib/plans";

// Redacted token info returned from GET /api/users/[id]/social-tokens
interface SafeTokenData {
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  connectedAt: string;
  pageId?: string;
  pageName?: string;
  scope?: string;
  pageOptions?: Array<{ id: string; name: string }>;
  publishTarget?: "page" | "profile" | "organization" | "account";
  personalProfileSupported?: boolean;
  linkedInTargets?: Array<{ id: string; name: string; type: "profile" | "organization" }>;
  selectedTargetId?: string;
  linkedInOrganizationAccessPending?: boolean;
  authMethod?: string;
}

type SafeTokens = Record<string, Record<string, SafeTokenData>>;

interface PlatformDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string;
  ring: string;
  bg: string;
  description: string;
  requiredEnvs: string[];
  docsUrl: string;
  oauthReady?: boolean;
  publishReady?: boolean;
  connectionMode?: "oauth" | "custom";
}

function isDefaultTikTokAvatar(url?: string) {
  if (!url) return false;
  return url.includes("tiktokcdn.com") && url.includes("1594805258216454");
}

const PLATFORMS: PlatformDef[] = [
  {
    id: "twitter",
    name: "Twitter / X",
    icon: <SiX className="w-7 h-7" />,
    gradient: "from-neutral-900 to-neutral-800",
    ring: "ring-white/30",
    bg: "bg-black",
    description: "X publishing is available on Agency and Agency Plus plans only. Included usage is managed internally per billing period.",
    requiredEnvs: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"],
    docsUrl: "https://developer.twitter.com/en/portal/dashboard",
    oauthReady: true,
    publishReady: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <FaLinkedin className="w-7 h-7" />,
    gradient: "from-[#0A66C2] to-[#004182]",
    ring: "ring-[#0A66C2]/50",
    bg: "bg-[#0A66C2]",
    description: "Share posts to your LinkedIn profile and company pages. Standard Developer App — no paid plan needed.",
    requiredEnvs: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    docsUrl: "https://www.linkedin.com/developers/apps",
    oauthReady: true,
    publishReady: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <SiFacebook className="w-7 h-7" />,
    gradient: "from-[#1877F2] to-[#0d5cc7]",
    ring: "ring-[#1877F2]/50",
    bg: "bg-[#1877F2]",
    description: "Publish to Facebook Pages. Requires Meta Developer App. Business Verification recommended for higher rate limits.",
    requiredEnvs: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
    docsUrl: "https://developers.facebook.com/apps",
    oauthReady: true,
    publishReady: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <SiInstagram className="w-7 h-7" />,
    gradient: "from-[#FD1D1D] via-[#E1306C] to-[#833AB4]",
    ring: "ring-[#E1306C]/50",
    bg: "bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4]",
    description: "Post to Instagram Business or Creator accounts with Instagram Business Login. Configure the dedicated Instagram app credentials in addition to your Meta setup.",
    requiredEnvs: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
    docsUrl: "https://developers.facebook.com/apps",
    oauthReady: true,
    publishReady: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <SiTiktok className="w-7 h-7 text-white drop-shadow-[1px_1px_0_#fe0979]" />,
    gradient: "from-black to-neutral-900",
    ring: "ring-[#fe0979]/40",
    bg: "bg-black border border-[#fe0979]/30",
    description: "Upload and publish videos to TikTok. Requires TikTok Developer App and Content Posting API access approval.",
    requiredEnvs: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
    docsUrl: "https://developers.tiktok.com/",
    oauthReady: true,
    publishReady: false,
  },
  {
    id: "threads",
    name: "Threads",
    icon: <SiThreads className="w-7 h-7" />,
    gradient: "from-black to-neutral-800",
    ring: "ring-white/20",
    bg: "bg-black border border-neutral-800",
    description: "Threads connects through the dedicated Threads app and OAuth flow. Publish enablement follows right after connection rollout.",
    requiredEnvs: ["THREADS_APP_ID", "THREADS_APP_SECRET"],
    docsUrl: "https://developers.facebook.com/",
    oauthReady: true,
    publishReady: false,
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: <SiBluesky className="w-7 h-7" />,
    gradient: "from-[#0560FF] to-[#0B80FF]",
    ring: "ring-[#0560FF]/40",
    bg: "bg-[#0560FF]",
    description: "Bluesky now connects with official OAuth. Enter your handle, approve access, and publish text plus images without app passwords.",
    requiredEnvs: [],
    docsUrl: "https://docs.bsky.app/",
    oauthReady: true,
    publishReady: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <SiYoutube className="w-7 h-7 text-[#FF0000]" />,
    gradient: "from-[#FF0000] to-[#c40000]",
    ring: "ring-[#FF0000]/40",
    bg: "bg-white border border-[#FF0000]/20",
    description: "YouTube account linking is ready. Shorts/video publish is staged right after the current provider release slice.",
    requiredEnvs: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    oauthReady: true,
    publishReady: false,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: <SiPinterest className="w-7 h-7 text-[#E60023]" />,
    gradient: "from-[#E60023] to-[#b0001c]",
    ring: "ring-[#E60023]/40",
    bg: "bg-white border border-[#E60023]/20",
    description: "Pinterest board connection is ready and image/video pin publishing is available in the current build.",
    requiredEnvs: ["PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET"],
    docsUrl: "https://developers.pinterest.com/apps/",
    oauthReady: true,
    publishReady: true,
  },
];

function BlueskyConnectModal({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const valid = handle.trim().length > 3;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      window.location.href = `/api/social/connect/bluesky?clientId=${encodeURIComponent(clientId)}&handle=${encodeURIComponent(handle.trim())}`;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bluesky connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-lg glass rounded-[2rem] border border-white/10 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <ShieldCheck className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Connect Bluesky</h2>
            <p className="text-sm text-neutral-400">Enter your handle and continue through the official Bluesky OAuth approval screen.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Handle</label>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="you.bsky.social" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50" />
          </div>
        </div>
        <div className="flex gap-3 pt-6">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-semibold transition-all">Cancel</button>
          <button type="submit" disabled={!valid || submitting} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all inline-flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Redirecting..." : "Continue to Bluesky"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PlatformCard({
  platform,
  token,
  onConnect,
  onDisconnect,
  onSelectPage,
  onSelectLinkedInTarget,
  connecting,
  disconnecting,
  configuredPlatforms,
  userType,
}: {
  platform: PlatformDef;
  token: SafeTokenData | null;
  onConnect: (platformId: string) => void;
  onDisconnect: (platformId: string) => void;
  onSelectPage: (platformId: string, pageId: string) => void;
  onSelectLinkedInTarget: (targetId: string) => void;
  connecting: string | null;
  disconnecting: string | null;
  configuredPlatforms: Set<string>;
  userType: PlanId;
}) {
  const isConnected = !!token;
  const isConfigured = configuredPlatforms.has(platform.id);
  const isConnecting = connecting === platform.id;
  const isDisconnecting = disconnecting === platform.id;
  const isBusy = isConnecting || isDisconnecting;
  const isOauthReady = platform.oauthReady !== false;
  const isPublishReady = platform.publishReady !== false;
  const isAvailableOnPlan = canPlanConnectPlatform(userType, platform.id);
  const pageOptions = token?.pageOptions ?? [];
  const linkedInTargets = token?.linkedInTargets ?? [];
  const usesMetaPageSelection =
    ["facebook", "instagram", "threads"].includes(platform.id) &&
    !(
      (platform.id === "instagram" &&
        (token?.publishTarget === "account" || token?.authMethod === "instagram_business_login")) ||
      (platform.id === "threads" && token?.publishTarget === "account")
    ) &&
    ((token?.publishTarget ?? "page") === "page" || pageOptions.length > 0);

  return (
    <div className={`glass rounded-[2rem] border p-6 flex flex-col gap-5 transition-all duration-300 ${
      isConnected ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/5 hover:border-white/10"
    }`}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 ${platform.bg}`}>
          {platform.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-lg leading-tight">{platform.name}</h3>
            {isConnected && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            )}
            {!isConfigured && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Not configured
              </span>
            )}
            {!isOauthReady && (
              <span className="flex items-center gap-1 text-xs font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Connection rollout
              </span>
            )}
            {!isPublishReady && (
              <span className="flex items-center gap-1 text-xs font-bold text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Publishing in rollout
              </span>
            )}
            {!isAvailableOnPlan && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Upgrade required
              </span>
            )}
          </div>
          <p className="text-neutral-400 text-sm mt-1 leading-relaxed">{platform.description}</p>
        </div>
      </div>

      {/* Connected account info */}
      {isConnected && token && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            {token.accountAvatar && !isDefaultTikTokAvatar(token.accountAvatar) ? (
              <img src={token.accountAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                <span className="text-violet-300 font-bold text-sm">{token.accountName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{token.accountName}</p>
              {token.pageName && (
                <p className="text-neutral-400 text-xs truncate">Page: {token.pageName}</p>
              )}
              <p className="text-neutral-500 text-xs">
                Connected {new Date(token.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          {usesMetaPageSelection && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Publish target</p>
              <select
                value={token.pageId ?? ""}
                onChange={(event) => onSelectPage(platform.id, event.target.value)}
                disabled={pageOptions.length === 0}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
              >
                {pageOptions.length === 0 ? (
                  <option value="">No Pages available</option>
                ) : (
                  pageOptions.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))
                )}
              </select>
              {platform.id === "facebook" && (
                <p className="text-xs text-neutral-500">
                  Personal Facebook profiles are not supported. NexoPost publishes to Pages only.
                </p>
              )}
              {platform.id === "instagram" && (
                <p className="text-xs text-neutral-500">
                  Instagram publishing in page-context mode requires a Business or Creator account linked to the selected Facebook Page.
                </p>
              )}
              {platform.id === "threads" && (
                <p className="text-xs text-neutral-500">
                  Threads will use the selected Meta Page context while the page-linked rollout path remains enabled.
                </p>
              )}
            </div>
          )}
          {platform.id === "linkedin" && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Publish target</p>
              <select
                value={token.selectedTargetId ?? token.accountId}
                onChange={(event) => onSelectLinkedInTarget(event.target.value)}
                disabled={linkedInTargets.length === 0}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#0A66C2]/60 disabled:opacity-50"
              >
                {(linkedInTargets.length === 0
                  ? [{ id: token.accountId, name: `${token.accountName} (Profile)`, type: "profile" as const }]
                  : linkedInTargets
                ).map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </select>
              {token.linkedInOrganizationAccessPending ? (
                <p className="text-xs text-amber-300/80">
                  Company Page options need additional LinkedIn organization access. Profile publishing is ready now.
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  Select whether this workspace publishes to the personal profile or an available Company Page.
                </p>
              )}
            </div>
          )}
          {platform.id === "instagram" && (
            <p className="text-xs text-neutral-500">
              {usesMetaPageSelection
                ? "Instagram publishing requires a Business or Creator account linked to the selected Facebook Page."
                : "Connected with Instagram Business Login. NexoPost will publish directly to this professional account, not to a personal Facebook profile."}
            </p>
          )}
          {platform.id === "threads" && (
            <p className="text-xs text-neutral-500">
              {usesMetaPageSelection
                ? "Threads will also use the selected Page context once the Meta rollout is enabled."
                : "Threads will publish directly to the connected account once the dedicated rollout path is enabled."}
            </p>
          )}
        </div>
      )}

      {/* Required env vars */}
      {!isConfigured && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
          <p className="text-amber-300 text-xs font-semibold mb-1.5">Required environment variables:</p>
          <div className="flex flex-wrap gap-1.5">
            {platform.requiredEnvs.map((env) => (
              <code key={env} className="text-xs bg-black/40 border border-white/10 text-neutral-300 px-2 py-0.5 rounded-md font-mono">
                {env}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-auto">
        {isConnected ? (
          <button
            onClick={() => onDisconnect(platform.id)}
            disabled={isBusy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
            {isDisconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : (
          <button
            onClick={() => onConnect(platform.id)}
            disabled={isBusy || !isConfigured || !isOauthReady || !isAvailableOnPlan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-300 hover:text-violet-200 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {isConnecting ? "Connecting…" : !isAvailableOnPlan ? "Upgrade" : !isOauthReady ? "Soon" : isConfigured ? "Connect" : "Not available"}
          </button>
        )}

        <a
          href={platform.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-neutral-500 hover:text-neutral-300 text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Dev Console
        </a>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const { data: session } = useSession();
  const { activeClient, userType } = useApp();
  const searchParams = useSearchParams();

  const [tokens, setTokens] = useState<SafeTokens>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [configuredPlatforms, setConfiguredPlatforms] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);

  const userId = session?.user?.id;

  const showToast = useCallback((message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadTokens = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/users/${userId}/social-tokens`);
      if (res.ok) setTokens(await res.json() as SafeTokens);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Check which platforms are configured (env vars set)
  const checkConfigured = useCallback(async () => {
    try {
      const res = await fetch("/api/social/configured");
      if (res.ok) {
        const data = await res.json() as { configured: string[] };
        setConfiguredPlatforms(new Set(data.configured));
      }
    } catch {
      // If endpoint unavailable, assume all configured (env check at connect time)
      setConfiguredPlatforms(new Set(PLATFORMS.map((p) => p.id)));
    }
  }, []);

  useEffect(() => {
    loadTokens();
    checkConfigured();
  }, [loadTokens, checkConfigured]);

  // Handle OAuth callback result
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const detail = searchParams.get("detail");

    if (success) {
      const name = PLATFORMS.find((p) => p.id === success)?.name ?? success;
      showToast(`${name} connected successfully!`, "success");
      loadTokens();
      window.history.replaceState(null, "", "/connections");
    }
    if (error) {
      const messages: Record<string, string> = {
        not_configured: "Platform is not configured. Add the required environment variables.",
        invalid_state: "OAuth state mismatch. Please try again.",
        token_exchange_failed: `Connection failed${detail ? `: ${decodeURIComponent(detail)}` : ""}. Check your API credentials.`,
        access_denied: "Access was denied. Please authorize the app.",
        plan_locked: detail ? decodeURIComponent(detail) : "Your current plan does not include this connection.",
      };
      showToast(messages[error] ?? `Connection error: ${error}`, "error");
      window.history.replaceState(null, "", "/connections");
    }
  }, [searchParams, showToast, loadTokens]);

  const handleConnect = (platformId: string) => {
    if (!activeClient.id || !userId) return;
    if (platformId === "bluesky") {
      setShowBlueskyModal(true);
      return;
    }
    setConnecting(platformId);
    // Navigate to OAuth initiation route — page will redirect to platform
    window.location.href = `/api/social/connect/${platformId}?clientId=${encodeURIComponent(activeClient.id)}`;
  };

  const handleDisconnect = async (platformId: string) => {
    if (!userId || !activeClient.id) return;
    setDisconnecting(platformId);
    try {
      const res = await fetch(
        `/api/users/${userId}/social-tokens?clientId=${encodeURIComponent(activeClient.id)}&platform=${platformId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setTokens((prev) => {
          const next = { ...prev };
          if (next[activeClient.id]) {
            next[activeClient.id] = { ...next[activeClient.id] };
            delete next[activeClient.id][platformId];
          }
          return next;
        });
        const name = PLATFORMS.find((p) => p.id === platformId)?.name ?? platformId;
        showToast(`${name} disconnected.`, "success");
      } else {
        showToast("Failed to disconnect. Please try again.");
      }
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSelectPage = async (platformId: string, pageId: string) => {
    if (!userId || !activeClient.id || !pageId) return;

    try {
      const res = await fetch(`/api/users/${userId}/social-tokens`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          platform: platformId,
          pageId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to update Page selection." }));
        throw new Error(data.error ?? "Failed to update Page selection.");
      }

      const data = await res.json() as { pageId: string; pageName: string };
      setTokens((prev) => {
        const next = { ...prev };
        next[activeClient.id] = {
          ...(next[activeClient.id] ?? {}),
          [platformId]: {
            ...(next[activeClient.id]?.[platformId] ?? {}),
            pageId: data.pageId,
            pageName: data.pageName,
          },
        };
        return next;
      });
      showToast(`${PLATFORMS.find((entry) => entry.id === platformId)?.name ?? platformId} publish target updated.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update Page selection.");
    }
  };

  const handleSelectLinkedInTarget = async (targetId: string) => {
    if (!userId || !activeClient.id || !targetId) return;

    try {
      const res = await fetch(`/api/users/${userId}/social-tokens`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          platform: "linkedin",
          targetId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to update LinkedIn publish target." }));
        throw new Error(data.error ?? "Failed to update LinkedIn publish target.");
      }

      const data = await res.json() as { id: string; name: string };
      setTokens((prev) => {
        const next = { ...prev };
        next[activeClient.id] = {
          ...(next[activeClient.id] ?? {}),
          linkedin: {
            ...(next[activeClient.id]?.linkedin ?? {}),
            selectedTargetId: data.id,
          },
        };
        return next;
      });
      showToast(`LinkedIn publish target updated to ${data.name}.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update LinkedIn publish target.");
    }
  };

  const clientTokens = tokens[activeClient.id] ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {showBlueskyModal ? (
        <BlueskyConnectModal
          clientId={activeClient.id}
          onClose={() => setShowBlueskyModal(false)}
        />
      ) : null}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/60 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 max-w-sm text-center ${
          toast.type === "success"
            ? "bg-[#091a0f] border border-emerald-500/50 text-emerald-200"
            : "bg-[#1a0909] border border-red-500/50 text-red-200"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="pl-2 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">OAuth Connections</p>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Social Connections</h1>
          <p className="text-neutral-400 text-lg font-medium flex items-center gap-2">
            Connecting accounts for:
            <span className="bg-violet-600/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
              <Building2 className="w-4 h-4" /> {activeClient.name || "—"}
            </span>
          </p>
        </div>
        <div className="shrink-0 px-4 py-2.5 rounded-xl border font-semibold text-sm bg-violet-500/10 border-violet-500/30 text-violet-400">
          {Object.keys(clientTokens).length} of {PLATFORMS.length} platforms connected
        </div>
      </header>

      {/* Info banner */}
      <div className="glass rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/80 leading-relaxed">
          <strong className="text-amber-300">Before connecting:</strong> Create developer apps for OAuth-based networks and add their credentials to your Vercel environment. Bluesky also uses OAuth now, but it only needs the user handle because NexoPost publishes the required client metadata automatically.
        </div>
      </div>

      {/* Platform grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              token={clientTokens[platform.id] ?? null}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onSelectPage={handleSelectPage}
              onSelectLinkedInTarget={handleSelectLinkedInTarget}
              connecting={connecting}
              disconnecting={disconnecting}
              configuredPlatforms={configuredPlatforms}
              userType={userType}
            />
          ))}
        </div>
      )}

      {/* Setup guide */}
      <section className="glass rounded-[2rem] border border-white/5 p-8 space-y-5">
        <h2 className="text-lg font-bold text-white">Setup Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-neutral-400">
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Twitter / X</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-400">
              <li>Go to developer.twitter.com and create a project + app</li>
              <li>Enable OAuth 2.0 with PKCE, add callback URL</li>
              <li>Select <em>Read and Write</em> permissions</li>
              <li>Add <code className="text-violet-300 bg-white/5 px-1 rounded">TWITTER_CLIENT_ID</code> &amp; <code className="text-violet-300 bg-white/5 px-1 rounded">TWITTER_CLIENT_SECRET</code> to env vars</li>
            </ol>
          </div>
          <div className="space-y-3">
            <h3 className="text-white font-semibold">LinkedIn</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-400">
              <li>Go to linkedin.com/developers and create an app</li>
              <li>Request <em>Share on LinkedIn</em> and <em>Sign In with LinkedIn using OpenID Connect</em> products</li>
              <li>Add OAuth 2.0 redirect URL</li>
              <li>Add <code className="text-violet-300 bg-white/5 px-1 rounded">LINKEDIN_CLIENT_ID</code> &amp; <code className="text-violet-300 bg-white/5 px-1 rounded">LINKEDIN_CLIENT_SECRET</code></li>
            </ol>
          </div>
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Facebook &amp; Instagram</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-400">
              <li>Create a Meta Business app at developers.facebook.com</li>
              <li>Add <em>Facebook Login</em> and <em>Instagram Graph API</em> products</li>
              <li><strong className="text-amber-300">Recommended:</strong> Complete Meta Business Verification for higher rate limits &amp; Instagram access</li>
              <li>Add <code className="text-violet-300 bg-white/5 px-1 rounded">FACEBOOK_APP_ID</code> &amp; <code className="text-violet-300 bg-white/5 px-1 rounded">FACEBOOK_APP_SECRET</code></li>
            </ol>
          </div>
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Callback URLs to Register</h3>
            <p className="text-neutral-500">Add these redirect URIs in each platform&apos;s developer console:</p>
            <div className="space-y-1">
              {["twitter", "linkedin", "facebook", "instagram", "tiktok", "youtube", "pinterest", "threads"].map((p) => (
                <code key={p} className="block text-xs bg-black/40 border border-white/10 text-violet-300 px-3 py-1.5 rounded-lg font-mono">
                  {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/social/callback/{p}
                </code>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
