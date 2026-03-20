"use client";
import React, { createContext, useContext, useState } from "react";

type UserType = "individual" | "agency";

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
}

const defaultClient = { id: "default_user", name: "My Personal Account" };

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userType, setUserType] = useState<UserType>("individual");
  const [clients, setClients] = useState<Client[]>([defaultClient]);
  const [activeClient, setActiveClient] = useState<Client>(defaultClient);

  const addClient = (name: string) => {
    const newClient = { id: Date.now().toString(), name };
    setClients([...clients, newClient]);
    setActiveClient(newClient);
    setUserType("agency"); // Automatically switch to agency if they add clients
  };

  return (
    <AppContext.Provider value={{ userType, setUserType, activeClient, setActiveClient, clients, addClient }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
