"use client";
import React, { createContext, useContext, useSyncExternalStore } from "react";
import {
  PendingPlanChange,
  SubscriptionRecord,
  addPaidDuration,
  getNextMonthStart,
} from "@/lib/subscription";

type UserType = "basic" | "pro" | "agency";
type BillingCycle = "monthly" | "annual";

interface Client {
  id: string;
  name: string;
}

interface UserProfile {
  email: string;
  fullName: string;
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
  phase: "trial" | "paid";
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
  logout: () => void;
  startPlan: (input: {
    billingCycle: BillingCycle;
    email: string;
    fullName: string;
    plan: UserType;
  }) => StartPlanResult;
  activeClient: Client;
  setActiveClient: (client: Client) => void;
  clients: Client[];
  addClient: (name: string) => void;
  connectedAccounts: Record<string, string[]>;
  toggleAccount: (clientId: string, platformId: string) => void;
}

const defaultClient: Client = { id: "default_user", name: "My Personal Account" };
const APP_SESSION_STORAGE_KEY = "nexopost-app-session";

const defaultSession: AppSession = {
  activeClientId: defaultClient.id,
  clients: [defaultClient],
  connectedAccounts: { "default_user": ["twitter", "facebook"] },
  isLoggedIn: false,
  pendingChange: null,
  subscription: null,
  userProfile: null,
  userType: "basic",
};

let currentSessionSnapshot: AppSession = defaultSession;
const sessionListeners = new Set<() => void>();

function getIsClientSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function subscribeHydration() {
  return () => {};
}

function readStoredSession(): AppSession {
  if (typeof window === "undefined") {
    return defaultSession;
  }

  try {
    const raw = window.localStorage.getItem(APP_SESSION_STORAGE_KEY);
    if (!raw) return defaultSession;

    const parsed = JSON.parse(raw) as Partial<AppSession>;
    const clients = parsed.clients?.length ? parsed.clients : defaultSession.clients;
    const activeClientId = clients.some((client) => client.id === parsed.activeClientId)
      ? parsed.activeClientId!
      : clients[0].id;

    return {
      activeClientId,
      clients,
      connectedAccounts: parsed.connectedAccounts ?? defaultSession.connectedAccounts,
      isLoggedIn: parsed.isLoggedIn ?? false,
      pendingChange: parsed.pendingChange ?? null,
      subscription: parsed.subscription ?? null,
      userProfile: parsed.userProfile ?? null,
      userType: parsed.userType ?? "basic",
    };
  } catch {
    return defaultSession;
  }
}

function resolveSessionDates(session: AppSession): AppSession {
  if (!session.pendingChange) {
    return session;
  }

  const effectiveAt = new Date(session.pendingChange.effectiveAt);
  if (effectiveAt.getTime() > Date.now()) {
    return session;
  }

  const expiresAt = addPaidDuration(effectiveAt, session.pendingChange.billingCycle);

  return {
    ...session,
    pendingChange: null,
    subscription: {
      billingCycle: session.pendingChange.billingCycle,
      expiresAt: expiresAt.toISOString(),
      hasUsedTrial: true,
      phase: "paid",
      plan: session.pendingChange.plan,
      startedAt: effectiveAt.toISOString(),
    },
    userType: session.pendingChange.plan,
  };
}

function getClientSessionSnapshot() {
  currentSessionSnapshot = resolveSessionDates(readStoredSession());
  return currentSessionSnapshot;
}

function getServerSessionSnapshot() {
  return defaultSession;
}

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      sessionListeners.delete(listener);
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === APP_SESSION_STORAGE_KEY) {
      currentSessionSnapshot = resolveSessionDates(readStoredSession());
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeSession(nextSession: AppSession) {
  currentSessionSnapshot = nextSession;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
  }

  sessionListeners.forEach((listener) => listener());
}

const defaultContextValue: AppContextType = {
  isHydrated: false,
  userType: "basic",
  setUserType: () => {},
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  pendingChange: null,
  subscription: null,
  userProfile: null,
  login: () => {},
  logout: () => {},
  startPlan: () => ({ effectiveAt: "", phase: "paid", scheduled: false }),
  activeClient: defaultClient,
  setActiveClient: () => {},
  clients: [defaultClient],
  addClient: () => {},
  connectedAccounts: { "default_user": ["twitter", "facebook"] },
  toggleAccount: () => {},
};

// Context never undefined — default value provided
const AppContext = createContext<AppContextType>(defaultContextValue);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(
    subscribeSession,
    getClientSessionSnapshot,
    getServerSessionSnapshot
  );
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getIsClientSnapshot,
    getServerHydrationSnapshot
  );
  const activeClient =
    session.clients.find((client) => client.id === session.activeClientId) ??
    session.clients[0] ??
    defaultClient;

  const setUserType = (type: UserType) => {
    writeSession({
      ...session,
      userType: type,
    });
  };

  const setIsLoggedIn = (status: boolean) => {
    if (!status) {
      writeSession(defaultSession);
      return;
    }

    writeSession({
      ...session,
      isLoggedIn: true,
    });
  };

  const buildUserProfile = (input: { email: string; fullName: string }, existingProfile: UserProfile | null): UserProfile => ({
    email: input.email,
    fullName: input.fullName,
    sessionId:
      existingProfile?.sessionId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`),
    signedInAt: existingProfile?.signedInAt ?? new Date().toISOString(),
  });

  const login = ({ email, fullName, userType }: { email: string; fullName: string; userType: UserType }) => {
    writeSession({
      ...session,
      isLoggedIn: true,
      userProfile: buildUserProfile({ email, fullName }, session.userProfile),
      userType,
    });
  };

  const startPlan = ({
    billingCycle,
    email,
    fullName,
    plan,
  }: {
    billingCycle: BillingCycle;
    email: string;
    fullName: string;
    plan: UserType;
  }): StartPlanResult => {
    const now = new Date();
    const currentSubscription = session.subscription;
    const hasUsedTrial = currentSubscription?.hasUsedTrial ?? false;
    const isActivePaidSubscription =
      currentSubscription?.phase === "paid" &&
      new Date(currentSubscription.expiresAt).getTime() > now.getTime();

    if (
      isActivePaidSubscription &&
      currentSubscription &&
      (currentSubscription.plan !== plan || currentSubscription.billingCycle !== billingCycle)
    ) {
      const effectiveAt = getNextMonthStart(now).toISOString();

      writeSession({
        ...session,
        isLoggedIn: true,
        pendingChange: {
          billingCycle,
          effectiveAt,
          plan,
        },
        userProfile: buildUserProfile({ email, fullName }, session.userProfile),
      });

      return {
        effectiveAt,
        phase: "paid",
        scheduled: true,
      };
    }

    const phase: SubscriptionRecord["phase"] = hasUsedTrial ? "paid" : "trial";
    const startAt = now;
    const expiresAt =
      phase === "trial"
        ? new Date(startAt.getTime() + 15 * 24 * 60 * 60 * 1000)
        : addPaidDuration(startAt, billingCycle);

    writeSession({
      ...session,
      activeClientId: session.activeClientId || defaultClient.id,
      clients: session.clients.length ? session.clients : [defaultClient],
      connectedAccounts:
        Object.keys(session.connectedAccounts).length > 0
          ? session.connectedAccounts
          : defaultSession.connectedAccounts,
      isLoggedIn: true,
      pendingChange: null,
      subscription: {
        billingCycle,
        expiresAt: expiresAt.toISOString(),
        hasUsedTrial: true,
        phase,
        plan,
        startedAt: startAt.toISOString(),
      },
      userProfile: buildUserProfile({ email, fullName }, session.userProfile),
      userType: plan,
    });

    return {
      effectiveAt: startAt.toISOString(),
      phase,
      scheduled: false,
    };
  };

  const logout = () => {
    writeSession(defaultSession);
  };

  const toggleAccount = (clientId: string, platformId: string) => {
    const current = session.connectedAccounts[clientId] || [];

    writeSession({
      ...session,
      connectedAccounts: {
        ...session.connectedAccounts,
        [clientId]: current.includes(platformId)
          ? current.filter((id) => id !== platformId)
          : [...current, platformId],
      },
    });
  };

  const addClient = (name: string) => {
    const newClient: Client = { id: Date.now().toString(), name };
    writeSession({
      ...session,
      activeClientId: newClient.id,
      clients: [...session.clients, newClient],
      connectedAccounts: {
        ...session.connectedAccounts,
        [newClient.id]: [],
      },
    });
  };

  const setActiveClient = (client: Client) => {
    writeSession({
      ...session,
      activeClientId: client.id,
    });
  };

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
        activeClient,
        setActiveClient,
        clients: session.clients,
        addClient,
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
