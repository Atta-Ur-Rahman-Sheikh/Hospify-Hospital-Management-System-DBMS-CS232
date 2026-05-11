import { cn } from '../../lib/cn';

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-500/40 bg-ink-800/60">
      <table className={cn('min-w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function THead({ children, className }) {
  return (
    <thead className={cn('bg-ink-900/60 border-b border-ink-500/40', className)}>
      {children}
    </thead>
  );
}

export function TBody({ children, className }) {
  return (
    <tbody className={cn('divide-y divide-ink-500/20', className)}>{children}</tbody>
  );
}

export function TR({ children, className, hoverable = true, ...props }) {
  return (
    <tr
      className={cn(
        hoverable && 'transition-colors hover:bg-ink-700/40',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TH({ children, className, align = 'left', ...props }) {
  return (
    <th
      className={cn(
        'px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-200',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({ children, className, align = 'left', ...props }) {
  return (
    <td
      className={cn(
        'px-5 py-4 text-ink-50 align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}
