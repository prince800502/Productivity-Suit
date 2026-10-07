'use client';

import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './components/Toast';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultMode="system">
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}