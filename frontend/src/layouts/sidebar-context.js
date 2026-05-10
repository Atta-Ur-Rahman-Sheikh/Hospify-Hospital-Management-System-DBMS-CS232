import { createContext, useContext } from 'react';

export const SidebarCtx = createContext(null);

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error('useSidebar must be used within <SidebarProvider>');
  return ctx;
}
