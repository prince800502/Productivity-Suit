import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  Budget, CategoryBudget, SavingsGoal, SavingsContribution, 
  MonthlyFinancialSummary, BudgetForm, CategoryBudgetForm, 
  SavingsGoalForm, SavingsContributionForm, BudgetProgress 
} from '../types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Query keys
export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...budgetKeys.lists(), filters] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
  current: () => [...budgetKeys.all, 'current'] as const,
  categoryBudgets: (budgetId: string) => [...budgetKeys.all, 'categories', budgetId] as const,
  savingsGoals: () => [...budgetKeys.all, 'savings-goals'] as const,
  savingsGoal: (id: string) => [...budgetKeys.all, 'savings-goal', id] as const,
  savingsContributions: (goalId: string) => [...budgetKeys.all, 'contributions', goalId] as const,
  monthlySummary: (month: string) => [...budgetKeys.all, 'monthly-summary', month] as const,
  monthlySummaries: () => [...budgetKeys.all, 'monthly-summaries'] as const,
};

// ============================================================
// BUDGETS
// ============================================================

export function useBudgets(filters?: { limit?: number }) {
  return useQuery({
    queryKey: budgetKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select('*')
        .order('month', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Budget[];
    },
  });
}

export function useCurrentBudget() {
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: budgetKeys.current(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();
      
      if (error) throw error;
      return data as Budget | null;
    },
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category_budgets(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Budget & { category_budgets: CategoryBudget[] };
    },
    enabled: !!id,
  });
}

export function useBudgetProgress(month?: string) {
  const targetMonth = month || format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: [...budgetKeys.all, 'progress', targetMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { spent: 0, budget: 0, remaining: 0, percentage: 0, currency: 'USD', categoryBreakdown: {} };

      // Get budget for the month
      const { data: budget } = await supabase
        .from('budgets')
        .select('*, category_budgets(*)')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .maybeSingle();

      // Get expenses for the month
      const start = format(startOfMonth(new Date(targetMonth)), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date(targetMonth)), 'yyyy-MM-dd');

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end);
      
      if (error) throw error;

      const spent = (expenses as { amount: number; category: string }[]).reduce((sum, e) => sum + e.amount, 0);
      const budgetAmount = budget?.amount || 0;
      const remaining = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      // Category breakdown
      const categoryBreakdown: Record<string, { spent: number; budget: number; percentage: number }> = {};
      const categories = ['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other'] as const;
      
      categories.forEach(cat => {
        const catSpent = (expenses as { amount: number; category: string }[])
          .filter(e => e.category === cat)
          .reduce((sum, e) => sum + e.amount, 0);
        const catBudget = budget?.category_budgets?.find((cb: CategoryBudget) => cb.category === cat)?.amount || 0;
        categoryBreakdown[cat] = {
          spent: catSpent,
          budget: catBudget,
          percentage: catBudget > 0 ? (catSpent / catBudget) * 100 : 0,
        };
      });

      return {
        spent,
        budget: budgetAmount,
        remaining,
        percentage,
        currency: budget?.currency || 'USD',
        categoryBreakdown,
      } as BudgetProgress;
    },
    enabled: !!targetMonth,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: BudgetForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...budget, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BudgetForm> }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.current() });
    },
  });
}

// ============================================================
// CATEGORY BUDGETS
// ============================================================

export function useCategoryBudgets(budgetId: string) {
  return useQuery({
    queryKey: budgetKeys.categoryBudgets(budgetId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('budget_id', budgetId);
      if (error) throw error;
      return data as CategoryBudget[];
    },
    enabled: !!budgetId,
  });
}

export function useCreateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryBudget: CategoryBudgetForm) => {
      const { data, error } = await supabase
        .from('category_budgets')
        .insert(categoryBudget)
        .select()
        .single();
      if (error) throw error;
      return data as CategoryBudget;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.categoryBudgets(vars.budget_id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(vars.budget_id) });
    },
  });
}

export function useUpdateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CategoryBudgetForm> }) => {
      const { data, error } = await supabase
        .from('category_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CategoryBudget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useDeleteCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('category_budgets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

// ============================================================
// SAVINGS GOALS
// ============================================================

export function useSavingsGoals(filters?: { is_completed?: boolean; limit?: number }) {
  return useQuery({
    queryKey: budgetKeys.savingsGoals(),
    queryFn: async () => {
      let query = supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.is_completed !== undefined) {
        query = query.eq('is_completed', filters.is_completed);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SavingsGoal[];
    },
  });
}

export function useSavingsGoal(id: string) {
  return useQuery({
    queryKey: budgetKeys.savingsGoal(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as SavingsGoal;
    },
    enabled: !!id,
  });
}

export function useSavingsContributions(goalId: string) {
  return useQuery({
    queryKey: budgetKeys.savingsContributions(goalId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_contributions')
        .select('*')
        .eq('savings_goal_id', goalId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavingsContribution[];
    },
    enabled: !!goalId,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: SavingsGoalForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.savingsGoals() });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SavingsGoalForm> }) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.savingsGoals() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.savingsGoal(id) });
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.savingsGoals() });
    },
  });
}

export function useAddSavingsContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contribution: SavingsContributionForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Add contribution
      const { data: contributionData, error: contribError } = await supabase
        .from('savings_contributions')
        .insert({ ...contribution, user_id: user.id })
        .select()
        .single();
      if (contribError) throw contribError;

      // Update savings goal current amount
      const { error: goalError } = await supabase.rpc('increment_savings_goal', {
        goal_id: contribution.savings_goal_id,
        amount: contribution.amount,
      });
      if (goalError) throw goalError;

      return contributionData as SavingsContribution;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.savingsContributions(vars.savings_goal_id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.savingsGoal(vars.savings_goal_id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.savingsGoals() });
    },
  });
}

// ============================================================
// MONTHLY FINANCIAL SUMMARY
// ============================================================

export function useMonthlyFinancialSummary(month: string) {
  return useQuery({
    queryKey: budgetKeys.monthlySummary(month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_financial_summary')
        .select('*')
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      return data as MonthlyFinancialSummary | null;
    },
    enabled: !!month,
  });
}

export function useMonthlyFinancialSummaries(limit?: number) {
  return useQuery({
    queryKey: budgetKeys.monthlySummaries(),
    queryFn: async () => {
      let query = supabase
        .from('monthly_financial_summary')
        .select('*')
        .order('month', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MonthlyFinancialSummary[];
    },
  });
}

// Helper to get previous month summary for comparison
export function usePreviousMonthComparison() {
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const previousMonth = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [...budgetKeys.all, 'comparison', currentMonth, previousMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: current } = await supabase
        .from('monthly_financial_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      const { data: previous } = await supabase
        .from('monthly_financial_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', previousMonth)
        .maybeSingle();

      if (!current || !previous) return null;

      return {
        current: current as MonthlyFinancialSummary,
        previous: previous as MonthlyFinancialSummary,
        changes: {
          income: previous.total_income > 0 
            ? ((current.total_income - previous.total_income) / previous.total_income) * 100 
            : 0,
          expenses: previous.total_expenses > 0 
            ? ((current.total_expenses - previous.total_expenses) / previous.total_expenses) * 100 
            : 0,
          savings: previous.net_savings !== 0 
            ? ((current.net_savings - previous.net_savings) / Math.abs(previous.net_savings)) * 100 
            : 0,
        },
      };
    },
  });
}