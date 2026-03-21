"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SiX, SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import { Calendar, CheckCircle2, PenLine, Send, Camera, MessageCircle, Repeat2, Heart, BarChart2, Share, ThumbsUp, MessageSquare, Repeat, Bookmark, Music, MoreHorizontal } from "lucide-react";

export default function AnimatedShowcase() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  
  const fullText = t.showcase.full_text;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (step === 0) {
      setText("");
      timeout = setTimeout(() => setStep(1), 600);
    } else if (step === 1) {
      timeout = setTimeout(() => setStep(2), 400);
    } else if (step === 2) {
      timeout = setTimeout(() => setStep(3), 400);
    } else if (step === 3) {
      timeout = setTimeout(() => setStep(4), 400);
    } else if (step === 4) {
      timeout = setTimeout(() => setStep(5), 400);
    } else if (step === 5) {
      let i = 0;
      setText(""); // ensure cleared
      const interval = setInterval(() => {
        setText((prev) => fullText.slice(0, prev.length + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
          timeout = setTimeout(() => setStep(6), 600);
        }
      }, 30);
      return () => clearInterval(interval);
    } else if (step === 6) {
      timeout = setTimeout(() => setStep(7), 800);
    } else if (step === 7) {
      timeout = setTimeout(() => setStep(8), 1200);
    } else if (step === 8) {
      timeout = setTimeout(() => setStep(9), 1800);
    } else if (step === 9) {
      timeout = setTimeout(() => setStep(10), 3000);
    } else if (step === 10) {
      timeout = setTimeout(() => setStep(11), 3000);
    } else if (step === 11) {
      timeout = setTimeout(() => setStep(12), 3000);
    } else if (step === 12) {
      timeout = setTimeout(() => setStep(13), 3000);
    } else if (step === 13) {
      timeout = setTimeout(() => setStep(0), 3000);
    }

    return () => clearTimeout(timeout);
  }, [step, fullText]);

  return (
    <section className="w-full px-6 py-12 mb-20">
      <div className="w-full max-w-[1100px] mx-auto relative cursor-default">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Global App Window */}
        <div className="relative z-10 w-full glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col hover:border-white/10 transition-colors bg-[#050508]/80 backdrop-blur-2xl">
          
          {/* Top bar (macOS style) */}
          <div className="h-14 border-b border-white/5 bg-white/[0.01] flex items-center px-6 gap-2 shrink-0">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
            <div className="flex-1 text-center text-xs font-bold text-neutral-600 tracking-widest hidden sm:block">app.nexopost.com</div>
          </div>

          {/* Main Layout */}
          <div className="flex flex-col lg:flex-row p-6 md:p-8 gap-8 items-stretch">
            
            {/* 1) Compose Area (Dims when in preview loop) */}
            <div className={`flex-1 bg-black/40 rounded-[2rem] border border-white/5 p-8 shadow-inner flex flex-col transition-all duration-1000 ${step >= 9 ? 'opacity-20 blur-sm brightness-50 pointer-events-none scale-[0.98]' : 'opacity-100 scale-100'}`}>
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <PenLine className="w-5 h-5" />
                </div>
                {t.showcase.compose_title}
              </h3>

              {/* Platform Selector */}
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { id: 'x', icon: <SiX className="w-6 h-6" />, color: 'bg-white text-black', defaultActive: step >= 1 },
                  { id: 'linkedin', icon: <FaLinkedin className="w-6 h-6" />, color: 'bg-[#0A66C2] text-white', defaultActive: step >= 2 },
                  { id: 'facebook', icon: <SiFacebook className="w-6 h-6" />, color: 'bg-[#1877F2] text-white', defaultActive: step >= 3 },
                  { id: 'instagram', icon: <SiInstagram className="w-6 h-6" />, color: 'bg-gradient-to-tr from-[#fd5949] to-[#d6249f] text-white', defaultActive: step >= 4 },
                  { id: 'tiktok', icon: <SiTiktok className="w-6 h-6" />, color: 'bg-black text-white shadow-[0_0_10px_rgba(254,9,121,0.5)] border border-neutral-700', defaultActive: step >= 5 },
                ].map((platform) => (
                  <div 
                    key={platform.id}
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                      platform.defaultActive 
                        ? `${platform.color} border-transparent scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)]` 
                        : 'border-white/10 bg-white/5 text-neutral-500 scale-100'
                    }`}
                  >
                    {platform.icon}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8 min-h-[160px] relative flex-1">
                <p className="text-neutral-200 text-[16px] leading-relaxed whitespace-pre-wrap">
                  {text}
                  {step >= 5 && step <= 7 && (
                    <span className="inline-block w-[3px] h-5 bg-violet-400 ml-1 animate-pulse align-middle" />
                  )}
                </p>
                {text === "" && step < 5 && (
                  <p className="text-neutral-600 text-[16px] absolute top-6 left-6">{t.showcase.placeholder}</p>
                )}
              </div>

              {/* Attachments & Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0 mt-auto">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`p-4 rounded-xl border transition-all duration-500 flex items-center justify-center ${step >= 6 ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-xl' : 'bg-white/5 border-white/10 text-neutral-500'}`}>
                    <Camera className="w-6 h-6" />
                  </div>
                  {step >= 6 && (
                    <div className="px-5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-sm animate-in fade-in slide-in-from-left-4 flex items-center gap-2">
                       media_1.png
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-neutral-500 hidden sm:flex">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className={`px-8 py-4 w-full sm:w-auto rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                    step === 7 ? 'bg-violet-600/70 cursor-wait shadow-violet-500/20' :
                    step >= 8 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/30'
                  }`}>
                    {step === 7 ? t.showcase.processing : step >= 8 ? <><CheckCircle2 className="w-6 h-6"/> {t.showcase.queued}</> : <><Send className="w-6 h-6"/> {t.showcase.publish_now}</>}
                  </div>
                </div>
              </div>
            </div>

            {/* 2) Phone Preview Area (Fixed Structure) */}
            <div className="hidden lg:flex flex-col items-center justify-center shrink-0 mx-4 relative overflow-visible">
               <h4 className={`text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 transition-colors duration-500 ${step >= 9 ? 'text-violet-400' : 'text-neutral-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${step >= 9 ? 'bg-violet-400 animate-pulse' : 'bg-neutral-600'}`} />
                  {step >= 9 ? t.showcase.live_networks : t.showcase.live_preview}
               </h4>

               {/* Rigorous Hardware Phone Shell */}
               <div className="w-[300px] h-[600px] bg-black rounded-[2.5rem] border-[8px] border-[#18181b] relative shadow-2xl overflow-hidden ring-1 ring-white/10 z-10">
                  {/* Elegant Hardware Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#18181b] rounded-b-xl flex items-center justify-center gap-2 z-50">
                     <div className="w-10 h-1.5 bg-black/40 rounded-full" />
                     <div className="w-2 h-2 bg-black/40 rounded-full" />
                  </div>

                  {/* Absolute layer wrapper for all screens so they crossfade perfectly over each other without layout jumps */}
                  
                  {/* Generic Screen (Steps 0-8) */}
                  <div className={`absolute inset-0 bg-neutral-950 px-4 pt-10 pb-4 flex flex-col transition-all duration-700 ${step < 9 ? 'opacity-100 z-40' : 'opacity-0 scale-95 z-0 delay-300 pointer-events-none'}`}>
                     <div className="flex items-center gap-3 mb-6 mt-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-sky-500 shadow-inner" />
                        <div className="space-y-2">
                          <div className="w-24 h-2 bg-neutral-800 rounded-full" />
                          <div className="w-16 h-2 bg-neutral-800 rounded-full" />
                        </div>
                     </div>
                     <p className="text-[14px] text-neutral-400 break-words leading-relaxed min-h-[4rem]">
                        {text || <span className="opacity-50">{t.showcase.waiting_text}</span>}
                     </p>
                     
                     <div className={`w-full h-[220px] bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mt-4 transition-all duration-700 ${step >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                         <img src="/logo.png" className="w-20 h-20 object-contain opacity-50 drop-shadow-2xl" alt="Preview Media" />
                     </div>
                  </div>

                  {/* X (Twitter) Screen */}
                  {step === 9 && (
                    <div className="absolute inset-0 bg-black px-4 pt-10 pb-4 z-40 animate-in slide-in-from-right-10 fade-in duration-500">
                       <div className="flex items-center gap-3 mb-3 mt-1">
                          <img src="/logo.png" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 p-1.5 object-contain" />
                          <div>
                             <div className="text-[15px] font-bold text-white flex items-center gap-1 leading-tight">NexoPost <span className="text-blue-400 text-[11px]">✔</span></div>
                             <div className="text-[13px] text-neutral-500">@nexopost</div>
                          </div>
                       </div>
                       <p className="text-[14px] text-white leading-normal mb-3 whitespace-pre-wrap">{text}</p>
                       <div className="w-full aspect-square border border-neutral-800 rounded-2xl bg-neutral-900 flex items-center justify-center overflow-hidden mb-3">
                          <img src="/logo.png" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex items-center justify-between text-neutral-500 px-2 mt-2">
                          <MessageCircle className="w-[18px] h-[18px]" />
                          <Repeat2 className="w-[18px] h-[18px]" />
                          <Heart className="w-[18px] h-[18px]" />
                          <BarChart2 className="w-[18px] h-[18px]" />
                          <Share className="w-[18px] h-[18px]" />
                       </div>
                    </div>
                  )}

                  {/* LinkedIn Screen */}
                  {step === 10 && (
                     <div className="absolute inset-0 bg-[#e9e5df] pt-8 z-40 animate-in slide-in-from-right-10 fade-in duration-500 flex flex-col">
                        <div className="bg-white p-4 pb-2">
                           <div className="flex items-center gap-3 mb-3 mt-1">
                              <img src="/logo.png" className="w-12 h-12 rounded bg-white border border-neutral-200 p-1.5 object-contain" />
                              <div className="leading-tight">
                                 <div className="text-[14px] font-bold text-black flex items-center gap-1">NexoPost <span className="text-neutral-500 text-[10px] font-normal">1st</span></div>
                                 <div className="text-[12px] text-neutral-500">{t.showcase.linkedin_role}</div>
                                 <div className="text-[11px] text-neutral-500 flex items-center gap-1">1m • 🌐</div>
                              </div>
                           </div>
                           <p className="text-[13px] text-black leading-normal mb-3 whitespace-pre-wrap">{text}</p>
                        </div>
                        <div className="bg-white w-full aspect-square flex items-center justify-center border-b border-neutral-200 overflow-hidden">
                           <img src="/logo.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-white px-5 py-3 flex items-center justify-between text-neutral-500 font-semibold text-[11px]">
                           <div className="flex flex-col items-center gap-1"><ThumbsUp className="w-4 h-4" /> Like</div>
                           <div className="flex flex-col items-center gap-1"><MessageSquare className="w-4 h-4" /> Comment</div>
                           <div className="flex flex-col items-center gap-1"><Repeat className="w-4 h-4" /> Repost</div>
                           <div className="flex flex-col items-center gap-1"><Send className="w-4 h-4" /> Send</div>
                        </div>
                     </div>
                  )}

                  {/* Facebook Screen */}
                  {step === 11 && (
                     <div className="absolute inset-0 bg-[#c9ccd1] pt-8 z-40 animate-in slide-in-from-right-10 fade-in duration-500 flex flex-col">
                        <div className="bg-white p-4 pb-3">
                           <div className="flex items-center gap-2 mb-3 mt-1">
                              <img src="/logo.png" className="w-10 h-10 rounded-full border border-neutral-200 bg-neutral-100 p-1.5 object-contain" />
                              <div className="leading-tight">
                                 <div className="text-[14px] font-bold text-[#050505]">NexoPost</div>
                                 <div className="text-[12px] text-[#65676B]">{t.showcase.facebook_time} • 🌍</div>
                              </div>
                              <MoreHorizontal className="w-5 h-5 text-[#65676B] ml-auto mb-3" />
                           </div>
                           <p className="text-[14px] text-[#050505] leading-normal">{text}</p>
                        </div>
                        <div className="bg-white w-full aspect-square flex items-center justify-center border-y border-neutral-200 overflow-hidden">
                           <img src="/logo.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-white p-2 border-b border-neutral-300">
                        </div>
                        <div className="bg-white px-6 py-2 flex items-center justify-between text-[#65676B] font-semibold text-[13px]">
                           <div className="flex items-center gap-2 py-1"><ThumbsUp className="w-5 h-5" /> Like</div>
                           <div className="flex items-center gap-2 py-1"><MessageSquare className="w-5 h-5" /> Comment</div>
                           <div className="flex items-center gap-2 py-1"><Share className="w-5 h-5" /> Share</div>
                        </div>
                     </div>
                  )}

                  {/* Instagram Screen */}
                  {step === 12 && (
                     <div className="absolute inset-0 bg-white pt-8 z-40 animate-in slide-in-from-right-10 fade-in duration-500 flex flex-col">
                        <div className="flex items-center gap-3 p-3 border-b border-neutral-100 mt-1">
                           <img src="/logo.png" className="w-8 h-8 rounded-full border border-neutral-300 p-1 object-contain" />
                           <div className="text-[13px] font-bold text-black">nexopostcom</div>
                           <MoreHorizontal className="w-5 h-5 text-black ml-auto" />
                        </div>
                        <div className="w-full aspect-square bg-neutral-50 border-y border-neutral-100 flex items-center justify-center overflow-hidden">
                           <img src="/logo.png" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                           <div className="flex items-center gap-4 mb-3">
                              <Heart className="w-6 h-6 text-black" />
                              <MessageCircle className="w-6 h-6 text-black" />
                              <Send className="w-6 h-6 text-black" />
                              <Bookmark className="w-6 h-6 text-black ml-auto" />
                           </div>
                           <div className="text-[13px] text-black leading-snug">
                              <span className="font-bold mr-2">nexopostcom</span>
                              {text}
                           </div>
                        </div>
                     </div>
                  )}

                  {/* TikTok Screen */}
                  {step === 13 && (
                     <div className="absolute inset-0 bg-black z-40 animate-in slide-in-from-right-10 fade-in duration-500 pt-8 flex flex-col">
                        <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                           <img src="/logo.png" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                        </div>
                        
                        {/* Top bar */}
                        <div className="absolute top-10 inset-x-0 px-4 flex justify-between z-20 text-white font-semibold">
                           <div className="text-[16px] drop-shadow-md">{t.showcase.tiktok_following} <span className="opacity-50 mx-1">|</span> {t.showcase.tiktok_for_you}</div>
                           <div className="opacity-80">🔍</div>
                        </div>

                        {/* Right Actions */}
                        <div className="absolute bottom-8 right-2 flex flex-col gap-5 items-center z-20">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 border border-white">
                              <img src="/logo.png" className="w-full h-full object-contain rounded-full" />
                           </div>
                           <div className="flex flex-col items-center"><Heart className="w-8 h-8 fill-white/90 text-transparent drop-shadow-md" /><span className="text-white text-xs font-bold font-sans mt-0.5">12K</span></div>
                           <div className="flex flex-col items-center"><MessageCircle className="w-8 h-8 fill-white/90 text-transparent drop-shadow-md" /><span className="text-white text-xs font-bold font-sans mt-0.5">340</span></div>
                           <div className="flex flex-col items-center"><Bookmark className="w-8 h-8 fill-white/90 text-transparent drop-shadow-md" /><span className="text-white text-xs font-bold font-sans mt-0.5">85</span></div>
                           <div className="flex flex-col items-center"><Share className="w-8 h-8 fill-white/90 text-transparent drop-shadow-md" /><span className="text-white text-xs font-bold font-sans mt-0.5">12</span></div>
                        </div>

                        {/* Bottom Text */}
                        <div className="absolute bottom-6 left-3 right-16 z-20 text-white">
                           <div className="font-bold text-[15px] drop-shadow-md mb-1">@nexopost</div>
                           <p className="text-[13px] drop-shadow-md mb-3 line-clamp-2 leading-snug">{text}</p>
                           <div className="flex items-center gap-2 text-[12px] font-semibold">
                              <Music className="w-4 h-4" /> {t.showcase.original_audio}
                           </div>
                        </div>
                     </div>
                  )}

               </div>
            </div>

          </div>

          {/* Full Screen Success Overlay that appears before the preview magic begins */}
          {step === 8 && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 z-[100]">
              <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/30 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-white font-bold text-3xl mb-3 tracking-tight">{t.showcase.success_title}</p>
              <p className="text-neutral-400 text-lg">{t.showcase.success_subtitle}</p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
