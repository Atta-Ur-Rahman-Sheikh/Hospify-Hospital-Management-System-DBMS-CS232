import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeOnBackdrop && onClose?.()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'relative w-full bg-ink-800 rounded-2xl border border-ink-500/60',
              'shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col',
              SIZES[size]
            )}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-ink-500/40">
                <div>
                  {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
                  {description && (
                    <p className="text-sm text-ink-200 mt-0.5">{description}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-ink-200 hover:text-white p-1 rounded-md hover:bg-ink-700 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-ink-500/40 flex items-center justify-end gap-3 bg-ink-900/40 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-md',
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={cn(
              'relative ml-auto h-full w-full bg-ink-800 border-l border-ink-500/60',
              'shadow-2xl flex flex-col',
              width
            )}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-ink-500/40">
              <div>
                {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
                {description && (
                  <p className="text-sm text-ink-200 mt-0.5">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-ink-200 hover:text-white p-1 rounded-md hover:bg-ink-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-ink-500/40 flex items-center justify-end gap-3 bg-ink-900/40">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
