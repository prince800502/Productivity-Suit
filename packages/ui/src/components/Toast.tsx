import { useState, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { isWeb, getDocument, getWindow } from '../utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
}

export interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

const glassColors = {
  success: 'glass border-success-200/50 dark:border-success-800/50 text-success-800 dark:text-success-300',
  error: 'glass border-danger-200/50 dark:border-danger-800/50 text-danger-800 dark:text-danger-300',
  warning: 'glass border-warning-200/50 dark:border-warning-800/50 text-warning-800 dark:text-warning-300',
  info: 'glass border-primary-200/50 dark:border-primary-800/50 text-primary-800 dark:text-primary-300',
  default: 'glass border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-300',
};

const iconColors = {
  success: 'text-success-500',
  error: 'text-danger-500',
  warning: 'text-warning-500',
  info: 'text-primary-500',
  default: 'text-neutral-500',
};

export function ToastComponent({ 
  id, 
  type = 'default', 
  title, 
  message, 
  duration = 5000, 
  action, 
  dismissible = true, 
  onClose 
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 200);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-glass',
        'min-w-[300px] max-w-md',
        'animate-slide-in-right',
        isExiting && 'animate-fade-out translate-x-full opacity-0',
        glassColors[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={cn('flex-shrink-0 mt-0.5', iconColors[type])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ '--focus-ring-color': iconColors[type].replace('text-', '') } as React.CSSProperties}
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => { setIsExiting(true); setTimeout(() => onClose(id), 200); }}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({ toasts, onClose, position = 'top-right' }: ToastContainerProps) {
  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (toasts.length === 0) return null;

  const container = (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2 pointer-events-none',
        positions[position]
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-md">
          <ToastComponent {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );

  if (!isWeb) return null;
  return createPortal(container, getDocument()!.body);
}

// Toast hook for easy usage
import { createContext, useContext } from 'react';

interface ToastContextType {
  toast: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}