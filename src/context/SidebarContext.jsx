import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext({ openSidebar: () => {} });

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ sidebarOpen: open, openSidebar: () => setOpen(true), closeSidebar: () => setOpen(false) }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
