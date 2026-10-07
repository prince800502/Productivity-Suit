import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '../utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconPosition = 'left', className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border bg-white dark:bg-neutral-900',
              'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              error
                ? 'border-danger-500 focus:ring-danger-500'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-600 dark:text-danger-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-neutral-900',
            'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400',
            'transition-colors duration-200 resize-y min-h-[80px]',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-600 dark:text-danger-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-neutral-900',
            'text-neutral-900 dark:text-neutral-100',
            'transition-colors duration-200 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-600 dark:text-danger-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');
    const descId = `${checkboxId}-desc`;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'mt-0.5 h-4 w-4 rounded border-neutral-300',
            'text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'dark:border-neutral-600 dark:bg-neutral-800 dark:checked:bg-primary-600 dark:checked:border-primary-600',
            className
          )}
          aria-describedby={description ? descId : undefined}
          {...props}
        />
        <div className="flex-1">
          <label htmlFor={checkboxId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
            {label}
          </label>
          {description && (
            <p id={descId} className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface RadioGroupProps {
  label: string;
  name: string;
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  direction?: 'horizontal' | 'vertical';
}

export function RadioGroup({ label, name, options, value, onChange, error, hint, direction = 'vertical' }: RadioGroupProps) {
  const groupId = name;
  const errorId = `${groupId}-error`;
  const hintId = `${groupId}-hint`;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {label}
      </label>
      <fieldset className={cn('space-y-2', direction === 'horizontal' && 'flex flex-wrap gap-4')}>
        {options.map(option => (
          <label key={option.value} className={cn('flex items-center gap-2 cursor-pointer', direction === 'horizontal' && 'flex-row')}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={cn(
                'h-4 w-4 border-neutral-300 text-primary-600',
                'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-primary-600'
              )}
            />
            <div>
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{option.label}</span>
              {option.description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </fieldset>
      {error && <p id={errorId} className="mt-1.5 text-sm text-danger-600 dark:text-danger-400" role="alert">{error}</p>}
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </div>
  );
}

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const switchId = id || label.toLowerCase().replace(/\s+/g, '-');
    const descId = `${switchId}-desc`;

    return (
      <div className="flex items-center gap-3">
        <button
          role="switch"
          type="button"
          ref={ref as any}
          id={switchId}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            props.checked
              ? 'bg-primary-600 dark:bg-primary-500'
              : 'bg-neutral-300 dark:bg-neutral-600',
            className
          )}
          aria-checked={props.checked}
          aria-describedby={description ? descId : undefined}
          onClick={() => props.onChange?.({ target: { checked: !props.checked } } as any)}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow',
              'transition-transform duration-200',
              props.checked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <div>
          <label htmlFor={switchId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
            {label}
          </label>
          {description && (
            <p id={descId} className="text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';