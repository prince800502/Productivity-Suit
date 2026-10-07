import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Reminder, ReminderForm, ReminderRepeat } from '../types';
import { format, addDays, addWeeks, addMonths, isAfter, isBefore } from 'date-fns';

export const reminderKeys = {
  all: ['reminders'] as const,
  lists: () => [...reminderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...reminderKeys.lists(), filters] as const,
  details: () => [...reminderKeys.all, 'detail'] as const,
  detail: (id: string) => [...reminderKeys.details(), id] as const,
  pending: () => [...reminderKeys.all, 'pending'] as const,
  today: () => [...reminderKeys.all, 'today'] as const,
};

export function useReminders(filters?: { is_active?: boolean; repeat?: ReminderRepeat }) {
  return useQuery({
    queryKey: reminderKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('reminders')
        .select('*')
        .order('trigger_at', { ascending: true });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.repeat) {
        query = query.eq('repeat', filters.repeat);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Reminder[];
    },
  });
}

export function usePendingReminders() {
  return useQuery({
    queryKey: reminderKeys.pending(),
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_active', true)
        .lte('trigger_at', now)
        .order('trigger_at', { ascending: true });
      if (error) throw error;
      return data as Reminder[];
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
}

export function useTodayReminders() {
  return useQuery({
    queryKey: reminderKeys.today(),
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_active', true)
        .gte('trigger_at', startOfDay.toISOString())
        .lte('trigger_at', endOfDay.toISOString())
        .order('trigger_at', { ascending: true });
      if (error) throw error;
      return data as Reminder[];
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminder: ReminderForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reminders')
        .insert({ ...reminder, user_id: user.id, is_active: true })
        .select()
        .single();
      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.pending() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ReminderForm> }) => {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.pending() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.pending() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });
}

export function useToggleReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('reminders')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.pending() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });
}

// Helper to calculate next trigger time for recurring reminders
export function calculateNextTrigger(triggerAt: string, repeat: ReminderRepeat | null): string | null {
  if (!repeat || repeat === 'none') return null;

  const date = new Date(triggerAt);
  let nextDate: Date;

  switch (repeat) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    default:
      return null;
  }

  return nextDate.toISOString();
}

// Process recurring reminders (call this from a cron job or scheduled function)
export async function processRecurringReminders() {
  const now = new Date().toISOString();
  
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('is_active', true)
    .neq('repeat', 'none')
    .lte('trigger_at', now);

  if (error) throw error;

  for (const reminder of reminders as Reminder[]) {
    const nextTrigger = calculateNextTrigger(reminder.trigger_at, reminder.repeat);
    if (nextTrigger) {
      await supabase
        .from('reminders')
        .update({ trigger_at: nextTrigger })
        .eq('id', reminder.id);
    }
  }

  return reminders.length;
}

// Notification permission helpers (web only - conditionally exported)
// These functions will be replaced by platform-specific implementations
export interface NotificationPermissionResult {
  permission: 'granted' | 'denied' | 'default';
}

export async function requestNotificationPermission(): Promise<NotificationPermissionResult['permission']> {
  // Server/React Native: return denied as default
  // Web implementation should be provided by platform-specific code
  return 'denied';
}

export function showNotification(title: string, options?: Record<string, unknown>) {
  // No-op on non-web platforms
  return null;
}

// Schedule a reminder notification
export function scheduleReminderNotification(reminder: Reminder): ReturnType<typeof setTimeout> | null {
  // No-op on non-web platforms
  return null;
}

// Cancel scheduled notification
export function cancelReminderNotification(timeoutId: ReturnType<typeof setTimeout> | null) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}