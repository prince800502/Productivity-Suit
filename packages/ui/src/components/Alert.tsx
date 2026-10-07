import { forwardRef, ReactNode } from 'react';
import { cn } from '../utils';
import { X, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

export interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
  icon?: ReactNode;
}

interface AlertCompoundComponent {
  Title: typeof AlertTitle;
  Description: typeof AlertDescription;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ children, variant = 'default', className, icon }, ref) => {
    const variants = {
      default: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100',
      destructive: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-300',
      warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-300',
      success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-800 dark:text-success-300',
      info: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300',
    };

    const icons = {
      default: Info,
      destructive: AlertCircle,
      warning: AlertTriangle,
      success: CheckCircle,
      info: Info,
    };

    const iconColors = {
      default: 'text-primary-500',
      destructive: 'text-danger-500',
      warning: 'text-warning-500',
      success: 'text-success-500',
      info: 'text-primary-500',
    };

    const Icon = icons[variant] || icons.default;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative flex w-full items-start gap-3 rounded-lg border p-4',
          variants[variant],
          className
        )}
      >
        {(icon || variant) && (
          <div className={cn('flex-shrink-0 mt-0.5', iconColors[variant])}>
            {icon || <Icon className="h-4 w-4" />}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    );
  }
);

export interface AlertTitleProps {
  children: ReactNode;
  className?: string;
}

const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ children, className }, ref) => (
    <h5
      ref={ref}
      className={cn('text-sm font-medium', className)}
      {...{ ref } as any}
    >
      {children}
    </h5>
  )
);

AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm opacity-90 mt-1', className)}
      {...{ ref } as any}
    >
      {children}
    </div>
  )
);

AlertDescription.displayName = 'AlertDescription';

const AlertComponent = Alert as typeof Alert & AlertCompoundComponent;
AlertComponent.Title = AlertTitle;
AlertComponent.Description = AlertDescription;
AlertComponent.displayName = 'Alert';

export { AlertComponent as Alert, AlertTitle, AlertDescription };