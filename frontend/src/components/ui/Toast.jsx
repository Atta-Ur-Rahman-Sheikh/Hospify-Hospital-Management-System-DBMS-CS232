import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ToastContext } from './toastContext';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONE = {
  success: 'border-vital-500/40 [&_.icon]:text-vital-400',
  error:   'border-danger-500/40 [&_.icon]:text-danger-500',
  info:    'border-brand-500/40 [&_.icon]:text-brand-400',
  warning: 'border-warn-500/40 [&_.icon]:text-warn-500',
};

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++idSeq;
      const item = {
        id,
        type: 'info',
        duration: 4500,
        ...toast,
      };
      setToasts((t) => [...t, item]);
      if (item.duration > 0) {
        setTimeout(() => dismiss(id), item.duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    toast: push,
    success: (title, description, opts = {}) =>
      push({ ...opts, type: 'success', title, description }),
    error: (title, description, opts = {}) =>
      push({ ...opts, type: 'error', title, description }),
    info: (title, description, opts = {}) =>
      push({ ...opts, type: 'info', title, description }),
    warning: (title, description, opts = {}) =>
      push({ ...opts, type: 'warning', title, description }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
          <AnimatePresence>
            {toasts.map((t) => {
              const Icon = ICONS[t.type] || Info;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 60, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'pointer-events-auto rounded-xl border bg-ink-800/95 backdrop-blur-md',
                    'shadow-2xl shadow-black/40 px-4 py-3.5',
                    'flex items-start gap-3',
                    TONE[t.type]
                  )}
                  role="status"
                >
                  <Icon className="icon h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {t.title && (
                      <p className="text-sm font-semibold text-white leading-tight">
                        {t.title}
                      </p>
                    )}
                    {t.description && (
                      <p className="text-xs text-ink-100 mt-0.5 leading-snug break-words">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="text-ink-200 hover:text-white p-0.5 rounded transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
