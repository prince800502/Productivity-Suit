'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@productivity-suite/ui';
import { ToastProvider } from '@productivity-suite/ui';
import { initializeSupabaseClient, setSharedSupabaseClient } from '@productivity-suite/core';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useState, ReactNode } from 'react';

// Initialize Supabase client SYNCHRONOUSLY at module level to ensure
// it's available before any hooks try to access it.
// This runs once when the module is first imported (client-side only).
let supabaseInitialized = false;

function initializeSupabaseSync() {
  if (typeof window === 'undefined' || supabaseInitialized) return;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (url && key) {
    const browserClient = getSupabaseBrowserClient();
    initializeSupabaseClient(url, key, { client: browserClient });
    setSharedSupabaseClient(browserClient);
    supabaseInitialized = true;
  } else {
    console.warn('Supabase credentials not found in environment variables');
  }
}

// Initialize immediately when module loads (client-side)
if (typeof window !== 'undefined') {
  initializeSupabaseSync();
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultMode="system">
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}