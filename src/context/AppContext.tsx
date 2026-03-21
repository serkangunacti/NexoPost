"use client";
import React, { createContext, useContext, useState } from "react";

type UserType = "basic" | "pro" | "agency";

interface Client {
  id: string;
  name: string;
}

interface AppContextType {
  userType: UserType;
  setUserType: (type: UserType) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  activeClient: Client;
  setActiveClient: (client: Client) => void;
  clients: Client[];
  addClient: (name: string) => void;
  connectedAccounts: Record<string, string[]>;
  toggleAccount: (clientId: string, platformId: string) => void;
}

const defaultClient = { id: "default_user", name: "My Personal Account" };

const defaultContextValue: AppContextType = {
  userType: "basic",
  setUserType: () => {},
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  activeClient: defaultClient,
  setActiveClient: () => {},
  clients: [defaultClient],
  addClient: () => {},
  connectedAccounts: { "default_user": ["twitter", "facebook"] },
  toggleAccount: () => {},
};

const AppContext = createContext<AppContextType>(defaultContextValue);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userType, setUserType] = useState<UserType>("basic");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([defaultClient]);
  const [activeClient, setActiveClient] = useState<Client>(defaultClient);
  
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, string[]>>({
    "default_user": ["twitter", "facebook"]
  });

  const toggleAccount = (clientId: string, platformId: string) => {
    setConnectedAccounts(prev => {
      const current = prev[clientId] || [];
      if (current.includes(platformId)) {
        return { ...prev, [clientId]: current.filter(id => id !== platformId) };
      } else {
        return { ...prev, [clientId]: [...current, platformId] };
      }
    });
  };

  const addClient = (name: string) => {
    const newClient = { id: Date.now().toString(), name };
    setClients([...clients, newClient]);
    setActiveClient(newClient);
  };

  return (
    <AppContext.Provider value={{ userType, setUserType, isLoggedIn, setIsLoggedIn, activeClient, setActiveClient, clients, addClient, connectedAccounts, toggleAccount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
