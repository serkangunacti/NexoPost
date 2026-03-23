"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, AlertCircle, Loader2, Link2, Unlink, Building2, ExternalLink } from "lucide-react";
import { SiX, SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

// Redacted token info returned from GET /api/users/[id]/social-tokens
interface SafeTokenData {
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  connectedAt: string;
  pageId?: string;
  pageName?: string;
  scope?: string;
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
}

const PLATFORMS: PlatformDef[] = [
  {
    id: "twitter",
    name: "Twitter / X",
    icon: <SiX className="w-7 h-7" />,
    gradient: "from-neutral-900 to-neutral-800",
    ring: "ring-white/30",
    bg: "bg-black",
    description: "Post tweets and threads. Requires Twitter Developer App with Basic ($100/mo) or higher plan for write access.",
    requiredEnvs: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"],
    docsUrl: "https://developer.twitter.com/en/portal/dashboard",
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
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <SiInstagram className="w-7 h-7" />,
    gradient: "from-[#FD1D1D] via-[#E1306C] to-[#833AB4]",
    ring: "ring-[#E1306C]/50",
    bg: "bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4]",
    description: "Post to Instagram Business or Creator accounts linked to a Facebook Page. Uses the same Meta app as Facebook.",
    requiredEnvs: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
    docsUrl: "https://developers.facebook.com/apps",
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
  },
];

function PlatformCard({
  platform,
  token,
  activeClientId,
  userId,
  onConnect,
  onDisconnect,
  connecting,
  disconnecting,
  configuredPlatforms,
}: {
  platform: PlatformDef;
  token: SafeTokenData | null;
  activeClientId: string;
  userId: string;
  onConnect: (platformId: string) => void;
  onDisconnect: (platformId: string) => void;
  connecting: string | null;
  disconnecting: string | null;
  configuredPlatforms: Set<string>;
}) {
  const isConnected = !!token;
  const isConfigured = configuredPlatforms.has(platform.id);
  const isConnecting = connecting === platform.id;
  const isDisconnecting = disconnecting === platform.id;
  const isBusy = isConnecting || isDisconnecting;

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
          </div>
          <p className="text-neutral-400 text-sm mt-1 leading-relaxed">{platform.description}</p>
        </div>
      </div>

      {/* Connected account info */}
      {isConnected && token && (
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
          {token.accountAvatar ? (
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
            disabled={isBusy || !isConfigured}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-300 hover:text-violet-200 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {isConnecting ? "Connecting…" : isConfigured ? "Connect" : "Not available"}
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
  const { activeClient } = useApp();
  const searchParams = useSearchParams();

  const [tokens, setTokens] = useState<SafeTokens>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [configuredPlatforms, setConfiguredPlatforms] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
      };
      showToast(messages[error] ?? `Connection error: ${error}`, "error");
      window.history.replaceState(null, "", "/connections");
    }
  }, [searchParams, showToast, loadTokens]);

  const handleConnect = (platformId: string) => {
    if (!activeClient.id || !userId) return;
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

  const clientTokens = tokens[activeClient.id] ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

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
          <strong className="text-amber-300">Before connecting:</strong> Create a developer app on each platform&apos;s developer console and add the API credentials as environment variables in your Vercel project settings. Each platform connection opens a secure OAuth authorization window.
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
              activeClientId={activeClient.id}
              userId={userId ?? ""}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              connecting={connecting}
              disconnecting={disconnecting}
              configuredPlatforms={configuredPlatforms}
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
              {["twitter", "linkedin", "facebook", "instagram", "tiktok"].map((p) => (
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
