"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { formatDateTime, getSubscriptionSnapshot } from "@/lib/subscription";
import {
  PLAN_ORDER,
  formatPriceCents,
  getPlanConfig,
  getPlanPriceCents,
  isPlanId,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans";
import { CheckCircle2, CreditCard, Lock, Zap, ArrowRight, Star, TicketPercent } from "lucide-react";

interface PurchaseResult {
  effectiveAt: string;
  phase: "free" | "trial" | "paid";
  scheduled: boolean;
}

type CheckoutPlan = Exclude<PlanId, "free">;
type CheckoutStep = "plan" | "payment" | "success";

type AppliedDiscount = {
  code: string;
  codeId: string;
  percentOff: number;
};

const PAID_PLAN_IDS = PLAN_ORDER.filter((plan) => plan !== "free") as CheckoutPlan[];

function parseSelectedPlan(value: string | null, fallback: CheckoutPlan): CheckoutPlan {
  return value && isPlanId(value) && value !== "free" ? value : fallback;
}

function parseBillingCycle(value: string | null, fallback: BillingCycle): BillingCycle {
  if (value === "annual") return "annual";
  if (value === "monthly") return "monthly";
  return fallback;
}

function parseStep(value: string | null): CheckoutStep {
  return value === "payment" ? "payment" : "plan";
}

function CheckoutContent() {
  const { t } = useLanguage();
  const { startPlan, subscription, userProfile } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = parseSelectedPlan(searchParams.get("plan"), subscription?.plan && subscription.plan !== "free" ? subscription.plan : "pro");
  const initialBillingCycle = parseBillingCycle(searchParams.get("billing"), subscription?.billingCycle ?? "monthly");
  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [step, setStep] = useState<CheckoutStep>(parseStep(searchParams.get("step")));
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.fullName ?? "");
  const [email, setEmail] = useState(userProfile?.email ?? "");
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);

  const plans = PAID_PLAN_IDS.map((id) => {
    const plan = getPlanConfig(id);
    return {
      ...plan,
      badge: plan.marketing.badge ?? "",
      perks: plan.marketing.perks,
    };
  });

  const currentPlan = plans.find((plan) => plan.id === selectedPlan) ?? plans[1];
  const basePriceCents = getPlanPriceCents(selectedPlan, billingCycle);
  const finalPriceCents = appliedDiscount
    ? Math.max(0, Math.round(basePriceCents * ((100 - appliedDiscount.percentOff) / 100)))
    : basePriceCents;
  const nextPath = searchParams.get("next") || "/dashboard";

  const isFirstTrial = !(subscription?.hasUsedTrial ?? false);
  const subscriptionSnapshot = getSubscriptionSnapshot(subscription);
  const purchaseCta = isFirstTrial
    ? (t.checkout.start_trial ?? "Start 15-Day Trial")
    : subscription && !subscriptionSnapshot.isExpired
      ? (t.checkout.change_paid_plan ?? "Switch to Paid Plan")
      : (t.checkout.renew_plan ?? "Renew Package");
  const scheduledDateLabel = purchaseResult ? formatDateTime(purchaseResult.effectiveAt) : "";
  const successSubtitle = purchaseResult?.scheduled
    ? t.checkout.scheduled_success_subtitle
    : t.checkout.success_subtitle;

  const purchaseSummary = useMemo(() => ({
    base: formatPriceCents(basePriceCents),
    final: formatPriceCents(finalPriceCents),
  }), [basePriceCents, finalPriceCents]);

  async function applyDiscount() {
    if (!discountCode.trim()) {
      setDiscountError("Enter a discount code.");
      return;
    }

    setDiscountLoading(true);
    setDiscountError("");
    try {
      const res = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle,
          code: discountCode.trim(),
          plan: selectedPlan,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Discount code could not be applied.");
      }

      const payload = await res.json() as AppliedDiscount;
      setAppliedDiscount(payload);
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountError(error instanceof Error ? error.message : "Discount code could not be applied.");
    } finally {
      setDiscountLoading(false);
    }
  }

  const handlePurchase = async () => {
    if (!fullName.trim() || !email.trim()) {
      alert("Please fill in your full name and email address.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const result = startPlan({
      billingCycle,
      email: email.trim(),
      fullName: fullName.trim(),
      plan: selectedPlan,
    });

    if (appliedDiscount) {
      await fetch("/api/discount-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle,
          code: appliedDiscount.code,
          email: email.trim(),
          orderContext: {
            finalPriceCents,
            originalPriceCents: basePriceCents,
          },
          plan: selectedPlan,
        }),
      }).catch(() => undefined);
    }

    setPurchaseResult(result);
    setLoading(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center glass border border-white/10 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 fade-in duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            {purchaseResult?.scheduled ? t.checkout.scheduled_success_title : t.checkout.success_title}
          </h2>
          {purchaseResult?.scheduled ? (
            <p className="text-neutral-300 font-medium mb-2">
              {t.checkout.scheduled_success_message.replace("{date}", scheduledDateLabel)}
            </p>
          ) : (
            <p className="text-neutral-400 font-medium mb-2">
              <span className="text-white font-bold">{currentPlan.label}</span> is now active for your workspace group.
            </p>
          )}
          <p className="text-neutral-500 text-sm mb-10">{successSubtitle}</p>
          <button
            onClick={() => router.push(nextPath)}
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none opacity-60" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
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
          <p className="text-neutral-400 font-medium text-lg max-w-xl mx-auto">{t.checkout.subtitle}</p>

          <div className="inline-flex items-center gap-2 p-1.5 glass rounded-full border border-white/10 mt-8 shadow-xl">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${billingCycle === "monthly" ? "text-white" : "text-neutral-400 hover:text-white"}`}
            >
              {billingCycle === "monthly" && <div className="absolute inset-0 bg-violet-600 rounded-full -z-10 shadow-[0_0_15px_rgba(139,92,246,0.4)]" />}
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${billingCycle === "annual" ? "text-white" : "text-neutral-400 hover:text-white"}`}
            >
              {billingCycle === "annual" && <div className="absolute inset-0 bg-violet-600 rounded-full -z-10 shadow-[0_0_15px_rgba(139,92,246,0.4)]" />}
              {t.pricing.annually}
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${billingCycle === "annual" ? "bg-white text-violet-600" : "bg-violet-600/30 text-violet-300"}`}>
                11 Months
              </span>
            </button>
          </div>
        </div>

        {step === "plan" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const accent =
                  plan.id === "basic"
                    ? "border-sky-400/30"
                    : plan.id === "pro"
                      ? "border-violet-400/40"
                      : plan.id === "agency"
                        ? "border-fuchsia-400/40"
                        : "border-amber-400/40";

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as CheckoutPlan)}
                    className={`relative text-left glass p-8 rounded-[2.5rem] border transition-all duration-300 shadow-lg flex flex-col cursor-pointer ${
                      isSelected ? `${accent} bg-white/[0.03] shadow-[0_0_30px_rgba(255,255,255,0.05)]` : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {plan.badge ? (
                      <div className="absolute -top-4 inset-x-0 mx-auto w-fit bg-gradient-to-r from-violet-500 to-sky-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                        {plan.badge}
                      </div>
                    ) : null}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-1">{plan.label}</h3>
                    <p className="text-neutral-500 text-sm font-medium mb-6">{plan.marketing.summary}</p>
                    <div className="mb-6 flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-white">${formatPriceCents(getPlanPriceCents(plan.id, billingCycle))}</span>
                      <span className="text-neutral-500 font-medium mb-1">{billingCycle === "annual" ? t.pricing.yr : t.pricing.mo}</span>
                    </div>
                    <ul className="space-y-3 flex-1 mb-8">
                      {plan.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2.5 text-neutral-300 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPlan(plan.id as CheckoutPlan);
                        setAppliedDiscount(null);
                        setDiscountCode("");
                        setDiscountError("");
                        setStep("payment");
                      }}
                      className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                      <CreditCard className="w-4 h-4" />
                      {t.checkout.select_plan.replace("{plan}", plan.label)}
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
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 mb-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-neutral-400 text-sm font-semibold">{t.checkout.selected_plan}</p>
                    <p className="text-white font-extrabold text-xl">{currentPlan.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-400 text-sm font-semibold">{billingCycle === "annual" ? "Annual Fee (11 months)" : t.checkout.monthly_fee}</p>
                    <p className="text-2xl font-extrabold text-violet-300">${purchaseSummary.final}</p>
                  </div>
                </div>
                {appliedDiscount ? (
                  <div className="mt-4 pt-4 border-t border-violet-500/20 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <TicketPercent className="w-4 h-4" />
                      {appliedDiscount.code} applied
                    </div>
                    <div className="text-neutral-400">
                      <span className="line-through mr-2">${purchaseSummary.base}</span>
                      <span className="text-white font-bold">${purchaseSummary.final}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-violet-500/20 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                    <Star className="w-4 h-4 fill-emerald-400" />
                    {isFirstTrial ? t.checkout.trial_note.replace("{period}", billingCycle === "annual" ? t.checkout.trial_period_year : t.checkout.trial_period_month) : "Discount codes apply to the first paid purchase only."}
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-7">{t.checkout.payment_title}</h2>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.checkout.full_name}</label>
                  <input
                    type="text"
                    placeholder={t.checkout.full_name_placeholder}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.checkout.email}</label>
                  <input
                    type="email"
                    placeholder="hello@nexopost.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">Discount Code</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                      placeholder="LAUNCH25"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={discountLoading}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold disabled:opacity-60"
                    >
                      {discountLoading ? "Checking…" : "Apply"}
                    </button>
                  </div>
                  {discountError ? <p className="text-sm text-red-300 mt-2">{discountError}</p> : null}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.checkout.card_number}</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Param Kurumsal secure payment"
                      maxLength={24}
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
                      {purchaseCta} — ${purchaseSummary.final}
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
