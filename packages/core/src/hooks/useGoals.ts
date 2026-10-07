import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  Goal, GoalMilestone, GoalTaskLink, GoalRoutineLink, 
  GoalForm, GoalMilestoneForm, GoalWithRelations,
  GoalStatus, GoalPriority 
} from '../types';
import { format } from 'date-fns';

// Query keys
export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...goalKeys.lists(), filters] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
  active: () => [...goalKeys.all, 'active'] as const,
  completed: () => [...goalKeys.all, 'completed'] as const,
  milestones: (goalId: string) => [...goalKeys.all, 'milestones', goalId] as const,
  milestone: (id: string) => [...goalKeys.all, 'milestone', id] as const,
  taskLinks: (goalId: string) => [...goalKeys.all, 'task-links', goalId] as const,
  routineLinks: (goalId: string) => [...goalKeys.all, 'routine-links', goalId] as const,
  stats: () => [...goalKeys.all, 'stats'] as const,
};

// ============================================================
// GOALS
// ============================================================

export function useGoals(filters?: { 
  status?: GoalStatus; 
  priority?: GoalPriority;
  category?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: goalKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useActiveGoals() {
  return useQuery({
    queryKey: goalKeys.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .order('target_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useCompletedGoals() {
  return useQuery({
    queryKey: goalKeys.completed(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Goal;
    },
    enabled: !!id,
  });
}

export function useGoalWithRelations(id: string) {
  return useQuery({
    queryKey: [...goalKeys.detail(id), 'with-relations'],
    queryFn: async () => {
      // Fetch goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();
      if (goalError) throw goalError;

      // Fetch milestones
      const { data: milestones } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', id)
        .order('order_index', { ascending: true });

      // Fetch linked tasks
      const { data: taskLinks } = await supabase
        .from('goal_task_links')
        .select('task_id')
        .eq('goal_id', id);

      let linkedTasks: any[] = [];
      if (taskLinks && taskLinks.length > 0) {
        const taskIds = taskLinks.map((tl: { task_id: string }) => tl.task_id);
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .in('id', taskIds);
        linkedTasks = tasks || [];
      }

      // Fetch linked routines
      const { data: routineLinks } = await supabase
        .from('goal_routine_links')
        .select('routine_id')
        .eq('goal_id', id);

      let linkedRoutines: any[] = [];
      if (routineLinks && routineLinks.length > 0) {
        const routineIds = routineLinks.map((rl: { routine_id: string }) => rl.routine_id);
        const { data: routines } = await supabase
          .from('routines')
          .select('*')
          .in('id', routineIds);
        linkedRoutines = routines || [];
      }

      return {
        ...goal,
        milestones: milestones as GoalMilestone[],
        linked_tasks: linkedTasks,
        linked_routines: linkedRoutines,
      } as GoalWithRelations;
    },
    enabled: !!id,
  });
}

export function useGoalStats() {
  return useQuery({
    queryKey: goalKeys.stats(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('goals')
        .select('*, goal_milestones(*)')
        .eq('user_id', user.id);
      if (error) throw error;

      const goals = data as (Goal & { goal_milestones: GoalMilestone[] })[];
      const total = goals.length;
      const completed = goals.filter(g => g.status === 'completed').length;
      const active = goals.filter(g => g.status === 'active').length;
      const paused = goals.filter(g => g.status === 'paused').length;
      
      const totalMilestones = goals.reduce((sum, g) => sum + (g.goal_milestones?.length || 0), 0);
      const completedMilestones = goals.reduce((sum, g) => 
        sum + (g.goal_milestones?.filter(m => m.is_completed).length || 0), 0);
      
      const avgProgress = total > 0 
        ? goals.reduce((sum, g) => sum + g.progress, 0) / total 
        : 0;

      // Goals by category
      const byCategory: Record<string, number> = {};
      goals.forEach(g => {
        const cat = g.category || 'uncategorized';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      // Goals by priority
      const byPriority: Record<GoalPriority, number> = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      };
      goals.forEach(g => byPriority[g.priority]++);

      // Upcoming deadlines (next 30 days)
      const thirtyDaysFromNow = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const upcomingDeadlines = goals
        .filter(g => g.target_date && g.status === 'active')
        .filter(g => g.target_date! <= thirtyDaysFromNow)
        .sort((a, b) => (a.target_date || '').localeCompare(b.target_date || ''))
        .slice(0, 5);

      return {
        total,
        completed,
        active,
        paused,
        completion_rate: total > 0 ? (completed / total) * 100 : 0,
        avg_progress: Math.round(avgProgress),
        total_milestones: totalMilestones,
        completed_milestones: completedMilestones,
        milestone_completion_rate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
        by_category: byCategory,
        by_priority: byPriority,
        upcoming_deadlines: upcomingDeadlines,
      };
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: GoalForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, user_id: user.id, start_date: format(new Date(), 'yyyy-MM-dd') })
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.completed() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats() });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GoalForm> }) => {
      // If marking as completed, set completed_at
      const updateData = { ...updates };
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
        updateData.progress = 100;
      }

      const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...goalKeys.detail(id), 'with-relations'] });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.completed() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats() });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.completed() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats() });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const updates: Partial<GoalForm> = { progress: Math.max(0, Math.min(100, progress)) };
      
      // Auto-complete if 100%
      if (progress >= 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats() });
    },
  });
}

// ============================================================
// GOAL MILESTONES
// ============================================================

export function useGoalMilestones(goalId: string) {
  return useQuery({
    queryKey: goalKeys.milestones(goalId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goalId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as GoalMilestone[];
    },
    enabled: !!goalId,
  });
}

export function useCreateGoalMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestone: GoalMilestoneForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('goal_milestones')
        .insert({ ...milestone, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as GoalMilestone;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.milestones(vars.goal_id) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(vars.goal_id) });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats() });
    },
  });
}

export function useUpdateGoalMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, goalId }: { id: string; updates: Partial<GoalMilestoneForm>; goalId: string }) => {
      const updateData = { ...updates };
      if (updates.is_completed && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('goal_milestones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data: data as GoalMilestone, goalId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.milestones(result.goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(result.goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats() });
    },
  });
}

export function useDeleteGoalMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, goalId }: { id: string; goalId: string }) => {
      const { error } = await supabase.from('goal_milestones').delete().eq('id', id);
      if (error) throw error;
      return { id, goalId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.milestones(result.goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(result.goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.stats() });
    },
  });
}

export function useReorderGoalMilestones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestones: { id: string; order_index: number; goalId: string }[]) => {
      const updates = milestones.map(({ id, order_index }) => 
        supabase.from('goal_milestones').update({ order_index }).eq('id', id)
      );
      await Promise.all(updates);
      return milestones;
    },
    onSuccess: (vars) => {
      const goalId = vars[0]?.goalId;
      if (goalId) {
        queryClient.invalidateQueries({ queryKey: goalKeys.milestones(goalId) });
      }
    },
  });
}

// ============================================================
// GOAL TASK LINKS
// ============================================================

export function useGoalTaskLinks(goalId: string) {
  return useQuery({
    queryKey: goalKeys.taskLinks(goalId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_task_links')
        .select('task_id')
        .eq('goal_id', goalId);
      if (error) throw error;
      return data as GoalTaskLink[];
    },
    enabled: !!goalId,
  });
}

export function useLinkTaskToGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, taskId }: { goalId: string; taskId: string }) => {
      const { data, error } = await supabase
        .from('goal_task_links')
        .insert({ goal_id: goalId, task_id: taskId })
        .select()
        .single();
      if (error) throw error;
      return data as GoalTaskLink;
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.taskLinks(goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
  });
}

export function useUnlinkTaskFromGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, taskId }: { goalId: string; taskId: string }) => {
      const { error } = await supabase
        .from('goal_task_links')
        .delete()
        .eq('goal_id', goalId)
        .eq('task_id', taskId);
      if (error) throw error;
      return { goalId, taskId };
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.taskLinks(goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
  });
}

// ============================================================
// GOAL ROUTINE LINKS
// ============================================================

export function useGoalRoutineLinks(goalId: string) {
  return useQuery({
    queryKey: goalKeys.routineLinks(goalId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_routine_links')
        .select('routine_id')
        .eq('goal_id', goalId);
      if (error) throw error;
      return data as GoalRoutineLink[];
    },
    enabled: !!goalId,
  });
}

export function useLinkRoutineToGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, routineId }: { goalId: string; routineId: string }) => {
      const { data, error } = await supabase
        .from('goal_routine_links')
        .insert({ goal_id: goalId, routine_id: routineId })
        .select()
        .single();
      if (error) throw error;
      return data as GoalRoutineLink;
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.routineLinks(goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
  });
}

export function useUnlinkRoutineFromGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, routineId }: { goalId: string; routineId: string }) => {
      const { error } = await supabase
        .from('goal_routine_links')
        .delete()
        .eq('goal_id', goalId)
        .eq('routine_id', routineId);
      if (error) throw error;
      return { goalId, routineId };
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.routineLinks(goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
  });
}

// Helper to calculate goal progress from milestones
export function calculateGoalProgressFromMilestones(milestones: GoalMilestone[]): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.is_completed).length;
  return Math.round((completed / milestones.length) * 100);
}

// Helper to get goal status color
export function getGoalStatusColor(status: GoalStatus): string {
  switch (status) {
    case 'active': return 'text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400';
    case 'completed': return 'text-success-600 bg-success-100 dark:bg-success-900/30 dark:text-success-400';
    case 'paused': return 'text-warning-600 bg-warning-100 dark:bg-warning-900/30 dark:text-warning-400';
    case 'archived': return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
    case 'cancelled': return 'text-danger-600 bg-danger-100 dark:bg-danger-900/30 dark:text-danger-400';
    default: return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
  }
}

// Helper to get goal priority color
export function getGoalPriorityColor(priority: GoalPriority): string {
  switch (priority) {
    case 'urgent': return 'text-danger-600 bg-danger-100 dark:bg-danger-900/30 dark:text-danger-400';
    case 'high': return 'text-warning-600 bg-warning-100 dark:bg-warning-900/30 dark:text-warning-400';
    case 'medium': return 'text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400';
    case 'low': return 'text-success-600 bg-success-100 dark:bg-success-900/30 dark:text-success-400';
    default: return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
  }
}

// Import needed for helpers
import { addDays } from 'date-fns';