"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowRight, CheckCircle2, Zap, Layers, Users, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import CookieBanner from "@/components/public/CookieBanner";

export default function LandingPage() {
  const { t } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);

  const socialIcons = [
    <SiX key="x" className="w-6 h-6 md:w-8 md:h-8 text-white hover:scale-110 transition-transform cursor-pointer" />,
    <FaLinkedin key="in" className="w-6 h-6 md:w-8 md:h-8 text-[#0A66C2] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiFacebook key="fb" className="w-6 h-6 md:w-8 md:h-8 text-[#1877F2] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiInstagram key="ig" className="w-6 h-6 md:w-8 md:h-8 text-[#E1306C] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiTiktok key="tt" className="w-6 h-6 md:w-8 md:h-8 text-[#00f2fe] drop-shadow-[2px_2px_0_#fe0979] hover:scale-110 transition-transform cursor-pointer" />,
    <SiYoutube key="yt" className="w-6 h-6 md:w-8 md:h-8 text-[#FF0000] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiThreads key="thr" className="w-6 h-6 md:w-8 md:h-8 text-white hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiBluesky key="sky" className="w-6 h-6 md:w-8 md:h-8 text-[#0560FF] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiPinterest key="pin" className="w-6 h-6 md:w-8 md:h-8 text-[#E60023] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />
  ];

  return (
    <div className="w-full flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center mt-[-5vh]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold mb-8 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Zap className="w-4 h-4 text-violet-400" />
            {t.hero.slogan}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
            {t.hero.title.split('.').map((part, i, arr) => (
              <span key={i}>
                {i === 0 ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">{part}.</span> : <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">{part}</span>}
              </span>
            ))}
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-2xl leading-relaxed">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto bg-violet-600 py-4 px-10 rounded-full font-bold text-white text-lg hover:bg-violet-500 transition-all shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.7)] flex items-center justify-center gap-3 border border-violet-400/50 hover:scale-105"
            >
              {t.hero.cta}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-70">
            {socialIcons.map((icon, i) => <div key={i}>{icon}</div>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-white/[0.02] border-y border-white/5 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{t.features.title}</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-violet-500 to-sky-500 mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <Layers className="w-12 h-12 text-sky-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{t.features.f1_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f1_desc}</p>
            </div>
            
            <div className="glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <Users className="w-12 h-12 text-violet-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{t.features.f2_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f2_desc}</p>
            </div>
            
            <div className="glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <Clock className="w-12 h-12 text-emerald-400 mb-6 relative z-10" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{t.features.f3_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f3_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">{t.pricing.title}</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-violet-500 to-sky-500 mx-auto rounded-full mb-6" />
            <p className="text-neutral-400 text-lg font-medium mb-10 max-w-xl mx-auto">{t.pricing.trial}</p>
            
            <div className="inline-flex items-center gap-2 p-1.5 glass rounded-full border border-white/10 relative shadow-2xl">
              <button 
                onClick={() => setIsAnnual(false)} 
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 z-10 ${!isAnnual ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                {!isAnnual && <div className="absolute inset-0 bg-violet-600 rounded-full -z-10 shadow-[0_0_15px_rgba(139,92,246,0.4)]" />}
                {t.pricing.monthly}
              </button>
              <button 
                onClick={() => setIsAnnual(true)} 
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 z-10 flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                {isAnnual && <div className="absolute inset-0 bg-violet-600 rounded-full -z-10 shadow-[0_0_15px_rgba(139,92,246,0.4)]" />}
                {t.pricing.annually}
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ml-1 transition-all ${isAnnual ? 'bg-white text-violet-600 shadow-md' : 'bg-violet-600/30 text-violet-300'}`}>
                  {t.pricing.save}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Basic Tier */}
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 relative hover:border-violet-500/30 transition-colors flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">{t.pricing.basic}</h3>
              <p className="text-neutral-400 font-medium mb-8">{t.pricing.basic_desc}</p>
              
              <div className="mb-8 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-white">${isAnnual ? "90" : "9"}</span>
                <span className="text-neutral-500 font-medium mb-1">{isAnnual ? t.pricing.yr : t.pricing.mo}</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.basic_perk1}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.basic_perk2}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.basic_perk3}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.basic_perk4}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.basic_perk5}
                </li>
              </ul>
              
              <Link href="/dashboard" className="w-full py-4 rounded-2xl glass font-bold text-white text-center hover:bg-white/10 transition-colors border-white/20 shadow-lg">
                {t.pricing.choose}
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="glass p-10 rounded-[2.5rem] border border-violet-500/50 bg-violet-900/10 relative shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col transform md:-translate-y-4 z-10">
              <div className="absolute -top-4 inset-x-0 mx-auto w-fit bg-gradient-to-r from-violet-500 to-sky-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                Most Popular
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">{t.pricing.pro}</h3>
              <p className="text-violet-300 font-medium mb-8">{t.pricing.pro_desc}</p>
              
              <div className="mb-8 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-white">${isAnnual ? "190" : "19"}</span>
                <span className="text-neutral-500 font-medium mb-1">{isAnnual ? t.pricing.yr : t.pricing.mo}</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.pro_perk1}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.pro_perk2}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.pro_perk3}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.pro_perk4}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.pro_perk5}
                </li>
              </ul>
              
              <Link href="/dashboard" className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-center transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                {t.pricing.choose}
              </Link>
            </div>

            {/* Agency Tier */}
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 relative hover:border-violet-500/30 transition-colors flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">{t.pricing.agency}</h3>
              <p className="text-neutral-400 font-medium mb-8">{t.pricing.agency_desc}</p>
              
              <div className="mb-8 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-white">${isAnnual ? "490" : "49"}</span>
                <span className="text-neutral-500 font-medium mb-1">{isAnnual ? t.pricing.yr : t.pricing.mo}</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.agency_perk1}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.agency_perk2}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.agency_perk3}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.agency_perk4}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.agency_perk5}
                </li>
              </ul>
              
              <Link href="/dashboard" className="w-full py-4 rounded-2xl glass font-bold text-white text-center hover:bg-white/10 transition-colors border-white/20 shadow-lg">
                {t.pricing.choose}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#050508] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-2 group mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30 group-hover:scale-105 transition-transform overflow-hidden relative shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Image src="/logo.png" alt="NexoPost Logo" fill className="object-cover" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Nexo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Post</span>
              </span>
            </Link>
            <div className="text-neutral-500 text-sm font-medium text-center md:text-left">
              {t.footer.copyright.split(t.footer.uptexx)[0]}
              <a href="https://www.uptexx.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">
                {t.footer.uptexx}
              </a>
              {t.footer.copyright.split(t.footer.uptexx)[1]}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex items-center gap-5 text-neutral-400">
              <a href="#" className="hover:text-white transition-colors hover:-translate-y-1"><SiX className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#0A66C2] transition-colors hover:-translate-y-1"><FaLinkedin className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#1877F2] transition-colors hover:-translate-y-1"><SiFacebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#E1306C] transition-colors hover:-translate-y-1"><SiInstagram className="w-5 h-5" /></a>
            </div>
            <div className="flex items-center gap-6 text-sm font-semibold text-neutral-500">
              <Link href="/privacy" className="hover:text-white transition-colors">{t.footer.privacy}</Link>
              <Link href="/terms" className="hover:text-white transition-colors">{t.footer.terms}</Link>
              <Link href="/contact" className="hover:text-white transition-colors">{t.footer.contact}</Link>
            </div>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}
