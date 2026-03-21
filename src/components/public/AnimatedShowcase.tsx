"use client";

import { useEffect, useState } from "react";
import { SiX, SiFacebook, SiInstagram } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import { Calendar, CheckCircle2, PenLine, Send, Camera, MessageCircle, Repeat2, Heart, BarChart2, Share, ThumbsUp, MessageSquare, Repeat } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AnimatedShowcase() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  
  // Use localized text (fallback if missing)
  const fullText = "Excited to launch our new product today! 🚀 #NexoPost #Update";

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (step === 0) {
      // Start clicking platforms
      setText("");
      timeout = setTimeout(() => setStep(1), 1000); // Select X
    } else if (step === 1) {
      timeout = setTimeout(() => setStep(2), 800); // Select LinkedIn
    } else if (step === 2) {
      timeout = setTimeout(() => setStep(3), 800); // Start typing
    } else if (step === 3) {
      // Typing effect
      let i = 0;
      const interval = setInterval(() => {
        setText(fullText.slice(0, i + 1));
        i++;
        if (i === fullText.length) {
          clearInterval(interval);
          timeout = setTimeout(() => setStep(4), 1000); // Done typing, move to image
        }
      }, 50);
      return () => clearInterval(interval);
    } else if (step === 4) {
      // Attach image
      timeout = setTimeout(() => setStep(5), 1000); // Click schedule
    } else if (step === 5) {
      // Scheduling spinner
      timeout = setTimeout(() => setStep(6), 1500); // Success overlay
    } else if (step === 6) {
      // Done - Success overlay, wait then move to X preview
      timeout = setTimeout(() => setStep(7), 2000); // X Preview
    } else if (step === 7) {
      // X preview duration
      timeout = setTimeout(() => setStep(8), 3500); // LinkedIn preview
    } else if (step === 8) {
      // LinkedIn preview duration
      timeout = setTimeout(() => setStep(0), 3500); // Reset
    }

    return () => clearTimeout(timeout);
  }, [step, fullText]);

  return (
    <section className="w-full px-6 py-12 mb-20">
      <div className="w-full max-w-5xl mx-auto relative cursor-default">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* App Window */}
        <div className="relative z-10 w-full glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col hover:border-white/10 transition-colors bg-[#050508]/80 backdrop-blur-2xl">
          {/* Top bar (macOS style) */}
          <div className="h-14 border-b border-white/5 bg-white/[0.01] flex items-center px-6 gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
            <div className="flex-1 text-center text-xs font-bold text-neutral-600 tracking-widest hidden sm:block">app.nexopost.com</div>
          </div>

          {/* Mock Body */}
          <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-8">
            
            {/* Main Compose Area */}
            <div className="flex-1 bg-black/40 rounded-[2rem] border border-white/5 p-8 shadow-inner relative">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <PenLine className="w-5 h-5" />
                </div>
                Craft New Post
              </h3>

              {/* Platform Selector */}
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { id: 'x', icon: <SiX className="w-6 h-6" />, color: 'bg-white text-black', defaultActive: step >= 1 },
                  { id: 'linkedin', icon: <FaLinkedin className="w-6 h-6" />, color: 'bg-[#0A66C2] text-white', defaultActive: step >= 2 },
                  { id: 'facebook', icon: <SiFacebook className="w-6 h-6" />, color: 'bg-[#1877F2] text-white', defaultActive: false },
                  { id: 'instagram', icon: <SiInstagram className="w-6 h-6" />, color: 'bg-gradient-to-tr from-[#fd5949] to-[#d6249f] text-white', defaultActive: false },
                ].map((platform) => (
                  <div 
                    key={platform.id}
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                      platform.defaultActive 
                        ? `${platform.color} border-transparent scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]` 
                        : 'border-white/10 bg-white/5 text-neutral-500 scale-100'
                    }`}
                  >
                    {platform.icon}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6 min-h-[160px] relative">
                <p className="text-neutral-200 text-lg leading-relaxed whitespace-pre-wrap">
                  {text}
                  {step >= 2 && step <= 4 && (
                    <span className="inline-block w-1.5 h-5 bg-violet-400 ml-1 animate-pulse align-middle" />
                  )}
                </p>
                {text === "" && step < 3 && (
                  <p className="text-neutral-600 text-lg absolute top-6 left-6">What do you want to share?</p>
                )}
              </div>

              {/* Attachments & Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-6">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`p-3.5 rounded-xl border transition-all duration-500 flex items-center justify-center ${step >= 4 ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-white/5 border-white/10 text-neutral-400'}`}>
                    <Camera className="w-6 h-6" />
                  </div>
                  {step >= 4 && (
                    <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold animate-in fade-in slide-in-from-left-4 flex items-center gap-2">
                       nexopost-logo.png
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hidden sm:flex">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className={`px-8 py-4 w-full sm:w-auto rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                    step === 5 ? 'bg-violet-600/70 cursor-wait shadow-violet-500/20' :
                    step >= 6 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/30'
                  }`}>
                    {step === 5 ? 'Generating...' : step >= 6 ? <><CheckCircle2 className="w-6 h-6"/> Queued</> : <><Send className="w-6 h-6"/> Publish Now</>}
                  </div>
                </div>
              </div>

            </div>

            {/* Side Preview Area */}
            <div className="hidden lg:flex flex-col w-80 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                Live Preview
              </h4>
              
              {/* Fake phone frame */}
              <div className="flex-1 bg-black rounded-[2.5rem] border-[6px] border-[#1a1a1e] p-5 relative overflow-hidden shadow-2xl flex flex-col">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-[#1a1a1e] w-36 mx-auto rounded-b-2xl z-20" />
                
                {step === 7 ? (
                  // X Preview
                  <div className="animate-in zoom-in-95 fade-in duration-500 mt-6 bg-black rounded-2xl border border-neutral-800 p-4 font-sans relative z-10 mx-[-4px]">
                     <div className="flex items-center gap-3 mb-3">
                       <img src="/logo.png" alt="NexoPost X" className="w-10 h-10 rounded-full bg-white/10 p-1.5 object-contain" />
                       <div>
                         <div className="text-[15px] font-bold text-white leading-tight flex items-center gap-1">NexoPost <span className="text-blue-400 text-xs">✔</span></div>
                         <div className="text-[14px] text-neutral-500">@nexopost · 1m</div>
                       </div>
                       <SiX className="w-4 h-4 text-neutral-500 ml-auto" />
                     </div>
                     <p className="text-[15px] text-white mb-3 leading-snug font-normal whitespace-pre-wrap">{text}</p>
                     <div className="w-full aspect-video rounded-2xl border border-neutral-800 relative overflow-hidden bg-white/5 flex items-center justify-center mb-3">
                        <img src="/logo.png" alt="Attachment" className="w-24 h-24 object-contain drop-shadow-2xl opacity-90" />
                     </div>
                     <div className="flex items-center justify-between text-neutral-500 px-1">
                        <MessageCircle className="w-[18px] h-[18px]" />
                        <Repeat2 className="w-[18px] h-[18px]" />
                        <Heart className="w-[18px] h-[18px]" />
                        <BarChart2 className="w-[18px] h-[18px]" />
                        <Share className="w-[18px] h-[18px]" />
                     </div>
                  </div>
                ) : step === 8 ? (
                  // LinkedIn Preview
                  <div className="animate-in zoom-in-95 fade-in duration-500 mt-6 bg-white rounded-2xl border border-neutral-200 p-4 font-sans relative z-10 shadow-lg mx-[-4px]">
                     <div className="flex items-start gap-3 mb-3">
                       <img src="/logo.png" alt="NexoPost LinkedIn" className="w-12 h-12 rounded-md bg-neutral-100 p-2 object-contain" />
                       <div className="flex-1">
                         <div className="text-[15px] font-bold text-black leading-tight flex items-center justify-between">NexoPost <FaLinkedin className="w-4 h-4 text-[#0A66C2]" /></div>
                         <div className="text-[12px] text-neutral-500 leading-tight mb-0.5">Social Media Automation</div>
                         <div className="text-[12px] text-neutral-500 flex items-center gap-1">Just now • <span className="text-[10px]">🌐</span></div>
                       </div>
                     </div>
                     <p className="text-[14px] text-black mb-3 leading-snug font-normal whitespace-pre-wrap">{text}</p>
                     <div className="w-full aspect-video border border-neutral-200 relative overflow-hidden bg-neutral-50 flex items-center justify-center mb-4 rounded-lg">
                        <img src="/logo.png" alt="Attachment" className="w-24 h-24 object-contain drop-shadow-lg opacity-90" />
                     </div>
                     <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-neutral-500 px-1 font-medium text-xs">
                        <div className="flex flex-col items-center gap-1 hover:text-[#0A66C2] transition-colors"><ThumbsUp className="w-[18px] h-[18px]" /> <span>Like</span></div>
                        <div className="flex flex-col items-center gap-1 hover:text-[#0A66C2] transition-colors"><MessageSquare className="w-[18px] h-[18px]" /> <span>Comment</span></div>
                        <div className="flex flex-col items-center gap-1 hover:text-[#0A66C2] transition-colors"><Repeat className="w-[18px] h-[18px]" /> <span>Repost</span></div>
                        <div className="flex flex-col items-center gap-1 hover:text-[#0A66C2] transition-colors"><Send className="w-[18px] h-[18px]" /> <span>Send</span></div>
                     </div>
                  </div>
                ) : (
                  // Generic Preview
                  <>
                    <div className="mt-8 flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-sky-500 shadow-inner" />
                      <div>
                        <div className="w-24 h-2.5 bg-neutral-700 rounded-full mb-2" />
                        <div className="w-16 h-2 bg-neutral-800 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-5">
                      <p className="text-sm text-neutral-300 break-words leading-relaxed">{text || <span className="text-neutral-800">Preview text here...</span>}</p>
                    </div>

                    {step >= 4 && (
                      <div className="w-full h-40 bg-white/5 rounded-2xl animate-in zoom-in duration-300 flex flex-col items-center justify-center border border-white/10 relative overflow-hidden group">
                        <img src="/logo.png" alt="Attached Media" className="w-16 h-16 object-contain opacity-80 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Success Overlay */}
              {step === 6 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500 z-30">
                  <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-2xl mb-1">Approved!</p>
                  <p className="text-neutral-400 text-sm text-center px-4">Your posts have been verified and queued securely.</p>
                </div>
              )}
              
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
