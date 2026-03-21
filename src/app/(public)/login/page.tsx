"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { findPurchasedAccount } from "@/lib/purchasedAccounts";

function LoginContent() {
  const { t } = useLanguage();
  const { loginWithPurchasedAccount } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

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
    await new Promise((resolve) => setTimeout(resolve, 600));

    const account = findPurchasedAccount(trimmedIdentifier, trimmedPassword);
    if (!account) {
      setLoading(false);
      setError(t.login_page.invalid);
      return;
    }

    loginWithPurchasedAccount(account);
    setSuccess(t.login_page.success);
    router.push(nextPath);
  };

  return (
    <div className="min-h-screen w-full px-6 py-28 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[520px] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none opacity-70" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-stretch">
        <section className="glass border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold mb-8">
            <ShieldCheck className="w-4 h-4" />
            Secure Account Access
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            {t.login_page.title}
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-xl">
            {t.login_page.subtitle}
          </p>

          <div className="mt-10 grid gap-4 text-sm text-neutral-300">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Purchased credentials can include your saved plan, billing cycle and workspace structure.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              After you send the user list, those accounts can be added directly to the purchased account registry.
            </div>
          </div>
        </section>

        <section className="glass border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
            >
              {loading ? t.login_page.processing : t.login_page.submit}
              {!loading ? <ArrowRight className="w-5 h-5" /> : null}
            </button>

            <p className="text-center text-sm text-neutral-500">
              {t.login_page.hint}{" "}
              <Link href="/checkout" className="text-violet-300 hover:text-violet-200 font-semibold transition-colors">
                {t.login_page.go_checkout}
              </Link>
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
