import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/useToast';

const DEMO_ACCOUNTS = [
  { email: 'admin@hospify.com',          role: 'Super Admin' },
  { email: 'receptionist@hospify.com',   role: 'Receptionist' },
  { email: 'dr.khalid@hospify.com',      role: 'Doctor' },
  { email: 'nurse.fatima@hospify.com',   role: 'Nurse' },
  { email: 'lab.raza@hospify.com',       role: 'Lab Tech' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success('Welcome back', `Signed in as ${u?.full_name || email}`);
      navigate('/');
    } catch (err) {
      toast.error('Sign in failed', err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 text-ink-50 flex">
      {/* Left visual panel */}
      <div className="relative hidden lg:flex flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-ink-900 to-ink-950" />
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-vital-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Hospify</p>
              <p className="text-[11px] text-white/60 uppercase tracking-widest font-medium">
                Hospital Management
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight"
            >
              The operating system for modern healthcare.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-lg text-white/70 leading-relaxed"
            >
              Patients, appointments, beds, billing, pharmacy and lab — all in
              one secure, audit-trailed workspace.
            </motion.p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60">
            <Shield className="h-4 w-4" />
            <span>256-bit encryption · HIPAA-aware design · Role-gated access</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 -z-10 lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900" />
          <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-500/15 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm space-y-7"
        >
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-base font-bold text-white">Hospify</p>
              <p className="text-[10px] text-ink-200 uppercase tracking-widest font-medium">
                HMS
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Sign in to your workspace
            </h2>
            <p className="mt-2 text-sm text-ink-200">
              Enter your email and password to access Hospify.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@hospify.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Button
              type="submit"
              isLoading={loading}
              size="lg"
              className="w-full"
              rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="rounded-xl border border-ink-500/40 bg-ink-800/60 p-4">
            <p className="text-[11px] uppercase tracking-widest text-ink-300 font-semibold mb-3">
              Demo accounts <span className="text-ink-200 normal-case font-normal tracking-normal">(password: Password123!)</span>
            </p>
            <ul className="space-y-1.5">
              {DEMO_ACCOUNTS.map((d) => (
                <li key={d.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword('Password123!');
                    }}
                    className="group w-full flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-ink-700/60 transition-colors"
                  >
                    <span className="font-mono text-ink-100 group-hover:text-white truncate">
                      {d.email}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 text-ink-300 group-hover:text-brand-400">
                      {d.role}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
