"use client";

import { FormEvent, useEffect, useState } from "react";
import { TicketPercent, Plus, Loader2 } from "lucide-react";
import { PLAN_ORDER, getPlanLabel, type BillingCycle, type PlanId } from "@/lib/plans";

type DiscountCodeRecord = {
  id: string;
  code: string;
  percentOff: number;
  startsAt: string | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redeemedCount: number;
  allowedPlans: PlanId[] | null;
  allowedBillingCycles: BillingCycle[] | null;
  isActive: boolean;
};

export default function CampaignsPage() {
  const [codes, setCodes] = useState<DiscountCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    allowedBillingCycles: ["monthly", "annual"] as BillingCycle[],
    allowedPlans: ["basic", "pro", "agency", "agency_plus"] as PlanId[],
    code: "",
    expiresAt: "",
    maxRedemptions: "",
    percentOff: "15",
    startsAt: "",
  });

  async function loadCodes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/discount-codes");
      if (!res.ok) throw new Error("Campaign codes could not be loaded.");
      const data = await res.json() as DiscountCodeRecord[];
      setCodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Campaign codes could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCodes();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedBillingCycles: form.allowedBillingCycles,
          allowedPlans: form.allowedPlans,
          code: form.code,
          expiresAt: form.expiresAt || null,
          maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
          percentOff: Number(form.percentOff),
          startsAt: form.startsAt || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Campaign code could not be created.");
      }

      setForm((prev) => ({
        ...prev,
        code: "",
        expiresAt: "",
        maxRedemptions: "",
        percentOff: "15",
        startsAt: "",
      }));
      setSuccess("Discount code created.");
      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Campaign code could not be created.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-bold">
          <TicketPercent className="w-4 h-4" />
          Promotions
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Campaign Codes</h1>
        <p className="text-neutral-400 max-w-3xl">
          Create percentage-based launch offers for the first paid purchase. Codes can be scoped to plans, billing cycles, and redemption windows.
        </p>
      </header>

      <section className="glass rounded-[2rem] border border-white/10 p-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Code</label>
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              placeholder="LAUNCH25"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Discount %</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.percentOff}
              onChange={(event) => setForm((prev) => ({ ...prev, percentOff: event.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Starts At</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Expires At</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Max Redemptions</label>
            <input
              type="number"
              min={1}
              value={form.maxRedemptions}
              onChange={(event) => setForm((prev) => ({ ...prev, maxRedemptions: event.target.value }))}
              placeholder="Leave empty for unlimited"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Billing Cycles</label>
            <div className="flex flex-wrap gap-2">
              {(["monthly", "annual"] as const).map((cycle) => {
                const active = form.allowedBillingCycles.includes(cycle);
                return (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        allowedBillingCycles: active
                          ? prev.allowedBillingCycles.filter((item) => item !== cycle)
                          : [...prev.allowedBillingCycles, cycle],
                      }))
                    }
                    className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                      active ? "border-violet-400/50 bg-violet-500/10 text-white" : "border-white/10 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {cycle}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-neutral-400 mb-2">Plans</label>
            <div className="flex flex-wrap gap-2">
              {PLAN_ORDER.filter((plan) => plan !== "free").map((plan) => {
                const active = form.allowedPlans.includes(plan);
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        allowedPlans: active
                          ? prev.allowedPlans.filter((item) => item !== plan)
                          : [...prev.allowedPlans, plan],
                      }))
                    }
                    className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                      active ? "border-violet-400/50 bg-violet-500/10 text-white" : "border-white/10 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {getPlanLabel(plan)}
                  </button>
                );
              })}
            </div>
          </div>
          {(error || success) && (
            <div className={`md:col-span-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
              error ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
            }`}>
              {error || success}
            </div>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Discount Code
            </button>
          </div>
        </form>
      </section>

      <section className="glass rounded-[2rem] border border-white/10 p-8">
        <h2 className="text-2xl font-bold text-white mb-5">Active Codes</h2>
        {loading ? (
          <div className="flex items-center gap-3 text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading codes…</div>
        ) : codes.length === 0 ? (
          <p className="text-neutral-500">No campaign codes created yet.</p>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => (
              <div key={code.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-white font-bold text-lg">{code.code}</p>
                  <p className="text-neutral-400 text-sm">
                    {code.percentOff}% off
                    {code.maxRedemptions ? ` • max ${code.maxRedemptions}` : " • unlimited redemptions"}
                    {code.expiresAt ? ` • expires ${new Date(code.expiresAt).toLocaleDateString("en-US")}` : ""}
                  </p>
                </div>
                <div className="text-sm text-neutral-400">
                  Redeemed: <span className="text-white font-semibold">{code.redeemedCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
