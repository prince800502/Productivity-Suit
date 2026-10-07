'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';
import { useState, useEffect } from 'react';
import { initializeSupabaseClient } from '@productivity-suite/core';
import Constants from 'expo-constants';

// Initialize Supabase client for core package hooks
// This must happen before any core hooks are used
let coreSupabaseInitialized = false;

function initializeCoreSupabase() {
  if (coreSupabaseInitialized) return;
  
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;
  
  if (supabaseUrl && supabaseAnonKey) {
    initializeSupabaseClient(supabaseUrl, supabaseAnonKey);
    coreSupabaseInitialized = true;
  } else {
    console.warn('Core Supabase credentials not found in Expo config');
  }
}

// Initialize immediately when module loads
initializeCoreSupabase();

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
      <AuthProvider>
        <ThemeProvider defaultMode="system">
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}