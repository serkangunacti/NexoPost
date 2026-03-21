"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, CreditCard, Lock, Zap, ArrowRight, Star } from "lucide-react";

function CheckoutContent() {
  const { t } = useLanguage();
  const { setIsLoggedIn, setUserType } = useApp();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | "agency">("pro");
  const [isAnnual, setIsAnnual] = useState(false);
  const [step, setStep] = useState<"plan" | "payment" | "success">("plan");
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: "basic" as const,
      name: t.pricing.basic,
      desc: t.pricing.basic_desc,
      monthlyPrice: 9,
      annualPrice: 90,
      perks: [t.pricing.basic_perk1, t.pricing.basic_perk2, t.pricing.basic_perk3, t.pricing.basic_perk5, t.pricing.basic_perk6, t.pricing.basic_perk7],
      color: "sky",
      accent: "border-sky-500/40 shadow-sky-500/10",
      activeAccent: "border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.25)] bg-sky-500/5",
      badge: "",
    },
    {
      id: "pro" as const,
      name: t.pricing.pro,
      desc: t.pricing.pro_desc,
      monthlyPrice: 19,
      annualPrice: 190,
      perks: [t.pricing.pro_perk1, t.pricing.pro_perk2, t.pricing.pro_perk3, t.pricing.pro_perk4, t.pricing.pro_perk5, t.pricing.pro_perk6, t.pricing.pro_perk7],
      color: "violet",
      accent: "border-violet-500/40 shadow-violet-500/10",
      activeAccent: "border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)] bg-violet-500/5",
      badge: t.pricing.popular,
    },
    {
      id: "agency" as const,
      name: t.pricing.agency,
      desc: t.pricing.agency_desc,
      monthlyPrice: 49,
      annualPrice: 490,
      perks: [t.pricing.agency_perk1, t.pricing.agency_perk2, t.pricing.agency_perk3, t.pricing.agency_perk4, t.pricing.agency_perk5, t.pricing.agency_perk6, t.pricing.agency_perk7],
      color: "fuchsia",
      accent: "border-fuchsia-500/40 shadow-fuchsia-500/10",
      activeAccent: "border-fuchsia-400 shadow-[0_0_30px_rgba(217,70,239,0.25)] bg-fuchsia-500/5",
      badge: "",
    },
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan)!;
  const price = isAnnual ? currentPlan.annualPrice : currentPlan.monthlyPrice;

  const handlePurchase = async () => {
    setLoading(true);
    // Simüle edilmiş ödeme işlemi
    await new Promise(r => setTimeout(r, 1800));
    setIsLoggedIn(true);
    setUserType(selectedPlan);
    setLoading(false);
    setStep("success");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center glass border border-white/10 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 fade-in duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">{t.checkout.success_title}</h2>
          <p className="text-neutral-400 font-medium mb-2">
            {t.checkout.success_message_prefix ? `${t.checkout.success_message_prefix} ` : null}
            <span className="text-white font-bold">{currentPlan.name}</span>
            {t.checkout.success_message_suffix}
          </p>
          <p className="text-neutral-500 text-sm mb-10">{t.checkout.success_subtitle}</p>
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105"
          >
            {t.checkout.go_to_dashboard} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-28 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none opacity-60" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/20 text-violet-400 font-bold text-sm mb-6 uppercase tracking-widest shadow-lg">
            <Zap className="w-4 h-4" /> {t.checkout.trial_badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t.checkout.title_main}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
              {t.checkout.title_highlight}
            </span>
          </h1>
          <p className="text-neutral-400 font-medium text-lg max-w-xl mx-auto">
            {t.checkout.subtitle}
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 glass rounded-full border border-white/10 mt-8 shadow-xl">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${!isAnnual ? "text-white" : "text-neutral-400 hover:text-white"}`}
            >
              {!isAnnual && <div className="absolute inset-0 bg-violet-600 rounded-full -z-10 shadow-[0_0_15px_rgba(139,92,246,0.4)]" />}
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isAnnual ? "text-white" : "text-neutral-400 hover:text-white"}`}
            >
              {isAnnual && <div className="absolute inset-0 bg-violet-600 rounded-full -z-10 shadow-[0_0_15px_rgba(139,92,246,0.4)]" />}
              {t.pricing.annually}
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${isAnnual ? "bg-white text-violet-600" : "bg-violet-600/30 text-violet-300"}`}>
                {t.checkout.annual_bonus}
              </span>
            </button>
          </div>
        </div>

        {step === "plan" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const btnColor = {
                  sky: "bg-sky-500 hover:bg-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)]",
                  violet: "bg-violet-600 hover:bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
                  fuchsia: "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]",
                }[plan.color];
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative text-left glass p-8 rounded-[2.5rem] border transition-all duration-300 shadow-lg flex flex-col cursor-pointer ${
                      isSelected ? plan.activeAccent : "border-white/10 hover:border-white/20"
                    } ${plan.id === "pro" ? "md:-translate-y-3 z-10" : ""}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-4 inset-x-0 mx-auto w-fit bg-gradient-to-r from-violet-500 to-sky-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                        {plan.badge}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-neutral-500 text-sm font-medium mb-6">{plan.desc}</p>
                    <div className="mb-6 flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-white">${isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                      <span className="text-neutral-500 font-medium mb-1">{isAnnual ? t.pricing.yr : t.pricing.mo}</span>
                    </div>
                    <ul className="space-y-3 flex-1 mb-8">
                      {plan.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-neutral-300 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    {/* Per-plan CTA button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan.id);
                        setStep("payment");
                      }}
                      className={`w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${btnColor}`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {t.checkout.select_plan.replace("{plan}", plan.name)}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              {/* Order Summary */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-400 text-sm font-semibold">{t.checkout.selected_plan}</p>
                    <p className="text-white font-extrabold text-xl">{currentPlan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-400 text-sm font-semibold">{isAnnual ? t.checkout.annual_fee : t.checkout.monthly_fee}</p>
                    <p className="text-2xl font-extrabold text-violet-300">${price}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-violet-500/20 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <Star className="w-4 h-4 fill-emerald-400" />
                  {t.checkout.trial_note.replace("{period}", isAnnual ? t.checkout.trial_period_year : t.checkout.trial_period_month)}
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-7">{t.checkout.payment_title}</h2>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.checkout.full_name}</label>
                  <input
                    type="text"
                    placeholder={t.checkout.full_name_placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.checkout.email}</label>
                  <input
                    type="email"
                    placeholder="hello@nexopost.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.checkout.card_number}</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.checkout.expiry}</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      maxLength={7}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">CVV</label>
                    <input
                      type="text"
                      placeholder="•••"
                      maxLength={4}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.checkout.processing}
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {t.checkout.secure_payment} — ${price}
                    </>
                  )}
                </button>

                <p className="text-center text-neutral-600 text-xs font-medium">
                  {t.checkout.security_note}
                </p>

                <button
                  onClick={() => setStep("plan")}
                  className="text-center text-neutral-500 hover:text-white text-sm font-semibold transition-colors"
                >
                  ← {t.checkout.back_to_plans}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-violet-500 animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
