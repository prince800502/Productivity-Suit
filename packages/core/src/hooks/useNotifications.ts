import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  Notification, NotificationPreferencesDB, NotificationForm, 
  NotificationPreferencesForm, NotificationType, NotificationPriority,
  NotificationChannel, NotificationCenterState 
} from '../types';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...notificationKeys.lists(), filters] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  today: () => [...notificationKeys.all, 'today'] as const,
  pending: () => [...notificationKeys.all, 'pending'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export function useNotifications(filters?: { 
  is_read?: boolean; 
  type?: NotificationType;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: notificationKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Notification[];
    },
  });
}

export function useUnreadNotifications(limit: number = 50) {
  return useQuery({
    queryKey: [...notificationKeys.unread(), limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Notification[];
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...notificationKeys.unread(), 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .is('archived_at', null);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTodayNotifications() {
  return useQuery({
    queryKey: notificationKeys.today(),
    queryFn: async () => {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
  });
}

export function usePendingNotifications() {
  return useQuery({
    queryKey: notificationKeys.pending(),
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .is('archived_at', null)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Notification[];
    },
    refetchInterval: 60000, // Check every minute
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: [...notificationKeys.all, 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Notification;
    },
    enabled: !!id,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: NotificationForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .insert({ ...notification, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.today() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.pending() });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.today() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.pending() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('is_read', false)
        .is('archived_at', null);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.today() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.pending() });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.today() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.pending() });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    },
  });
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationPreferencesDB | null;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferencesForm>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({ ...preferences, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as NotificationPreferencesDB;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

// ============================================================
// NOTIFICATION HELPERS
// ============================================================

// Create notification for task reminder
export function useCreateTaskReminderNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ taskId, taskTitle, dueDate, minutesBefore }: { 
      taskId: string; 
      taskTitle: string; 
      dueDate: string;
      minutesBefore: number;
    }) => {
      const triggerAt = new Date(new Date(dueDate).getTime() - minutesBefore * 60000).toISOString();
      
      return createNotification.mutateAsync({
        type: 'task_reminder',
        title: `Task Due Soon: ${taskTitle}`,
        message: `Your task "${taskTitle}" is due in ${minutesBefore} minutes.`,
        priority: minutesBefore <= 15 ? 'high' : 'normal',
        related_entity_type: 'task',
        related_entity_id: taskId,
        action_url: `/tasks?task=${taskId}`,
        action_label: 'View Task',
        scheduled_for: triggerAt,
        delivery_channels: ['in_app', 'push'],
        metadata: { minutes_before: minutesBefore },
      });
    },
  });
}

// Create notification for habit reminder
export function useCreateHabitReminderNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ habitId, habitName, time }: { 
      habitId: string; 
      habitName: string; 
      time: string; // HH:mm
    }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const triggerAt = new Date(`${today}T${time}`).toISOString();
      
      return createNotification.mutateAsync({
        type: 'habit_reminder',
        title: `Time for: ${habitName}`,
        message: `Don't forget to complete your habit "${habitName}".`,
        priority: 'normal',
        related_entity_type: 'habit',
        related_entity_id: habitId,
        action_url: `/habits?habit=${habitId}`,
        action_label: 'Mark Complete',
        scheduled_for: triggerAt,
        delivery_channels: ['in_app', 'push'],
        metadata: { habit_time: time },
      });
    },
  });
}

// Create notification for budget warning
export function useCreateBudgetWarningNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ budgetPercentage, spent, budget, currency }: { 
      budgetPercentage: number;
      spent: number;
      budget: number;
      currency: string;
    }) => {
      const isExceeded = budgetPercentage >= 100;
      
      return createNotification.mutateAsync({
        type: isExceeded ? 'budget_exceeded' : 'budget_warning',
        title: isExceeded ? 'Budget Exceeded!' : 'Budget Warning',
        message: isExceeded 
          ? `You've exceeded your monthly budget of ${currency}${budget.toFixed(2)}. Current spending: ${currency}${spent.toFixed(2)}.`
          : `You've used ${budgetPercentage.toFixed(0)}% of your monthly budget (${currency}${spent.toFixed(2)} of ${currency}${budget.toFixed(2)}).`,
        priority: isExceeded ? 'urgent' : 'high',
        related_entity_type: 'budget',
        action_url: '/expenses',
        action_label: 'View Expenses',
        delivery_channels: ['in_app', 'email', 'push'],
        metadata: { budget_percentage: budgetPercentage, spent, budget },
      });
    },
  });
}

// Create notification for subscription renewal
export function useCreateSubscriptionRenewalNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ expenseId, name, amount, currency, daysUntil, nextPaymentDate }: { 
      expenseId: string;
      name: string;
      amount: number;
      currency: string;
      daysUntil: number;
      nextPaymentDate: string;
    }) => {
      const triggerAt = new Date(nextPaymentDate).toISOString();
      
      return createNotification.mutateAsync({
        type: 'subscription_renewal',
        title: `Upcoming Renewal: ${name}`,
        message: `Your subscription "${name}" (${currency}${amount.toFixed(2)}) renews in ${daysUntil} day(s).`,
        priority: daysUntil <= 1 ? 'high' : 'normal',
        related_entity_type: 'recurring_expense',
        related_entity_id: expenseId,
        action_url: `/expenses?recurring=${expenseId}`,
        action_label: 'Manage Subscription',
        scheduled_for: triggerAt,
        delivery_channels: ['in_app', 'email', 'push'],
        metadata: { amount, currency, days_until: daysUntil },
      });
    },
  });
}

// Create notification for goal deadline
export function useCreateGoalDeadlineNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ goalId, goalTitle, targetDate, daysUntil }: { 
      goalId: string;
      goalTitle: string;
      targetDate: string;
      daysUntil: number;
    }) => {
      return createNotification.mutateAsync({
        type: 'goal_deadline',
        title: `Goal Deadline Approaching: ${goalTitle}`,
        message: `Your goal "${goalTitle}" is due in ${daysUntil} day(s).`,
        priority: daysUntil <= 3 ? 'high' : 'normal',
        related_entity_type: 'goal',
        related_entity_id: goalId,
        action_url: `/goals?goal=${goalId}`,
        action_label: 'View Goal',
        scheduled_for: new Date(targetDate).toISOString(),
        delivery_channels: ['in_app', 'push'],
        metadata: { days_until: daysUntil },
      });
    },
  });
}

// Create notification for weekly report
export function useCreateWeeklyReportNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ reportId, weekStart, weekEnd }: { 
      reportId: string;
      weekStart: string;
      weekEnd: string;
    }) => {
      return createNotification.mutateAsync({
        type: 'weekly_report',
        title: 'Your Weekly Productivity Report is Ready',
        message: `Check out your productivity summary for ${weekStart} to ${weekEnd}.`,
        priority: 'normal',
        related_entity_type: 'ai_weekly_report',
        related_entity_id: reportId,
        action_url: `/analytics?report=${reportId}`,
        action_label: 'View Report',
        delivery_channels: ['in_app', 'email'],
        metadata: { week_start: weekStart, week_end: weekEnd },
      });
    },
  });
}

// Create notification for achievement
export function useCreateAchievementNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ title, message, relatedEntityType, relatedEntityId }: { 
      title: string;
      message: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }) => {
      return createNotification.mutateAsync({
        type: 'achievement',
        title,
        message,
        priority: 'normal',
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        delivery_channels: ['in_app', 'push'],
        metadata: { achievement: true },
      });
    },
  });
}

// Create notification for streak milestone
export function useCreateStreakMilestoneNotification() {
  const createNotification = useCreateNotification();

  return useMutation({
    mutationFn: async ({ 
      entityType, 
      entityName, 
      streakDays,
      entityId 
    }: { 
      entityType: 'habit' | 'routine' | 'pomodoro';
      entityName: string;
      streakDays: number;
      entityId: string;
    }) => {
      return createNotification.mutateAsync({
        type: 'streak_milestone',
        title: `${streakDays} Day Streak! 🔥`,
        message: `Amazing! You've maintained a ${streakDays}-day streak for "${entityName}".`,
        priority: 'normal',
        related_entity_type: entityType,
        related_entity_id: entityId,
        delivery_channels: ['in_app', 'push'],
        metadata: { streak_days: streakDays, entity_type: entityType },
      });
    },
  });
}

// Get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'task_reminder': return 'Clock';
    case 'habit_reminder': return 'Target';
    case 'budget_warning': return 'AlertTriangle';
    case 'budget_exceeded': return 'AlertCircle';
    case 'subscription_renewal': return 'CreditCard';
    case 'goal_deadline': return 'Flag';
    case 'pomodoro_reminder': return 'Timer';
    case 'schedule_reminder': return 'Calendar';
    case 'routine_reminder': return 'Repeat';
    case 'milestone_due': return 'Target';
    case 'weekly_report': return 'BarChart3';
    case 'achievement': return 'Trophy';
    case 'streak_milestone': return 'Flame';
    case 'custom': return 'Bell';
    default: return 'Bell';
  }
}

// Get notification color based on priority
export function getNotificationColor(priority: NotificationPriority): string {
  switch (priority) {
    case 'urgent': return 'text-danger-600 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800';
    case 'high': return 'text-warning-600 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800';
    case 'normal': return 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
    case 'low': return 'text-neutral-600 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    default: return 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
  }
}

// Format notification time
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, 'MMM d, yyyy');
}