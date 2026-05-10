import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    className,
    containerClassName,
    id,
    ...props
  },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="label-text">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-200">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg bg-ink-900 text-sm text-white placeholder-ink-300',
            'border border-ink-500 px-3 py-2.5',
            'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-200">
            {rightIcon}
          </div>
        )}
      </div>
      {(hint || error) && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-danger-500' : 'text-ink-200')}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Input;

export function Textarea({ label, hint, error, className, containerClassName, id, name, rows = 4, ...props }) {
  const textareaId = id || name;
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="label-text">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        className={cn(
          'block w-full rounded-lg bg-ink-900 text-sm text-white placeholder-ink-300',
          'border border-ink-500 px-3 py-2.5',
          'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          'transition-colors duration-150',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className
        )}
        {...props}
      />
      {(hint || error) && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-danger-500' : 'text-ink-200')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Select({ label, hint, error, className, containerClassName, id, name, children, ...props }) {
  const selectId = id || name;
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="label-text">
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        className={cn(
          'block w-full rounded-lg bg-ink-900 text-sm text-white',
          'border border-ink-500 px-3 py-2.5',
          'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          'transition-colors duration-150',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {(hint || error) && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-danger-500' : 'text-ink-200')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
