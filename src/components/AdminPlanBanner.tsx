"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, Crown, Rocket, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatDateTime, getSubscriptionSnapshot } from "@/lib/subscription";

export default function AdminPlanBanner() {
  const { pendingChange, subscription, userProfile } = useApp();
  const snapshot = getSubscriptionSnapshot(subscription);

  const Icon = snapshot.isExpired ? AlertTriangle : snapshot.isTrial ? Rocket : ShieldCheck;
  const accentClass = snapshot.isExpired
    ? "text-amber-300 border-amber-400/30 bg-amber-500/10"
    : snapshot.isTrial
      ? "text-sky-300 border-sky-400/30 bg-sky-500/10"
      : "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";

  return (
    <section className="mb-8">
      <div className="glass border border-white/10 rounded-[2rem] p-6 md:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 right-0 w-72 h-72 bg-violet-500/10 blur-[110px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-bold ${accentClass}`}>
                <Icon className="w-4 h-4" />
                {snapshot.statusLabel}
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <Crown className="w-6 h-6 text-violet-400" />
                  {snapshot.planLabel}
                </h2>
                <p className="text-neutral-400 mt-2 max-w-2xl font-medium">
                  {snapshot.renewLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/checkout"
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)] text-center"
              >
                {snapshot.isExpired ? "Renew Package" : snapshot.isTrial ? "Upgrade to Paid" : "Change Package"}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 font-bold mb-2">Current Access</p>
              <p className="text-white font-bold text-lg">{snapshot.phaseLabel}</p>
              {userProfile ? <p className="text-neutral-400 text-sm mt-2 truncate">{userProfile.email}</p> : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 font-bold mb-2">Expire Date</p>
              <p className="text-white font-bold text-lg flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-400" />
                {snapshot.expiresAtLabel}
              </p>
              <p className="text-neutral-400 text-sm mt-2">{snapshot.timeLeftLabel}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 font-bold mb-2">Posting Access</p>
              <p className={`font-bold text-lg ${snapshot.canPublish ? "text-emerald-300" : "text-amber-300"}`}>
                {snapshot.canPublish ? "Publishing Enabled" : "Publishing Locked"}
              </p>
              <p className="text-neutral-400 text-sm mt-2">
                Expired users can still review data and export reports, but they cannot publish new posts until they renew.
              </p>
            </div>
          </div>

          {pendingChange ? (
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-violet-300 font-bold mb-2">Scheduled Change</p>
              <p className="text-white font-bold">
                Your {pendingChange.plan} {pendingChange.billingCycle} package will start on {formatDateTime(pendingChange.effectiveAt)}.
              </p>
              <p className="text-neutral-300 text-sm mt-2">
                Your current package stays active until the end of this month. The new billing date will begin on the first day of the next month.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
