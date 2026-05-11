import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { SidebarProvider } from './SidebarContext';
import { useSidebar } from './sidebar-context';
import GridPattern from '../components/ui/GridPattern';
import { useAuth } from '../context/auth-context';
import { cn } from '../lib/cn';

const QUICK_NAV = {
  d: '/',
  p: '/patients',
  a: '/appointments',
  b: '/beds',
  m: '/admissions', // m = admissions
  l: '/lab',
  r: '/billing', // r = receipts
  o: '/doctors',
  h: '/pharmacy', // h = pharmacy
};

const NEW_PATIENT_ROLES = ['super_admin', 'receptionist'];

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    el.isContentEditable
  );
}

function Shell() {
  const { collapsed, isMobile } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Global keyboard shortcuts ──
  // - "g" then a single key navigates (g d → dashboard, g p → patients, etc.)
  // - "n" opens the New Patient slide-over (if allowed)
  useEffect(() => {
    let leader = null;
    let leaderTimer = null;

    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(document.activeElement)) return;

      // Resolve the "g + x" navigation prefix
      if (leader === 'g') {
        const key = e.key.toLowerCase();
        if (QUICK_NAV[key]) {
          e.preventDefault();
          navigate(QUICK_NAV[key]);
        }
        leader = null;
        clearTimeout(leaderTimer);
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        leader = 'g';
        clearTimeout(leaderTimer);
        leaderTimer = setTimeout(() => { leader = null; }, 1100);
        return;
      }

      if (e.key.toLowerCase() === 'n' && NEW_PATIENT_ROLES.includes(user?.role)) {
        e.preventDefault();
        navigate('/patients', { state: { openCreate: true } });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(leaderTimer);
    };
  }, [navigate, user?.role]);

  return (
    <div className="min-h-screen bg-ink-900 text-ink-50 relative">
      {/* Subtle ambient backdrop: fixed dotted grid + a single soft accent */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <GridPattern className="absolute inset-0 opacity-[0.55]" />
        <div className="absolute -top-40 left-1/3 h-[420px] w-[420px] rounded-full bg-brand-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-vital-600/[0.05] blur-[120px]" />
      </div>

      <Sidebar />

      <div
        className={cn(
          'min-h-screen transition-[padding] duration-300',
          isMobile ? 'pl-0' : (collapsed ? 'pl-[72px]' : 'pl-[248px]')
        )}
      >
        <TopBar />
        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
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
