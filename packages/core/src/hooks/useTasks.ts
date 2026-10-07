import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus, TaskPriority, TaskForm, TaskStats } from '../types';
import { startOfDay, endOfDay, format, subDays } from 'date-fns';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
  byStatus: (status: TaskStatus) => [...taskKeys.all, 'status', status] as const,
  byPriority: (priority: TaskPriority) => [...taskKeys.all, 'priority', priority] as const,
  today: () => [...taskKeys.all, 'today'] as const,
  overdue: () => [...taskKeys.all, 'overdue'] as const,
};

export function useTasks(filters?: {
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  parent_task_id?: string | null;
  limit?: number;
}) {
  return useQuery({
    queryKey: taskKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.tag) {
        query = query.contains('tags', [filters.tag]);
      }
      if (filters?.parent_task_id !== undefined) {
        if (filters.parent_task_id === null) {
          query = query.is('parent_task_id', null);
        } else {
          query = query.eq('parent_task_id', filters.parent_task_id);
        }
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Task;
    },
    enabled: !!id,
  });
}

export function useTodayTasks() {
  return useQuery({
    queryKey: taskKeys.today(),
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`due_date.lte.${today},due_date.is.null`)
        .neq('status', 'done')
        .neq('status', 'archived')
        .order('priority', { ascending: false })
        .order('order', { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: taskKeys.overdue(),
    queryFn: async () => {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .lt('due_date', yesterday)
        .neq('status', 'done')
        .neq('status', 'archived')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('status, priority')
        .eq('user_id', user.id);
      if (error) throw error;

      const tasks = data as Task[];
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const overdue = tasks.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' && t.status !== 'archived'
      ).length;

      const byPriority: Record<TaskPriority, number> = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      };

      tasks.forEach(t => {
        byPriority[t.priority]++;
      });

      return {
        total,
        completed,
        in_progress: inProgress,
        overdue,
        completion_rate: total > 0 ? (completed / total) * 100 : 0,
        by_priority: byPriority,
      } as TaskStats;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get max order for positioning
      const { data: maxOrder } = await supabase
        .from('tasks')
        .select('order')
        .eq('user_id', user.id)
        .is('parent_task_id', task.parent_task_id || null)
        .order('order', { ascending: false })
        .limit(1);

      const order = (maxOrder?.[0]?.order ?? -1) + 1;

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user.id, order })
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskForm> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tasks: { id: string; order: number }[]) => {
      const updates = tasks.map(({ id, order }) => 
        supabase.from('tasks').update({ order }).eq('id', id)
      );
      await Promise.all(updates);
      return tasks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useToggleTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}