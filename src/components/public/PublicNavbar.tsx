"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { Globe, User, ArrowRight } from "lucide-react";

export default function PublicNavbar() {
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="w-full fixed top-0 left-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30 group-hover:scale-105 transition-transform overflow-hidden relative shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Image src="/logo.png" alt="NexoPost Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            Nexo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Post</span>
          </span>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          
          {/* Language Selector */}
          <div className="relative group">
            <button className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5">
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </button>
            <div className="absolute top-full right-0 mt-2 w-32 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto z-50">
              <button 
                onClick={() => setLang('tr')} 
                className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors ${lang === 'tr' ? 'bg-violet-500/10 text-violet-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
              >
                Türkçe (TR)
              </button>
              <button 
                onClick={() => setLang('en')} 
                className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors ${lang === 'en' ? 'bg-violet-500/10 text-violet-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
              >
                English (EN)
              </button>
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 hidden sm:block"></div>

          {/* Login / Dashboard */}
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-bold py-2.5 px-6 rounded-full transition-all group shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <User className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">{t.nav.login}</span>
            <span className="sm:hidden">Login</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>

        </div>
      </div>
    </nav>
  );
}
