"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[560px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 right-0 w-[30rem] h-[30rem] bg-sky-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[24rem] h-[24rem] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,18,28,0.95),rgba(7,7,12,0.92))] p-7 md:p-9 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.16),transparent_32%)] pointer-events-none" />

          <div className="relative z-10">
            <div className="rounded-[2.25rem] border border-white/10 bg-black/30 p-6 md:p-8 shadow-inner">
              <div className="relative flex min-h-[420px] flex-col items-center justify-start overflow-hidden rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_38%),linear-gradient(180deg,#09090f,#050508)] px-8 pt-10 pb-12 text-center">
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
                <p className="relative z-10 mt-8 max-w-lg text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                  <>
                    Everything you need.
                    <br />
                    Nothing you don&apos;t.
                  </>
                </p>
              </div>
            </div>

          </div>
        </section>

        <section className="relative min-h-[620px] overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,14,22,0.96),rgba(9,9,14,0.94))] p-7 md:p-9 shadow-[0_30px_100px_rgba(0,0,0,0.45)] xl:mt-0">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_70%)] pointer-events-none" />
          <form onSubmit={handleSubmit} className="mx-auto max-w-[420px] space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-neutral-300">
                <ShieldCheck className="w-4 h-4" />
                Secure Account Access
              </div>
              <h2 className="mt-6 text-3xl md:text-[2rem] font-extrabold tracking-tight text-white">
                {t.login_page.title}
              </h2>
            </div>

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
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:translate-y-[-1px] active:scale-[0.99]"
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
