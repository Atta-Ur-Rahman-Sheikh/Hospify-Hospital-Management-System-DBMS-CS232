import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Command,
  Sparkles,
  ArrowRight,
  Users,
  Stethoscope,
  Receipt,
  CalendarClock,
  Check,
  CornerDownLeft,
  X as CloseIcon,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { useAlerts, useResolveAlert } from '../hooks/useAdmin';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useToast } from '../components/ui/useToast';
import { cn } from '../lib/cn';

const ALERT_ROLES = ['super_admin', 'nurse', 'pharmacist'];

const RESULT_ICON = {
  patient: Users,
  doctor: Stethoscope,
  bill: Receipt,
  appointment: CalendarClock,
};

const RESULT_TONE = {
  patient: 'text-brand-300 bg-brand-500/15 ring-brand-500/30',
  doctor: 'text-vital-300 bg-vital-500/15 ring-vital-500/30',
  bill: 'text-fuchsia-300 bg-fuchsia-500/15 ring-fuchsia-500/30',
  appointment: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
};

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const canSeeAlerts = ALERT_ROLES.includes(user?.role);
  const { data: alerts = [] } = useAlerts({ enabled: canSeeAlerts });
  const resolve = useResolveAlert();
  const unread = alerts?.length || 0;

  const results = useGlobalSearch(query);

  // Group results for nicer rendering.
  const grouped = useMemo(() => {
    const groups = {};
    for (const r of results) {
      groups[r.kind] ??= [];
      groups[r.kind].push(r);
    }
    return groups;
  }, [results]);

  // ⌘K / Ctrl+K → focus search; "/" also focuses search like GitHub.
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (!typing && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const onClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open]);

  // Close search dropdown when the route changes. The sidebar uses NavLink
  // and we don't control every navigator, so listening to pathname changes is
  // the cleanest place to reset this popover.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setOpen(false);
    setQuery('');
    setActiveIdx(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [location.pathname]);

  const onSelect = (r) => {
    setOpen(false);
    setQuery('');
    navigate(r.href);
  };

  const onSearchKey = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) setOpen(true);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const r = results[activeIdx];
      if (r) {
        e.preventDefault();
        onSelect(r);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolve.mutateAsync(id);
      toast.success('Alert resolved');
    } catch (err) {
      toast.error('Could not resolve', err.response?.data?.error || 'Try again');
    }
  };

  const showResults = open && query.trim().length > 0;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-16 flex items-center gap-4',
        'bg-ink-900/75 backdrop-blur-xl border-b border-ink-500/30',
        'px-4 sm:px-6'
      )}
    >
      {/* Search */}
      <div ref={containerRef} className="relative flex-1 max-w-xl">
        <Search
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
            open ? 'text-brand-400' : 'text-ink-300'
          )}
        />
        <input
          ref={inputRef}
          id="global-search"
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onSearchKey}
          placeholder="Search patients, doctors, invoices…"
          className={cn(
            'w-full h-10 pl-10 pr-24 rounded-lg text-sm',
            'bg-ink-800/60 border border-ink-500/40 text-white placeholder-ink-300',
            'focus:outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/15 focus:bg-ink-800',
            'transition-all'
          )}
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md text-ink-300 hover:text-white hover:bg-ink-700 transition-colors"
            aria-label="Clear search"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 rounded-md border border-ink-500/50 bg-ink-900/80 px-1.5 py-0.5 text-[10px] font-medium text-ink-300">
            <Command className="h-3 w-3" />K
          </kbd>
        )}

        {/* Results dropdown */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.985 }}
              transition={{ duration: 0.14 }}
              className="absolute left-0 right-0 mt-2 rounded-xl bg-ink-800/95 border border-ink-500/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
            >
              <div className="max-h-[420px] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="p-8 text-center">
                    <Sparkles className="h-5 w-5 mx-auto mb-2 text-ink-300" />
                    <p className="text-sm text-ink-200">No matches for <span className="text-white font-medium">"{query}"</span></p>
                    <p className="text-xs text-ink-300 mt-1">Try a name, CNIC, invoice ID, or date.</p>
                  </div>
                ) : (
                  <ResultList
                    grouped={grouped}
                    results={results}
                    activeIdx={activeIdx}
                    onSelect={onSelect}
                    onHover={setActiveIdx}
                  />
                )}
              </div>
              <div className="px-3 py-2 border-t border-ink-500/30 bg-ink-900/40 flex items-center gap-3 text-[10px] text-ink-300 font-mono uppercase tracking-widest">
                <span className="inline-flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
                <span className="inline-flex items-center gap-1">↑↓ nav</span>
                <span className="inline-flex items-center gap-1">esc close</span>
                <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal">
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        {canSeeAlerts && (
          <div className="relative">
            <button
              onClick={() => setShowNotif((s) => !s)}
              className={cn(
                'relative h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors',
                showNotif ? 'bg-ink-700 text-white' : 'text-ink-100 hover:bg-ink-700 hover:text-white'
              )}
              aria-label="Notifications"
              aria-expanded={showNotif}
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-white flex items-center justify-center ring-2 ring-ink-900">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-[18px] w-[18px] rounded-full bg-danger-500/40 animate-ping" />
              )}
            </button>

            <AnimatePresence>
              {showNotif && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.985 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] z-40 origin-top-right"
                  >
                    <div className="bg-ink-800 rounded-xl border border-ink-500/50 shadow-2xl shadow-black/50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-ink-500/40 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">Alerts</p>
                          <p className="text-[11px] text-ink-300 mt-0.5">
                            Live notifications from the hospital
                          </p>
                        </div>
                        <Badge tone={unread ? 'danger' : 'success'} size="sm" dot>
                          {unread} active
                        </Badge>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto divide-y divide-ink-500/25">
                        {alerts.length === 0 ? (
                          <div className="px-4 py-10 text-center text-sm text-ink-200">
                            <Sparkles className="h-5 w-5 mx-auto mb-2 text-ink-300" />
                            You're all caught up.
                          </div>
                        ) : (
                          alerts.slice(0, 12).map((a) => (
                            <AlertRow
                              key={a.alert_id}
                              alert={a}
                              onResolve={() => handleResolve(a.alert_id)}
                              loading={resolve.isPending}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* User badge */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 ml-1 border-l border-ink-500/30">
          <Avatar name={user?.full_name || 'User'} size="sm" />
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-semibold text-white truncate max-w-[140px]">
              {user?.full_name || 'User'}
            </p>
            <p className="text-[10px] text-ink-300 uppercase tracking-widest">
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

const KIND_LABEL = {
  patient: 'Patients',
  doctor: 'Doctors',
  bill: 'Invoices',
  appointment: 'Appointments',
};

function ResultList({ grouped, results, activeIdx, onSelect, onHover }) {
  let runningIdx = -1;
  return (
    <div className="py-2">
      {Object.entries(grouped).map(([kind, items]) => (
        <div key={kind} className="px-1">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-300/80">
            {KIND_LABEL[kind] || kind}
          </p>
          {items.map((r) => {
            runningIdx++;
            const idx = runningIdx;
            const isActive = idx === activeIdx;
            const Icon = RESULT_ICON[r.kind] || Search;
            return (
              <button
                key={`${r.kind}-${r.id}`}
                onMouseEnter={() => onHover(idx)}
                onClick={() => onSelect(r)}
                className={cn(
                  'group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  isActive ? 'bg-brand-500/10' : 'hover:bg-ink-700/50'
                )}
              >
                <span
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center ring-1 ring-inset shrink-0',
                    RESULT_TONE[r.kind]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{r.title}</p>
                  <p className="text-xs text-ink-300 truncate">{r.subtitle}</p>
                </div>
                <ArrowRight
                  className={cn(
                    'h-4 w-4 transition-all',
                    isActive ? 'text-brand-300 translate-x-0' : 'text-ink-400/0 group-hover:text-ink-300 -translate-x-1 group-hover:translate-x-0'
                  )}
                />
              </button>
            );
          })}
        </div>
      ))}
      {results.length === 0 && (
        <p className="px-3 py-6 text-center text-sm text-ink-300">No results.</p>
      )}
    </div>
  );
}

function AlertRow({ alert, onResolve, loading }) {
  return (
    <div className="px-4 py-3 hover:bg-ink-700/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-warn-500/15 ring-1 ring-warn-500/30 flex items-center justify-center shrink-0">
          <Bell className="h-4 w-4 text-warn-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-warn-500 uppercase tracking-widest">
            {alert.alert_type?.replace(/_/g, ' ')}
          </p>
          <p className="text-sm text-white mt-0.5 line-clamp-2 leading-snug">
            {alert.message}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            {alert.created_at && (
              <p className="text-[10px] text-ink-400">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            )}
            <button
              onClick={onResolve}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md text-[11px] font-medium text-vital-300 hover:text-vital-200 hover:bg-vital-500/10 px-2 py-0.5 transition-colors disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
