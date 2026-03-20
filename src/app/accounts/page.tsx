"use client";

import { useState } from "react";
import { Check, Link as LinkIcon, AlertCircle } from "lucide-react";

export default function AccountsPage() {
  const [platforms, setPlatforms] = useState([
    { id: "twitter", name: "Twitter/X", icon: "𝕏", color: "bg-neutral-900 border border-neutral-700", connected: true, handle: "@nexopost" },
    { id: "linkedin", name: "LinkedIn", icon: "in", color: "bg-[#0A66C2]", connected: false, handle: "" },
    { id: "facebook", name: "Facebook", icon: "f", color: "bg-[#1877F2]", connected: true, handle: "NexoPost App" },
    { id: "instagram", name: "Instagram", icon: "IG", color: "bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4]", connected: false, handle: "" },
  ]);

  const toggleConnect = (id: string) => {
    setPlatforms(platforms.map(p => {
      if (p.id === id) {
        return { ...p, connected: !p.connected, handle: !p.connected ? "@mock_user" : "" };
      }
      return p;
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-8 pl-2">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Social Accounts</h1>
        <p className="text-neutral-400 text-lg font-medium">Connect your profiles to enable cross-posting to multiple networks at once.</p>
      </header>

      <div className="glass rounded-[2rem] p-8 md:p-12 border border-white/5 relative overflow-hidden shadow-2xl">
        {/* Ambient Glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {platforms.map(platform => (
            <div key={platform.id} className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all hover:bg-white/5">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[1rem] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-black/30 ${platform.color} group-hover:scale-110 transition-transform duration-300`}>
                  {platform.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{platform.name}</h3>
                  {platform.connected ? (
                    <span className="text-sm text-emerald-400 flex items-center gap-1.5 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-md w-fit">
                      <Check className="w-3.5 h-3.5" /> Connected as {platform.handle}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-500 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> Not connected
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => toggleConnect(platform.id)}
                className={`py-2 px-5 rounded-full text-sm font-bold transition-all ${
                  platform.connected 
                  ? "bg-white/5 text-neutral-300 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30" 
                  : "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:scale-105 active:scale-95 border border-violet-400/50"
                }`}
              >
                {platform.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex gap-4 relative z-10 items-start">
          <div className="p-2.5 bg-sky-500/20 rounded-xl shrink-0 shadow-inner">
            <LinkIcon className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h4 className="text-sky-300 font-bold mb-1.5 text-lg">More platforms coming soon</h4>
            <p className="text-sky-200/70 text-sm leading-relaxed max-w-2xl font-medium">We are actively working on adding support for TikTok, Pinterest, and YouTube Shorts. Stay tuned for updates in the upcoming releases!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
