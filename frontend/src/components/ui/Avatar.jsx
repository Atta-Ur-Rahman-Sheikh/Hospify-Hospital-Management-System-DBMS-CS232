import { cn } from '../../lib/cn';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const PALETTES = [
  'bg-brand-500/20 text-brand-300 ring-brand-500/30',
  'bg-vital-500/20 text-vital-300 ring-vital-500/30',
  'bg-fuchsia-500/20 text-fuchsia-300 ring-fuchsia-500/30',
  'bg-amber-500/20 text-amber-300 ring-amber-500/30',
  'bg-rose-500/20 text-rose-300 ring-rose-500/30',
  'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30',
];

function pickPalette(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

export default function Avatar({ name = '', src, size = 'md', className, ring = false, ...props }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          SIZES[size],
          'rounded-full object-cover ring-2 ring-ink-700',
          ring && 'ring-brand-500/40',
          className
        )}
        {...props}
      />
    );
  }
  return (
    <div
      className={cn(
        SIZES[size],
        'rounded-full flex items-center justify-center font-semibold ring-1 ring-inset shrink-0',
        pickPalette(name),
        ring && 'ring-2 !ring-brand-500/50',
        className
      )}
      title={name}
      {...props}
    >
      {initials(name)}
    </div>
  );
}
