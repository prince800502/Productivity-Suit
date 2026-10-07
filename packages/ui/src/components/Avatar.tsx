import { cn } from '../utils';
import { getInitials } from '../utils';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

export function Avatar({ src, name, size = 'md', className, alt }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const sizeClass = sizes[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-medium text-primary-700 dark:text-primary-300',
        sizeClass,
        className
      )}
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
    >
      {name && getInitials(name)}
    </div>
  );
}

export interface AvatarGroupProps {
  children: React.ReactNode;
  className?: string;
  max?: number;
}

export function AvatarGroup({ children, className, max = 5 }: AvatarGroupProps) {
  const kids = Array.isArray(children) ? children : [children];
  const visibleChildren = kids.slice(0, max);
  const remainingCount = kids.length - max;

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const sizeClass = sizes.md; // Default size for the group indicator

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleChildren.map((child, index) => (
        <span key={index} className="relative z-10">
          {child}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className={cn(
          'relative z-0 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium border-2 border-white dark:border-neutral-900',
          sizeClass
        )}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}