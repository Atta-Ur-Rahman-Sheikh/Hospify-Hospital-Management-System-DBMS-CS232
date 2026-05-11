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
  Stethoscope,
  BedDouble,
  Beaker,
  Pill,
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

const FEATURES = [
  { icon: Stethoscope, label: 'Patient & doctor records' },
  { icon: BedDouble,   label: 'Real-time bed availability' },
  { icon: Pill,        label: 'Pharmacy & prescriptions' },
  { icon: Beaker,      label: 'Lab orders & results' },
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
    <div className="h-screen overflow-hidden bg-ink-900 text-ink-50 flex">
      {/* Left visual panel */}
      <div className="relative hidden lg:flex flex-1 overflow-hidden bg-ink-950">
        <LoginHeroArt />

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

          <div className="space-y-7 max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-4xl xl:text-5xl font-bold text-white leading-[1.05] tracking-tight"
            >
              The operating system for{' '}
              <span className="bg-gradient-to-r from-brand-400 to-vital-300 bg-clip-text text-transparent">
                modern healthcare
              </span>
              .
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-base text-white/70 leading-relaxed"
            >
              One secure workspace for patients, appointments, beds, billing,
              pharmacy and lab — built for the people running the hospital.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid grid-cols-2 gap-2.5 max-w-sm"
            >
              {FEATURES.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white/85"
                >
                  <f.icon className="h-4 w-4 text-brand-300 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{f.label}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60">
            <Shield className="h-4 w-4" />
            <span>JWT auth · audit trails · role-gated access</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 -z-10 lg:hidden">
          <div className="fixed inset-0 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900" />
          <div className="fixed top-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-500/15 blur-3xl" />
        </div>

        <div className="min-h-full w-full flex flex-col items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-sm space-y-7 py-8"
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
    </div>
  );
}

/**
 * Custom inline SVG hero — builds atmosphere without screaming "stock gradient".
 * Layers: deep gradient → soft conic glow → fine grid → animated EKG trace →
 * floating glass cards → subtle radial vignette.
 */
function LoginHeroArt() {
  return (
    <div className="absolute inset-0">
      {/* Base radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 10%, #0F172A 0%, #0A0F1E 55%, #060A14 100%)',
        }}
      />

      {/* Subtle conic glow behind everything */}
      <div className="absolute -top-40 -left-40 h-[640px] w-[640px] opacity-50">
        <div
          className="h-full w-full rounded-full blur-3xl"
          style={{
            background:
              'conic-gradient(from 220deg at 50% 50%, rgba(37,99,235,0.35), rgba(13,148,136,0.18), rgba(37,99,235,0.0) 70%)',
          }}
        />
      </div>

      {/* Fine medical grid */}
      <svg
        className="absolute inset-0 h-full w-full text-white/[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <pattern id="medGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <pattern id="medGridFine" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#medGridFine)" />
        <rect width="100%" height="100%" fill="url(#medGrid)" />
      </svg>

      {/* Big EKG / heart line — the signature visual */}
      <svg
        viewBox="0 0 600 220"
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full h-[40%] opacity-90"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="ekgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
            <stop offset="20%"  stopColor="#2563EB" stopOpacity="1" />
            <stop offset="55%"  stopColor="#0D9488" stopOpacity="1" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
          </linearGradient>
          <filter id="ekgGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Baseline ghost line */}
        <path
          d="M 0 110 H 600"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          fill="none"
        />

        {/* Animated heartbeat trace */}
        <motion.path
          d="M 0 110
             L 90 110
             L 110 110 L 120 90 L 130 130 L 140 60 L 150 160 L 165 110
             L 250 110
             L 270 110 L 280 95 L 290 125 L 300 70 L 310 150 L 325 110
             L 420 110
             L 440 110 L 450 100 L 460 120 L 470 80 L 480 140 L 495 110
             L 600 110"
          stroke="url(#ekgGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#ekgGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />

        {/* Pulsing dot riding the trace */}
        <motion.circle
          r="4"
          fill="#0D9488"
          initial={{ cx: 0, cy: 110, opacity: 0 }}
          animate={{
            cx: [0, 600],
            cy: [110, 110],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 2.4,
            times: [0, 0.05, 0.95, 1],
          }}
          style={{ filter: 'drop-shadow(0 0 6px #0D9488)' }}
        />
      </svg>

      {/* Floating "live" stat card — subtle proof of life */}
      <motion.div
        initial={{ opacity: 0, y: 16, x: -8 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute right-10 top-20 hidden xl:block w-56 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            Vitals · live
          </p>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-vital-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-vital-500" />
          </span>
        </div>
        <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">
          72 <span className="text-xs text-white/60 font-medium">bpm</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md bg-white/5 px-2 py-1.5">
            <p className="text-white/50">SpO₂</p>
            <p className="text-white font-semibold tabular-nums">98%</p>
          </div>
          <div className="rounded-md bg-white/5 px-2 py-1.5">
            <p className="text-white/50">Temp</p>
            <p className="text-white font-semibold tabular-nums">37.1°C</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16, x: 8 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="absolute left-12 bottom-32 hidden xl:block w-52 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-2xl shadow-black/40"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
          Beds today
        </p>
        <div className="mt-2 flex items-end gap-3">
          <p className="text-2xl font-bold text-white tabular-nums leading-none">128</p>
          <p className="text-[11px] text-vital-300 font-semibold mb-0.5">
            +6 free
          </p>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-brand-500 to-vital-500" />
        </div>
        <p className="mt-1.5 text-[10px] text-white/50">66% occupancy</p>
      </motion.div>

      {/* Bottom vignette so text never fights the art */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
