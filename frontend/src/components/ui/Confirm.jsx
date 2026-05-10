import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import { ConfirmContext } from './confirm-context';

const TONE = {
  danger: {
    icon: 'text-danger-500 bg-danger-500/15 ring-danger-500/30',
    btn: 'danger',
  },
  warning: {
    icon: 'text-warn-500 bg-warn-500/15 ring-warn-500/30',
    btn: 'primary',
  },
  primary: {
    icon: 'text-brand-300 bg-brand-500/15 ring-brand-500/30',
    btn: 'primary',
  },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => {
    setState({
      title: 'Are you sure?',
      description: 'This action cannot be undone.',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      tone: 'primary',
      ...opts,
    });
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handle = (value) => {
    setState(null);
    resolverRef.current?.(value);
    resolverRef.current = null;
  };

  const tone = TONE[state?.tone || 'primary'] || TONE.primary;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {createPortal(
        <AnimatePresence>
          {state && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <motion.div
                className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => handle(false)}
              />
              <motion.div
                role="alertdialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="relative w-full max-w-md rounded-2xl bg-ink-800 border border-ink-500/60 shadow-2xl shadow-black/50 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl ring-1 ring-inset flex items-center justify-center shrink-0 ${tone.icon}`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-white">{state.title}</h2>
                    {state.description && (
                      <p className="mt-1 text-sm text-ink-200 leading-relaxed">
                        {state.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button variant="ghost" onClick={() => handle(false)}>
                    {state.cancelLabel}
                  </Button>
                  <Button variant={tone.btn} onClick={() => handle(true)} autoFocus>
                    {state.confirmLabel}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
