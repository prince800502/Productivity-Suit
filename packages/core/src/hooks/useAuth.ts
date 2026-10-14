import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Track if initial profile fetch has completed to avoid overwriting form edits
  const profileLoadedRef = useRef(false);

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
        profileLoadedRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[useAuth] fetchProfile error:', error);
      // Don't overwrite profile state on error - keep existing data
      return;
    }

    if (data) {
      setState(prev => ({ ...prev, profile: data as Profile }));
      profileLoadedRef.current = true;
    } else {
      // Profile not found - this shouldn't happen for authenticated users due to trigger
      console.warn('[useAuth] fetchProfile: no profile found for user', userId);
      setState(prev => ({ ...prev, profile: null }));
      profileLoadedRef.current = true;
    }
  }, []);

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
      profileLoadedRef.current = false;
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
    // Get the current authenticated user directly from Supabase to avoid closure staleness
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Only allow updating valid database columns (exclude id, email, created_at, updated_at)
    const allowedUpdates: Partial<Profile> = {};
    const allowedKeys: (keyof Profile)[] = [
      'full_name',
      'avatar_url',
      'currency',
      'monthly_budget',
      'theme',
      'notification_preferences',
    ];
    
    for (const key of allowedKeys) {
      if (key in updates) {
        (allowedUpdates as any)[key] = (updates as any)[key];
      }
    }

    // Use update (not upsert) since profile should always exist via trigger
    // This avoids potential upsert conflict issues and ensures we're updating the correct row
    const { data, error } = await supabase
      .from('profiles')
      .update(allowedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[useAuth] updateProfile error:', error);
      return { data: null, error };
    }

    // Verify the returned row contains the saved values
    if (data) {
      const returnedProfile = data as Profile;
      let verificationFailed = false;
      
      for (const key of allowedKeys) {
        if (key in allowedUpdates) {
          const submittedValue = (allowedUpdates as any)[key];
          const returnedValue = (returnedProfile as any)[key];
          
          // Handle null/undefined and object comparison for notification_preferences
          if (key === 'notification_preferences') {
            // For objects, do a shallow comparison of keys that were submitted
            if (submittedValue && returnedValue) {
              for (const subKey of Object.keys(submittedValue)) {
                if (submittedValue[subKey] !== returnedValue[subKey]) {
                  console.warn(`[useAuth] updateProfile verification mismatch for ${key}.${subKey}:`, {
                    submitted: submittedValue[subKey],
                    returned: returnedValue[subKey],
                  });
                  verificationFailed = true;
                }
              }
            } else if (submittedValue !== returnedValue) {
              console.warn(`[useAuth] updateProfile verification mismatch for ${key}:`, {
                submitted: submittedValue,
                returned: returnedValue,
              });
              verificationFailed = true;
            }
          } else if (submittedValue !== returnedValue) {
            console.warn(`[useAuth] updateProfile verification mismatch for ${key}:`, {
              submitted: submittedValue,
              returned: returnedValue,
            });
            verificationFailed = true;
          }
        }
      }

      if (verificationFailed) {
        console.error('[useAuth] updateProfile: returned data does not match submitted values');
        // Still update local state with returned data (source of truth)
        setState(prev => ({ ...prev, profile: returnedProfile }));
        return { data: returnedProfile, error: new Error('Database verification failed: returned data mismatch') };
      }

      // Update local state only after confirmed persistence
      setState(prev => ({ ...prev, profile: returnedProfile }));
    }

    return { data, error };
  }, []);

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
    profileLoaded: profileLoadedRef.current,
  };
}

// Profile-specific hook
export function useProfile() {
  const { profile, updateProfile, loading } = useAuth();
  return { profile, updateProfile, loading };
}