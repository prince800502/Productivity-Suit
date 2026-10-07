import { useState, ReactNode, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';
import { isWeb, getDocument, getWindow } from '../utils';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, position = 'top', delay = 200, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Tab') hideTooltip();
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-900 dark:border-t-neutral-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-900 dark:border-b-neutral-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-900 dark:border-l-neutral-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-900 dark:border-r-neutral-800',
  };

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={cn(
        'absolute z-50 px-3 py-1.5 text-xs font-medium text-white',
        'bg-neutral-900 dark:bg-neutral-950 rounded shadow-lg',
        'whitespace-nowrap pointer-events-none',
        'animate-fade-in scale-95',
        positions[position],
        className
      )}
    >
      {content}
      <div
        className={cn(
          'absolute w-0 h-0 border-4 border-transparent',
          arrows[position]
        )}
      />
    </div>
  ) : null;

  const wrapper = (
    <span
      ref={childRef}
      tabIndex={0}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onKeyDown={handleKeyDown}
      className="inline-block relative"
    >
      {children}
      {tooltipContent}
    </span>
  );

  if (!isWeb) return wrapper;
  return createPortal(wrapper, getDocument()!.body);
}

// Simple tooltip without portal (for use inside overflow containers)
export interface SimpleTooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function SimpleTooltip({ content, children, position = 'top', className }: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-900 dark:border-t-neutral-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-900 dark:border-b-neutral-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-900 dark:border-l-neutral-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-900 dark:border-r-neutral-800',
  };

  return (
    <span
      className="inline-block relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-1.5 text-xs font-medium text-white',
            'bg-neutral-900 dark:bg-neutral-950 rounded shadow-lg',
            'whitespace-nowrap pointer-events-none',
            'animate-fade-in',
            positions[position],
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4 border-transparent',
              arrows[position]
            )}
          />
        </div>
      )}
    </span>
  );
}