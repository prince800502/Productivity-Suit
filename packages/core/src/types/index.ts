// Database types (generated from Supabase)
// This will be replaced by `supabase gen types` command
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>;
      };
      routines: {
        Row: Routine;
        Insert: Omit<Routine, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Routine, 'id' | 'created_at' | 'updated_at'>>;
      };
      pomodoro_sessions: {
        Row: PomodoroSession;
        Insert: Omit<PomodoroSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PomodoroSession, 'id' | 'created_at' | 'updated_at'>>;
      };
      schedule_events: {
        Row: ScheduleEvent;
        Insert: Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at'>>;
      };
      holidays: {
        Row: Holiday;
        Insert: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Holiday, 'id' | 'created_at' | 'updated_at'>>;
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Reminder, 'id' | 'created_at' | 'updated_at'>>;
      };
      // Phase 3 tables
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>>;
      };
      category_budgets: {
        Row: CategoryBudget;
        Insert: Omit<CategoryBudget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CategoryBudget, 'id' | 'created_at' | 'updated_at'>>;
      };
      savings_goals: {
        Row: SavingsGoal;
        Insert: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>>;
      };
      savings_contributions: {
        Row: SavingsContribution;
        Insert: Omit<SavingsContribution, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SavingsContribution, 'id' | 'created_at' | 'updated_at'>>;
      };
      monthly_financial_summary: {
        Row: MonthlyFinancialSummary;
        Insert: Omit<MonthlyFinancialSummary, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MonthlyFinancialSummary, 'id' | 'created_at' | 'updated_at'>>;
      };
      recurring_expenses: {
        Row: RecurringExpense;
        Insert: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>>;
      };
      recurring_expense_payments: {
        Row: RecurringExpensePayment;
        Insert: Omit<RecurringExpensePayment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RecurringExpensePayment, 'id' | 'created_at' | 'updated_at'>>;
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Goal, 'id' | 'created_at' | 'updated_at'>>;
      };
      goal_milestones: {
        Row: GoalMilestone;
        Insert: Omit<GoalMilestone, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GoalMilestone, 'id' | 'created_at' | 'updated_at'>>;
      };
      goal_task_links: {
        Row: GoalTaskLink;
        Insert: Omit<GoalTaskLink, 'id' | 'created_at'>;
        Update: Partial<Omit<GoalTaskLink, 'id' | 'created_at'>>;
      };
      goal_routine_links: {
        Row: GoalRoutineLink;
        Insert: Omit<GoalRoutineLink, 'id' | 'created_at'>;
        Update: Partial<Omit<GoalRoutineLink, 'id' | 'created_at'>>;
      };
      habits: {
        Row: Habit;
        Insert: Omit<Habit, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Habit, 'id' | 'created_at' | 'updated_at'>>;
      };
      habit_completions: {
        Row: HabitCompletion;
        Insert: Omit<HabitCompletion, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HabitCompletion, 'id' | 'created_at' | 'updated_at'>>;
      };
      habit_streaks: {
        Row: HabitStreak;
        Insert: Omit<HabitStreak, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HabitStreak, 'id' | 'created_at' | 'updated_at'>>;
      };
      habit_skips: {
        Row: HabitSkip;
        Insert: Omit<HabitSkip, 'id' | 'created_at'>;
        Update: Partial<Omit<HabitSkip, 'id' | 'created_at'>>;
      };
      calendar_sources: {
        Row: CalendarSource;
        Insert: Omit<CalendarSource, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CalendarSource, 'id' | 'created_at' | 'updated_at'>>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>;
      };
      calendar_sync_log: {
        Row: CalendarSyncLog;
        Insert: Omit<CalendarSyncLog, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CalendarSyncLog, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>;
      };
      notification_preferences: {
        Row: NotificationPreferencesDB;
        Insert: Omit<NotificationPreferencesDB, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationPreferencesDB, 'id' | 'created_at' | 'updated_at'>>;
      };
      ai_providers: {
        Row: AIProvider;
        Insert: Omit<AIProvider, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AIProvider, 'id' | 'created_at' | 'updated_at'>>;
      };
      ai_conversations: {
        Row: AIConversation;
        Insert: Omit<AIConversation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AIConversation, 'id' | 'created_at' | 'updated_at'>>;
      };
      ai_messages: {
        Row: AIMessage;
        Insert: Omit<AIMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<AIMessage, 'id' | 'created_at'>>;
      };
      ai_commands: {
        Row: AICommand;
        Insert: Omit<AICommand, 'id' | 'created_at'>;
        Update: Partial<Omit<AICommand, 'id' | 'created_at'>>;
      };
      ai_weekly_reports: {
        Row: AIWeeklyReport;
        Insert: Omit<AIWeeklyReport, 'id' | 'created_at'>;
        Update: Partial<Omit<AIWeeklyReport, 'id' | 'created_at'>>;
      };
    };
  };
}

// Core domain types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  monthly_budget: number | null;
  theme: 'light' | 'dark' | 'system';
  notification_preferences: NotificationPreferences | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
  budget_alerts: boolean;
  task_reminders: boolean;
  routine_reminders: boolean;
}

// ============================================================
// EXPENSES
// ============================================================
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'utilities'
  | 'other';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ============================================================
// TASKS
// ============================================================
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  tags: string[];
  parent_task_id: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================================
// ROUTINES
// ============================================================
export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: RoutineFrequency;
  time_of_day: string | null; // HH:mm format
  days_of_week: number[]; // 0-6, Sunday = 0
  is_active: boolean;
  streak_count: number;
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RoutineFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

// ============================================================
// POMODORO
// ============================================================
export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  type: PomodoroType;
  duration_minutes: number;
  completed_minutes: number;
  status: PomodoroStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PomodoroType = 'focus' | 'short_break' | 'long_break';
export type PomodoroStatus = 'running' | 'paused' | 'completed' | 'cancelled';

// ============================================================
// SCHEDULE
// ============================================================
export interface ScheduleEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  day_of_week: number; // 0-6
  color: string;
  is_recurring: boolean;
  event_type: ScheduleEventType;
  created_at: string;
  updated_at: string;
}

export type ScheduleEventType = 'class' | 'work' | 'personal' | 'appointment';

export interface Holiday {
  id: string;
  user_id: string;
  name: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// REMINDERS (Legacy - replaced by Notifications)
// ============================================================
export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  trigger_at: string;
  repeat: ReminderRepeat | null;
  is_active: boolean;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

// ============================================================
// BUDGETS & FINANCIAL GOALS (Phase 3)
// ============================================================
export interface Budget {
  id: string;
  user_id: string;
  month: string; // YYYY-MM-DD (first day of month)
  amount: number;
  currency: string;
  alert_threshold: number; // percentage
  created_at: string;
  updated_at: string;
}

export interface CategoryBudget {
  id: string;
  budget_id: string;
  category: ExpenseCategory;
  amount: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  icon: string | null;
  color: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsContribution {
  id: string;
  savings_goal_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface MonthlyFinancialSummary {
  id: string;
  user_id: string;
  month: string; // YYYY-MM-DD
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  budget_amount: number;
  budget_spent: number;
  budget_remaining: number;
  budget_percentage: number;
  top_category: string | null;
  top_category_amount: number;
  subscription_total: number;
  created_at: string;
  updated_at: string;
}

// Budget progress for UI
export interface BudgetProgress {
  spent: number;
  budget: number;
  remaining: number;
  percentage: number;
  currency: string;
  categoryBreakdown: Record<ExpenseCategory, { spent: number; budget: number; percentage: number }>;
}

// ============================================================
// RECURRING EXPENSES & SUBSCRIPTIONS (Phase 3)
// ============================================================
export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_payment_date: string;
  last_payment_date: string | null;
  is_active: boolean;
  reminder_days_before: number;
  payment_method: string | null;
  auto_create_expense: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpensePayment {
  id: string;
  recurring_expense_id: string;
  user_id: string;
  amount: number;
  paid_on: string;
  expense_id: string | null;
  status: 'paid' | 'failed' | 'skipped' | 'pending';
  note: string | null;
  created_at: string;
}

// Upcoming payment for dashboard
export interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  frequency: RecurringFrequency;
  next_payment_date: string;
  days_until: number;
  is_active: boolean;
}

// ============================================================
// GOALS SYSTEM (Phase 3)
// ============================================================
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  start_date: string;
  progress: number; // 0-100
  status: GoalStatus;
  priority: GoalPriority;
  category: string | null;
  icon: string | null;
  color: string;
  parent_goal_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface GoalMilestone {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalTaskLink {
  id: string;
  goal_id: string;
  task_id: string;
  created_at: string;
}

export interface GoalRoutineLink {
  id: string;
  goal_id: string;
  routine_id: string;
  created_at: string;
}

export interface GoalWithRelations extends Goal {
  milestones: GoalMilestone[];
  linked_tasks: Task[];
  linked_routines: Routine[];
}

// ============================================================
// HABIT TRACKER (Phase 3)
// ============================================================
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  days_of_week: number[]; // For custom frequency
  times_per_period: number; // For weekly frequency
  reminder_time: string | null; // HH:mm
  reminder_enabled: boolean;
  color: string;
  icon: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  date: string; // YYYY-MM-DD
  count: number;
  note: string | null;
  mood: number | null; // 1-5
  created_at: string;
}

export interface HabitStreak {
  id: string;
  habit_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  streak_start_date: string | null;
  updated_at: string;
}

export interface HabitSkip {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  reason: string | null;
  created_at: string;
}

// Habit statistics for UI
export interface HabitStats {
  habit_id: string;
  total_completions: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number; // percentage for last 30 days
  best_streak: number;
  completions_by_weekday: Record<number, number>; // 0-6
  completions_by_month: Record<string, number>; // YYYY-MM
  heatmap_data: HabitHeatmapDay[];
}

export interface HabitHeatmapDay {
  date: string; // YYYY-MM-DD
  count: number; // number of completions
  intensity: number; // 0-4 for GitHub-style heatmap
  is_today: boolean;
  is_future: boolean;
}

// Today's habit for dashboard
export interface TodayHabit {
  habit: Habit;
  is_completed: boolean;
  completion_count: number;
  target_count: number;
  streak: number;
}

// ============================================================
// CALENDAR INTEGRATION (Phase 3)
// ============================================================
export interface CalendarSource {
  id: string;
  user_id: string;
  name: string;
  provider: CalendarProvider;
  external_id: string | null;
  access_token: string | null; // Encrypted
  refresh_token: string | null; // Encrypted
  token_expires_at: string | null;
  color: string;
  is_primary: boolean;
  is_visible: boolean;
  sync_enabled: boolean;
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'ical' | 'local';

export interface CalendarEvent {
  id: string;
  user_id: string;
  calendar_source_id: string | null;
  external_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  timezone: string;
  recurrence_rule: string | null; // RRULE
  recurrence_exception_dates: string[] | null; // EXDATE
  recurrence_id: string | null;
  status: CalendarEventStatus;
  visibility: CalendarEventVisibility;
  color: string | null;
  is_recurring: boolean;
  event_type: CalendarEventType;
  meeting_url: string | null;
  attendees: CalendarAttendee[];
  reminders: CalendarReminder[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CalendarEventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type CalendarEventVisibility = 'default' | 'public' | 'private' | 'confidential';
export type CalendarEventType = 'class' | 'work' | 'personal' | 'appointment' | 'focus' | 'break';

export interface CalendarAttendee {
  email: string;
  name: string | null;
  status: 'needsAction' | 'accepted' | 'declined' | 'tentative';
  response: boolean | null;
}

export interface CalendarReminder {
  method: 'email' | 'popup' | 'push';
  minutes_before: number;
}

export interface CalendarSyncLog {
  id: string;
  calendar_source_id: string;
  user_id: string;
  status: 'success' | 'partial' | 'failed';
  events_synced: number;
  events_created: number;
  events_updated: number;
  events_deleted: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Calendar view types
export interface CalendarDay {
  date: string; // YYYY-MM-DD
  day_number: number;
  is_current_month: boolean;
  is_today: boolean;
  is_weekend: boolean;
  events: CalendarEvent[];
  has_holiday: boolean;
  holiday_name: string | null;
}

export interface CalendarWeek {
  week_start: string;
  days: CalendarDay[];
}

export interface CalendarMonth {
  month: string; // YYYY-MM
  weeks: CalendarWeek[];
}

// ============================================================
// SMART NOTIFICATIONS (Phase 3)
// ============================================================
export type NotificationType =
  | 'task_reminder'
  | 'habit_reminder'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'subscription_renewal'
  | 'goal_deadline'
  | 'pomodoro_reminder'
  | 'schedule_reminder'
  | 'routine_reminder'
  | 'milestone_due'
  | 'weekly_report'
  | 'achievement'
  | 'streak_milestone'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  priority: NotificationPriority;
  related_entity_type: string | null;
  related_entity_id: string | null;
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  read_at: string | null;
  archived_at: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  delivery_channels: NotificationChannel[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesDB {
  id: string;
  user_id: string;
  // In-app
  in_app_enabled: boolean;
  // Email
  email_enabled: boolean;
  email_daily_summary: boolean;
  email_weekly_report: boolean;
  email_budget_alerts: boolean;
  email_task_reminders: boolean;
  email_routine_reminders: boolean;
  email_habit_reminders: boolean;
  email_goal_deadlines: boolean;
  email_subscription_renewals: boolean;
  // Push
  push_enabled: boolean;
  push_task_reminders: boolean;
  push_routine_reminders: boolean;
  push_habit_reminders: boolean;
  push_budget_warnings: boolean;
  push_subscription_renewals: boolean;
  push_goal_deadlines: boolean;
  push_pomodoro_reminders: boolean;
  push_schedule_reminders: boolean;
  // Timing
  quiet_hours_start: string; // HH:mm
  quiet_hours_end: string; // HH:mm
  timezone: string;
  // Frequency
  max_daily_notifications: number;
  batch_similar: boolean;
  created_at: string;
  updated_at: string;
}

// Notification center state
export interface NotificationCenterState {
  notifications: Notification[];
  unread_count: number;
  is_loading: boolean;
  has_more: boolean;
}

// ============================================================
// AI PRODUCTIVITY (Phase 4 - Architecture preparation)
// ============================================================
export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';
export type AIModelCapability = 'chat' | 'completion' | 'embedding' | 'function_calling';

export interface AIProvider {
  id: string;
  user_id: string;
  provider: AIProviderType;
  name: string;
  api_key_encrypted: string | null;
  base_url: string | null;
  model: string;
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  is_active: boolean;
  capabilities: AIModelCapability[];
  rate_limit_rpm: number;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  ai_provider_id: string | null;
  title: string | null;
  system_prompt: string | null;
  model: string | null;
  temperature: number | null;
  total_tokens: number;
  total_cost: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls: unknown | null;
  tool_call_id: string | null;
  tokens_used: number;
  cost: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AICommand {
  id: string;
  user_id: string;
  conversation_id: string | null;
  command_text: string;
  parsed_intent: string | null;
  parsed_entities: Record<string, unknown>;
  actions: AIAction[];
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  result: unknown | null;
  error_message: string | null;
  executed_at: string | null;
  created_at: string;
}

export interface AIAction {
  type: string;
  payload: Record<string, unknown>;
  description: string;
}

export interface AIWeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  report_data: Record<string, unknown>;
  summary: string | null;
  insights: unknown[];
  recommendations: unknown[];
  generated_by_ai_provider_id: string | null;
  tokens_used: number;
  cost: number;
  is_read: boolean;
  created_at: string;
}

// AI context for the assistant
export interface AIContext {
  user_id: string;
  tasks: Task[];
  expenses: Expense[];
  goals: Goal[];
  habits: Habit[];
  pomodoro_sessions: PomodoroSession[];
  schedule_events: ScheduleEvent[];
  routines: Routine[];
  budgets: Budget[];
  savings_goals: SavingsGoal[];
  recurring_expenses: RecurringExpense[];
  preferences: NotificationPreferencesDB | null;
  profile: Profile | null;
}

// Natural language command parsing
export interface ParsedCommand {
  intent: string;
  entities: Record<string, unknown>;
  confidence: number;
  actions: AIAction[];
}

// ============================================================
// ANALYTICS (Enhanced)
// ============================================================
export interface DailySpending {
  date: string;
  total: number;
  by_category: Record<ExpenseCategory, number>;
}

export interface WeeklySpending {
  week_start: string;
  total: number;
  daily: DailySpending[];
}

export interface TaskStats {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate: number;
  by_priority: Record<TaskPriority, number>;
}

export interface PomodoroStats {
  total_sessions: number;
  total_focus_minutes: number;
  average_session_length: number;
  streak_days: number;
  by_type: Record<PomodoroType, number>;
}

export interface RoutineStats {
  total: number;
  active: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
}

// Enhanced analytics for Phase 3
export interface ProductivityAnalytics {
  // Focus & Pomodoro
  focus_hours: number;
  tasks_completed: number;
  completion_rate: number;
  most_productive_day: string | null;
  most_productive_hour: number | null;
  pomodoro_stats: PomodoroStats;
  habit_consistency: number;
  routine_completion: number;
  
  // Finance
  income_vs_expenses: { income: number; expenses: number; net: number };
  category_spending: Record<ExpenseCategory, number>;
  monthly_spending_trend: { month: string; total: number }[];
  budget_adherence: number;
  savings_rate: number;
  subscription_spending: number;
  
  // Goals
  goal_completion_rate: number;
  goal_progress_average: number;
  milestones_completed: number;
  
  // Habits
  habit_completion_rate: number;
  active_habits: number;
  longest_habit_streak: number;
}

export interface AnalyticsFilters {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  start_date?: string;
  end_date?: string;
}

// ============================================================
// COMMAND PALETTE (Phase 3)
// ============================================================
export interface CommandPaletteItem {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: CommandCategory;
  action: () => void | Promise<void>;
  keywords: string[];
  shortcut?: string;
}

export type CommandCategory =
  | 'navigation'
  | 'create'
  | 'search'
  | 'actions'
  | 'settings'
  | 'ai';

// ============================================================
// FORM VALIDATION SCHEMAS (Zod)
// ============================================================
import { z } from 'zod';

// Existing schemas
export const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other']),
  description: z.string().max(200).optional(),
  date: z.string().date(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'archived']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional().nullable().transform(val => val === '' ? null : val),
  estimated_minutes: z.number().positive().optional().nullable(),
  tags: z.array(z.string()).default([]),
  parent_task_id: z.string().uuid().optional().nullable(),
});

export const routineSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']),
  time_of_day: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  days_of_week: z.array(z.number().min(0).max(6)).default([]),
});

export const pomodoroSchema = z.object({
  task_id: z.string().uuid().optional().nullable(),
  type: z.enum(['focus', 'short_break', 'long_break']),
  duration_minutes: z.number().positive().max(120),
});

export const scheduleEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  day_of_week: z.number().min(0).max(6),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  is_recurring: z.boolean().default(true),
  event_type: z.enum(['class', 'work', 'personal', 'appointment']),
});

export const holidaySchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().date(),
  is_recurring: z.boolean().default(false),
});

export const reminderSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().max(200).optional(),
  trigger_at: z.string().datetime(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().nullable(),
});

// Phase 3 schemas
export const budgetSchema = z.object({
  month: z.string().date(),
  amount: z.number().nonnegative(),
  currency: z.string().default('USD'),
  alert_threshold: z.number().min(0).max(100).default(80),
});

export const categoryBudgetSchema = z.object({
  budget_id: z.string().uuid(),
  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other']),
  amount: z.number().nonnegative(),
  alert_threshold: z.number().min(0).max(100).default(80),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target_amount: z.number().positive(),
  current_amount: z.number().nonnegative().default(0),
  currency: z.string().default('USD'),
  target_date: z.string().date().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
});

export const savingsContributionSchema = z.object({
  savings_goal_id: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().max(200).optional(),
});

export const recurringExpenseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string().date(),
  end_date: z.string().date().optional().nullable(),
  reminder_days_before: z.number().int().min(0).max(30).default(3),
  payment_method: z.string().max(50).optional(),
  auto_create_expense: z.boolean().default(true),
});

export const goalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  target_date: z.string().date().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().max(50).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
  parent_goal_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'completed', 'paused', 'archived', 'cancelled']).default('active'),
  progress: z.number().min(0).max(100).default(0),
  completed_at: z.string().datetime().optional().nullable(),
});

export const goalMilestoneSchema = z.object({
  goal_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target_date: z.string().date().optional().nullable(),
  order_index: z.number().int().nonnegative().default(0),
  is_completed: z.boolean().default(false),
  completed_at: z.string().datetime().optional().nullable(),
});

export const habitSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  frequency: z.enum(['daily', 'weekly', 'custom']),
  days_of_week: z.array(z.number().min(0).max(6)).default([]),
  times_per_period: z.number().int().positive().default(1),
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  reminder_enabled: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
  icon: z.string().optional(),
});

export const habitCompletionSchema = z.object({
  habit_id: z.string().uuid(),
  date: z.string().date(),
  count: z.number().int().positive().default(1),
  note: z.string().max(200).optional(),
  mood: z.number().int().min(1).max(5).optional(),
});

export const habitSkipSchema = z.object({
  habit_id: z.string().uuid(),
  date: z.string().date(),
  reason: z.string().max(200).optional(),
});

export const calendarSourceSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(['google', 'outlook', 'apple', 'ical', 'local']),
  external_id: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
  is_primary: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  sync_enabled: z.boolean().default(true),
});

export const calendarEventSchema = z.object({
  calendar_source_id: z.string().uuid().optional().nullable(),
  external_id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  all_day: z.boolean().default(false),
  timezone: z.string().default('UTC'),
  recurrence_rule: z.string().optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  visibility: z.enum(['default', 'public', 'private', 'confidential']).default('default'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  is_recurring: z.boolean().default(false),
  event_type: z.enum(['class', 'work', 'personal', 'appointment', 'focus', 'break']).default('personal'),
  meeting_url: z.string().url().optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    status: z.enum(['needsAction', 'accepted', 'declined', 'tentative']),
    response: z.boolean().optional(),
  })).default([]),
  reminders: z.array(z.object({
    method: z.enum(['email', 'popup', 'push']),
    minutes_before: z.number().int().positive(),
  })).default([]),
});

export const notificationSchema = z.object({
  type: z.enum([
    'task_reminder', 'habit_reminder', 'budget_warning', 'budget_exceeded',
    'subscription_renewal', 'goal_deadline', 'pomodoro_reminder',
    'schedule_reminder', 'routine_reminder', 'milestone_due',
    'weekly_report', 'achievement', 'streak_milestone', 'custom'
  ]),
  title: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  related_entity_type: z.string().optional(),
  related_entity_id: z.string().uuid().optional(),
  action_url: z.string().url().optional(),
  action_label: z.string().max(50).optional(),
  scheduled_for: z.string().datetime().optional(),
  delivery_channels: z.array(z.enum(['in_app', 'email', 'push', 'sms'])).default(['in_app']),
  metadata: z.record(z.unknown()).default({}),
});

export const notificationPreferencesSchema = z.object({
  in_app_enabled: z.boolean().default(true),
  email_enabled: z.boolean().default(true),
  email_daily_summary: z.boolean().default(true),
  email_weekly_report: z.boolean().default(false),
  email_budget_alerts: z.boolean().default(true),
  email_task_reminders: z.boolean().default(true),
  email_routine_reminders: z.boolean().default(true),
  email_habit_reminders: z.boolean().default(true),
  email_goal_deadlines: z.boolean().default(true),
  email_subscription_renewals: z.boolean().default(true),
  push_enabled: z.boolean().default(true),
  push_task_reminders: z.boolean().default(true),
  push_routine_reminders: z.boolean().default(true),
  push_habit_reminders: z.boolean().default(true),
  push_budget_warnings: z.boolean().default(true),
  push_subscription_renewals: z.boolean().default(true),
  push_goal_deadlines: z.boolean().default(true),
  push_pomodoro_reminders: z.boolean().default(true),
  push_schedule_reminders: z.boolean().default(true),
  quiet_hours_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('22:00'),
  quiet_hours_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('08:00'),
  timezone: z.string().default('UTC'),
  max_daily_notifications: z.number().int().positive().default(50),
  batch_similar: z.boolean().default(true),
});

export const aiProviderSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'custom']),
  name: z.string().min(1).max(50),
  api_key: z.string().optional(), // Will be encrypted before storage
  base_url: z.string().url().optional(),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().default(4000),
  capabilities: z.array(z.enum(['chat', 'completion', 'embedding', 'function_calling'])).default(['chat']),
  rate_limit_rpm: z.number().int().positive().default(60),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const aiConversationSchema = z.object({
  ai_provider_id: z.string().uuid().optional(),
  title: z.string().max(100).optional(),
  system_prompt: z.string().max(2000).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export const aiMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  tool_calls: z.unknown().optional(),
  tool_call_id: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const aiCommandSchema = z.object({
  command_text: z.string().min(1).max(1000),
  parsed_intent: z.string().optional(),
  parsed_entities: z.record(z.unknown()).default({}),
  actions: z.array(z.object({
    type: z.string(),
    payload: z.record(z.unknown()),
    description: z.string(),
  })).default([]),
});

// Type inference
export type ExpenseForm = z.infer<typeof expenseSchema>;
export type TaskForm = z.infer<typeof taskSchema>;
export type RoutineForm = z.infer<typeof routineSchema>;
export type PomodoroForm = z.infer<typeof pomodoroSchema>;
export type ScheduleEventForm = z.infer<typeof scheduleEventSchema>;
export type HolidayForm = z.infer<typeof holidaySchema>;
export type ReminderForm = z.infer<typeof reminderSchema>;
export type BudgetForm = z.infer<typeof budgetSchema>;
export type CategoryBudgetForm = z.infer<typeof categoryBudgetSchema>;
export type SavingsGoalForm = z.infer<typeof savingsGoalSchema>;
export type SavingsContributionForm = z.infer<typeof savingsContributionSchema>;
export type RecurringExpenseForm = z.infer<typeof recurringExpenseSchema>;
export type GoalForm = z.infer<typeof goalSchema>;
export type GoalMilestoneForm = z.infer<typeof goalMilestoneSchema>;
export type HabitForm = z.infer<typeof habitSchema>;
export type HabitCompletionForm = z.infer<typeof habitCompletionSchema>;
export type HabitSkipForm = z.infer<typeof habitSkipSchema>;
export type CalendarSourceForm = z.infer<typeof calendarSourceSchema>;
export type CalendarEventForm = z.infer<typeof calendarEventSchema>;
export type NotificationForm = z.infer<typeof notificationSchema>;
export type NotificationPreferencesForm = z.infer<typeof notificationPreferencesSchema>;
export type AIProviderForm = z.infer<typeof aiProviderSchema>;
export type AIConversationForm = z.infer<typeof aiConversationSchema>;
export type AIMessageForm = z.infer<typeof aiMessageSchema>;
export type AICommandForm = z.infer<typeof aiCommandSchema>;