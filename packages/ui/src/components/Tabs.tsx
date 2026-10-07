import { useState, ReactNode, KeyboardEvent, useContext, createContext } from 'react';
import { cn } from '../utils';

export interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  children?: ReactNode;
}

interface TabsContextType {
  value: string;
  onChange: (value: string) => void;
  variant?: 'line' | 'enclosed' | 'soft' | 'pills';
  fullWidth?: boolean;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within a Tabs component');
  }
  return context;
}

const variants = {
  line: {
    container: 'border-b border-neutral-200 dark:border-neutral-800',
    tab: 'border-b-2 -mb-px',
    active: 'border-primary-600 text-primary-600 dark:text-primary-400',
    inactive: 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
  },
  enclosed: {
    container: '',
    tab: 'rounded-lg',
    active: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm',
    inactive: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
  },
  soft: {
    container: '',
    tab: 'rounded-lg',
    active: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    inactive: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
  },
  pills: {
    container: 'bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg',
    tab: 'rounded-md',
    active: 'bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-300 shadow',
    inactive: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
  },
};

const handleKeyDown = (event: KeyboardEvent, tabs: Tab[], index: number, onChange: (value: string) => void) => {
  let newIndex = index;
  if (event.key === 'ArrowRight') newIndex = (index + 1) % tabs.length;
  if (event.key === 'ArrowLeft') newIndex = (index - 1 + tabs.length) % tabs.length;
  if (event.key === 'Home') newIndex = 0;
  if (event.key === 'End') newIndex = tabs.length - 1;

  if (newIndex !== index && !tabs[newIndex].disabled) {
    event.preventDefault();
    onChange(tabs[newIndex].value);
  }
};

function renderTabList({ tabs = [], value, onChange, variant = 'line', fullWidth = false }: { tabs: Tab[]; value: string; onChange: (value: string) => void; variant: 'line' | 'enclosed' | 'soft' | 'pills'; fullWidth: boolean }) {
  const { container, tab, active, inactive } = variants[variant];

  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className={cn('flex gap-1', variant === 'pills' && container, variant !== 'pills' && container)}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          aria-controls={`${tab.value}-panel`}
          id={`${tab.value}-tab`}
          tabIndex={value === tab.value ? 0 : -1}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.value)}
          onKeyDown={e => handleKeyDown(e, tabs, index, onChange)}
          className={cn(
            'flex items-center gap-1.5 font-medium text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            tab.disabled && 'opacity-50 cursor-not-allowed',
            fullWidth && 'flex-1 justify-center',
            tab,
            value === tab.value ? active : inactive
          )}
        >
          {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function renderTabPanels({ tabs = [], value }: { tabs: Tab[]; value: string }) {
  return (
    <div className="mt-4">
      {tabs.map(tab => (
        <div
          key={tab.value}
          role="tabpanel"
          id={`${tab.value}-panel`}
          aria-labelledby={`${tab.value}-tab`}
          hidden={value !== tab.value}
          className="animate-fade-in"
        >
          {tab.children}
        </div>
      ))}
    </div>
  );
}

export interface TabsProps {
  tabs?: Tab[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'line' | 'enclosed' | 'soft' | 'pills';
  className?: string;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Tabs = ({ tabs, value, onChange, variant = 'line', className, fullWidth = false, children }: TabsProps) => {
  const isCompoundApi = typeof children === 'object' && children !== null && !Array.isArray(tabs);

  if (!isCompoundApi) {
    return (
      <div className={cn(className)}>
        {renderTabList({ tabs: tabs || [], value, onChange, variant, fullWidth })}
        {renderTabPanels({ tabs: tabs || [], value })}
      </div>
    );
  }

  return (
    <TabsContext.Provider value={{ value, onChange, variant, fullWidth }}>
      <div className={cn(className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const { variant = 'line', fullWidth = false } = useTabsContext();

  const variantStyles = {
    line: 'border-b border-neutral-200 dark:border-neutral-800',
    enclosed: '',
    soft: '',
    pills: 'bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg',
  };

  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className={cn('flex gap-1', variantStyles[variant], className)}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function TabsTrigger({ value, children, disabled, className, icon }: TabsTriggerProps) {
  const { value: activeValue, onChange, variant = 'line', fullWidth = false } = useTabsContext();

  const { tab, active, inactive } = variants[variant];

  return (
    <button
      role="tab"
      aria-selected={activeValue === value}
      aria-controls={`${value}-panel`}
      id={`${value}-tab`}
      tabIndex={activeValue === value ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={cn(
        'flex items-center gap-1.5 font-medium text-sm transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        fullWidth && 'flex-1 justify-center',
        tab,
        activeValue === value ? active : inactive,
        className
      )}
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`${value}-panel`}
      aria-labelledby={`${value}-tab`}
      className={cn('mt-4 animate-fade-in', className)}
    >
      {children}
    </div>
  );
}

// Alias for backward compatibility
export { TabsContent as TabPanel };