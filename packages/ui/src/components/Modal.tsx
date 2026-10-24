'use client';

import { Fragment, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';
import { X } from 'lucide-react';
import { Button } from './Button';
import { isWeb, getDocument, getWindow } from '../utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  // New props for enhanced modal
  footer?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  headerClassName,
  bodyClassName,
  footerClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && isWeb) {
      previousActiveElement.current = getDocument()?.activeElement as HTMLElement;
      const body = getDocument()?.body;
      if (body) body.style.overflow = 'hidden';
      modalRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }
        if (e.key === 'Tab') {
          trapFocus(e);
        }
      };

      getDocument()?.addEventListener('keydown', handleKeyDown);
      return () => {
        getDocument()?.removeEventListener('keydown', handleKeyDown);
        const body = getDocument()?.body;
        if (body) body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, closeOnEscape, onClose]);

  const trapFocus = (e: KeyboardEvent) => {
    if (!modalRef.current || !isWeb) return;
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && getDocument()?.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && getDocument()?.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-[40rem]',    // 640px - standard form modal
    lg: 'max-w-[48rem]',    // 768px - larger forms
    xl: 'max-w-[56rem]',    // 896px - large forms
    full: 'max-w-[90vw]',   // full screen
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop with blur - only blurs what's behind it (the app) */}
      <div
        className="fixed inset-0 modal-overlay modal-overlay-enter"
        aria-hidden="true"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div className="flex min-h-[calc(100dvh-48px)] items-center justify-center p-4 md:p-6">
        <div
          ref={modalRef}
          tabIndex={-1}
          className={cn(
            'w-full rounded-2xl modal-enter modal-content animate-in',
            sizes[size]
          )}
        >
          {(title || showCloseButton) && (
            <div className={cn(
              'flex items-start justify-between px-6 py-5 border-b',
              headerClassName
            )}>
              <div className="pr-4">
                {title && (
                  <h2 id="modal-title" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="h-5 w-5" />}
                  onClick={onClose}
                  aria-label="Close modal"
                  className="flex-shrink-0 -mr-2"
                />
              )}
            </div>
          )}
          <div className={cn('overflow-y-auto max-h-[calc(100dvh-12rem)] p-6', bodyClassName)}>
            {children}
          </div>
          {footer && (
            <div className={cn(
              'flex items-center justify-end gap-3 px-6 py-4 border-t',
              footerClassName
            )}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // During SSR/type checking, render a placeholder instead of null to avoid JSX parsing issues
  if (!isWeb) {
    return (
      <div data-modal-placeholder="true" style={{ display: 'none' }}>
        {children}
      </div>
    );
  }
  return createPortal(modalContent, getDocument()!.body);
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={
      <div className="flex justify-end gap-3 w-full">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    }>
      <p className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed">{message}</p>
    </Modal>
  );
}

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: 'text-success-600 dark:text-success-400',
    error: 'text-danger-600 dark:text-danger-400',
    warning: 'text-warning-600 dark:text-warning-400',
    info: 'text-primary-600 dark:text-primary-400',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={
      <div className="flex justify-end w-full">
        <Button onClick={onClose}>OK</Button>
      </div>
    }>
      <div className="flex items-start gap-3">
        <span className={cn('text-2xl mt-0.5 flex-shrink-0', colors[type])}>{icons[type]}</span>
        <p className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}