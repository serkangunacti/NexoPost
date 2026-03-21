"use client";

import { Check, AlertCircle, Building2 } from "lucide-react";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import { useApp } from "@/context/AppContext";

export default function AccountsPage() {
  const { userType, activeClient, connectedAccounts, toggleAccount } = useApp();
  
  const defaultPlatforms = [
    { id: "twitter", name: "Twitter/X", icon: <SiX className="w-6 h-6" />, color: "bg-neutral-900 border border-neutral-700" },
    { id: "linkedin", name: "LinkedIn", icon: <FaLinkedin className="w-6 h-6" />, color: "bg-[#0A66C2]" },
    { id: "facebook", name: "Facebook", icon: <SiFacebook className="w-6 h-6" />, color: "bg-[#1877F2]" },
    { id: "instagram", name: "Instagram", icon: <SiInstagram className="w-6 h-6" />, color: "bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4]" },
    { id: "tiktok", name: "TikTok", icon: <SiTiktok className="w-6 h-6 text-[#00f2fe] drop-shadow-[1px_1px_0_#fe0979]" />, color: "bg-black border border-white/10" },
    { id: "threads", name: "Threads", icon: <SiThreads className="w-6 h-6" />, color: "bg-black border border-neutral-800" },
    { id: "bluesky", name: "Bluesky", icon: <SiBluesky className="w-6 h-6" />, color: "bg-[#0560FF]" },
    { id: "pinterest", name: "Pinterest", icon: <SiPinterest className="w-6 h-6" />, color: "bg-[#E60023]" },
    { id: "youtube", name: "YouTube", icon: <SiYoutube className="w-6 h-6 text-[#FF0000]" />, color: "bg-white border border-neutral-200" },
  ];

  const currentConnectedIds = connectedAccounts[activeClient.id] || [];

  const handleToggle = (id: string) => {
    toggleAccount(activeClient.id, id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-6 pl-2 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Social Accounts</h1>
          <p className="text-neutral-400 text-lg font-medium flex items-center gap-2">
            Managing accounts for: 
            <span className="bg-violet-600/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
              <Building2 className="w-4 h-4" /> {activeClient.name}
            </span>
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-xl border font-bold text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
          Unlimited Networks Supported
          <span className="block text-xs font-semibold opacity-70 uppercase mt-0.5">{userType} Plan</span>
        </div>
      </header>

      <div className="glass rounded-[2rem] p-8 md:p-12 border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {defaultPlatforms.map(platform => {
            const isConnected = currentConnectedIds.includes(platform.id);
            
            return (
              <div key={platform.id} className="glass p-6 rounded-2xl flex flex-col justify-between group hover:border-white/20 transition-all hover:bg-white/5 gap-6">
                <div className="flex items-start justify-between w-full">
                  <div className={`w-14 h-14 rounded-[1rem] flex items-center justify-center text-white font-bold shadow-lg shadow-black/30 ${platform.color} group-hover:scale-110 transition-transform duration-300`}>
                    {platform.icon}
                  </div>
                  {isConnected && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold bg-emerald-400/10 px-2 py-1 rounded-md">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{platform.name}</h3>
                  {isConnected ? (
                    <p className="text-sm text-neutral-400">@{activeClient.name.toLowerCase().replace(/\s+/g, '')}</p>
                  ) : (
                    <p className="text-sm text-neutral-500 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> Not connected
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => handleToggle(platform.id)}
                  className={`py-2 px-5 w-full rounded-xl text-sm font-bold transition-all ${
                    isConnected 
                    ? "bg-white/5 text-neutral-300 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30" 
                    : "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:scale-105 active:scale-95 border border-violet-400/50"
                  }`}
                >
                  {isConnected ? "Disconnect" : "Connect Account"}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
