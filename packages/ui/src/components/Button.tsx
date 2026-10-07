import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium transition-all duration-200
      rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

    const variants = {
      primary: `
        bg-primary-600 text-white hover:bg-primary-700
        focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600
      `,
      secondary: `
        bg-secondary-600 text-white hover:bg-secondary-700
        focus:ring-secondary-500 dark:bg-secondary-500 dark:hover:bg-secondary-600
      `,
      outline: `
        border-2 border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50
        focus:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800
      `,
      ghost: `
        bg-transparent text-neutral-700 hover:bg-neutral-100
        focus:ring-neutral-400 dark:text-neutral-300 dark:hover:bg-neutral-800
      `,
      danger: `
        bg-danger-600 text-white hover:bg-danger-700
        focus:ring-danger-500 dark:bg-danger-500 dark:hover:bg-danger-600
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    const width = fullWidth ? 'w-full' : '';

    const Comp = asChild ? Slot : 'button';

    // When asChild is true, delegate all rendering to the child component
    // The child (e.g., Link) should handle its own content, loading state, and icons
    const slotChildren = asChild
      ? children
      : (
          <>
            {loading ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : icon && iconPosition === 'left' ? (
              <span className="flex-shrink-0">{icon}</span>
            ) : null}
            {children}
            {icon && iconPosition === 'right' && !loading && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        );

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], width, className)}
        disabled={disabled || loading}
        {...props}
      >
        {slotChildren}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Icon button variant
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', 'aria-label': ariaLabel, className, children, ...props }, ref) => {
    const sizes = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(sizes[size], 'flex items-center justify-center', className)}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';