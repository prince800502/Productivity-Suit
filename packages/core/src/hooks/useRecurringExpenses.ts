import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  RecurringExpense, RecurringExpensePayment, RecurringExpenseForm, 
  UpcomingPayment, RecurringFrequency 
} from '../types';
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays, isBefore, startOfDay } from 'date-fns';

// Query keys
export const recurringExpenseKeys = {
  all: ['recurringExpenses'] as const,
  lists: () => [...recurringExpenseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...recurringExpenseKeys.lists(), filters] as const,
  details: () => [...recurringExpenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringExpenseKeys.details(), id] as const,
  active: () => [...recurringExpenseKeys.all, 'active'] as const,
  upcoming: () => [...recurringExpenseKeys.all, 'upcoming'] as const,
  payments: (recurringExpenseId: string) => [...recurringExpenseKeys.all, 'payments', recurringExpenseId] as const,
  totalMonthly: () => [...recurringExpenseKeys.all, 'monthly-total'] as const,
};

// ============================================================
// RECURRING EXPENSES
// ============================================================

export function useRecurringExpenses(filters?: { is_active?: boolean; limit?: number }) {
  return useQuery({
    queryKey: recurringExpenseKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('recurring_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RecurringExpense[];
    },
  });
}

export function useActiveRecurringExpenses() {
  return useQuery({
    queryKey: recurringExpenseKeys.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('is_active', true)
        .order('next_payment_date', { ascending: true });
      if (error) throw error;
      return data as RecurringExpense[];
    },
  });
}

export function useRecurringExpense(id: string) {
  return useQuery({
    queryKey: recurringExpenseKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*, recurring_expense_payments(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as RecurringExpense & { recurring_expense_payments: RecurringExpensePayment[] };
    },
    enabled: !!id,
  });
}

// Upcoming payments for dashboard
export function useUpcomingPayments(days: number = 30) {
  return useQuery({
    queryKey: [...recurringExpenseKeys.upcoming(), days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const futureDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('next_payment_date', futureDate)
        .order('next_payment_date', { ascending: true });
      
      if (error) throw error;
      
      const today = startOfDay(new Date());
      return (data as RecurringExpense[]).map(expense => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        frequency: expense.frequency,
        next_payment_date: expense.next_payment_date,
        days_until: differenceInDays(new Date(expense.next_payment_date), today),
        is_active: expense.is_active,
      })) as UpcomingPayment[];
    },
  });
}

// Monthly subscription total
export function useMonthlySubscriptionTotal() {
  return useQuery({
    queryKey: recurringExpenseKeys.totalMonthly(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('amount, frequency')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;

      // Convert all to monthly equivalent
      const monthlyTotal = (data as RecurringExpense[]).reduce((sum, expense) => {
        let monthlyAmount = expense.amount;
        switch (expense.frequency) {
          case 'daily':
            monthlyAmount = expense.amount * 30;
            break;
          case 'weekly':
            monthlyAmount = expense.amount * 4.33;
            break;
          case 'yearly':
            monthlyAmount = expense.amount / 12;
            break;
          case 'monthly':
          default:
            monthlyAmount = expense.amount;
        }
        return sum + monthlyAmount;
      }, 0);

      return Math.round(monthlyTotal * 100) / 100;
    },
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: RecurringExpenseForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate next payment date
      const startDate = new Date(expense.start_date);
      const nextPaymentDate = format(startDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({ 
          ...expense, 
          user_id: user.id,
          next_payment_date: nextPaymentDate,
        })
        .select()
        .single();
      if (error) throw error;
      return data as RecurringExpense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.active() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.totalMonthly() });
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RecurringExpenseForm> }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RecurringExpense;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.active() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.totalMonthly() });
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.active() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.totalMonthly() });
    },
  });
}

export function useToggleRecurringExpenseActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RecurringExpense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.active() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.totalMonthly() });
    },
  });
}

// ============================================================
// RECURRING EXPENSE PAYMENTS
// ============================================================

export function useRecurringExpensePayments(recurringExpenseId: string) {
  return useQuery({
    queryKey: recurringExpenseKeys.payments(recurringExpenseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expense_payments')
        .select('*')
        .eq('recurring_expense_id', recurringExpenseId)
        .order('paid_on', { ascending: false });
      if (error) throw error;
      return data as RecurringExpensePayment[];
    },
    enabled: !!recurringExpenseId,
  });
}

export function useRecordRecurringPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<RecurringExpensePayment, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('recurring_expense_payments')
        .insert(payment)
        .select()
        .single();
      if (error) throw error;
      return data as RecurringExpensePayment;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.payments(vars.recurring_expense_id) });
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.detail(vars.recurring_expense_id) });
    },
  });
}

// Calculate next payment date based on frequency
export function calculateNextPaymentDate(currentDate: string, frequency: RecurringFrequency): string {
  const date = new Date(currentDate);
  let nextDate: Date;

  switch (frequency) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    case 'yearly':
      nextDate = addYears(date, 1);
      break;
    default:
      nextDate = addMonths(date, 1);
  }

  return format(nextDate, 'yyyy-MM-dd');
}

// Check if payment is due today or overdue
export function isPaymentDue(nextPaymentDate: string): boolean {
  const today = startOfDay(new Date());
  const paymentDate = startOfDay(new Date(nextPaymentDate));
  return isBefore(paymentDate, today) || paymentDate.getTime() === today.getTime();
}

// Get days until next payment
export function getDaysUntilPayment(nextPaymentDate: string): number {
  const today = startOfDay(new Date());
  const paymentDate = startOfDay(new Date(nextPaymentDate));
  return differenceInDays(paymentDate, today);
}