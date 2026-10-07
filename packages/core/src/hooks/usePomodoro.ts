import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PomodoroSession, PomodoroType, PomodoroStatus, PomodoroForm, PomodoroStats } from '../types';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';

export const pomodoroKeys = {
  all: ['pomodoro'] as const,
  lists: () => [...pomodoroKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...pomodoroKeys.lists(), filters] as const,
  details: () => [...pomodoroKeys.all, 'detail'] as const,
  detail: (id: string) => [...pomodoroKeys.details(), id] as const,
  active: () => [...pomodoroKeys.all, 'active'] as const,
  today: () => [...pomodoroKeys.all, 'today'] as const,
  stats: () => [...pomodoroKeys.all, 'stats'] as const,
  streak: () => [...pomodoroKeys.all, 'streak'] as const,
};

export function usePomodoroSessions(filters?: {
  type?: PomodoroType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: pomodoroKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('pomodoro_sessions')
        .select('*')
        .order('started_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.startDate) {
        query = query.gte('started_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('started_at', filters.endDate);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PomodoroSession[];
    },
  });
}

export function useActivePomodoro() {
  return useQuery({
    queryKey: pomodoroKeys.active(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['running', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PomodoroSession | null;
    },
    refetchInterval: 5000, // Poll for active session
  });
}

export function useTodayPomodoro() {
  return useQuery({
    queryKey: pomodoroKeys.today(),
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const start = startOfDay(new Date(today));
      const end = endOfDay(new Date(today));

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .gte('started_at', start.toISOString())
        .lte('started_at', end.toISOString())
        .eq('status', 'completed')
        .order('started_at', { ascending: true });
      if (error) throw error;
      return data as PomodoroSession[];
    },
  });
}

export function usePomodoroStats() {
  return useQuery({
    queryKey: pomodoroKeys.stats(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('type, duration_minutes, completed_minutes, status, started_at')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      if (error) throw error;

      const sessions = data as PomodoroSession[];
      const totalSessions = sessions.length;
      const totalFocusMinutes = sessions
        .filter(s => s.type === 'focus')
        .reduce((sum, s) => sum + s.completed_minutes, 0);
      const averageSessionLength = totalSessions > 0
        ? sessions.reduce((sum, s) => sum + s.completed_minutes, 0) / totalSessions
        : 0;

      const byType: Record<PomodoroType, number> = {
        focus: 0,
        short_break: 0,
        long_break: 0,
      };
      sessions.forEach(s => byType[s.type]++);

      // Calculate streak (consecutive days with at least one focus session)
      const focusDays = new Set(
        sessions
          .filter(s => s.type === 'focus')
          .map(s => format(new Date(s.started_at), 'yyyy-MM-dd'))
      );
      
      let streakDays = 0;
      let currentDate = new Date();
      while (focusDays.has(format(currentDate, 'yyyy-MM-dd'))) {
        streakDays++;
        currentDate = subDays(currentDate, 1);
      }

      return {
        total_sessions: totalSessions,
        total_focus_minutes: totalFocusMinutes,
        average_session_length: Math.round(averageSessionLength),
        streak_days: streakDays,
        by_type: byType,
      } as PomodoroStats;
    },
  });
}

export function useCreatePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: PomodoroForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          ...session,
          user_id: user.id,
          status: 'running',
          completed_minutes: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as PomodoroSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.active() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.today() });
    },
  });
}

export function useUpdatePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PomodoroSession> }) => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PomodoroSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.active() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.today() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.stats() });
    },
  });
}

export function useCompletePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completedMinutes }: { id: string; completedMinutes: number }) => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update({
          status: 'completed',
          completed_minutes: completedMinutes,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PomodoroSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.active() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.today() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.stats() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.streak() });
    },
  });
}

export function usePausePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update({ status: 'paused' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PomodoroSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.active() });
    },
  });
}

export function useResumePomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update({ status: 'running' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PomodoroSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.active() });
    },
  });
}

export function useCancelPomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PomodoroSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.active() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.today() });
    },
  });
}

// Pomodoro timer hook for local state management
import { useState, useEffect, useCallback } from 'react';

export function usePomodoroTimer(initialMinutes: number = 25) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedMinutes, setCompletedMinutes] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setCompletedMinutes(prev => prev + 1);
            return 0;
          }
          return prev - 1;
        });
        setCompletedMinutes(prev => prev + 1/60);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeLeft]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback((minutes?: number) => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft((minutes ?? initialMinutes) * 60);
    setCompletedMinutes(0);
  }, [initialMinutes]);

  const skip = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(0);
  }, []);

  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  const progress = ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100;

  return {
    timeLeft,
    formattedTime,
    isRunning,
    isPaused,
    completedMinutes: Math.round(completedMinutes),
    progress,
    start,
    pause,
    resume,
    reset,
    skip,
  };
}

// Preset durations
export const POMODORO_PRESETS = {
  focus: 25,
  short_break: 5,
  long_break: 15,
} as const;