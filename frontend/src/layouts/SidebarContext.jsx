import { useEffect, useState } from 'react';
import { SidebarCtx } from './sidebar-context';

export function SidebarProvider({ children }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [collapsed, setCollapsed] = useState(isMobile);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <SidebarCtx.Provider
      value={{ collapsed, setCollapsed, isMobile, toggle: () => setCollapsed((c) => !c) }}
    >
      {children}
    </SidebarCtx.Provider>
  );
}
