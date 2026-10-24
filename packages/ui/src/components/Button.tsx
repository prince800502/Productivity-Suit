import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'premium';
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
        bg-champagne-600 text-obsidian-950 hover:bg-champagne-700
        focus:ring-champagne-500 dark:bg-champagne-600 dark:hover:bg-champagne-700 dark:text-obsidian-950
        shadow-md hover:shadow-lg
      `,
      secondary: `
        bg-obsidian-800 text-neutral-100 hover:bg-obsidian-700
        focus:ring-obsidian-500 dark:bg-obsidian-700 dark:hover:bg-obsidian-600
        border border-obsidian-600
      `,
      outline: `
        border-2 border-obsidian-600 bg-transparent text-champagne-600 hover:bg-champagne-500/10
        focus:ring-champagne-500 dark:border-champagne-500 dark:text-champagne-400 dark:hover:bg-champagne-500/20
      `,
      ghost: `
        bg-transparent text-champagne-600 hover:bg-champagne-500/10
        focus:ring-champagne-500 dark:text-champagne-400 dark:hover:bg-champagne-500/10
      `,
      danger: `
        bg-danger-600 text-white hover:bg-danger-700
        focus:ring-danger-500 dark:bg-danger-500 dark:hover:bg-danger-600
        shadow-md hover:shadow-lg
      `,
      glass: `
        glass-interactive text-neutral-900 dark:text-neutral-100
        hover:bg-white/90 dark:hover:bg-neutral-950/80
        focus:ring-champagne-500
      `,
      premium: `
        bg-champagne-600 text-obsidian-950 hover:bg-champagne-700
        focus:ring-champagne-500 dark:bg-champagne-600 dark:hover:bg-champagne-700 dark:text-obsidian-950
        shadow-md hover:shadow-lg
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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
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