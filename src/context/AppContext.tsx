"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import type { BillingCycle, PendingPlanChange, PlanId, SubscriptionRecord } from "@/lib/subscription";

type UserType = PlanId;
type ActivationMode = "auto" | "trial" | "paid";

interface Client {
  id: string;
  name: string;
}

interface UserProfile {
  companyName: string;
  email: string;
  fullName: string;
  phone: string;
}

// Mirrors the payload of GET /api/users/[id] (lib/workspaces buildAppSession).
interface AppSession {
  activeClientId: string;
  clients: Client[];
  connectedAccounts: Record<string, string[]>;
  isStaff: boolean;
  isSuperadmin: boolean;
  isLoggedIn: boolean;
  pendingChange: PendingPlanChange | null;
  subscription: SubscriptionRecord | null;
  userProfile: UserProfile | null;
  userType: UserType;
}

export interface StartPlanResult {
  effectiveAt: string;
  phase: "free" | "trial" | "paid";
  scheduled: boolean;
}

type ActionResult = { ok: true } | { ok: false; error: string };

interface AppContextType {
  isHydrated: boolean;
  userType: UserType;
  isLoggedIn: boolean;
  pendingChange: PendingPlanChange | null;
  subscription: SubscriptionRecord | null;
  userProfile: UserProfile | null;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  startPlan: (input: {
    activationMode?: ActivationMode;
    billingCycle: BillingCycle;
    discountCode?: string | null;
    plan: UserType;
  }) => Promise<StartPlanResult>;
  updateUserProfile: (updates: { fullName?: string; companyName?: string; phone?: string }) => Promise<ActionResult>;
  activeClient: Client;
  setActiveClient: (client: Client) => void;
  clients: Client[];
  addClient: (name: string) => Promise<ActionResult>;
  removeClient: (clientId: string) => Promise<ActionResult>;
  renameClient: (clientId: string, name: string) => Promise<ActionResult>;
  connectedAccounts: Record<string, string[]>;
  isStaff: boolean;
  isSuperadmin: boolean;
}

// Sentinel: used as fallback when no client workspaces exist
const defaultClient: Client = { id: "", name: "" };

const defaultSession: AppSession = {
  activeClientId: "",
  clients: [],
  connectedAccounts: {},
  isStaff: false,
  isSuperadmin: false,
  isLoggedIn: false,
  pendingChange: null,
  subscription: null,
  userProfile: null,
  userType: "free",
};

const notSignedIn: ActionResult = { ok: false, error: "You need to sign in first." };

const defaultContextValue: AppContextType = {
  isHydrated: false,
  userType: "free",
  isLoggedIn: false,
  pendingChange: null,
  subscription: null,
  userProfile: null,
  logout: async () => {},
  refreshSession: async () => {},
  startPlan: async () => {
    throw new Error(notSignedIn.error);
  },
  updateUserProfile: async () => notSignedIn,
  activeClient: defaultClient,
  setActiveClient: () => {},
  clients: [],
  addClient: async () => notSignedIn,
  removeClient: async () => notSignedIn,
  renameClient: async () => notSignedIn,
  connectedAccounts: {},
  isStaff: false,
  isSuperadmin: false,
};

// Context never undefined — default value provided
const AppContext = createContext<AppContextType>(defaultContextValue);

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({})) as { error?: string };
  return payload.error ?? fallback;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession>(defaultSession);
  const [isHydrated, setIsHydrated] = useState(false);
  const uidRef = useRef<string | null>(null);
  const { data: authSession, status } = useSession();

  const applySession = useCallback((data: Omit<AppSession, "isLoggedIn">) => {
    setSession({ ...data, isLoggedIn: true });
  }, []);

  const refreshSession = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid) return;

    const res = await fetch(`/api/users/${uid}`, { cache: "no-store" });
    if (res.ok) {
      applySession(await res.json());
    }
  }, [applySession]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      uidRef.current = null;
      queueMicrotask(() => {
        setSession(defaultSession);
        setIsHydrated(true);
      });
      return;
    }

    const uid = authSession?.user?.id;
    if (!uid) {
      queueMicrotask(() => setIsHydrated(true));
      return;
    }
    uidRef.current = uid;

    refreshSession()
      .catch(console.error)
      .finally(() => setIsHydrated(true));
  }, [status, authSession?.user?.id, refreshSession]);

  const updateUser = async (body: Record<string, unknown>): Promise<ActionResult> => {
    const uid = uidRef.current;
    if (!uid) return notSignedIn;

    const res = await fetch(`/api/users/${uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false, error: await readError(res, "Could not save your changes.") };
    }

    applySession(await res.json());
    return { ok: true };
  };

  const logout = async () => {
    await signOut({ redirect: false });
    uidRef.current = null;
    setSession(defaultSession);
  };

  const updateUserProfile = (updates: { fullName?: string; companyName?: string; phone?: string }) =>
    updateUser(updates);

  const startPlan: AppContextType["startPlan"] = async (input) => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(await readError(res, "Plan could not be activated."));
    }

    const result = await res.json() as StartPlanResult;
    await refreshSession();
    return result;
  };

  const addClient = async (name: string): Promise<ActionResult> => {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      return { ok: false, error: await readError(res, "Workspace could not be created.") };
    }

    await refreshSession();
    return { ok: true };
  };

  const renameClient = async (clientId: string, name: string): Promise<ActionResult> => {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      return { ok: false, error: await readError(res, "Workspace could not be renamed.") };
    }

    await refreshSession();
    return { ok: true };
  };

  const removeClient = async (clientId: string): Promise<ActionResult> => {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(clientId)}`, { method: "DELETE" });

    if (!res.ok) {
      return { ok: false, error: await readError(res, "Workspace could not be deleted.") };
    }

    await refreshSession();
    return { ok: true };
  };

  const setActiveClient = (client: Client) => {
    setSession((prev) => ({ ...prev, activeClientId: client.id }));
    updateUser({ activeClientId: client.id }).catch(console.error);
  };

  const activeClient =
    session.clients.find((c) => c.id === session.activeClientId) ??
    session.clients[0] ??
    defaultClient;

  return (
    <AppContext.Provider
      value={{
        isHydrated,
        userType: session.userType,
        isLoggedIn: session.isLoggedIn,
        pendingChange: session.pendingChange,
        subscription: session.subscription,
        userProfile: session.userProfile,
        logout,
        refreshSession,
        startPlan,
        updateUserProfile,
        activeClient,
        setActiveClient,
        clients: session.clients,
        addClient,
        removeClient,
        renameClient,
        connectedAccounts: session.connectedAccounts,
        isStaff: session.isStaff,
        isSuperadmin: session.isSuperadmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  return useContext(AppContext);
}
