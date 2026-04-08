"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Shield, AlertTriangle } from "lucide-react";

type SuperadminUser = {
  id: string;
  email: string | null;
  plan: string;
  subscription: {
    billingCycle: string;
    currentPeriodEnd?: string | null;
    currentPeriodStart?: string | null;
    expiresAt?: string | null;
    phase: string;
  } | null;
  superadminNote: string | null;
  workspaceCount: number;
  supportRequests: Array<{ id: string; status: string; subject: string; createdAt: string }>;
  workspaces: Array<{
    id: string;
    name: string;
    status: string;
    role: string;
    memberCount: number;
    publishFailures: number;
    socialAccounts: Array<{
      id: string;
      platform: string;
      status: string;
      displayName: string;
      connectedAt: string;
      tokenExpiresAt: string | null;
      hasAccessToken: boolean;
      hasRefreshToken: boolean;
    }>;
  }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const planOptions = ["free", "basic", "pro", "agency", "agency_plus"];
const workspaceStatusOptions = ["ACTIVE", "PAUSED", "ARCHIVED"];
const socialStatusOptions = ["CONNECTED", "DISCONNECTED", "EXPIRED", "ERROR"];

export default function SuperadminDashboard() {
  const [users, setUsers] = useState<SuperadminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/superadmin/overview");
      if (!response.ok) {
        throw new Error("Superadmin data could not be loaded.");
      }
      const data = await response.json() as { users: SuperadminUser[] };
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (key: string, payload: Record<string, unknown>) => {
    setSavingKey(key);
    try {
      const response = await fetch("/api/superadmin/overview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Update failed");
      }
      await load();
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Founder Access</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">Superadmin Overview</h1>
          <p className="text-neutral-400 text-lg font-medium">Customer plans, token health, workspace status, and safe controls in one place.</p>
        </div>
        <button onClick={() => load()} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors font-semibold">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <p className="text-neutral-500 uppercase tracking-widest text-xs font-bold mb-2">Customers</p>
          <p className="text-4xl font-extrabold text-white">{users.length}</p>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <p className="text-neutral-500 uppercase tracking-widest text-xs font-bold mb-2">Open Support</p>
          <p className="text-4xl font-extrabold text-white">
            {users.reduce((sum, user) => sum + user.supportRequests.filter((request) => request.status === "OPEN").length, 0)}
          </p>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <p className="text-neutral-500 uppercase tracking-widest text-xs font-bold mb-2">Problematic Connections</p>
          <p className="text-4xl font-extrabold text-white">
            {users.reduce((sum, user) => sum + user.workspaces.reduce((acc, workspace) => acc + workspace.socialAccounts.filter((account) => account.status !== "CONNECTED").length, 0), 0)}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {users.map((user) => (
          <section key={user.id} className="glass rounded-[2rem] border border-white/10 p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white text-xl font-bold">{user.email ?? user.id}</h2>
                  <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase">{user.plan}</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-bold uppercase">{user.subscription?.phase ?? "no subscription"}</span>
                </div>
                <p className="text-sm text-neutral-400">Period: {formatDate(user.subscription?.currentPeriodStart)} - {formatDate(user.subscription?.currentPeriodEnd)}</p>
                <p className="text-sm text-neutral-500">Workspace count: {user.workspaceCount}</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 md:items-end">
                <label className="text-sm text-neutral-400 font-semibold">
                  Plan
                  <select
                    defaultValue={user.plan}
                    onChange={(e) => patch(`user-plan-${user.id}`, { type: "user", userId: user.id, userType: e.target.value })}
                    disabled={savingKey === `user-plan-${user.id}`}
                    className="mt-2 block min-w-40 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    {planOptions.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                  </select>
                </label>
                <label className="text-sm text-neutral-400 font-semibold min-w-72">
                  Founder Note
                  <textarea
                    defaultValue={user.superadminNote ?? ""}
                    onBlur={(e) => patch(`user-note-${user.id}`, { type: "user", userId: user.id, superadminNote: e.target.value.trim() || null })}
                    disabled={savingKey === `user-note-${user.id}`}
                    className="mt-2 block w-full min-h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white resize-none"
                    placeholder="Private note about this customer"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {user.workspaces.map((workspace) => (
                <div key={workspace.id} className="rounded-3xl border border-white/8 bg-black/20 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">{workspace.name}</h3>
                      <p className="text-neutral-500 text-sm">{workspace.memberCount} members • {workspace.publishFailures} recent publish issues</p>
                    </div>
                    <select
                      defaultValue={workspace.status}
                      onChange={(e) => patch(`workspace-${workspace.id}`, { type: "workspace", workspaceId: workspace.id, status: e.target.value })}
                      disabled={savingKey === `workspace-${workspace.id}`}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                    >
                      {workspaceStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {workspace.socialAccounts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-neutral-500">No social connections on this workspace yet.</div>
                    ) : workspace.socialAccounts.map((account) => (
                      <div key={account.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white font-semibold">{account.displayName}</p>
                              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300">{account.platform}</span>
                              {account.status !== "CONNECTED" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                  <AlertTriangle className="w-3 h-3" /> {account.status}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-neutral-500">Connected: {formatDate(account.connectedAt)} • Expires: {formatDate(account.tokenExpiresAt)}</p>
                            <p className="text-xs text-neutral-500">
                              Token health: access {account.hasAccessToken ? "stored" : "missing"} • refresh {account.hasRefreshToken ? "stored" : "missing"}
                            </p>
                          </div>
                          <select
                            defaultValue={account.status}
                            onChange={(e) => patch(`social-${account.id}`, { type: "socialAccount", socialAccountId: account.id, status: e.target.value })}
                            disabled={savingKey === `social-${account.id}`}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                          >
                            {socialStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {user.supportRequests.length > 0 ? (
              <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-violet-400" />
                  <h3 className="text-white font-bold">Recent Support Requests</h3>
                </div>
                <div className="space-y-3">
                  {user.supportRequests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-white font-semibold">{request.subject}</p>
                      <p className="text-xs text-neutral-500">{request.status} • {formatDate(request.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
