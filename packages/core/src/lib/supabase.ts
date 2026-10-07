import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '../types';

// Singleton pattern for Supabase client
let supabaseInstance: SupabaseClient<Database> | null = null;

// Type assertion helper
function assertClient(client: SupabaseClient<Database> | null): asserts client is SupabaseClient<Database> {
  if (!client) throw new Error('Supabase client is null');
}
let isInitialized = false;

/**
 * Initialize the Supabase client. In browser environments, this should be called
 * with the shared browser client from the web app to avoid multiple GoTrueClient instances.
 * In server/non-browser environments, it creates a new client.
 */
export function initializeSupabaseClient(
  url: string, 
  anonKey: string, 
  options?: { client?: SupabaseClient<Database> }
): SupabaseClient<Database> {
  // If a client is explicitly provided (e.g., from the web app's browser client), use it
  if (options?.client) {
    supabaseInstance = options.client;
    isInitialized = true;
    return supabaseInstance;
  }
  
  // Otherwise, use the singleton pattern for standalone usage
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  if (!url || !anonKey) {
    throw new Error('Supabase URL and anon/publishable key are required');
  }
  
  supabaseInstance = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  
  isInitialized = true;
  return supabaseInstance;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call initializeSupabaseClient() first.');
  }
  return supabaseInstance!;
}
 
export function isSupabaseInitialized(): boolean {
  return isInitialized;
}

/**
 * Set a shared Supabase client instance (e.g., the browser client from the web app).
 * This avoids multiple GoTrueClient instances and ensures shared auth state.
 */
export function setSharedSupabaseClient(client: SupabaseClient<Database>): void {
  supabaseInstance = client;
  isInitialized = true;
}

// For backwards compatibility - throws helpful error if not initialized
export const supabase = new Proxy({} as any, {
  get(_, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

// Auth helpers
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || '/reset-password',
  });
  return { data, error };
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  return { data, error };
}

// Profile helpers
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// Realtime subscriptions
export function subscribeToTable<T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (payload: { new: Database['public']['Tables'][T]['Row']; old: Database['public']['Tables'][T]['Row'] | null; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void,
  filter?: string
) {
  const channel = supabase
    .channel(`realtime:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload: { new: Record<string, unknown>; old: Record<string, unknown> | null; eventType: string }) => {
        callback({
          new: payload.new as unknown as Database['public']['Tables'][T]['Row'],
          old: payload.old as unknown as Database['public']['Tables'][T]['Row'] | null,
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Storage helpers
export async function uploadAvatar(userId: string, file: File | Blob) {
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const fileName = `${userId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) return { data: null, error };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return { data: { path: filePath, publicUrl }, error: null };
}

export async function deleteAvatar(userId: string) {
  const { data, error } = await supabase.storage.from('avatars').remove([`avatars/${userId}.jpg`]);
  return { data, error };
}