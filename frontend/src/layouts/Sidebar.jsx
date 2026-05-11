import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  BedDouble,
  ClipboardPlus,
  Pill,
  FlaskConical,
  Receipt,
  ShieldCheck,
  Stethoscope,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import Avatar from '../components/ui/Avatar';
import { cn } from '../lib/cn';
import { useSidebar } from './sidebar-context';

const NAV = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['super_admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist', 'billing_staff'] },
    ],
  },
  {
    section: 'Clinical',
    items: [
      { name: 'Patients',     path: '/patients',     icon: Users,         roles: ['super_admin', 'doctor', 'nurse', 'receptionist'] },
      { name: 'Appointments', path: '/appointments', icon: CalendarClock, roles: ['super_admin', 'doctor', 'receptionist'] },
      { name: 'Admissions',   path: '/admissions',   icon: ClipboardPlus, roles: ['super_admin', 'doctor', 'nurse', 'receptionist'] },
      { name: 'Beds',         path: '/beds',         icon: BedDouble,     roles: ['super_admin', 'doctor', 'nurse'] },
      { name: 'Doctors',      path: '/doctors',      icon: Stethoscope,   roles: ['super_admin', 'doctor', 'nurse', 'receptionist'] },
    ],
  },
  {
    section: 'Operations',
    items: [
      { name: 'Pharmacy', path: '/pharmacy', icon: Pill,          roles: ['super_admin', 'pharmacist', 'doctor'] },
      { name: 'Lab',      path: '/lab',      icon: FlaskConical,  roles: ['super_admin', 'lab_technician', 'doctor'] },
      { name: 'Billing',  path: '/billing',  icon: Receipt,       roles: ['super_admin', 'billing_staff', 'receptionist'] },
    ],
  },
  {
    section: 'System',
    items: [
      { name: 'Admin', path: '/admin', icon: ShieldCheck, roles: ['super_admin'] },
    ],
  },
];

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  billing_staff: 'Billing Staff',
};

/** Custom medical-cross-with-EKG mark. More distinctive than a generic Activity icon. */
function HospifyMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hospify-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#hospify-mark)" />
      {/* white plus */}
      <path d="M14 8h4v6h6v4h-6v6h-4v-6H8v-4h6V8z" fill="white" fillOpacity="0.95" />
      {/* faint ekg arc */}
      <path
        d="M5 22 L11 22 L13 18 L15 26 L17 20 L20 22 L27 22"
        stroke="white"
        strokeOpacity="0.6"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ekg-line"
      />
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { collapsed, toggle, isMobile } = useSidebar();
  const showLabels = !collapsed;

  return (
    <motion.aside
      animate={{ width: isMobile ? (collapsed ? 0 : 248) : (collapsed ? 72 : 248) }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden',
        'bg-ink-950/95 backdrop-blur-xl border-r border-ink-500/30',
        isMobile && collapsed && 'border-r-0'
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-ink-500/30 shrink-0',
          collapsed && 'justify-center px-0'
        )}
      >
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <HospifyMark className="h-9 w-9 drop-shadow-[0_4px_12px_rgba(37,99,235,0.35)]" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-vital-500 ring-2 ring-ink-950 pulse-dot" />
          </div>
          <AnimatePresence initial={false}>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-[15px] font-bold text-white leading-none tracking-tight">
                  Hospify
                </p>
                <p className="text-[10px] text-ink-300 mt-1.5 uppercase tracking-[0.18em] font-medium">
                  Care OS
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV.map((group) => {
          const items = group.items.filter((it) => it.roles.includes(user?.role));
          if (!items.length) return null;
          return (
            <div key={group.section}>
              <AnimatePresence initial={false}>
                {showLabels && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-300/80"
                  >
                    {group.section}
                  </motion.div>
                )}
              </AnimatePresence>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium',
                          'transition-colors duration-150',
                          isActive
                            ? 'text-white bg-brand-500/10'
                            : 'text-ink-100 hover:bg-ink-800/80 hover:text-white',
                          collapsed && 'justify-center px-0'
                        )
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          {/* slim left accent — replaces full electric pill */}
                          <span
                            className={cn(
                              'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full transition-all',
                              isActive
                                ? 'bg-brand-500 opacity-100'
                                : 'bg-brand-500 opacity-0 group-hover:opacity-30',
                              collapsed && 'left-0'
                            )}
                          />
                          <item.icon
                            className={cn(
                              'h-[17px] w-[17px] shrink-0 transition-colors',
                              isActive ? 'text-brand-400' : 'text-ink-200 group-hover:text-ink-50'
                            )}
                            strokeWidth={isActive ? 2.2 : 1.8}
                          />
                          <AnimatePresence initial={false}>
                            {showLabels && (
                              <motion.span
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -4 }}
                                className="truncate"
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>



      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={toggle}
          className="mx-3 mb-2 h-8 rounded-md border border-ink-500/30 bg-ink-800/60 text-ink-200 hover:bg-ink-700 hover:text-white transition-colors flex items-center justify-center"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}

      {/* User card */}
      <div className={cn('border-t border-ink-500/30 p-3', collapsed && 'flex flex-col items-center')}>
        <div className={cn('flex items-center gap-3 px-1', collapsed && 'flex-col gap-2 px-0')}>
          <Avatar name={user?.full_name || 'User'} size="md" ring />
          <AnimatePresence initial={false}>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="min-w-0 flex-1"
              >
                <p className="text-sm font-semibold text-white truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-[11px] text-ink-300 truncate">
                  {ROLE_LABEL[user?.role] || user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={logout}
            title="Sign out"
            className={cn(
              'p-2 rounded-md text-ink-300 hover:bg-ink-700 hover:text-danger-500 transition-colors',
              collapsed && 'mt-1'
            )}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
