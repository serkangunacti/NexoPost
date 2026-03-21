"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck } from "lucide-react";

export default function CookieBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_accepted");
    if (!accepted) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10 z-[100] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(139,92,246,0.15)] animate-in slide-in-from-bottom-full duration-700">
      <div className="flex items-center gap-3 text-neutral-300 text-sm font-medium flex-1 max-w-4xl">
        <ShieldCheck className="w-6 h-6 text-violet-400 shrink-0" />
        <p>{t.cookies.text}</p>
      </div>
      <button 
        onClick={() => {
          localStorage.setItem("cookies_accepted", "true");
          setShow(false);
        }}
        className="w-full md:w-auto bg-violet-600 hover:bg-violet-500 text-white px-8 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95 whitespace-nowrap"
      >
        {t.cookies.accept}
      </button>
    </div>
  );
}
