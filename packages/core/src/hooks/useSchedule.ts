import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ScheduleEvent, ScheduleEventType, ScheduleEventForm, Holiday, HolidayForm } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export const scheduleKeys = {
  all: ['schedule'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...scheduleKeys.lists(), filters] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
  weekly: (weekStart: string) => [...scheduleKeys.all, 'weekly', weekStart] as const,
  today: () => [...scheduleKeys.all, 'today'] as const,
  holidays: () => [...scheduleKeys.all, 'holidays'] as const,
};

export function useScheduleEvents(filters?: {
  day_of_week?: number;
  event_type?: ScheduleEventType;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: scheduleKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('schedule_events')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (filters?.day_of_week !== undefined) {
        query = query.eq('day_of_week', filters.day_of_week);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.start_date) {
        query = query.gte('start_time', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('start_time', filters.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduleEvent[];
    },
  });
}

export function useWeeklySchedule(weekStart: string) {
  return useQuery({
    queryKey: scheduleKeys.weekly(weekStart),
    queryFn: async () => {
      const start = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      const { data: events, error: eventsError } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('is_recurring', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });
      if (eventsError) throw eventsError;

      const { data: holidays, error: holidaysError } = await supabase
        .from('holidays')
        .select('*')
        .or(`date.gte.${format(start, 'yyyy-MM-dd')},date.lte.${format(end, 'yyyy-MM-dd')}`);
      if (holidaysError) throw holidaysError;

      const scheduleMap = new Map<number, ScheduleEvent[]>();
      days.forEach((day, index) => {
        scheduleMap.set(index, []);
      });

      (events as ScheduleEvent[]).forEach(event => {
        const dayEvents = scheduleMap.get(event.day_of_week) || [];
        dayEvents.push(event);
        scheduleMap.set(event.day_of_week, dayEvents);
      });

      return {
        week_start: format(start, 'yyyy-MM-dd'),
        days: Array.from(scheduleMap.entries()).map(([dayIndex, events]) => ({
          day_index: dayIndex,
          date: format(days[dayIndex], 'yyyy-MM-dd'),
          day_name: format(days[dayIndex], 'EEEE'),
          events: events.sort((a, b) => a.start_time.localeCompare(b.start_time)),
          is_holiday: holidays.some((h: { date: string }) => h.date === format(days[dayIndex], 'yyyy-MM-dd')),
        })),
      };
    },
    enabled: !!weekStart,
  });
}

export function useTodaySchedule() {
  return useQuery({
    queryKey: scheduleKeys.today(),
    queryFn: async () => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, but we use 1 = Monday
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Mon, 6=Sun
      const dateStr = format(today, 'yyyy-MM-dd');

      const { data: events, error: eventsError } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('day_of_week', adjustedDayOfWeek)
        .eq('is_recurring', true)
        .order('start_time', { ascending: true });
      if (eventsError) throw eventsError;

      const { data: holidays, error: holidaysError } = await supabase
        .from('holidays')
        .select('*')
        .eq('date', dateStr)
        .maybeSingle();
      if (holidaysError) throw holidaysError;

      return {
        date: dateStr,
        day_name: format(today, 'EEEE'),
        events: events as ScheduleEvent[],
        is_holiday: !!holidays,
        holiday_name: holidays?.name,
      };
    },
  });
}

export function useCreateScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: ScheduleEventForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('schedule_events')
        .insert({ ...event, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.today() });
    },
  });
}

export function useUpdateScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduleEventForm> }) => {
      const { data, error } = await supabase
        .from('schedule_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.today() });
    },
  });
}

export function useDeleteScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedule_events').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.today() });
    },
  });
}

// Holidays
export function useHolidays() {
  return useQuery({
    queryKey: scheduleKeys.holidays(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data as Holiday[];
    },
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holiday: HolidayForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('holidays')
        .insert({ ...holiday, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Holiday;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.holidays() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.today() });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.holidays() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.today() });
    },
  });
}

// Bulk import from calendar file (ICS/CSV)
export function useImportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (events: Omit<ScheduleEventForm, 'user_id'>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const eventsWithUser = events.map(e => ({ ...e, user_id: user.id }));
      const { data, error } = await supabase
        .from('schedule_events')
        .insert(eventsWithUser)
        .select();
      if (error) throw error;
      return data as ScheduleEvent[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.today() });
    },
  });
}