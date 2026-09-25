"use client";

import { createContext, useContext } from "react";

type AppContextValue = {
  advisorName: string;
  isAdmin: boolean;
  // Chats en "esperando asesor": se muestra como badge en la navegacion.
  waitingCount: number;
};

const AppContext = createContext<AppContextValue>({ advisorName: "Asesor", isAdmin: false, waitingCount: 0 });

export function AppProvider({ value, children }: { value: AppContextValue; children: React.ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
