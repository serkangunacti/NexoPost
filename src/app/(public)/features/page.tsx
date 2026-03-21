"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Repeat2, LayoutDashboard, Timer, CheckCircle2, Workflow, ArrowRight, Zap, Target, BarChart, Smartphone } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function FeaturesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-violet-500 animate-spin" /></div>}>
      <FeaturesContent />
    </Suspense>
  );
}

function FeaturesContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"sync" | "multi" | "schedule">("sync");

  // Load the initial tab from URL param if available
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "sync" || tabParam === "multi" || tabParam === "schedule") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    {
      id: "sync",
      icon: <Repeat2 className="w-5 h-5" />,
      title: t.features.f1_title,
      summary: t.features.f1_desc,
      color: "violet",
      points: [
        "Connect all platforms: X (Twitter), Facebook, LinkedIn, Instagram, TikTok, Threads, Bluesky, Pinterest, and YouTube.",
        "One central compose window for multiple destinations, eliminating copy-pasting.",
        "Auto-Scale Media artificially scales your graphics (1:1 for IG, 9:16 for TT) flawlessly.",
        "Platform-specific previews guarantee your content looks perfect natively before publishing."
      ]
    },
    {
      id: "multi",
      icon: <LayoutDashboard className="w-5 h-5" />,
      title: t.features.f2_title,
      summary: t.features.f2_desc,
      color: "indigo",
      points: [
        "Isolate client workspaces into distinct 'Brands' or 'Projects' under one login.",
        "Toggle instantly between 10+ different companies without logging out and back in.",
        "Centralized billing for the agency owner while deploying dedicated analytics per brand.",
        "Keep tokens securely isolated; post to Brand A's Twitter without mixing it up with Brand B's."
      ]
    },
    {
      id: "schedule",
      icon: <Timer className="w-5 h-5" />,
      title: t.features.f3_title,
      summary: t.features.f3_desc,
      color: "sky",
      points: [
        "Queue weeks' worth of posts inside the visual Drag-and-Drop Calendar.",
        "Set custom times for specific time zones to reach global audiences.",
        "Save posts as Drafts for your copywriters or clients to review before hitting Schedule.",
        "Leverage 'Evergreen' queues to recycle your best-performing posts indefinitely."
      ]
    }
  ] as const;

  const currentTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden pt-24 pb-32">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[800px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-violet-400 font-bold text-sm mb-6 uppercase tracking-widest shadow-lg shadow-violet-500/10">
            <Workflow className="w-4 h-4" /> Platform Features
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-neutral-500 tracking-tight leading-tight mb-6">
            Everything you need. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Nothing you don't.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-medium">
            Dive deep into the specific modules that make NexoPost the ultimate automation and orchestration tool for social media.
          </p>
        </div>

        {/* Tab Selector & Content Container */}
        <div className="flex flex-col lg:flex-row shadow-2xl rounded-[3rem] border border-white/5 glass overflow-hidden animate-in fade-in zoom-in-95 duration-700 delay-150 relative">
          
          {/* Side Nav for desktop (Top nav for mobile) */}
          <div className="flex flex-row lg:flex-col lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/5 p-4 md:p-6 gap-2 bg-black/40 lg:bg-transparent overflow-x-auto lg:overflow-visible">
             {tabs.map((tab) => {
               const isActive = activeTab === tab.id;
               const ColorTheme = {
                 violet: "text-violet-400 bg-violet-500/10 border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]",
                 indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]",
                 sky: "text-sky-400 bg-sky-500/10 border-sky-500/20 shadow-[0_0_20px_rgba(14,165,233,0.15)]",
               }[tab.color];

               const ActiveLineColor = {
                 violet: "bg-violet-500",
                 indigo: "bg-indigo-500",
                 sky: "bg-sky-500",
               }[tab.color];

               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-start text-left gap-4 p-5 rounded-2xl transition-all duration-300 relative group overflow-hidden whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink w-auto lg:w-full
                     ${isActive ? `glass border border-white/10 ${ColorTheme}` : 'hover:bg-white/5 border border-transparent'}
                   `}
                 >
                    {/* Active Indicator Line */}
                    {isActive && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full ${ActiveLineColor} shadow-[0_0_10px_currentColor] hidden lg:block`} />
                    )}
                    {isActive && (
                      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-t-full ${ActiveLineColor} shadow-[0_0_10px_currentColor] lg:hidden`} />
                    )}

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${isActive ? 'bg-white/10 scale-110' : 'bg-black/30 group-hover:scale-110'}`}>
                      {tab.icon}
                    </div>
                    <div>
                       <h3 className={`text-lg font-bold transition-colors ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
                          {tab.title}
                       </h3>
                       <p className={`text-sm hidden lg:block mt-1 line-clamp-2 ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {tab.summary}
                       </p>
                    </div>
                 </button>
               );
             })}
          </div>

          {/* Right Content Details */}
          <div className="lg:w-2/3 p-8 md:p-12 lg:p-16 relative bg-gradient-to-br from-white/[0.02] to-transparent">
             <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
             
             {/* Key content rendering bound by activeTab */}
             <div key={activeTab} className="animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-8 shadow-inner shadow-white/5">
                 <div className={`text-${currentTabData.color}-400`}>
                   {currentTabData.icon}
                 </div>
               </div>

               <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                 {currentTabData.title}
               </h2>
               <p className="text-xl text-neutral-400 font-medium leading-relaxed mb-10">
                 {currentTabData.summary} Detailed below are the core mechanics of how this module accelerates your digital workflow.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                 {currentTabData.points.map((point, index) => (
                   <div key={index} className="flex gap-4">
                      <div className="shrink-0 mt-1">
                        <CheckCircle2 className={`w-6 h-6 text-${currentTabData.color}-400`} />
                      </div>
                      <p className="text-neutral-300 leading-relaxed text-[15px] font-medium">
                        {point}
                      </p>
                   </div>
                 ))}
               </div>

               <Link href="/dashboard" className="inline-flex items-center gap-2 text-white font-bold bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-8 py-4 transition-all hover:scale-105 active:scale-95 group">
                 Experience it now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Link>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
