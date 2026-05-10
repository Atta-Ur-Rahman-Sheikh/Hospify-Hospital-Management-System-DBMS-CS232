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
  Activity,
  ChevronLeft,
  ChevronRight,
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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { collapsed, toggle, isMobile } = useSidebar();
  const showLabels = !collapsed;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col',
        'bg-ink-950/95 backdrop-blur-xl border-r border-ink-500/40'
      )}
    >
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 h-16 border-b border-ink-500/30 shrink-0',
        collapsed && 'justify-center px-0'
      )}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-vital-500 ring-2 ring-ink-950" />
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
                <p className="text-[10px] text-ink-200 mt-1 uppercase tracking-widest font-medium">
                  HMS Suite
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
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
                    className="px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-300 mb-2"
                  >
                    {group.section}
                  </motion.div>
                )}
              </AnimatePresence>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                          'transition-colors duration-150',
                          isActive
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                            : 'text-ink-100 hover:bg-ink-800 hover:text-white',
                          collapsed && 'justify-center px-0'
                        )
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
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
          className="mx-3 mb-2 h-8 rounded-lg border border-ink-500/40 bg-ink-800 text-ink-100 hover:bg-ink-700 hover:text-white transition-colors flex items-center justify-center"
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
                <p className="text-[11px] text-ink-200 truncate">
                  {ROLE_LABEL[user?.role] || user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={logout}
            title="Sign out"
            className={cn(
              'p-2 rounded-md text-ink-200 hover:bg-ink-700 hover:text-danger-500 transition-colors',
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
