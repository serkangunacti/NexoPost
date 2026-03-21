"use client";

import { useApp } from "@/context/AppContext";
import { getAnalyticsOverview } from "@/lib/adminAnalytics";
import { BarChart3, Lock, TrendingUp, Users, Eye, ArrowUpRight, Link as LinkIcon } from "lucide-react";
import { SiYoutube, SiTiktok, SiMeta } from "react-icons/si";
import Link from "next/link";

export default function AnalyticsPage() {
  const { userType, activeClient, connectedAccounts } = useApp();

  const currentConnectedIds = connectedAccounts[activeClient.id] || [];
  const isMetaConnected = currentConnectedIds.includes('facebook') || currentConnectedIds.includes('instagram');
  const isTikTokConnected = currentConnectedIds.includes('tiktok');
  const isYouTubeConnected = currentConnectedIds.includes('youtube');
  const overview = getAnalyticsOverview(userType, currentConnectedIds);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <header className="mb-6 pl-2">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Social Analytics</h1>
        <p className="text-neutral-400 text-lg font-medium">Track your brand&apos;s cross-platform performance.</p>
      </header>

      {userType === "basic" ? (
        <div className="glass rounded-[2rem] p-12 md:p-20 text-center border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          <Lock className="w-20 h-20 text-neutral-600 mb-6 drop-shadow-2xl" />
          <h2 className="text-3xl font-bold text-white mb-4">Advanced Analytics Locked</h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-lg">Unlock comprehensive Meta and TikTok analytics reporting to understand your audience and grow your brand.</p>
          <button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-500 hover:to-sky-400 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-violet-500/25 hover:scale-105 active:scale-95 text-lg">
            Upgrade to Pro
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {overview.map((metric) => {
              const Icon = metric.key === "audience" ? Users : metric.key === "impressions" ? Eye : BarChart3;
              return (
                <div key={metric.key} className="glass p-6 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-3 text-neutral-400 font-semibold mb-4">
                    <Icon className={`w-5 h-5 ${metric.iconAccent}`} /> {metric.title}
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3" /> {metric.trend}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Meta Analytics */}
            <div className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                    <SiMeta className="w-6 h-6 text-[#0668E1]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Meta Suite</h3>
                </div>
                {isMetaConnected ? (
                  <button onClick={() => alert("Full Report module will be available soon in next update.")} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1 hover:bg-white/5 rounded-lg"><ArrowUpRight className="w-4 h-4" /> Full Report</button>
                ) : (
                  <Link href="/accounts" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors font-bold px-3 py-1 bg-violet-500/10 rounded-lg hover:bg-violet-500/20"><LinkIcon className="w-4 h-4" /> Connect Meta</Link>
                )}
              </div>
              
              {isMetaConnected ? (
                <>
                  <div className="h-48 w-full border-b border-white/10 flex items-end justify-between px-2 pt-10 gap-2 relative z-10">
                    {[40, 70, 45, 90, 60, 100, 50].map((h, i) => (
                      <div key={i} className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-md hover:opacity-80 transition-opacity cursor-pointer group relative" style={{ height: `${h}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {h}k
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between px-2 mt-4 text-xs font-bold text-neutral-500 uppercase tracking-widest relative z-10">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </>
              ) : (
                <div className="h-48 w-full flex flex-col items-center justify-center z-10 relative">
                  <p className="text-neutral-500 mb-4 font-medium text-center px-4">Your Meta account (Facebook/Instagram) is not connected. Link a social account to view data charts.</p>
                  <Link href="/accounts" className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 border border-white/10">
                     <LinkIcon className="w-4 h-4" /> Go to Accounts
                  </Link>
                </div>
              )}
            </div>

            {/* TikTok Analytics */}
            <div className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(0,242,254,0.3)]">
                    <SiTiktok className="w-5 h-5 text-[#00f2fe] drop-shadow-[2px_2px_0_#fe0979]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">TikTok For Business</h3>
                </div>
                {isTikTokConnected ? (
                  <button onClick={() => alert("Full Report module will be available soon in next update.")} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1 hover:bg-white/5 rounded-lg"><ArrowUpRight className="w-4 h-4" /> Full Report</button>
                ) : (
                  <Link href="/accounts" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors font-bold px-3 py-1 bg-violet-500/10 rounded-lg hover:bg-violet-500/20"><LinkIcon className="w-4 h-4" /> Connect TikTok</Link>
                )}
              </div>
              
              {isTikTokConnected ? (
                <>
                  <div className="h-48 w-full border-b border-white/10 flex items-end justify-between px-2 pt-10 gap-2 relative z-10">
                    {[60, 40, 80, 50, 100, 70, 90].map((h, i) => (
                      <div key={i} className="w-full bg-gradient-to-t from-[#fe0979] to-[#00f2fe] rounded-t-md hover:opacity-80 transition-opacity cursor-pointer group relative" style={{ height: `${h}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {h}k
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between px-2 mt-4 text-xs font-bold text-neutral-500 uppercase tracking-widest relative z-10">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </>
              ) : (
                <div className="h-48 w-full flex flex-col items-center justify-center z-10 relative">
                  <p className="text-neutral-500 mb-4 font-medium text-center px-4">Your TikTok account is not connected. Link your account to view business data.</p>
                  <Link href="/accounts" className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 border border-white/10">
                     <LinkIcon className="w-4 h-4" /> Go to Accounts
                  </Link>
                </div>
              )}
            </div>

            {/* YouTube Analytics */}
            {userType === "agency" ? (
              <div className="glass p-8 rounded-[2rem] border border-white/5 lg:col-span-2 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                      <SiYoutube className="w-6 h-6 text-[#FF0000]" />
                    </div>
                    <h3 className="text-xl font-bold text-white">YouTube Studio Analytics</h3>
                  </div>
                  {isYouTubeConnected ? (
                    <button onClick={() => alert("Full Report module will be available soon in next update.")} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1 hover:bg-white/5 rounded-lg"><ArrowUpRight className="w-4 h-4" /> Full Report</button>
                  ) : (
                    <Link href="/accounts" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors font-bold px-3 py-1 bg-violet-500/10 rounded-lg hover:bg-violet-500/20"><LinkIcon className="w-4 h-4" /> Connect YouTube</Link>
                  )}
                </div>
                
                {isYouTubeConnected ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-colors cursor-pointer">
                      <p className="text-neutral-400 text-sm font-semibold mb-2">Subscribers</p>
                      <p className="text-2xl font-bold text-white">142.5k</p>
                      <p className="text-xs text-emerald-400 mt-2 font-medium">+1,204 (28 days)</p>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-colors cursor-pointer">
                      <p className="text-neutral-400 text-sm font-semibold mb-2">Watch Time</p>
                      <p className="text-2xl font-bold text-white">840.2k hrs</p>
                      <p className="text-xs text-emerald-400 mt-2 font-medium">+12% (28 days)</p>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-colors cursor-pointer">
                      <p className="text-neutral-400 text-sm font-semibold mb-2">Estimated Revenue</p>
                      <p className="text-2xl font-bold text-white">$4,295</p>
                      <p className="text-xs text-emerald-400 mt-2 font-medium">+$450 (28 days)</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center z-10 relative py-10">
                    <p className="text-neutral-500 mb-4 font-medium text-center px-4">Your YouTube account is not connected. Link your account to view engagement stats and channel reports.</p>
                    <Link href="/accounts" className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 border border-white/10">
                      <LinkIcon className="w-4 h-4" /> Go to Accounts
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass p-8 rounded-[2rem] border border-white/5 lg:col-span-2 relative overflow-hidden group">
                <div className="absolute inset-0 backdrop-blur-sm bg-[#050508]/60 z-10 flex flex-col items-center justify-center text-center p-6">
                  <Lock className="w-12 h-12 text-neutral-500 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">YouTube Studio Locked</h3>
                  <p className="text-neutral-400 max-w-md mb-6">Unlock deep YouTube metrics, estimated revenue algorithms, and advanced agency tools.</p>
                  <button className="bg-white hover:bg-neutral-200 text-black px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 text-sm">
                    Upgrade to Agency
                  </button>
                </div>
                
                {/* Blurred backdrop content */}
                <div className="opacity-30 pointer-events-none filter blur-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                        <SiYoutube className="w-6 h-6 text-[#FF0000]" />
                      </div>
                      <h3 className="text-xl font-bold text-white">YouTube Studio Analytics</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-5 h-24"></div>
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-5 h-24"></div>
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-5 h-24"></div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
