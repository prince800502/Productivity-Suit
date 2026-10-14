import { cn } from '../utils';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
  'aria-label'?: string;
}

export function Progress({ 
  value, 
  max = 100, 
  size = 'md', 
  variant = 'default', 
  showLabel = false, 
  label, 
  className,
  'aria-label': ariaLabel
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variants = {
    default: 'bg-primary-600 dark:bg-primary-500',
    primary: 'bg-primary-600 dark:bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={ariaLabel}>
      <div className="flex items-center justify-between mb-1">
        {label && <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>}
        {showLabel && <span className="text-sm font-mono text-neutral-500 dark:text-neutral-400">{Math.round(percentage)}%</span>}
      </div>
      <div className={cn('relative w-full progress-bar', sizes[size])}>
        <div
          className={cn(
            'progress-bar-fill rounded-full transition-all duration-500 ease-out',
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
  'aria-label'?: string;
}

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 48, 
  strokeWidth = 4, 
  variant = 'default', 
  showLabel = true, 
  label, 
  className,
  'aria-label': ariaLabel
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const variants = {
    default: 'text-primary-600 dark:text-primary-500',
    primary: 'text-primary-600 dark:text-primary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-danger-500',
  };

  return (
    <div 
      className={cn('relative inline-flex items-center justify-center', className)} 
      role="progressbar" 
      aria-valuenow={value} 
      aria-valuemin={0} 
      aria-valuemax={max} 
      aria-label={ariaLabel}
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-neutral-200 dark:text-neutral-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn(
            'transition-all duration-500 ease-out',
            variants[variant]
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {(showLabel || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showLabel && (
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {Math.round(percentage)}%
            </span>
          )}
          {label && <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>}
        </div>
      )}
    </div>
  );
}

export interface StepProgressProps {
  steps: { label: string; completed?: boolean; current?: boolean }[];
  variant?: 'default' | 'primary' | 'success';
  className?: string;
}

export function StepProgress({ steps, variant = 'primary', className }: StepProgressProps) {
  const variants = {
    default: 'text-neutral-600 dark:text-neutral-400',
    primary: 'text-primary-600 dark:text-primary-400',
    success: 'text-success-500',
  };

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                step.completed
                  ? `bg-${variant === 'success' ? 'success' : variant === 'primary' ? 'primary' : 'neutral'}-500 text-white`
                  : step.current
                  ? `bg-${variant === 'success' ? 'success' : variant === 'primary' ? 'primary' : 'neutral'}-500 text-white ring-4 ring-${variant === 'success' ? 'success' : variant === 'primary' ? 'primary' : 'neutral'}-500/30`
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
              )}
            >
              {step.completed ? '✓' : index + 1}
            </div>
            <span className={cn(
              'ml-2 text-sm font-medium',
              step.current ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'
            )}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-2',
                step.completed
                  ? `bg-${variant === 'success' ? 'success' : variant === 'primary' ? 'primary' : 'neutral'}-500`
                  : 'bg-neutral-200 dark:bg-neutral-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200 dark:bg-neutral-700',
        variants[variant],
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}