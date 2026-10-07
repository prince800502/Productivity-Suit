import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, className, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
      elevated: 'bg-white dark:bg-neutral-900 shadow-lg dark:shadow-neutral-900/50',
      outlined: 'bg-transparent border-2 border-neutral-200 dark:border-neutral-700',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          hover && 'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-neutral-900 dark:text-neutral-100', className)}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('mt-1 text-sm text-neutral-500 dark:text-neutral-400', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

// Stat Card for dashboards
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function StatCard({ title, value, change, changeLabel, icon, trend = 'neutral', variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-white dark:bg-neutral-900',
    primary: 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800',
    success: 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800',
    warning: 'bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800',
    danger: 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800',
  };

  const trendColors = {
    up: 'text-success-600 dark:text-success-400',
    down: 'text-danger-600 dark:text-danger-400',
    neutral: 'text-neutral-500 dark:text-neutral-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Card variant="default" padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
        </div>
        {icon && <div className="text-neutral-400 dark:text-neutral-500">{icon}</div>}
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn('text-sm font-medium', trendColors[trend])}>
            {trendIcons[trend]} {Math.abs(change)}%
          </span>
          {changeLabel && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{changeLabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}