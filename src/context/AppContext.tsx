"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  BillingCycle,
  PendingPlanChange,
  PlanId,
  SubscriptionRecord,
  buildSubscriptionRecord,
  getNextMonthStart,
} from "@/lib/subscription";

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
  sessionId: string;
  signedInAt: string;
}

interface AppSession {
  activeClientId: string;
  clients: Client[];
  connectedAccounts: Record<string, string[]>;
  isLoggedIn: boolean;
  pendingChange: PendingPlanChange | null;
  subscription: SubscriptionRecord | null;
  userProfile: UserProfile | null;
  userType: UserType;
}

interface StartPlanResult {
  effectiveAt: string;
  phase: "free" | "trial" | "paid";
  scheduled: boolean;
}

interface AppContextType {
  isHydrated: boolean;
  userType: UserType;
  setUserType: (type: UserType) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  pendingChange: PendingPlanChange | null;
  subscription: SubscriptionRecord | null;
  userProfile: UserProfile | null;
  login: (input: { email: string; fullName: string; userType: UserType }) => void;
  logout: () => Promise<void>;
  startPlan: (input: {
    activationMode?: ActivationMode;
    billingCycle: BillingCycle;
    companyName?: string;
    email: string;
    fullName: string;
    phone?: string;
    plan: UserType;
  }) => StartPlanResult;
  updateUserProfile: (updates: { fullName?: string; companyName?: string; phone?: string; email?: string }) => void;
  activeClient: Client;
  setActiveClient: (client: Client) => void;
  clients: Client[];
  addClient: (name: string) => void;
  removeClient: (clientId: string) => void;
  renameClient: (clientId: string, name: string) => void;
  connectedAccounts: Record<string, string[]>;
  toggleAccount: (clientId: string, platformId: string) => void;
}

// Sentinel: used as fallback when no client workspaces exist
const defaultClient: Client = { id: "", name: "" };

const defaultSession: AppSession = {
  activeClientId: "",
  clients: [],
  connectedAccounts: {},
  isLoggedIn: false,
  pendingChange: null,
  subscription: null,
  userProfile: null,
  userType: "free",
};

function resolveSessionDates(session: AppSession): AppSession {
  if (!session.pendingChange) return session;

  const effectiveAt = new Date(session.pendingChange.effectiveAt);
  if (effectiveAt.getTime() > Date.now()) return session;

  return {
    ...session,
    pendingChange: null,
    subscription: buildSubscriptionRecord({
      billingCycle: session.pendingChange.billingCycle,
      hasUsedTrial: true,
      phase: "paid",
      plan: session.pendingChange.plan,
      startedAt: effectiveAt,
    }),
    userType: session.pendingChange.plan,
  };
}

const defaultContextValue: AppContextType = {
  isHydrated: false,
  userType: "free",
  setUserType: () => {},
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  pendingChange: null,
  subscription: null,
  userProfile: null,
  login: () => {},
  logout: async () => {},
  startPlan: () => ({ effectiveAt: "", phase: "paid", scheduled: false }),
  updateUserProfile: () => {},
  activeClient: defaultClient,
  setActiveClient: () => {},
  clients: [],
  addClient: () => {},
  removeClient: () => {},
  renameClient: () => {},
  connectedAccounts: {},
  toggleAccount: () => {},
};

// Context never undefined — default value provided
const AppContext = createContext<AppContextType>(defaultContextValue);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession>(defaultSession);
  const [isHydrated, setIsHydrated] = useState(false);
  const uidRef = useRef<string | null>(null);
  const { data: authSession, status } = useSession();

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

    fetch(`/api/users/${uid}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json() as AppSession;
        const resolved = resolveSessionDates({
          activeClientId: data.activeClientId ?? "",
          clients: data.clients ?? [],
          connectedAccounts: data.connectedAccounts ?? {},
          isLoggedIn: true,
          pendingChange: data.pendingChange ?? null,
          subscription: data.subscription ?? null,
          userProfile: data.userProfile ?? null,
          userType: data.userType ?? "free",
        });
        setSession(resolved);

        if (data.pendingChange && !resolved.pendingChange) {
          fetch(`/api/users/${uid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pendingChange: null, subscription: resolved.subscription, userType: resolved.userType }),
          }).catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setIsHydrated(true));
  }, [status, authSession?.user?.id]);

  const persist = (updates: Partial<AppSession>) => {
    const uid = uidRef.current;
    if (!uid) return;
    fetch(`/api/users/${uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const buildUserProfile = (
    input: { email: string; fullName: string; companyName?: string; phone?: string },
    existingProfile: UserProfile | null
  ): UserProfile => ({
    companyName: input.companyName ?? existingProfile?.companyName ?? "",
    email: input.email,
    fullName: input.fullName,
    phone: input.phone ?? existingProfile?.phone ?? "",
    sessionId:
      existingProfile?.sessionId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`),
    signedInAt: existingProfile?.signedInAt ?? new Date().toISOString(),
  });

  const setUserType = (type: UserType) => {
    setSession((prev) => ({ ...prev, userType: type }));
    persist({ userType: type });
  };

  const setIsLoggedIn = (status: boolean) => {
    if (!status) {
      logout();
      return;
    }
    setSession((prev) => ({ ...prev, isLoggedIn: true }));
  };

  const login = ({ email, fullName, userType }: { email: string; fullName: string; userType: UserType }) => {
    const userProfile = buildUserProfile({ email, fullName }, session.userProfile);
    setSession((prev) => ({ ...prev, isLoggedIn: true, userProfile, userType }));
    persist({ isLoggedIn: true, userProfile, userType });
  };

  const logout = async () => {
    await signOut({ redirect: false });
    uidRef.current = null;
    setSession(defaultSession);
  };

  const updateUserProfile = (updates: { fullName?: string; companyName?: string; phone?: string; email?: string }) => {
    if (!session.userProfile) return;
    const userProfile = { ...session.userProfile, ...updates };
    setSession((prev) => ({ ...prev, userProfile }));
    persist({ userProfile });
  };

  const startPlan = ({
    activationMode = "auto",
    billingCycle,
    companyName = "",
    email,
    fullName,
    phone = "",
    plan,
  }: {
    activationMode?: ActivationMode;
    billingCycle: BillingCycle;
    companyName?: string;
    email: string;
    fullName: string;
    phone?: string;
    plan: UserType;
  }): StartPlanResult => {
    const now = new Date();
    const currentSubscription = session.subscription;
    const hasUsedTrial = currentSubscription?.hasUsedTrial ?? false;
    const isActivePaidSubscription =
      currentSubscription?.phase === "paid" &&
      (!!currentSubscription.expiresAt && new Date(currentSubscription.expiresAt).getTime() > now.getTime());

    if (
      isActivePaidSubscription &&
      currentSubscription &&
      (currentSubscription.plan !== plan || currentSubscription.billingCycle !== billingCycle)
    ) {
      const effectiveAt = getNextMonthStart(now).toISOString();
      const pendingChange: PendingPlanChange = { billingCycle, effectiveAt, plan };
      const userProfile = buildUserProfile({ email, fullName, companyName, phone }, session.userProfile);
      setSession((prev) => ({ ...prev, isLoggedIn: true, pendingChange, userProfile }));
      persist({ isLoggedIn: true, pendingChange, userProfile });
      return { effectiveAt, phase: "paid", scheduled: true };
    }

    const phase: SubscriptionRecord["phase"] =
      plan === "free"
        ? "free"
        : activationMode === "trial"
          ? "trial"
          : activationMode === "paid"
            ? "paid"
            : hasUsedTrial
              ? "paid"
              : "trial";

    const subscription: SubscriptionRecord =
      phase === "trial"
        ? {
            billingCycle,
            currentPeriodEnd: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            currentPeriodStart: now.toISOString(),
            expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            hasUsedTrial: true,
            phase,
            plan,
            startedAt: now.toISOString(),
          }
        : buildSubscriptionRecord({
            billingCycle,
            hasUsedTrial: phase !== "free",
            phase,
            plan,
            startedAt: now,
          });

    const userProfile = buildUserProfile({ email, fullName, companyName, phone }, session.userProfile);

    const nextSession: AppSession = {
      ...session,
      isLoggedIn: true,
      pendingChange: null,
      subscription,
      userProfile,
      userType: plan,
    };

    setSession(nextSession);

    const uid = uidRef.current;
    if (uid) {
      fetch(`/api/users/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeClientId: nextSession.activeClientId,
          clients: nextSession.clients,
          connectedAccounts: nextSession.connectedAccounts,
          pendingChange: null,
          subscription,
          userProfile,
          userType: plan,
        }),
      }).catch(console.error);
    }

    return { effectiveAt: now.toISOString(), phase, scheduled: false };
  };

  const toggleAccount = (clientId: string, platformId: string) => {
    const current = session.connectedAccounts[clientId] || [];
    const next = current.includes(platformId)
      ? current.filter((id) => id !== platformId)
      : [...current, platformId];
    const connectedAccounts = { ...session.connectedAccounts, [clientId]: next };
    setSession((prev) => ({ ...prev, connectedAccounts }));
    persist({ connectedAccounts });
  };

  const addClient = (name: string) => {
    const newClient: Client = { id: Date.now().toString(), name };
    const clients = [...session.clients, newClient];
    const connectedAccounts = { ...session.connectedAccounts, [newClient.id]: [] };
    setSession((prev) => ({ ...prev, activeClientId: newClient.id, clients, connectedAccounts }));
    persist({ activeClientId: newClient.id, clients, connectedAccounts });
  };

  const renameClient = (clientId: string, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const clients = session.clients.map((c) => c.id === clientId ? { ...c, name: trimmedName } : c);
    setSession((prev) => ({ ...prev, clients }));
    persist({ clients });
  };

  const removeClient = (clientId: string) => {
    if (session.clients.length === 1) return;
    const clients = session.clients.filter((c) => c.id !== clientId);
    if (clients.length === session.clients.length) return;
    const connectedAccounts = { ...session.connectedAccounts };
    delete connectedAccounts[clientId];
    const activeClientId =
      session.activeClientId === clientId ? clients[0].id : session.activeClientId;
    setSession((prev) => ({ ...prev, activeClientId, clients, connectedAccounts }));
    persist({ activeClientId, clients, connectedAccounts });
  };

  const setActiveClient = (client: Client) => {
    setSession((prev) => ({ ...prev, activeClientId: client.id }));
    persist({ activeClientId: client.id });
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
        setUserType,
        isLoggedIn: session.isLoggedIn,
        setIsLoggedIn,
        pendingChange: session.pendingChange,
        subscription: session.subscription,
        userProfile: session.userProfile,
        login,
        logout,
        startPlan,
        updateUserProfile,
        activeClient,
        setActiveClient,
        clients: session.clients,
        addClient,
        removeClient,
        renameClient,
        connectedAccounts: session.connectedAccounts,
        toggleAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  return useContext(AppContext);
}
