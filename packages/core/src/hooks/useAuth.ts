import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

// Cross-platform environment variable access
function getAppUrl(): string {
  const globalAny = globalThis as any;
  const processEnv = globalAny.process?.env;
  
  if (processEnv?.NEXT_PUBLIC_APP_URL) {
    return processEnv.NEXT_PUBLIC_APP_URL;
  }
  if (processEnv?.EXPO_PUBLIC_APP_URL) {
    return processEnv.EXPO_PUBLIC_APP_URL;
  }
  return 'http://localhost:3000';
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: sessionData } }: { data: { session: Session | null } }) => {
      setState(prev => ({ ...prev, session: sessionData, user: sessionData?.user ?? null, loading: false }));
      if (sessionData?.user) {
        fetchProfile(sessionData.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, profile: null }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setState(prev => ({ ...prev, profile: data as Profile }));
    }
  };

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getAppUrl()}/auth/callback`,
      },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setState(prev => ({ ...prev, user: null, profile: null, session: null }));
    }
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/auth/reset-password`,
    });
    return { data, error };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!state.user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single();
    
    if (!error && data) {
      setState(prev => ({ ...prev, profile: data as Profile }));
    }
    return { data, error };
  }, [state.user]);

  return {
    ...state,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated: !!state.user,
  };
}

// Profile-specific hook
export function useProfile() {
  const { profile, updateProfile, loading } = useAuth();
  return { profile, updateProfile, loading };
}