import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Expense, ExpenseCategory, ExpenseForm, DailySpending, WeeklySpending } from '../types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, subDays, eachDayOfInterval } from 'date-fns';

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  daily: (date: string) => [...expenseKeys.all, 'daily', date] as const,
  weekly: (weekStart: string) => [...expenseKeys.all, 'weekly', weekStart] as const,
  monthly: (month: string) => [...expenseKeys.all, 'monthly', month] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
  stats: (period: string) => [...expenseKeys.all, 'stats', period] as const,
};

// Fetch expenses with optional filters
export function useExpenses(filters?: {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  limit?: number;
}) {
  return useQuery({
    queryKey: expenseKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

// Fetch single expense
export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Expense;
    },
    enabled: !!id,
  });
}

// Create expense
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: ExpenseForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('daily') });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('monthly') });
    },
  });
}

// Update expense
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExpenseForm> }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('daily') });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('monthly') });
    },
  });
}

// Delete expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('daily') });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: expenseKeys.stats('monthly') });
    },
  });
}

// Daily spending aggregation
export function useDailySpending(date: string) {
  return useQuery({
    queryKey: expenseKeys.daily(date),
    queryFn: async () => {
      const start = startOfDay(new Date(date));
      const end = endOfDay(new Date(date));

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));
      if (error) throw error;

      const by_category: Record<ExpenseCategory, number> = {
        food: 0,
        transport: 0,
        shopping: 0,
        entertainment: 0,
        health: 0,
        education: 0,
        utilities: 0,
        other: 0,
      };

      let total = 0;
      (data as Expense[]).forEach((expense) => {
        by_category[expense.category] += expense.amount;
        total += expense.amount;
      });

      return { date, total, by_category } as DailySpending;
    },
    enabled: !!date,
  });
}

// Weekly spending aggregation
export function useWeeklySpending(weekStart: string) {
  return useQuery({
    queryKey: expenseKeys.weekly(weekStart),
    queryFn: async () => {
      const start = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category, date')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));
      if (error) throw error;

      const dailyMap = new Map<string, DailySpending>();
      days.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        dailyMap.set(dateStr, {
          date: dateStr,
          total: 0,
          by_category: {
            food: 0,
            transport: 0,
            shopping: 0,
            entertainment: 0,
            health: 0,
            education: 0,
            utilities: 0,
            other: 0,
          },
        });
      });

      (data as Expense[]).forEach((expense) => {
        const daily = dailyMap.get(expense.date);
        if (daily) {
          daily.by_category[expense.category] += expense.amount;
          daily.total += expense.amount;
        }
      });

      const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      const total = daily.reduce((sum, d) => sum + d.total, 0);

      return { week_start: format(start, 'yyyy-MM-dd'), total, daily } as WeeklySpending;
    },
    enabled: !!weekStart,
  });
}

// Category totals for a period
export function useCategoryTotals(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...expenseKeys.categories(), startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category')
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;

      const totals: Record<ExpenseCategory, number> = {
        food: 0,
        transport: 0,
        shopping: 0,
        entertainment: 0,
        health: 0,
        education: 0,
        utilities: 0,
        other: 0,
      };

      (data as Expense[]).forEach((expense) => {
        totals[expense.category] += expense.amount;
      });

      return totals;
    },
    enabled: !!startDate && !!endDate,
  });
}

// Monthly budget tracking
export function useMonthlyBudget(month: string) {
  return useQuery({
    queryKey: expenseKeys.monthly(month),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { spent: 0, budget: 0, remaining: 0, percentage: 0 };

      // Get profile for budget
      const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_budget, currency')
        .eq('id', user.id)
        .single();

      const start = new Date(month + '-01');
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));
      if (error) throw error;

      const spent = (expenses as Expense[]).reduce((sum, e) => sum + e.amount, 0);
      const budget = profile?.monthly_budget || 0;
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      return { spent, budget, remaining, percentage, currency: profile?.currency || 'USD' };
    },
    enabled: !!month,
  });
}