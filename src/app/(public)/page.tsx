"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCtaHref } from "@/hooks/useCtaHref";
import { ArrowRight, CheckCircle2, Zap, Layers, Users, Clock, BarChart3, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import AnimatedShowcase from "@/components/public/AnimatedShowcase";
import SpaceBackground from "@/components/public/SpaceBackground";
import { PLAN_ORDER, formatPriceCents, getPlanConfig, getPlanPriceCents, type PlanId } from "@/lib/plans";

export default function LandingPage() {
  const { t } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);
  const ctaHref = useCtaHref();
  const buildCheckoutHref = (plan: Exclude<PlanId, "free">) =>
    `/checkout?plan=${plan}&billing=${isAnnual ? "annual" : "monthly"}&step=payment`;
  const publicPlans = PLAN_ORDER.map((planId) => getPlanConfig(planId));

  const socialIcons = [
    <SiX key="x" className="w-6 h-6 md:w-8 md:h-8 text-white hover:scale-110 transition-transform cursor-pointer" />,
    <FaLinkedin key="in" className="w-6 h-6 md:w-8 md:h-8 text-[#0A66C2] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiFacebook key="fb" className="w-6 h-6 md:w-8 md:h-8 text-[#1877F2] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiInstagram key="ig" className="w-6 h-6 md:w-8 md:h-8 text-[#E1306C] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
    <SiTiktok key="tt" className="w-6 h-6 md:w-8 md:h-8 text-[#00f2fe] drop-shadow-[2px_2px_0_#fe0979] hover:scale-110 transition-transform cursor-pointer" />,
    <SiYoutube key="yt" className="w-6 h-6 md:w-8 md:h-8 text-[#FF0000] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />,
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
        <div className="max-w-7xl mx-auto">
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
                  11 Months
                </span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 max-w-[1400px] mx-auto">
            {publicPlans.map((plan) => {
              const href = plan.id === "free" ? "/login" : buildCheckoutHref(plan.id);
              const price = formatPriceCents(getPlanPriceCents(plan.id, isAnnual ? "annual" : "monthly"));
              const featured = plan.id === "pro" || plan.id === "agency_plus";

              return (
                <div
                  key={plan.id}
                  className={`glass p-8 rounded-[2.5rem] border relative transition-colors flex flex-col ${
                    featured ? "border-violet-500/40 bg-violet-900/10 shadow-[0_0_50px_rgba(139,92,246,0.12)]" : "border-white/10 hover:border-violet-500/30"
                  }`}
                >
                  {plan.marketing.badge ? (
                    <div className="absolute -top-4 inset-x-0 mx-auto w-fit bg-gradient-to-r from-violet-500 to-sky-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                      {plan.marketing.badge}
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.label}</h3>
                  <p className="text-neutral-400 font-medium mb-8 min-h-[72px]">{plan.marketing.summary}</p>
                  <div className="mb-8 flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-white">${price}</span>
                    <span className="text-neutral-500 font-medium mb-1">{isAnnual ? t.pricing.yr : t.pricing.mo}</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.marketing.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-3 text-neutral-300 font-medium tracking-wide">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={href}
                    className={`w-full py-4 rounded-2xl font-bold text-white text-center transition-colors shadow-lg ${
                      featured ? "bg-violet-600 hover:bg-violet-500" : "glass hover:bg-white/10 border-white/20"
                    }`}
                  >
                    {plan.marketing.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
