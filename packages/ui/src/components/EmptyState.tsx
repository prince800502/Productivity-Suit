'use client';

import { cn } from '../utils';
import { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'py-8 px-4',
  md: 'py-12 px-6',
  lg: 'py-16 px-8',
};

const iconSizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div className={cn('text-center', sizeClasses[size], className)}>
      {icon && (
        <div className={cn('mx-auto mb-4 text-neutral-300 dark:text-neutral-700', iconSizes[size])}>
          {icon}
        </div>
      )}
      <h3 className={cn('font-medium', size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : 'text-xl', 'text-neutral-900 dark:text-white')}>
        {title}
      </h3>
      {description && (
        <p className={cn('mt-2', size === 'sm' ? 'text-sm' : 'text-base', 'text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto')}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline"
            >
              {secondaryAction.label}
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                action.variant === 'primary' ? 'bg-primary-600 text-white hover:bg-primary-700' :
                action.variant === 'secondary' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700' :
                'border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              )}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}