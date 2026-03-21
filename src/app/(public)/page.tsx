"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCtaHref } from "@/hooks/useCtaHref";
import { ArrowRight, CheckCircle2, Zap, Layers, Users, Clock, BarChart3, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import AnimatedShowcase from "@/components/public/AnimatedShowcase";
import SpaceBackground from "@/components/public/SpaceBackground";

export default function LandingPage() {
  const { t } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);
  const ctaHref = useCtaHref();
  const buildCheckoutHref = (plan: "basic" | "pro" | "agency") =>
    `/checkout?plan=${plan}&billing=${isAnnual ? "annual" : "monthly"}&step=payment`;

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
        <SpaceBackground />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center pt-8 md:pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold mb-8 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Zap className="w-4 h-4 text-violet-400" />
            {t.hero.slogan}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
            {t.hero.title.split('.').map((part, i) => (
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
              href={ctaHref}
              className="w-full sm:w-auto bg-violet-600 py-4 px-10 rounded-full font-bold text-white text-lg hover:bg-violet-500 transition-all shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.7)] flex items-center justify-center gap-3 border border-violet-400/50 hover:scale-105"
            >
              {t.hero.cta}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-70">
            {socialIcons.map((icon, i) => <div key={i}>{icon}</div>)}
          </div>

          <div className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-neutral-300 text-sm font-bold shadow-lg shadow-white/5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            {t.hero.no_limits}
          </div>
        </div>
      </section>

      {/* Animated App Showcase */}
      <AnimatedShowcase />

      {/* Features Section */}
      <section id="features" className="w-full bg-white/[0.02] border-y border-white/5 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{t.features.title}</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-violet-500 to-sky-500 mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/features?tab=sync#feature-tabs" className="block glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <Layers className="w-12 h-12 text-sky-400 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-sky-300 transition-colors">{t.features.f1_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f1_desc}</p>
            </Link>
            
            <Link href="/features?tab=multi#feature-tabs" className="block glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <Users className="w-12 h-12 text-violet-400 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-violet-300 transition-colors">{t.features.f2_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f2_desc}</p>
            </Link>
            
            <Link href="/features?tab=schedule#feature-tabs" className="block glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <Clock className="w-12 h-12 text-emerald-400 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-emerald-300 transition-colors">{t.features.f3_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f3_desc}</p>
            </Link>

            <Link href="/features?tab=analytics#feature-tabs" className="block glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <BarChart3 className="w-12 h-12 text-fuchsia-400 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-fuchsia-300 transition-colors">{t.features.f4_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f4_desc}</p>
            </Link>

            <Link href="/features?tab=ai#feature-tabs" className="block glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <Sparkles className="w-12 h-12 text-amber-400 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-amber-300 transition-colors">{t.features.f5_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f5_desc}</p>
            </Link>

            <Link href="/features?tab=inbox#feature-tabs" className="block glass p-10 rounded-3xl border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <MessageSquare className="w-12 h-12 text-rose-400 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-rose-300 transition-colors">{t.features.f6_title}</h3>
              <p className="text-neutral-400 leading-relaxed font-medium relative z-10">{t.features.f6_desc}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-32 px-6">
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
                  {t.pricing.basic_perk5}
                </li>
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.basic_perk6}
                </li>
                <li className="flex items-center gap-3 text-neutral-100 font-bold tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.basic_perk7}
                </li>
              </ul>
              
              <Link href={buildCheckoutHref("basic")} className="w-full py-4 rounded-2xl glass font-bold text-white text-center hover:bg-white/10 transition-colors border-white/20 shadow-lg">
                {t.pricing.choose}
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="glass p-10 rounded-[2.5rem] border border-violet-500/50 bg-violet-900/10 relative shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col transform md:-translate-y-4 z-10">
              <div className="absolute -top-4 inset-x-0 mx-auto w-fit bg-gradient-to-r from-violet-500 to-sky-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                {t.pricing.popular}
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
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.pro_perk6}
                </li>
                <li className="flex items-center gap-3 text-white font-bold tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.pro_perk7}
                </li>
              </ul>
              
              <Link href={buildCheckoutHref("pro")} className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-center transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)]">
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
                <li className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.agency_perk6}
                </li>
                <li className="flex items-center gap-3 text-neutral-100 font-bold tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {t.pricing.agency_perk7}
                </li>
              </ul>
              
              <Link href={buildCheckoutHref("agency")} className="w-full py-4 rounded-2xl glass font-bold text-white text-center hover:bg-white/10 transition-colors border-white/20 shadow-lg">
                {t.pricing.choose}
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
