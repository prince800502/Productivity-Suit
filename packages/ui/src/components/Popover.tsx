'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback, forwardRef, ReactNode, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';

export interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

function getPosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  side: 'top' | 'right' | 'bottom' | 'left' = 'bottom',
  align: 'start' | 'center' | 'end' = 'center',
  sideOffset = 8
) {
  let top = 0;
  let left = 0;

  switch (side) {
    case 'bottom':
      top = triggerRect.bottom + sideOffset;
      if (align === 'start') left = triggerRect.left;
      else if (align === 'center') left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
      else left = triggerRect.right - contentRect.width;
      break;
    case 'top':
      top = triggerRect.top - contentRect.height - sideOffset;
      if (align === 'start') left = triggerRect.left;
      else if (align === 'center') left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
      else left = triggerRect.right - contentRect.width;
      break;
    case 'right':
      left = triggerRect.right + sideOffset;
      if (align === 'start') top = triggerRect.top;
      else if (align === 'center') top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
      else top = triggerRect.bottom - contentRect.height;
      break;
    case 'left':
      left = triggerRect.left - contentRect.width - sideOffset;
      if (align === 'start') top = triggerRect.top;
      else if (align === 'center') top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
      else top = triggerRect.bottom - contentRect.height;
      break;
  }

  return { top, left };
}

export function Popover({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange : setUncontrolledOpen;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [contentRect, setContentRect] = useState<DOMRect | null>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current && contentRef.current) {
      const tRect = triggerRef.current.getBoundingClientRect();
      const cRect = contentRef.current.getBoundingClientRect();
      setTriggerRect(tRect);
      setContentRect(cRect);
    }
  }, []);

  useEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      triggerRef.current?.contains(event.target as Node) ||
      contentRef.current?.contains(event.target as Node)
    ) {
      return;
    }
    setOpen?.(false);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside as unknown as EventListener);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener);
  }, [open, handleClickOutside]);

  const trigger = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === PopoverTrigger
  ) as React.ReactElement<any> | undefined;

  const content = React.Children.toArray(children).find(
    child => React.isValidElement(child) && (child.type === PopoverContent || (child.type as any)?.displayName === 'PopoverContent')
  ) as React.ReactElement<any> | undefined;

  if (!trigger || !content) {
    return <>{children}</>;
  }

  const position = triggerRect && contentRect ? getPosition(triggerRect, contentRect, content.props.side, content.props.align, content.props.sideOffset) : { top: 0, left: 0 };

  const triggerWithRef = React.cloneElement(trigger, {
    ref: triggerRef,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen?.(!open);
      trigger.props.onClick?.(e);
    },
  });

  const contentWithRef = React.cloneElement(content, {
    ref: contentRef,
    style: {
      ...content.props.style,
      position: 'fixed',
      top: position.top,
      left: position.left,
      zIndex: 50,
    },
  });

  return (
    <>
      {triggerWithRef}
      {open && createPortal(contentWithRef, document.body)}
    </>
  );
}

Popover.displayName = 'Popover';

export const PopoverTrigger = forwardRef<HTMLButtonElement, { children: ReactNode; asChild?: boolean }>(
  ({ children, asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        ...props,
        onClick: (e: React.MouseEvent) => {
          (props as any).onClick?.(e);
          (children.props as any)?.onClick?.(e);
        },
      });
    }
    return <button ref={ref} {...props}>{children}</button>;
  }
);

PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverContent = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { side?: 'top' | 'right' | 'bottom' | 'left'; align?: 'start' | 'center' | 'end'; sideOffset?: number }>(
  ({ children, className, side, align, sideOffset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg p-2 min-w-[200px]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PopoverContent.displayName = 'PopoverContent';