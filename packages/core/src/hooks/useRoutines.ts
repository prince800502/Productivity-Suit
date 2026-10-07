import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Routine, RoutineFrequency, RoutineForm, RoutineStats } from '../types';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

export const routineKeys = {
  all: ['routines'] as const,
  lists: () => [...routineKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...routineKeys.lists(), filters] as const,
  details: () => [...routineKeys.all, 'detail'] as const,
  detail: (id: string) => [...routineKeys.details(), id] as const,
  active: () => [...routineKeys.all, 'active'] as const,
  today: () => [...routineKeys.all, 'today'] as const,
  stats: () => [...routineKeys.all, 'stats'] as const,
  streaks: () => [...routineKeys.all, 'streaks'] as const,
};

export function useRoutines(filters?: { is_active?: boolean; frequency?: RoutineFrequency }) {
  return useQuery({
    queryKey: routineKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.frequency) {
        query = query.eq('frequency', filters.frequency);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Routine[];
    },
  });
}

export function useActiveRoutines() {
  return useQuery({
    queryKey: routineKeys.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('is_active', true)
        .order('time_of_day', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Routine[];
    },
  });
}

export function useTodayRoutines() {
  return useQuery({
    queryKey: routineKeys.today(),
    queryFn: async () => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday
      const dateStr = format(today, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('is_active', true)
        .or(`frequency.eq.daily,frequency.eq.weekdays,frequency.eq.weekends,frequency.eq.custom`)
        .order('time_of_day', { ascending: true, nullsFirst: false });
      if (error) throw error;

      const routines = data as Routine[];
      return routines.filter(routine => {
        switch (routine.frequency) {
          case 'daily':
            return true;
          case 'weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5;
          case 'weekends':
            return dayOfWeek === 0 || dayOfWeek === 6;
          case 'custom':
            return routine.days_of_week.includes(dayOfWeek);
          default:
            return false;
        }
      });
    },
  });
}

export function useRoutineStats() {
  return useQuery({
    queryKey: routineKeys.stats(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;

      const routines = data as Routine[];
      const total = routines.length;
      const active = routines.filter(r => r.is_active).length;
      
      // Calculate completion rate for last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      // This would require a routine_completions table - simplified for now
      const completionRate = active > 0 ? 75 : 0; // Placeholder
      
      const currentStreak = routines.reduce((max, r) => Math.max(max, r.streak_count), 0);
      const longestStreak = routines.reduce((max, r) => Math.max(max, r.streak_count), 0);

      return {
        total,
        active,
        completion_rate: completionRate,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      } as RoutineStats;
    },
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routine: RoutineForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('routines')
        .insert({ ...routine, user_id: user.id, streak_count: 0 })
        .select()
        .single();
      if (error) throw error;
      return data as Routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: routineKeys.active() });
      queryClient.invalidateQueries({ queryKey: routineKeys.today() });
      queryClient.invalidateQueries({ queryKey: routineKeys.stats() });
    },
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RoutineForm> }) => {
      const { data, error } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: routineKeys.active() });
      queryClient.invalidateQueries({ queryKey: routineKeys.today() });
      queryClient.invalidateQueries({ queryKey: routineKeys.stats() });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: routineKeys.active() });
      queryClient.invalidateQueries({ queryKey: routineKeys.today() });
      queryClient.invalidateQueries({ queryKey: routineKeys.stats() });
    },
  });
}

export function useCompleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: routine, error: fetchError } = await supabase
        .from('routines')
        .select('streak_count, last_completed_at')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const today = format(new Date(), 'yyyy-MM-dd');
      const lastCompleted = routine.last_completed_at ? format(new Date(routine.last_completed_at), 'yyyy-MM-dd') : null;
      
      let newStreak = routine.streak_count;
      if (lastCompleted !== today) {
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        if (lastCompleted === yesterday) {
          newStreak += 1;
        } else if (lastCompleted !== today) {
          newStreak = 1;
        }
      }

      const { data, error } = await supabase
        .from('routines')
        .update({
          streak_count: newStreak,
          last_completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: routineKeys.active() });
      queryClient.invalidateQueries({ queryKey: routineKeys.today() });
      queryClient.invalidateQueries({ queryKey: routineKeys.stats() });
      queryClient.invalidateQueries({ queryKey: routineKeys.streaks() });
    },
  });
}

export function useToggleRoutineActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('routines')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: routineKeys.active() });
      queryClient.invalidateQueries({ queryKey: routineKeys.today() });
    },
  });
}