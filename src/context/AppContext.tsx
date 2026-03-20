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
  activeClient: Client;
  setActiveClient: (client: Client) => void;
  clients: Client[];
  addClient: (name: string) => void;
  connectedAccounts: Record<string, string[]>;
  toggleAccount: (clientId: string, platformId: string) => void;
}

const defaultClient = { id: "default_user", name: "My Personal Account" };

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userType, setUserType] = useState<UserType>("basic");
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
    setUserType("agency"); 
  };

  return (
    <AppContext.Provider value={{ userType, setUserType, activeClient, setActiveClient, clients, addClient, connectedAccounts, toggleAccount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
