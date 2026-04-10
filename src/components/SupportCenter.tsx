"use client";

import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, LoaderCircle, Send, MessageSquareText } from "lucide-react";
import { useApp } from "@/context/AppContext";

type SupportRequestItem = {
  id: string;
  subject: string;
  message: string;
  status: string;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
};

const inputCls =
  "w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all";

export default function SupportCenter() {
  const { activeClient } = useApp();
  const [requests, setRequests] = useState<SupportRequestItem[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => subject.trim().length >= 4 && message.trim().length >= 10,
    [subject, message]
  );

  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/support-requests", { cache: "no-store" });
      if (!response.ok) throw new Error("Support requests could not be loaded.");
      const payload = (await response.json()) as { requests?: SupportRequestItem[] };
      setRequests(payload.requests ?? []);
    } catch (err) {
      console.error(err);
      setError("Support requests could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/support-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeClient?.id ?? null,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Support request could not be created.");
      }

      setSubject("");
      setMessage("");
      setSuccess("Support request created successfully.");
      await loadRequests();
    } catch (err) {
      console.error(err);
      setError("Support request could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-white/10 bg-[#12121a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
              <LifeBuoy className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Support</h1>
              <p className="text-sm text-neutral-400">Open a ticket for the active workspace.</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-400">Subject</label>
              <input
                className={inputCls}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Short summary of the issue"
              />
              <p className="mt-2 text-xs text-neutral-500">{subject.length}/120</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-400">Message</label>
              <textarea
                className={`${inputCls} min-h-40 resize-none`}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe the issue, affected platform, and what happened."
              />
              <p className="mt-2 text-xs text-neutral-500">{message.length}/4000</p>
            </div>
            {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
            {success ? <p className="text-sm font-semibold text-emerald-400">{success}</p> : null}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Creating..." : "Create support request"}
            </button>
          </form>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#12121a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Your requests</h2>
              <p className="text-sm text-neutral-400">Latest support requests opened from your account.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadRequests()}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center text-neutral-400">
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 text-center">
              <MessageSquareText className="mb-3 h-10 w-10 text-neutral-500" />
              <p className="font-semibold text-white">No support requests yet</p>
              <p className="mt-2 max-w-md text-sm text-neutral-400">
                When you open your first request, it will appear here with its current status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-violet-500/20 hover:bg-black/30"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{request.subject}</h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                        {new Date(request.createdAt).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                      {request.status}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-300">{request.message}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
