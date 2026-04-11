"use client";

import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, LoaderCircle, MessageSquareText, Paperclip, RefreshCcw, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";

type SupportReplyItem = {
  id: string;
  body: string;
  authorType: string;
  source: string;
  attachmentUrls: string[];
  seenByUserAt: string | null;
  seenByStaffAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorUser: {
    email: string | null;
    name: string | null;
  } | null;
};

type SupportRequestItem = {
  id: string;
  subject: string;
  message: string;
  status: string;
  workspaceId: string | null;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string | null;
    name: string | null;
  };
  workspace?: {
    name: string;
  } | null;
  replies: SupportReplyItem[];
};

const inputCls =
  "w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

function MessageBubble({
  tone,
  title,
  meta,
  body,
  attachmentUrls,
}: {
  tone: "user" | "staff" | "system";
  title: string;
  meta: string;
  body: string;
  attachmentUrls: string[];
}) {
  const toneCls =
    tone === "staff"
      ? "border-violet-500/20 bg-violet-500/10"
      : tone === "system"
        ? "border-sky-500/20 bg-sky-500/10"
        : "border-white/10 bg-black/20";

  return (
    <div className={`rounded-3xl border p-4 ${toneCls}`}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">{meta}</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-200">{body}</p>
      {attachmentUrls.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {attachmentUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
            >
              {/(\.png|\.jpe?g|\.gif|\.webp|\.avif)$/i.test(url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Attachment" className="h-44 w-full object-cover" />
              ) : (
                <div className="flex min-h-24 items-center justify-center px-4 text-center text-sm text-neutral-300">{url}</div>
              )}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function SupportCenter() {
  const { activeClient, isStaff } = useApp();
  const [requests, setRequests] = useState<SupportRequestItem[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyAttachments, setReplyAttachments] = useState<Record<string, string[]>>({});
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => subject.trim().length >= 4 && message.trim().length >= 10,
    [subject, message]
  );

  async function markRead() {
    if (isStaff) return;
    await fetch("/api/support-requests/read", { method: "POST" }).catch(console.error);
  }

  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(isStaff ? "/api/support-requests/admin" : "/api/support-requests", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Support requests could not be loaded.");
      const payload = (await response.json()) as { requests?: SupportRequestItem[] };
      setRequests(payload.requests ?? []);
      if (!isStaff) {
        await markRead();
      }
    } catch (err) {
      console.error(err);
      setError("Support requests could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [isStaff]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !activeClient?.id) return [];
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("workspaceId", activeClient.id);
        formData.append("file", file);
        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Attachment upload failed.");
        }
        const payload = (await response.json()) as { url?: string };
        if (payload.url) urls.push(payload.url);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  }

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
          attachmentUrls: attachments,
        }),
      });

      if (!response.ok) {
        throw new Error("Support request could not be created.");
      }

      setSubject("");
      setMessage("");
      setAttachments([]);
      setSuccess("Support request created successfully.");
      await loadRequests();
    } catch (err) {
      console.error(err);
      setError("Support request could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(requestId: string, status: string) {
    try {
      const response = await fetch("/api/support-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      if (!response.ok) throw new Error("Status update failed.");
      setRequests((current) =>
        current.map((request) => (request.id === requestId ? { ...request, status } : request))
      );
    } catch (err) {
      console.error(err);
      setError("Support status could not be updated.");
    }
  }

  async function handleReplySubmit(requestId: string) {
    const body = replyDrafts[requestId]?.trim() ?? "";
    if (body.length < 2 || busyRequestId) return;

    setBusyRequestId(requestId);
    setError(null);
    try {
      const response = await fetch(`/api/support-requests/${requestId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: body,
          attachmentUrls: replyAttachments[requestId] ?? [],
        }),
      });
      if (!response.ok) throw new Error("Reply could not be sent.");
      setReplyDrafts((current) => ({ ...current, [requestId]: "" }));
      setReplyAttachments((current) => ({ ...current, [requestId]: [] }));
      await loadRequests();
    } catch (err) {
      console.error(err);
      setError("Reply could not be sent.");
    } finally {
      setBusyRequestId(null);
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
              <h1 className="text-xl font-bold text-white">{isStaff ? "Support Operations" : "Support"}</h1>
              <p className="text-sm text-neutral-400">
                {isStaff ? "Review tickets, reply, and update request status." : "Open a ticket and continue the conversation from one place."}
              </p>
            </div>
          </div>

          {isStaff ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Queue snapshot</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Open requests</p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {requests.filter((request) => request.status === "OPEN").length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Awaiting resolution</p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {requests.filter((request) => request.status === "IN_PROGRESS").length}
                    </p>
                  </div>
                </div>
              </div>
              {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
            </div>
          ) : (
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
              <div className="space-y-3">
                <label className="mb-2 block text-sm font-semibold text-neutral-400">Attachments</label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white">
                  <Paperclip className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Add screenshot or media"}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={async (event) => {
                      const urls = await uploadFiles(event.target.files).catch((err) => {
                        console.error(err);
                        setError("Attachment upload failed.");
                        return [];
                      });
                      if (urls.length) setAttachments((current) => [...current, ...urls]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {attachments.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {attachments.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Attachment" className="h-32 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
              {success ? <p className="text-sm font-semibold text-emerald-400">{success}</p> : null}
              <button
                type="submit"
                disabled={!canSubmit || submitting || uploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Creating..." : "Create support request"}
              </button>
            </form>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#12121a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{isStaff ? "Support queue" : "Your requests"}</h2>
              <p className="text-sm text-neutral-400">
                {isStaff ? "Incoming ticket list across workspaces." : "Track replies from the support team and continue the thread."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadRequests()}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
            >
              <RefreshCcw className="mr-2 inline h-4 w-4" />
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
                When the first ticket is opened, the full conversation will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {requests.map((request) => (
                <article key={request.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{request.subject}</h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                        {new Date(request.createdAt).toLocaleString("tr-TR")}
                      </p>
                      {isStaff ? (
                        <p className="mt-2 text-xs text-neutral-400">
                          {(request.user?.name || request.user?.email || "Unknown user")}
                          {request.workspace?.name ? ` • ${request.workspace.name}` : ""}
                        </p>
                      ) : null}
                    </div>
                    {isStaff ? (
                      <select
                        value={request.status}
                        onChange={(event) => void handleStatusChange(request.id, event.target.value)}
                        className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                        {request.status}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <MessageBubble
                      tone="user"
                      title="Original request"
                      meta={new Date(request.createdAt).toLocaleString("tr-TR")}
                      body={request.message}
                      attachmentUrls={request.attachmentUrls}
                    />

                    {request.replies.map((reply) => (
                      <MessageBubble
                        key={reply.id}
                        tone={reply.authorType === "STAFF" ? "staff" : "user"}
                        title={
                          reply.authorType === "STAFF"
                            ? reply.source === "MAILBOX"
                              ? "Support reply"
                              : "Portal reply"
                            : "Customer reply"
                        }
                        meta={new Date(reply.createdAt).toLocaleString("tr-TR")}
                        body={reply.body}
                        attachmentUrls={reply.attachmentUrls}
                      />
                    ))}
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
                    <textarea
                      className={`${inputCls} min-h-28 resize-none`}
                      value={replyDrafts[request.id] ?? ""}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({ ...current, [request.id]: event.target.value }))
                      }
                      placeholder={isStaff ? "Write a reply to the customer..." : "Add more details or reply to support..."}
                    />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white">
                        <Paperclip className="h-4 w-4" />
                        Attach
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={async (event) => {
                            const urls = await uploadFiles(event.target.files).catch((err) => {
                              console.error(err);
                              setError("Attachment upload failed.");
                              return [];
                            });
                            if (urls.length) {
                              setReplyAttachments((current) => ({
                                ...current,
                                [request.id]: [...(current[request.id] ?? []), ...urls],
                              }));
                            }
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={(replyDrafts[request.id]?.trim().length ?? 0) < 2 || busyRequestId === request.id || uploading}
                        onClick={() => void handleReplySubmit(request.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyRequestId === request.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Reply
                      </button>
                    </div>
                    {(replyAttachments[request.id] ?? []).length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {(replyAttachments[request.id] ?? []).map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Reply attachment" className="h-28 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
