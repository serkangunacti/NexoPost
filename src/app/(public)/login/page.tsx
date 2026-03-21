"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { findPurchasedAccount } from "@/lib/purchasedAccounts";

function LoginContent() {
  const { t } = useLanguage();
  const { loginWithPurchasedAccount, startPlan } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registrationMode, setRegistrationMode] = useState<"trial" | "paid">("trial");
  const [trialPlan, setTrialPlan] = useState<"basic" | "pro" | "agency">("pro");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const selectedPlanPrice = trialPlan === "agency" ? 49 : trialPlan === "pro" ? 19 : 9;
  const planFeatureMap = {
    basic: [
      t.pricing.basic_perk1,
      t.pricing.basic_perk2,
      t.pricing.basic_perk3,
      t.pricing.basic_perk5,
      t.pricing.basic_perk6,
      t.pricing.basic_perk7,
    ],
    pro: [
      t.pricing.pro_perk1,
      t.pricing.pro_perk2,
      t.pricing.pro_perk3,
      t.pricing.pro_perk4,
      t.pricing.pro_perk5,
      t.pricing.pro_perk6,
      t.pricing.pro_perk7,
    ],
    agency: [
      t.pricing.agency_perk1,
      t.pricing.agency_perk2,
      t.pricing.agency_perk3,
      t.pricing.agency_perk4,
      t.pricing.agency_perk5,
      t.pricing.agency_perk6,
      t.pricing.agency_perk7,
    ],
  } as const;
  const selectedPlanFeatures = planFeatureMap[trialPlan];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setError(t.login_page.invalid);
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const account = findPurchasedAccount(trimmedIdentifier, trimmedPassword);
      if (!account) {
        setError(t.login_page.invalid);
        return;
      }

      loginWithPurchasedAccount(account);
      setSuccess(t.login_page.success);
      router.push(nextPath);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const baseFieldsValid =
      registerName.trim() &&
      registerEmail.trim() &&
      registerPassword.trim() &&
      companyName.trim() &&
      phone.trim();
    const paymentFieldsValid = cardNumber.trim() && expiry.trim() && cvv.trim();

    if (!baseFieldsValid) {
      setError(t.login_page.register_error);
      return;
    }

    if (registrationMode === "paid" && !paymentFieldsValid) {
      setError("Please fill in your payment details.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = startPlan({
        activationMode: registrationMode,
        billingCycle: "monthly",
        companyName: companyName.trim(),
        email: registerEmail.trim(),
        fullName: registerName.trim(),
        phone: phone.trim(),
        plan: trialPlan,
      });

      setSuccess(result.phase === "trial" ? t.login_page.register_success_trial : t.login_page.register_success_paid);
      router.push(nextPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full px-6 py-28 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[560px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 right-0 w-[30rem] h-[30rem] bg-sky-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[24rem] h-[24rem] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
        <section className="relative min-h-[620px] overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,18,28,0.95),rgba(7,7,12,0.92))] p-7 md:p-9 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.16),transparent_32%)] pointer-events-none" />

          <div className="relative z-10 h-full">
            <div className="h-full rounded-[2.25rem] border border-white/10 bg-black/30 p-6 md:p-8 shadow-inner">
              <div className="relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_38%),linear-gradient(180deg,#09090f,#050508)] px-8 pt-10 pb-12 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_24%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(139,92,246,0.12),transparent_55%)] pointer-events-none" />
                <div className="relative z-10 flex h-48 w-48 md:h-56 md:w-56 items-center justify-center rounded-[2.5rem] border border-violet-500/30 bg-white/[0.03] shadow-[0_0_60px_rgba(139,92,246,0.2)] backdrop-blur-sm">
                  <Image
                    src="/logo.png"
                    alt="NexoPost Logo"
                    width={180}
                    height={180}
                    className="h-32 w-32 md:h-40 md:w-40 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.12)]"
                  />
                </div>
                {mode === "register" ? (
                  <>
                    <p className="relative z-10 mt-8 max-w-lg text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                      <>
                        Everything you need.
                        <br />
                        Nothing you don&apos;t.
                      </>
                    </p>
                    <div className="relative z-10 mt-8 w-full max-w-md rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                        {t.login_page.selected_price}
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-white">${selectedPlanPrice} USD</p>
                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">
                        {trialPlan === "agency" ? t.pricing.agency : trialPlan === "pro" ? t.pricing.pro : t.pricing.basic}
                      </p>
                      <p className="mt-2 text-sm font-medium text-neutral-400">
                        {trialPlan === "agency"
                          ? t.pricing.agency_desc
                          : trialPlan === "pro"
                            ? t.pricing.pro_desc
                            : t.pricing.basic_desc}
                      </p>
                      <div className="mt-4 space-y-3">
                        {selectedPlanFeatures.slice(0, 4).map((feature) => (
                          <div key={feature} className="flex items-start gap-3">
                            <div className="mt-1 h-2 w-2 rounded-full bg-violet-400" />
                            <p className="text-sm font-medium text-white">{feature}</p>
                          </div>
                        ))}
                      </div>
                      {registrationMode === "trial" ? (
                        <button
                          type="button"
                          onClick={() => setRegistrationMode("paid")}
                          className="mt-6 w-full rounded-2xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500/20"
                        >
                          {t.login_page.buy_plan_submit}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

          </div>
        </section>

        <section className="relative min-h-[620px] overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,14,22,0.96),rgba(9,9,14,0.94))] p-7 md:p-9 shadow-[0_30px_100px_rgba(0,0,0,0.45)] xl:mt-0">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_70%)] pointer-events-none" />
          <form
            onSubmit={mode === "login" ? handleSubmit : handleRegistration}
            className="mx-auto flex h-full max-w-[420px] flex-col justify-center space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-neutral-300">
                <ShieldCheck className="w-4 h-4" />
                Secure Account Access
              </div>
              <h2 className="mt-6 text-3xl md:text-[2rem] font-extrabold tracking-tight text-white">
                {mode === "login" ? t.login_page.title : t.login_page.register_title}
              </h2>
              {mode === "register" ? (
                <p className="mt-3 text-sm text-neutral-400">{t.login_page.register_subtitle}</p>
              ) : null}
            </div>

            {mode === "login" ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    {t.login_page.identifier}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder={t.login_page.identifier_placeholder}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    {t.login_page.password}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t.login_page.password_placeholder}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    {t.login_page.trial_plan_label}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["basic", "pro", "agency"] as const).map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setTrialPlan(plan)}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                          trialPlan === plan
                            ? "border-violet-400/50 bg-violet-500/10 text-white"
                            : "border-white/10 bg-black/20 text-neutral-300 hover:bg-white/5"
                        }`}
                      >
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    {t.login_page.register_name}
                  </label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(event) => setRegisterName(event.target.value)}
                    placeholder={t.login_page.register_name_placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    {t.login_page.register_email}
                  </label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder={t.login_page.identifier_placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    {t.login_page.register_password}
                  </label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder={t.login_page.register_password_placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    Firma Adı <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Şirket / Ajans adınız"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-400 mb-2">
                    Telefon Numarası <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+90 5xx xxx xx xx"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  />
                </div>

                {registrationMode === "paid" ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-400 mb-2">
                        {t.login_page.card_number}
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(event) => setCardNumber(event.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-400 mb-2">
                          {t.login_page.expiry}
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(event) => setExpiry(event.target.value)}
                          placeholder="MM / YY"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-400 mb-2">
                          {t.login_page.cvv}
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(event) => setCvv(event.target.value)}
                          placeholder="123"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : null}

              </>
            )}

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:translate-y-[-1px] active:scale-[0.99]"
            >
              {loading
                ? mode === "login"
                  ? t.login_page.processing
                  : t.login_page.register_processing
                : mode === "login"
                  ? t.login_page.submit
                  : registrationMode === "trial"
                    ? t.login_page.start_trial_submit
                    : t.login_page.buy_plan_submit}
              {!loading ? <ArrowRight className="w-5 h-5" /> : null}
            </button>

            <p className="text-center text-sm text-neutral-500">
              {mode === "login" ? t.login_page.hint : t.login_page.register_login_link}{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode((currentMode) => (currentMode === "login" ? "register" : "login"));
                  setRegistrationMode("trial");
                }}
                className="text-violet-300 hover:text-violet-200 font-semibold transition-colors"
              >
                {mode === "login" ? t.login_page.go_checkout : t.login_page.title}
              </button>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-violet-500 animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
