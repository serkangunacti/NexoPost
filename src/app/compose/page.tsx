"use client";

import { useState } from "react";
import { Send, Calendar as CalendarIcon, Image as ImageIcon, Smile, Type, Clock } from "lucide-react";

export default function ComposePage() {
  const [text, setText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"]);

  const platforms = [
    { id: "twitter", name: "Twitter", icon: "𝕏", color: "hover:bg-neutral-800 bg-neutral-900", activeColor: "bg-neutral-800 ring-2 ring-white" },
    { id: "linkedin", name: "LinkedIn", icon: "in", color: "hover:bg-[#0A66C2]/80 bg-[#0A66C2]/40", activeColor: "bg-[#0A66C2] ring-2 ring-white" },
    { id: "facebook", name: "Facebook", icon: "f", color: "hover:bg-[#1877F2]/80 bg-[#1877F2]/40", activeColor: "bg-[#1877F2] ring-2 ring-white" },
  ];

  const handleToggle = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-8 pr-4">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Craft New Post</h1>
        <p className="text-neutral-400 text-lg font-medium">Write once, publish everywhere. Select your platforms and start typing.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection */}
          <div className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-5">1. Select Destination</h3>
            <div className="flex gap-4 relative z-10">
              {platforms.map(p => {
                const isActive = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleToggle(p.id)}
                    className={`w-14 h-14 rounded-[1rem] flex items-center justify-center text-3xl font-bold transition-all duration-300 transform ${isActive ? p.activeColor + ' scale-105 shadow-lg shadow-white/10' : p.color + ' opacity-60 hover:opacity-100 hover:scale-105'}`}
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
              placeholder="What do you want to share with your audience today?"
              className="flex-1 w-full bg-transparent p-8 text-xl text-white resize-none focus:outline-none placeholder:text-neutral-600 font-medium leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button className="glass py-4 px-8 rounded-full font-bold text-white hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2.5 group">
              <Clock className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform" />
              Schedule Post
            </button>
            <button className="bg-violet-600 py-4 px-10 rounded-full font-bold text-white hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(139,92,246,0.7)] flex items-center gap-2.5 group hover:scale-105 active:scale-95 border border-violet-400/50">
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Post Now
            </button>
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
              <div className="space-y-6">
                {selectedPlatforms.map(id => {
                  const p = platforms.find(x => x.id === id);
                  return (
                    <div key={id} className="glass p-6 rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-colors shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${p?.activeColor}`}>{p?.icon}</div>
                        <div>
                          <div className="font-bold text-white text-sm">NexoPost App</div>
                          <div className="text-xs text-neutral-400 font-medium">Just now · Public</div>
                        </div>
                      </div>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap font-medium">
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
