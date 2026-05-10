import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { SidebarProvider } from './SidebarContext';
import { useSidebar } from './sidebar-context';
import { cn } from '../lib/cn';

function Shell() {
  const { collapsed } = useSidebar();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-ink-900 text-ink-50 relative">
      {/* Decorative ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/3 h-[480px] w-[480px] rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-[420px] w-[420px] rounded-full bg-vital-600/10 blur-3xl" />
      </div>

      <Sidebar />

      <div
        className={cn(
          'min-h-screen transition-[padding] duration-300',
          collapsed ? 'pl-[72px]' : 'pl-[240px]'
        )}
      >
        <TopBar />
        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <Shell />
    </SidebarProvider>
  );
}
