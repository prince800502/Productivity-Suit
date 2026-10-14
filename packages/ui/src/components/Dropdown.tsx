'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';
import { ChevronDown, Check } from 'lucide-react';
import { Button, IconButton } from './Button';
import { isWeb, getDocument } from '../utils';

export interface DropdownItem {
  label?: string;
  value?: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  divider?: boolean;
  subItems?: DropdownItem[];
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  width?: number | 'trigger';
  closeOnSelect?: boolean;
  // Optional header content (e.g., user info)
  header?: ReactNode;
}

export function Dropdown({ 
  trigger, 
  items, 
  onSelect, 
  align = 'right', 
  width = 'trigger', 
  closeOnSelect = true,
  header 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isWeb) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    getDocument()?.addEventListener('mousedown', handleClickOutside);
    return () => getDocument()?.removeEventListener('mousedown', handleClickOutside);
  }, [isWeb]);

  useEffect(() => {
    if (!isWeb || !isOpen) return;
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        (triggerRef.current as HTMLElement)?.focus();
      }
    }

    getDocument()?.addEventListener('keydown', handleKeyDown);
    return () => getDocument()?.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isWeb]);

  // Update trigger rect when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    if (item.value === undefined) return;
    onSelect(item.value);
    if (closeOnSelect) setIsOpen(false);
  };

  const renderItems = (items: DropdownItem[], level = 0) => (
    <ul role="menu" className={cn(
      'py-1 dropdown-menu min-w-[160px] max-h-60 overflow-auto',
      level > 0 && 'absolute left-full top-0 ml-1 mt-[-1px]'
    )}>
      {items.map((item, index) => {
        if (item.divider) {
          return <li key={`divider-${index}`} role="separator" className="border-t border-neutral-200 dark:border-neutral-700 my-1" />;
        }
        
        if (item.subItems) {
          return (
            <li key={item.value} role="none" className="relative">
              <button
                role="menuitem"
                tabIndex={-1}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                  'text-neutral-700 dark:text-neutral-300',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-800',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
                disabled={item.disabled}
                aria-haspopup="true"
                aria-expanded="false"
              >
                {item.icon && <span className="flex-shrink-0 h-4 w-4">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </button>
              {renderItems(item.subItems, level + 1)}
            </li>
          );
        }

        return (
          <li key={item.value} role="none">
            <button
              role="menuitem"
              tabIndex={-1}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                item.danger
                  ? 'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-800',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon && <span className="flex-shrink-0 h-4 w-4">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="px-1.5 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-500 dark:text-neutral-400 font-mono">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const dropdownWidth = typeof width === 'number' ? `${width}px` : 'w-full';

  const dropdownContent = isOpen && triggerRect ? (
    <div
      ref={dropdownRef}
      className={cn(
        'fixed z-[100]',
        align === 'left' ? 'left-0' : 'right-0',
        'top-0'
      )}
      style={{
        left: align === 'left' ? triggerRect.left : undefined,
        right: align === 'right' ? window.innerWidth - triggerRect.right : undefined,
        top: triggerRect.bottom + 6, // 6px gap
        minWidth: dropdownWidth === 'w-full' ? triggerRect.width : dropdownWidth,
        maxHeight: '60vh',
      }}
    >
      <div className="dropdown-menu min-w-[220px] max-w-[320px] w-full glass-strong rounded-2xl shadow-[0_24px_64px_rgb(0,0,0,0.4),inset_0_1px_0_rgba(120,113,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.15)] border-[rgba(120,113,255,0.2)] backdrop-blur-2xl overflow-hidden">
        {/* Optional Header */}
        {header && (
          <div className="px-3 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50">
            {header}
          </div>
        )}
        {renderItems(items)}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="inline-block">
        {trigger}
      </div>
      {/* Portal to body to avoid clipping and stacking context issues */}
      {isWeb && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}

export interface SelectDropdownProps {
  value: string;
  placeholder: string;
  options: { value: string; label: string; icon?: ReactNode; disabled?: boolean }[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
}

export function SelectDropdown({ value, placeholder, options, onChange, className, disabled, required, error }: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isWeb) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    getDocument()?.addEventListener('mousedown', handleClickOutside);
    return () => getDocument()?.removeEventListener('mousedown', handleClickOutside);
  }, [isWeb]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'glass input-glass',
          'text-left text-neutral-900 dark:text-neutral-100',
          'rounded-lg transition-colors',
          error
            ? 'border-danger-500 focus:ring-2 focus:ring-danger-500'
            : 'border-neutral-300/50 dark:border-neutral-700/50 hover:border-neutral-400/50 dark:hover:border-neutral-600/50',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <span className={cn('truncate', !selectedOption && 'text-neutral-400 dark:text-neutral-500')}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto dropdown-menu"
        >
          {options.map(option => (
            <li key={option.value} role="option" aria-selected={value === option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                disabled={option.disabled}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                  value === option.value
                    ? 'bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.icon && <span className="flex-shrink-0 h-4 w-4">{option.icon}</span>}
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 ml-auto text-primary-600 dark:text-primary-400" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}