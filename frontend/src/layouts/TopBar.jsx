import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Search, Command, Sparkles } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAlerts } from '../hooks/useAdmin';
import { cn } from '../lib/cn';

const ALERT_ROLES = ['super_admin', 'nurse', 'pharmacist'];
const NEW_PATIENT_ROLES = ['super_admin', 'receptionist'];

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);

  const canSeeAlerts = ALERT_ROLES.includes(user?.role);
  const canCreatePatient = NEW_PATIENT_ROLES.includes(user?.role);

  const { data: alerts = [] } = useAlerts({ enabled: canSeeAlerts });
  const unread = alerts?.length || 0;

  // ⌘K / Ctrl+K → focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 flex items-center gap-4',
        'bg-ink-900/80 backdrop-blur-xl border-b border-ink-500/40',
        'px-4 sm:px-6'
      )}
    >
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-200 group-focus-within:text-brand-400 transition-colors" />
          <input
            id="global-search"
            type="text"
            placeholder="Search patients, doctors, bills…"
            className={cn(
              'w-full h-10 pl-10 pr-20 rounded-lg text-sm',
              'bg-ink-800/60 border border-ink-500/50 text-white placeholder-ink-300',
              'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-ink-800',
              'transition-all'
            )}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 rounded-md border border-ink-500/50 bg-ink-900 px-2 py-0.5 text-[10px] font-medium text-ink-200">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {canCreatePatient && (
          <Button
            size="md"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() =>
              navigate('/patients', { state: { openCreate: true } })
            }
            className="hidden sm:inline-flex"
          >
            New Patient
          </Button>
        )}

        {/* Notifications */}
        {canSeeAlerts ? (
          <div className="relative">
            <button
              onClick={() => setShowNotif((s) => !s)}
              className="relative h-10 w-10 inline-flex items-center justify-center rounded-lg text-ink-100 hover:bg-ink-700 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-white flex items-center justify-center ring-2 ring-ink-900">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotif && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotif(false)}
                />
                <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] z-40 origin-top-right">
                  <div className="bg-ink-800 rounded-xl border border-ink-500/60 shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-ink-500/40 flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Alerts</p>
                      <Badge tone={unread ? 'danger' : 'neutral'} size="sm">
                        {unread} active
                      </Badge>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-ink-200">
                          <Sparkles className="h-5 w-5 mx-auto mb-2 text-ink-300" />
                          You're all caught up.
                        </div>
                      ) : (
                        alerts.slice(0, 8).map((a) => (
                          <div
                            key={a.alert_id}
                            className="px-4 py-3 border-b border-ink-500/30 last:border-0 hover:bg-ink-700/40 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-lg bg-warn-500/15 ring-1 ring-warn-500/30 flex items-center justify-center shrink-0">
                                <Bell className="h-4 w-4 text-warn-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white uppercase tracking-wider">
                                  {a.alert_type?.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm text-ink-100 mt-0.5 line-clamp-2">
                                  {a.message}
                                </p>
                                {a.created_at && (
                                  <p className="text-[10px] text-ink-300 mt-1">
                                    {new Date(a.created_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 border-l border-ink-500/40">
          <Avatar name={user?.full_name || 'User'} size="sm" />
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-medium text-white truncate max-w-[140px]">
              {user?.full_name || 'User'}
            </p>
            <p className="text-[10px] text-ink-200 uppercase tracking-wider">
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
