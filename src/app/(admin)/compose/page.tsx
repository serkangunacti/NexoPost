"use client";

import { useState } from "react";
import { Send, Image as ImageIcon, Smile, Type, Clock, Loader2, Wand2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import { getSubscriptionSnapshot } from "@/lib/subscription";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

export default function ComposePage() {
  const { subscription, activeClient } = useApp();
  const [text, setText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const subscriptionSnapshot = getSubscriptionSnapshot(subscription);

  const platforms = [
    { id: "twitter", name: "Twitter", icon: <SiX className="w-6 h-6" />, color: "hover:bg-neutral-800 bg-neutral-900 border border-neutral-700", activeColor: "bg-black ring-2 ring-white text-white" },
    { id: "linkedin", name: "LinkedIn", icon: <FaLinkedin className="w-6 h-6" />, color: "hover:bg-[#0A66C2]/80 bg-[#0A66C2]/40 text-white/70", activeColor: "bg-[#0A66C2] ring-2 ring-white text-white" },
    { id: "facebook", name: "Facebook", icon: <SiFacebook className="w-6 h-6" />, color: "hover:bg-[#1877F2]/80 bg-[#1877F2]/40 text-white/70", activeColor: "bg-[#1877F2] ring-2 ring-white text-white" },
    { id: "instagram", name: "Instagram", icon: <SiInstagram className="w-6 h-6" />, color: "hover:bg-gradient-to-tr hover:from-[#FD1D1D]/80 hover:to-[#833AB4]/80 bg-gradient-to-tr from-[#FD1D1D]/40 to-[#833AB4]/40 text-white/70", activeColor: "bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4] ring-2 ring-white text-white" },
    { id: "tiktok", name: "TikTok", icon: <SiTiktok className="w-6 h-6 drop-shadow-[1px_1px_0_#fe0979]" />, color: "hover:bg-[#000000]/80 bg-[#000000]/40 border border-[#fe0979]/30 text-[#00f2fe]/70", activeColor: "bg-black ring-2 ring-[#00f2fe] text-[#00f2fe] shadow-[0_0_15px_#fe0979]" },
    { id: "threads", name: "Threads", icon: <SiThreads className="w-6 h-6" />, color: "hover:bg-neutral-800 bg-neutral-900 border border-neutral-800 text-white/70", activeColor: "bg-black ring-2 ring-white text-white" },
    { id: "bluesky", name: "Bluesky", icon: <SiBluesky className="w-6 h-6" />, color: "hover:bg-[#0560FF]/80 bg-[#0560FF]/40 text-white/70", activeColor: "bg-[#0560FF] ring-2 ring-white text-white" },
    { id: "pinterest", name: "Pinterest", icon: <SiPinterest className="w-6 h-6" />, color: "hover:bg-[#E60023]/80 bg-[#E60023]/40 text-white/70", activeColor: "bg-[#E60023] ring-2 ring-white text-white" },
    { id: "youtube_shorts", name: "YouTube Shorts", icon: <SiYoutube className="w-6 h-6" />, color: "hover:bg-[#FF0000]/80 bg-[#FF0000]/40 text-white/70", activeColor: "bg-[#FF0000] ring-2 ring-white text-white shadow-[0_0_15px_#FF0000]" },
  ];

  const handleToggle = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSavePost = async (status: 'Scheduled' | 'Published' | 'Draft') => {
    if (!text.trim() || selectedPlatforms.length === 0) return;
    if ((status === "Scheduled" || status === "Published") && !subscriptionSnapshot.canPublish) {
      alert("Your package has expired. Renew your subscription to schedule or publish new posts.");
      return;
    }
    if (!db) {
      alert("Firebase configuration is missing.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "posts"), {
        content: text,
        platforms: selectedPlatforms,
        status: status,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        autoOptimize: autoOptimize,
      });
      setText("");
      alert(status === 'Published' ? "Post published successfully!" : "Post scheduled effectively!");
    } catch (error) {
      console.error("Error writing document: ", error);
      alert("Error saving post to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-8 pr-4">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Active Client</p>
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{activeClient.name || "No Client Selected"}</h1>
        <p className="text-neutral-400 text-lg font-medium">Write once, publish everywhere. Select your platforms and start typing.</p>
        {!subscriptionSnapshot.canPublish ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
            Your package is expired. You can still draft content, but scheduling and publishing are locked until renewal.
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection */}
          <div className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-5">1. Select Destination</h3>
            <div className="flex gap-4 relative z-10 flex-wrap">
              {platforms.map(p => {
                const isActive = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    title={p.name}
                    onClick={() => handleToggle(p.id)}
                    className={`w-14 h-14 rounded-[1rem] flex items-center justify-center font-bold transition-all duration-300 transform ${isActive ? p.activeColor + ' scale-105 shadow-lg shadow-white/10' : p.color + ' opacity-60 hover:opacity-100 hover:scale-105'}`}
                  >
                    {p.icon}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Editor */}
          <div className="glass rounded-[2rem] border border-white/5 overflow-hidden flex flex-col min-h-[420px] shadow-2xl relative transition-all duration-500 hover:border-violet-500/20">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <button className="p-2.5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors"><Type className="w-5 h-5" /></button>
              <button className="p-2.5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors"><ImageIcon className="w-5 h-5" /></button>
              <button className="p-2.5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors"><Smile className="w-5 h-5" /></button>
              <span className="ml-auto text-xs font-bold text-neutral-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <span className={text.length > 2800 ? "text-red-400" : "text-white"}>{text.length}</span> / 2800
              </span>
            </div>
            
            <textarea 
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={isSubmitting}
              placeholder="What do you want to share with your audience today?"
              className="flex-1 w-full bg-transparent p-8 text-xl text-white resize-none focus:outline-none placeholder:text-neutral-600 font-medium leading-relaxed disabled:opacity-50"
            />
          </div>

          {/* Footer Actions Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4">
             {/* Auto Optimize Media Toggle */}
             <div 
               onClick={() => setAutoOptimize(!autoOptimize)}
               className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-5 py-3.5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-colors group select-none shadow-inner"
             >
                <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative ${autoOptimize ? 'bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-neutral-700'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white box-shadow-sm transition-transform duration-300 absolute top-1 ${autoOptimize ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div className="flex flex-col">
                   <span className="text-white text-[15px] font-bold flex items-center gap-2">
                     <Wand2 className={`w-4 h-4 ${autoOptimize ? 'text-violet-400' : 'text-neutral-500'} transition-colors`} /> 
                     Auto-Scale Media
                   </span>
                   <span className="text-neutral-400 text-xs font-medium mt-0.5">Crop & fit seamlessly per platform (1:1, 9:16)</span>
                </div>
             </div>

             {/* Action Buttons */}
             <div className="flex justify-end gap-3 flex-wrap ml-auto">
               <button 
                 onClick={() => handleSavePost('Draft')}
                 disabled={isSubmitting || !text || selectedPlatforms.length === 0}
                 className="glass py-3.5 px-6 rounded-full font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
               >
                 Save Draft
               </button>
               <button 
                 onClick={() => handleSavePost('Scheduled')}
                 disabled={isSubmitting || !text || selectedPlatforms.length === 0 || !subscriptionSnapshot.canPublish}
                 className="glass py-3.5 px-6 rounded-full font-bold text-white hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
               >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Clock className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />}
                 Schedule
               </button>
               <button 
                 onClick={() => handleSavePost('Published')}
                 disabled={isSubmitting || !text || selectedPlatforms.length === 0 || !subscriptionSnapshot.canPublish}
                 className="bg-violet-600 py-3.5 px-8 rounded-full font-bold text-white hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(139,92,246,0.7)] flex items-center gap-2.5 group hover:-translate-y-0.5 active:translate-y-0 border border-violet-400/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
               >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                 Post Now
               </button>
             </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="lg:col-span-1 border-white/10 pl-0 mt-8 lg:mt-0 relative">
          <div className="sticky top-10">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Previews
            </h3>
            
            {selectedPlatforms.length === 0 ? (
              <div className="glass p-8 rounded-3xl text-center border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
                <ImageIcon className="w-10 h-10 text-neutral-600" />
                <p className="text-neutral-500 text-sm font-medium">Select a platform to see how your post will look like.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 pb-4">
                {selectedPlatforms.map(id => {
                  const p = platforms.find(x => x.id === id);
                  return (
                    <div key={id} className="glass p-6 rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-colors shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${p?.activeColor}`}>{p?.icon}</div>
                        <div>
                          <div className="font-bold text-white text-sm">NexoPost App</div>
                          <div className="text-xs text-neutral-400 font-medium">Just now · {p?.name}</div>
                        </div>
                      </div>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap font-medium break-words">
                        {text || <span className="text-neutral-600">Your awesome content goes here...</span>}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
