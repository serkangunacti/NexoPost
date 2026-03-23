"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { Globe, User, ArrowRight, Menu, X } from "lucide-react";
import { SiX, SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

export default function PublicNavbar() {
  const { lang, setLang, t } = useLanguage();
  const { isLoggedIn } = useApp();
  const loginHref = isLoggedIn ? "/dashboard" : "/login";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="w-full fixed top-0 left-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Left Section: Logo & Navigation */}
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Image src="/logo.png" alt="NexoPost Logo" width={28} height={28} className="h-7 w-7 object-contain" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Nexo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Post</span>
              </span>
            </Link>

            {/* Navigation Links — desktop only */}
            <div className="hidden lg:flex items-center gap-8">
              <Link href="/#features" className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors">{t.nav.features}</Link>
              <Link href="/#pricing" className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors">{t.nav.pricing}</Link>
              <Link href="/blog" className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors">{t.nav.blog}</Link>
              <Link href="/contact" className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors">{t.nav.contact}</Link>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">

            {/* Social Icons — xl+ only */}
            <div className="hidden xl:flex items-center gap-4 text-neutral-400 mr-2">
              <a href="#" className="hover:text-white transition-colors"><SiX className="w-4 h-4" /></a>
              <a href="#" className="hover:text-[#0A66C2] transition-colors"><FaLinkedin className="w-4 h-4" /></a>
              <a href="#" className="hover:text-[#1877F2] transition-colors"><SiFacebook className="w-4 h-4" /></a>
              <a href="#" className="hover:text-[#E1306C] transition-colors"><SiInstagram className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors"><SiTiktok className="w-4 h-4" /></a>
            </div>

            {/* Language Selector */}
            <div className="relative group py-2">
              <button className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5">
                <Globe className="w-4 h-4" />
                {lang.toUpperCase()}
              </button>
              <div className="absolute top-full right-0 w-32 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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
              href={loginHref}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-bold py-2.5 px-4 sm:px-6 rounded-full transition-all group shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <User className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline">{t.nav.login}</span>
              <span className="sm:hidden">{t.nav.login_short}</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all hidden sm:block" />
            </Link>

            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-20 left-0 right-0 z-50 lg:hidden bg-[#0a0a0f] border-b border-white/10 shadow-2xl">
            <div className="px-4 py-4 space-y-1">
              <Link href="/#features" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors">
                {t.nav.features}
              </Link>
              <Link href="/#pricing" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors">
                {t.nav.pricing}
              </Link>
              <Link href="/blog" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors">
                {t.nav.blog}
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors">
                {t.nav.contact}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
