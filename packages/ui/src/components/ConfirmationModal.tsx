'use client';

import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { isWeb, getDocument } from '../utils';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantColors = {
  danger: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
  warning: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
  primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
};

const iconComponents = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  primary: CheckCircle,
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  size = 'md',
}: ConfirmationModalProps) {
  const Icon = iconComponents[variant];
  const confirmClass = variantColors[variant];

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  if (!isOpen) return null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none',
        'bg-black/50 backdrop-blur-sm'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <div
        className={cn(
          'pointer-events-auto w-full glass-strong rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-800/50',
          'animate-scale-in',
          sizeClasses[size]
        )}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', variant === 'danger' ? 'bg-danger-100 dark:bg-danger-900/30' : variant === 'warning' ? 'bg-warning-100 dark:bg-warning-900/30' : 'bg-primary-100 dark:bg-primary-900/30')}>
                <Icon className={cn('w-5 h-5', variant === 'danger' ? 'text-danger-600 dark:text-danger-400' : variant === 'warning' ? 'text-warning-600 dark:text-warning-400' : 'text-primary-600 dark:text-primary-400')} />
              </div>
              <div>
                <h2 id="confirmation-modal-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {title}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-shrink-0 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {description && (
            <p id="confirmation-modal-description" className="text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              className={confirmClass}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isWeb) return null;
  return createPortal(modalContent, getDocument()!.body);
}