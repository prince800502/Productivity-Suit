import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  Habit, HabitCompletion, HabitStreak, HabitSkip, 
  HabitForm, HabitCompletionForm, HabitSkipForm,
  HabitStats, HabitHeatmapDay, TodayHabit, HabitFrequency 
} from '../types';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval, differenceInDays, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

// Query keys
export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...habitKeys.lists(), filters] as const,
  details: () => [...habitKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitKeys.details(), id] as const,
  active: () => [...habitKeys.all, 'active'] as const,
  today: () => [...habitKeys.all, 'today'] as const,
  completions: (habitId: string) => [...habitKeys.all, 'completions', habitId] as const,
  completionsByDate: (habitId: string, startDate: string, endDate: string) => 
    [...habitKeys.all, 'completions', habitId, startDate, endDate] as const,
  streaks: () => [...habitKeys.all, 'streaks'] as const,
  streak: (habitId: string) => [...habitKeys.streaks(), habitId] as const,
  skips: (habitId: string) => [...habitKeys.all, 'skips', habitId] as const,
  stats: (habitId: string) => [...habitKeys.all, 'stats', habitId] as const,
  heatmap: (habitId: string, year: number) => [...habitKeys.all, 'heatmap', habitId, year] as const,
  allHeatmap: (year: number) => [...habitKeys.all, 'heatmap-all', year] as const,
};

// ============================================================
// HABITS
// ============================================================

export function useHabits(filters?: { 
  is_active?: boolean; 
  frequency?: HabitFrequency;
  include_archived?: boolean;
}) {
  return useQuery({
    queryKey: habitKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (!filters?.include_archived) {
        query = query.is('archived_at', null);
      }
      if (filters?.is_active !== undefined) {
        // Active means not archived and not explicitly inactive
        query = query.is('archived_at', null);
      }
      if (filters?.frequency) {
        query = query.eq('frequency', filters.frequency);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Habit[];
    },
  });
}

export function useActiveHabits() {
  return useQuery({
    queryKey: habitKeys.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Habit[];
    },
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Habit;
    },
    enabled: !!id,
  });
}

// Today's habits for dashboard
export function useTodayHabits() {
  return useQuery({
    queryKey: habitKeys.today(),
    queryFn: async () => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday
      const dateStr = format(today, 'yyyy-MM-dd');

      const { data: habits, error } = await supabase
        .from('habits')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const filteredHabits = (habits as Habit[]).filter(habit => {
        switch (habit.frequency) {
          case 'daily':
            return true;
          case 'weekly':
            // For weekly, check if today is one of the days (simplified - could use times_per_period)
            return habit.days_of_week.length === 0 || habit.days_of_week.includes(dayOfWeek);
          case 'custom':
            return habit.days_of_week.includes(dayOfWeek);
          default:
            return false;
        }
      });

      // Get completions for today
      const { data: completions } = await supabase
        .from('habit_completions')
        .select('habit_id, count')
        .eq('date', dateStr);

      const completionMap = new Map<string, number>((completions?.map((c: { habit_id: string; count: number }) => [c.habit_id, c.count]) || []));

      return filteredHabits.map(habit => ({
        habit,
        is_completed: (completionMap.get(habit.id) || 0) >= habit.times_per_period,
        completion_count: completionMap.get(habit.id) || 0,
        target_count: habit.times_per_period,
        streak: 0, // Will be populated by streak hook
      })) as TodayHabit[];
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: HabitForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .insert({ ...habit, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.active() });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HabitForm> }) => {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: habitKeys.active() });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.active() });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('habits')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.active() });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
    },
  });
}

export function useRestoreHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('habits')
        .update({ archived_at: null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.active() });
    },
  });
}

// ============================================================
// HABIT COMPLETIONS
// ============================================================

export function useHabitCompletions(habitId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: startDate && endDate 
      ? habitKeys.completionsByDate(habitId, startDate, endDate)
      : habitKeys.completions(habitId),
    queryFn: async () => {
      let query = supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!habitId,
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (completion: HabitCompletionForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert completion (handle multiple completions per day)
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('id, count')
        .eq('habit_id', completion.habit_id)
        .eq('date', completion.date)
        .maybeSingle();

      let result;
      if (existing) {
        const newCount = existing.count + (completion.count || 1);
        const { data, error } = await supabase
          .from('habit_completions')
          .update({ 
            count: newCount,
            note: completion.note,
            mood: completion.mood,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({ 
            ...completion, 
            user_id: user.id,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Update streak
      await updateHabitStreak(completion.habit_id, completion.date);

      return result as HabitCompletion;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.completions(vars.habit_id) });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
      queryClient.invalidateQueries({ queryKey: habitKeys.streak(vars.habit_id) });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats(vars.habit_id) });
      queryClient.invalidateQueries({ queryKey: habitKeys.heatmap(vars.habit_id, new Date().getFullYear()) });
      queryClient.invalidateQueries({ queryKey: habitKeys.allHeatmap(new Date().getFullYear()) });
    },
  });
}

export function useUndoHabitCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date, count = 1 }: { habitId: string; date: string; count?: number }) => {
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('id, count')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (!existing) return null;

      const newCount = existing.count - count;
      
      if (newCount <= 0) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_completions')
          .update({ count: newCount, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      }

      // Recalculate streak
      await updateHabitStreak(habitId, date);

      return { habitId, date };
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: habitKeys.completions(result.habitId) });
        queryClient.invalidateQueries({ queryKey: habitKeys.today() });
        queryClient.invalidateQueries({ queryKey: habitKeys.streak(result.habitId) });
        queryClient.invalidateQueries({ queryKey: habitKeys.stats(result.habitId) });
        queryClient.invalidateQueries({ queryKey: habitKeys.heatmap(result.habitId, new Date().getFullYear()) });
        queryClient.invalidateQueries({ queryKey: habitKeys.allHeatmap(new Date().getFullYear()) });
      }
    },
  });
}

// ============================================================
// HABIT SKIPS
// ============================================================

export function useHabitSkips(habitId: string) {
  return useQuery({
    queryKey: habitKeys.skips(habitId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_skips')
        .select('*')
        .eq('habit_id', habitId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as HabitSkip[];
    },
    enabled: !!habitId,
  });
}

export function useSkipHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skip: HabitSkipForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habit_skips')
        .insert({ ...skip, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as HabitSkip;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.skips(vars.habit_id) });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
    },
  });
}

export function useUndoHabitSkip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const { error } = await supabase
        .from('habit_skips')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', date);
      if (error) throw error;
      return { habitId, date };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.skips(result.habitId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
    },
  });
}

// ============================================================
// HABIT STREAKS
// ============================================================

export function useHabitStreak(habitId: string) {
  return useQuery({
    queryKey: habitKeys.streak(habitId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('habit_id', habitId)
        .maybeSingle();
      if (error) throw error;
      return data as HabitStreak | null;
    },
    enabled: !!habitId,
  });
}

// Internal function to update streak (called after completion/skip)
async function updateHabitStreak(habitId: string, date: string) {
  // Get all completions for this habit
  const { data: completions } = await supabase
    .from('habit_completions')
    .select('date')
    .eq('habit_id', habitId)
    .order('date', { ascending: true });

  if (!completions || completions.length === 0) {
    // No completions, reset streak
    await supabase
      .from('habit_streaks')
      .upsert({
        habit_id: habitId,
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
        streak_start_date: null,
        updated_at: new Date().toISOString(),
      });
    return;
  }

  const completionDates = completions.map((c: { date: string }) => c.date).sort();
  const today = format(new Date(), 'yyyy-MM-dd');
  const targetDate = date;

  // Calculate current streak
  let currentStreak = 0;
  let streakStartDate = completionDates[0];
  let lastCompletedDate = completionDates[completionDates.length - 1];

  // Check from today backwards
  let checkDate: Date | string = today;
  while (true) {
    const checkDateStr = typeof checkDate === 'string' ? checkDate : format(new Date(checkDate), 'yyyy-MM-dd');
    if (completionDates.includes(checkDateStr)) {
      currentStreak++;
      checkDate = subDays(typeof checkDate === 'string' ? new Date(checkDate) : checkDate, 1);
    } else {
      // If today has no completion, check if it's a skip day
      const { data: skip } = await supabase
        .from('habit_skips')
        .select('id')
        .eq('habit_id', habitId)
        .eq('date', checkDateStr)
        .maybeSingle();
      
      if (skip) {
        // Skip day doesn't break streak but doesn't count
        checkDate = subDays(new Date(checkDate), 1);
        continue;
      }
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const compDate of completionDates) {
    const compDateObj = new Date(compDate);
    if (prevDate && differenceInDays(compDateObj, prevDate) === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = compDateObj;
  }

  // Update streak record
  await supabase
    .from('habit_streaks')
    .upsert({
      habit_id: habitId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed_date: lastCompletedDate,
      streak_start_date: currentStreak > 0 ? format(subDays(new Date(today), currentStreak - 1), 'yyyy-MM-dd') : null,
      updated_at: new Date().toISOString(),
    });
}

// ============================================================
// HABIT STATISTICS
// ============================================================

export function useHabitStats(habitId: string) {
  return useQuery({
    queryKey: habitKeys.stats(habitId),
    queryFn: async () => {
      const { data: habit } = await supabase
        .from('habits')
        .select('*')
        .eq('id', habitId)
        .single();

      if (!habit) throw new Error('Habit not found');

      // Get completions for last 30 days
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: completions } = await supabase
        .from('habit_completions')
        .select('date, count')
        .eq('habit_id', habitId)
        .gte('date', thirtyDaysAgo)
        .lte('date', today);

      // Get streak
      const { data: streak } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('habit_id', habitId)
        .maybeSingle();

      const totalCompletions = completions?.reduce((sum: number, c: { count: number }) => sum + c.count, 0) || 0;
      const daysWithCompletions = new Set(completions?.map((c: { date: string }) => c.date) || []).size;
      const expectedDays = 30; // Simplified

      // Completions by weekday
      const completionsByWeekday: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      completions?.forEach((c: { date: string; count: number }) => {
        const day = new Date(c.date).getDay();
        completionsByWeekday[day] += c.count;
      });

      // Completions by month (last 12 months)
      const completionsByMonth: Record<string, number> = {};
      const twelveMonthsAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      const { data: allCompletions } = await supabase
        .from('habit_completions')
        .select('date, count')
        .eq('habit_id', habitId)
        .gte('date', twelveMonthsAgo);
      
      allCompletions?.forEach((c: { date: string; count: number }) => {
        const month = c.date.substring(0, 7); // YYYY-MM
        completionsByMonth[month] = (completionsByMonth[month] || 0) + c.count;
      });

      // Generate heatmap data for current year
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      
      const { data: yearCompletions } = await supabase
        .from('habit_completions')
        .select('date, count')
        .eq('habit_id', habitId)
        .gte('date', yearStart)
        .lte('date', yearEnd);

      const completionMap = new Map<string, number>((yearCompletions?.map((c: { date: string; count: number }) => [c.date, c.count]) || []));
      
      const heatmapData: HabitHeatmapDay[] = eachDayOfInterval({
        start: new Date(yearStart),
        end: new Date(yearEnd),
      }).map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = completionMap.get(dateStr) || 0;
        let intensity = 0;
        if (count > 0) {
          intensity = Math.min(4, Math.ceil(count / habit.times_per_period * 4));
        }
        return {
          date: dateStr,
          count,
          intensity,
          is_today: isSameDay(date, new Date()),
          is_future: date > new Date(),
        };
      });

      return {
        habit_id: habitId,
        total_completions: totalCompletions,
        current_streak: streak?.current_streak || 0,
        longest_streak: streak?.longest_streak || 0,
        completion_rate: expectedDays > 0 ? (daysWithCompletions / expectedDays) * 100 : 0,
        best_streak: streak?.longest_streak || 0,
        completions_by_weekday: completionsByWeekday,
        completions_by_month: completionsByMonth,
        heatmap_data: heatmapData,
      } as HabitStats;
    },
    enabled: !!habitId,
  });
}

// ============================================================
// HEATMAP (All habits combined)
// ============================================================

export function useAllHabitsHeatmap(year?: number) {
  const targetYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: habitKeys.allHeatmap(targetYear),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const yearStart = `${targetYear}-01-01`;
      const yearEnd = `${targetYear}-12-31`;

      const { data: completions } = await supabase
        .from('habit_completions')
        .select('habit_id, date, count')
        .eq('user_id', user.id)
        .gte('date', yearStart)
        .lte('date', yearEnd);

      const { data: habits } = await supabase
        .from('habits')
        .select('id, times_per_period')
        .eq('user_id', user.id)
        .is('archived_at', null);

      if (!habits || habits.length === 0) return [];

      const habitTargets = new Map<string, number>(habits.map((h: { id: string; times_per_period: number }) => [h.id, h.times_per_period]));
      
      // Aggregate completions by date
      const dailyTotals = new Map<string, number>();
      completions?.forEach((c: { habit_id: string; date: string; count: number }) => {
        const target = habitTargets.get(c.habit_id) || 1;
        const ratio = c.count / target;
        dailyTotals.set(c.date, (dailyTotals.get(c.date) || 0) + ratio);
      });

      return eachDayOfInterval({
        start: new Date(yearStart),
        end: new Date(yearEnd),
      }).map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const totalRatio = dailyTotals.get(dateStr) || 0;
        let intensity = 0;
        if (totalRatio > 0) {
          intensity = Math.min(4, Math.ceil(totalRatio * 4));
        }
        return {
          date: dateStr,
          count: Math.round(totalRatio * 100) / 100,
          intensity,
          is_today: isSameDay(date, new Date()),
          is_future: date > new Date(),
        };
      }) as HabitHeatmapDay[];
    },
  });
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Check if habit is due today
export function isHabitDueToday(habit: Habit): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      // Simplified: due every day for weekly habits
      // Could be enhanced to only show on specific days
      return true;
    case 'custom':
      return habit.days_of_week.includes(dayOfWeek);
    default:
      return false;
  }
}

// Get habit frequency label
export function getHabitFrequencyLabel(habit: Habit): string {
  switch (habit.frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return habit.times_per_period > 1 
        ? `${habit.times_per_period}x per week` 
        : 'Weekly';
    case 'custom':
      if (habit.days_of_week.length === 0) return 'Custom';
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return habit.days_of_week.map(d => days[d]).join(', ');
    default:
      return 'Unknown';
  }
}

// Get completion status for a specific date
export function getHabitCompletionForDate(
  habit: Habit, 
  completions: HabitCompletion[], 
  date: string
): { count: number; isComplete: boolean; isSkipped: boolean } {
  const completion = completions.find(c => c.date === date);
  const count = completion?.count || 0;
  return {
    count,
    isComplete: count >= habit.times_per_period,
    isSkipped: false, // Would need skip data
  };
}