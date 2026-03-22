"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Repeat2, LayoutDashboard, Timer, CheckCircle2, Workflow, ArrowRight, BarChart3, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCtaHref } from "@/hooks/useCtaHref";

const tabIds = ["sync", "multi", "schedule", "analytics", "ai", "inbox"] as const;
type TabId = (typeof tabIds)[number];

function isTabId(value: string | null): value is TabId {
  return value !== null && tabIds.includes(value as TabId);
}

export default function FeaturesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-violet-500 animate-spin" /></div>}>
      <FeaturesContent />
    </Suspense>
  );
}

function FeaturesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const ctaHref = useCtaHref();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId = isTabId(tabParam) ? tabParam : "sync";

  useEffect(() => {
    if (tabParam) {
      const el = document.getElementById("feature-tabs");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const tabs = [
    {
      id: "sync",
      icon: <Repeat2 className="w-5 h-5" />,
      title: t.features.f1_title,
      summary: t.features.f1_desc,
      color: "violet",
      points: t.features_page.sync
    },
    {
      id: "multi",
      icon: <LayoutDashboard className="w-5 h-5" />,
      title: t.features.f2_title,
      summary: t.features.f2_desc,
      color: "indigo",
      points: t.features_page.multi
    },
    {
      id: "schedule",
      icon: <Timer className="w-5 h-5" />,
      title: t.features.f3_title,
      summary: t.features.f3_desc,
      color: "sky",
      points: t.features_page.schedule
    },
    {
      id: "analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      title: t.features.f4_title,
      summary: t.features.f4_desc,
      color: "fuchsia",
      points: t.features_page.analytics || []
    },
    {
      id: "ai",
      icon: <Sparkles className="w-5 h-5" />,
      title: t.features.f5_title,
      summary: t.features.f5_desc,
      color: "amber",
      points: t.features_page.ai || []
    },
    {
      id: "inbox",
      icon: <MessageSquare className="w-5 h-5" />,
      title: t.features.f6_title,
      summary: t.features.f6_desc,
      color: "rose",
      points: t.features_page.inbox || []
    }
  ] as const;

  const currentTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  const colorMap = {
    violet: {
      theme: "text-violet-400 bg-violet-500/10 border-violet-500/20",
      line: "bg-violet-500",
    },
    indigo: {
      theme: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      line: "bg-indigo-500",
    },
    sky: {
      theme: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      line: "bg-sky-500",
    },
    fuchsia: {
      theme: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
      line: "bg-fuchsia-500",
    },
    amber: {
      theme: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      line: "bg-amber-500",
    },
    rose: {
      theme: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      line: "bg-rose-500",
    },
  };

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-x-hidden pt-20 md:pt-24 pb-20 md:pb-32">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[800px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-8 md:mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-violet-400 font-bold text-sm mb-6 uppercase tracking-widest shadow-lg shadow-violet-500/10">
            <Workflow className="w-4 h-4" /> {t.features_page.badge}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-neutral-500 tracking-tight leading-tight mb-4 md:mb-6">
            {t.features_page.title_main}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">{t.features_page.title_highlight}</span>
          </h1>
          <p className="text-base md:text-xl text-neutral-400 max-w-2xl mx-auto font-medium">
            {t.features_page.subtitle}
          </p>
        </div>

        {/* Tab Selector & Content Container */}
        <div id="feature-tabs" className="flex flex-col lg:flex-row shadow-2xl rounded-2xl md:rounded-[3rem] border border-white/5 glass overflow-hidden animate-in fade-in duration-700 delay-150 relative">

          {/* ── Mobile tab grid (3×2) — hidden on lg+ ── */}
          <div className="lg:hidden grid grid-cols-3 border-b border-white/5 bg-black/40 p-2 gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const colors = colorMap[tab.color as keyof typeof colorMap];
              return (
                <button
                  key={tab.id}
                  onClick={() => router.replace(`/features?tab=${tab.id}`, { scroll: false })}
                  className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `glass border ${colors.theme}`
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  {/* active underline */}
                  {isActive && (
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full ${colors.line}`} />
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${isActive ? "bg-white/15 scale-110" : "bg-black/30"}`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight line-clamp-2 w-full ${isActive ? "text-white" : "text-neutral-400"}`}>
                    {tab.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Desktop sidebar nav — hidden on mobile ── */}
          <div className="hidden lg:flex lg:flex-col lg:w-1/3 border-r border-white/5 p-6 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const colors = colorMap[tab.color as keyof typeof colorMap];
              return (
                <button
                  key={tab.id}
                  onClick={() => router.replace(`/features?tab=${tab.id}`, { scroll: false })}
                  className={`flex items-start text-left gap-4 p-5 rounded-2xl transition-all duration-300 relative group overflow-hidden w-full ${
                    isActive ? `glass border border-white/10 ${colors.theme}` : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full ${colors.line}`} />
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${isActive ? "bg-white/10 scale-110" : "bg-black/30 group-hover:scale-110"}`}>
                    {tab.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-lg font-bold transition-colors ${isActive ? "text-white" : "text-neutral-400 group-hover:text-white"}`}>
                      {tab.title}
                    </h3>
                    <p className={`text-sm mt-1 line-clamp-2 ${isActive ? "text-neutral-300" : "text-neutral-500"}`}>
                      {tab.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Content Panel ── */}
          <div className="w-full lg:w-2/3 p-5 sm:p-8 lg:p-12 xl:p-16 relative bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Title row */}
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 shadow-inner shadow-white/5">
                  <div className={`text-${currentTabData.color}-400`}>
                    {currentTabData.icon}
                  </div>
                </div>
                <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight break-words min-w-0 flex-1">
                  {currentTabData.title}
                </h2>
              </div>

              {/* Summary */}
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-neutral-400 font-medium leading-relaxed mb-5 md:mb-8">
                {currentTabData.summary} {t.features_page.detail_text}
              </p>

              {/* Feature points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5 mb-6 md:mb-10">
                {currentTabData.points.map((point: string, index: number) => (
                  <div key={index} className="flex gap-3 items-start">
                    <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 text-${currentTabData.color}-400 shrink-0 mt-0.5`} />
                    <p className="text-neutral-300 leading-relaxed text-sm font-medium">
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={ctaHref}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 text-white font-bold bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-6 py-3 sm:py-4 transition-all hover:scale-105 active:scale-95 group text-sm sm:text-base"
              >
                {t.features_page.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
