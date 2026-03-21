"use client";
import React, { createContext, useContext, useSyncExternalStore } from "react";

type UserType = "basic" | "pro" | "agency";

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
  userProfile: UserProfile | null;
  userType: UserType;
}

interface AppContextType {
  isHydrated: boolean;
  userType: UserType;
  setUserType: (type: UserType) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  userProfile: UserProfile | null;
  login: (input: { email: string; fullName: string; userType: UserType }) => void;
  logout: () => void;
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
      userProfile: parsed.userProfile ?? null,
      userType: parsed.userType ?? "basic",
    };
  } catch {
    return defaultSession;
  }
}

function getClientSessionSnapshot() {
  currentSessionSnapshot = readStoredSession();
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
      currentSessionSnapshot = readStoredSession();
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
  userProfile: null,
  login: () => {},
  logout: () => {},
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

  const login = ({ email, fullName, userType }: { email: string; fullName: string; userType: UserType }) => {
    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;

    writeSession({
      activeClientId: defaultClient.id,
      clients: [defaultClient],
      connectedAccounts: defaultSession.connectedAccounts,
      isLoggedIn: true,
      userProfile: {
        email,
        fullName,
        sessionId,
        signedInAt: new Date().toISOString(),
      },
      userType,
    });
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
        userProfile: session.userProfile,
        login,
        logout,
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
