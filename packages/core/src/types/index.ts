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
      // College Management tables
      academic_terms: {
        Row: AcademicTerm;
        Insert: Omit<AcademicTerm, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AcademicTerm, 'id' | 'created_at' | 'updated_at'>>;
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>;
      };
      attendance_records: {
        Row: AttendanceRecord;
        Insert: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>>;
      };
      subject_grades: {
        Row: SubjectGrade;
        Insert: Omit<SubjectGrade, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SubjectGrade, 'id' | 'created_at' | 'updated_at'>>;
      };
      academic_calendar_events: {
        Row: AcademicCalendarEvent;
        Insert: Omit<AcademicCalendarEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AcademicCalendarEvent, 'id' | 'created_at' | 'updated_at'>>;
      };
      timetable_imports: {
        Row: TimetableImport;
        Insert: Omit<TimetableImport, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TimetableImport, 'id' | 'created_at' | 'updated_at'>>;
      };
      attendance_baselines: {
        Row: AttendanceBaseline;
        Insert: Omit<AttendanceBaseline, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AttendanceBaseline, 'id' | 'created_at' | 'updated_at'>>;
      };
      academic_documents: {
        Row: AcademicDocument;
        Insert: Omit<AcademicDocument, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AcademicDocument, 'id' | 'created_at' | 'updated_at'>>;
      };
      notification_rules: {
        Row: NotificationRule;
        Insert: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>>;
      };
      attendance_auto_mark_config: {
        Row: AttendanceAutoMarkConfig;
        Insert: Omit<AttendanceAutoMarkConfig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AttendanceAutoMarkConfig, 'id' | 'created_at' | 'updated_at'>>;
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
  // College profile fields
  college_name: string | null;
  university: string | null;
  degree: string | null;
  branch: string | null;
  academic_year: string | null;
  current_semester: number | null;
  roll_number: string | null;
  enrollment_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  // In-app
  in_app_enabled?: boolean;
  // Email
  email_enabled?: boolean;
  email_daily_summary?: boolean;
  email_weekly_report?: boolean;
  email_budget_alerts?: boolean;
  email_task_reminders?: boolean;
  email_routine_reminders?: boolean;
  email_habit_reminders?: boolean;
  email_goal_deadlines?: boolean;
  email_subscription_renewals?: boolean;
  // Push
  push_enabled?: boolean;
  push_task_reminders?: boolean;
  push_routine_reminders?: boolean;
  push_habit_reminders?: boolean;
  push_budget_warnings?: boolean;
  push_subscription_renewals?: boolean;
  push_goal_deadlines?: boolean;
  push_pomodoro_reminders?: boolean;
  push_schedule_reminders?: boolean;
  // Timing
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  // Frequency
  max_daily_notifications?: number;
  batch_similar?: boolean;
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
  subject_id: string | null;
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
// NotificationChannel is defined later with 'browser' support

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

// ============================================================
// COLLEGE MANAGEMENT SYSTEM
// ============================================================

export interface AcademicTerm {
  id: string;
  user_id: string;
  name: string; // e.g., "Fall 2024"
  code: string; // e.g., "FA24"
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Subject {
  id: string;
  user_id: string;
  academic_term_id: string;
  name: string; // e.g., "Calculus I"
  code: string; // e.g., "MATH101"
  faculty: string | null;
  credits: number;
  color: string;
  icon: string | null;
  description: string | null;
  attendance_threshold: number; // Minimum percentage required (default 75)
  total_classes_scheduled: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectWithTerm extends Subject {
  academic_terms: AcademicTerm;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  class_session_number: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Attendance summary from database function
export interface AttendanceSummary {
  total_classes: number;
  attended: number;
  missed: number;
  excused: number;
  percentage: number;
  classes_needed_for_threshold: number;
  classes_can_miss: number;
}

export interface SubjectAttendance extends SubjectWithTerm {
  attendance_summary: AttendanceSummary;
  recent_records: AttendanceRecord[];
}

// Academic task types (extended from tasks)
export type AcademicTaskType = 'assignment' | 'exam' | 'quiz' | 'project' | 'homework' | 'other';

export interface AcademicTask extends Task {
  subject_id: string | null;
  academic_type: AcademicTaskType | null;
  weight: number | null; // Percentage weight for grade calculation
  score_obtained: number | null;
  max_score: number | null;
  submission_date: string | null;
  is_graded: boolean;
  subject?: SubjectWithTerm | null;
}

export interface SubjectGrade {
  id: string;
  user_id: string;
  subject_id: string;
  task_id: string;
  weight: number;
  score_obtained: number | null;
  max_score: number;
  percentage: number;
  letter_grade: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubjectWithGrades extends Subject {
  grades: SubjectGrade[];
  overall_percentage: number | null;
  overall_letter_grade: string | null;
}

// Timetable entry (extends schedule_events with subject_id)
export interface TimetableEntry extends ScheduleEvent {
  subject_id: string | null;
  subject?: Subject;
  academic_term_id: string | null;
}

// College dashboard data
export interface CollegeDashboardData {
  current_term: AcademicTerm | null;
  subjects: SubjectWithTerm[];
  today_classes: TimetableEntry[];
  upcoming_assignments: AcademicTask[];
  upcoming_exams: AcademicTask[];
  attendance_alerts: SubjectAttendance[];
  attendance_summary: {
    total_subjects: number;
    subjects_below_threshold: number;
    overall_attendance: number;
  };
}

// ============================================================
// ACADEMIC DOCUMENTS
// ============================================================

export type DocumentCategory = 
  | 'fee_structure' 
  | 'fee_receipts' 
  | 'bonafide_certificates' 
  | 'scholarship_documents' 
  | 'scholarship_receipts' 
  | 'academic_calendars' 
  | 'examination_notices' 
  | 'syllabus' 
  | 'admit_cards' 
  | 'mark_sheets' 
  | 'college_notices' 
  | 'other';

export type DocumentFileType = 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';

export type DocumentSource = 'manual' | 'calendar_import' | 'timetable_import' | 'assignment_submission';

export interface AcademicDocument {
  id: string;
  user_id: string;
  academic_term_id: string | null;
  subject_id: string | null;
  filename: string;
  original_filename: string;
  file_type: DocumentFileType;
  mime_type: string | null;
  file_size: number;
  storage_path: string;
  category: DocumentCategory;
  folder: string | null;
  academic_year: string | null;
  semester: string | null;
  description: string | null;
  source: DocumentSource;
  import_batch_id: string | null;
  is_archived: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicDocumentForm {
  academic_term_id?: string | null;
  subject_id?: string | null;
  category: DocumentCategory;
  folder?: string | null;
  academic_year?: string | null;
  semester?: string | null;
  description?: string | null;
}

// ============================================================
// NOTIFICATION RULES
// ============================================================

export type NotificationTriggerType = 
  | 'class_starting' 
  | 'class_ending' 
  | 'break_starting' 
  | 'break_ending'
  | 'exam_reminder' 
  | 'assignment_due' 
  | 'academic_event' 
  | 'schedule_change';

export type NotificationChannel = 'in_app' | 'browser' | 'email';

export interface NotificationRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  trigger_type: NotificationTriggerType;
  lead_time_minutes: number;
  filters: Record<string, unknown>;
  channels: NotificationChannel[];
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationRuleForm {
  name: string;
  description?: string | null;
  is_enabled?: boolean;
  trigger_type: NotificationTriggerType;
  lead_time_minutes?: number;
  filters?: Record<string, unknown>;
  channels?: NotificationChannel[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  cooldown_minutes?: number;
}

// ============================================================
// ATTENDANCE AUTO-MARK CONFIG
// ============================================================

export type AutoMarkStatus = 'present' | 'absent' | 'excused';
export type AutoMarkSource = 'auto' | 'manual' | 'import';

export interface AttendanceAutoMarkConfig {
  id: string;
  user_id: string;
  is_enabled: boolean;
  grace_period_minutes: number;
  apply_to_all_subjects: boolean;
  subject_ids: string[];
  default_status: AutoMarkStatus;
  exclude_holidays: boolean;
  exclude_cancelled_classes: boolean;
  only_past_classes: boolean;
  notify_before_auto_mark: boolean;
  notification_lead_time_minutes: number;
  mark_source: AutoMarkSource;
  created_at: string;
  updated_at: string;
}

export interface AttendanceAutoMarkConfigForm {
  is_enabled?: boolean;
  grace_period_minutes?: number;
  apply_to_all_subjects?: boolean;
  subject_ids?: string[];
  default_status?: AutoMarkStatus;
  exclude_holidays?: boolean;
  exclude_cancelled_classes?: boolean;
  only_past_classes?: boolean;
  notify_before_auto_mark?: boolean;
  notification_lead_time_minutes?: number;
  mark_source?: AutoMarkSource;
}

// ============================================================
// ACADEMIC CALENDAR EVENTS (from database)
// ============================================================

export interface AcademicCalendarEvent {
  id: string;
  user_id: string;
  academic_term_id: string | null;
  title: string;
  description: string | null;
  event_type: 'holiday' | 'exam' | 'exam_period' | 'assignment_due' | 'registration_deadline' | 'college_event' | 'other';
  start_date: string;
  end_date: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  source: 'pdf_import' | 'manual' | 'ics_import' | 'csv_import';
  import_batch_id: string | null;
  confidence_score: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AcademicCalendarEventForm {
  academic_term_id?: string | null;
  title: string;
  description?: string | null;
  event_type: AcademicCalendarEvent['event_type'];
  start_date: string;
  end_date?: string | null;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  source?: AcademicCalendarEvent['source'];
  import_batch_id?: string | null;
  confidence_score?: number | null;
  metadata?: Record<string, unknown>;
}

// ============================================================
// TIMETABLE IMPORTS
// ============================================================

export interface TimetableImport {
  id: string;
  user_id: string;
  academic_term_id: string | null;
  filename: string;
  file_type: 'pdf' | 'csv' | 'ics' | 'manual';
  file_size: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  extracted_data: unknown | null;
  parsing_errors: unknown | null;
  imported_count: number;
  skipped_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ATTENDANCE BASELINES
// ============================================================

export type BaselineSource = 'pdf_import' | 'manual' | 'legacy_import';

export interface AttendanceBaseline {
  id: string;
  user_id: string;
  subject_id: string;
  total_conducted: number;
  total_attended: number;
  source: BaselineSource;
  import_batch_id: string | null;
  semester: string | null;
  academic_term_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceBaselineForm {
  subject_id: string;
  total_conducted: number;
  total_attended: number;
  source: BaselineSource;
  import_batch_id?: string | null;
  semester?: string | null;
  academic_term_id?: string | null;
  notes?: string | null;
}

// Grade letter calculation
export function calculateLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

// Get attendance status color
export function getAttendanceStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case 'present': return 'text-success-600 bg-success-100 dark:bg-success-900/30 dark:text-success-400';
    case 'absent': return 'text-danger-600 bg-danger-100 dark:bg-danger-900/30 dark:text-danger-400';
    case 'late': return 'text-warning-600 bg-warning-100 dark:bg-warning-900/30 dark:text-warning-400';
    case 'excused': return 'text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400';
    default: return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
  }
}

// Get attendance status label
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'present': return 'Present';
    case 'absent': return 'Absent';
    case 'late': return 'Late';
    case 'excused': return 'Excused';
    default: return 'Unknown';
  }
}

// Get academic task type color
export function getAcademicTaskTypeColor(type: AcademicTaskType): string {
  switch (type) {
    case 'exam': return 'text-danger-600 bg-danger-100 dark:bg-danger-900/30 dark:text-danger-400';
    case 'quiz': return 'text-warning-600 bg-warning-100 dark:bg-warning-900/30 dark:text-warning-400';
    case 'assignment': return 'text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400';
    case 'project': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
    case 'homework': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
  }
}

// Get academic task type label
export function getAcademicTaskTypeLabel(type: AcademicTaskType): string {
  switch (type) {
    case 'exam': return 'Exam';
    case 'quiz': return 'Quiz';
    case 'assignment': return 'Assignment';
    case 'project': return 'Project';
    case 'homework': return 'Homework';
    default: return 'Other';
  }
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
// ATTENDANCE PLANNER
// ============================================================

export interface AttendancePlannerConfig {
  target_percentage: number;
  average_classes_per_day: number;
  total_classes: number;
  attended_classes: number;
  use_timetable: boolean;
  start_date: string | null;
}

// ============================================================
// DOCUMENT PARSING TYPES
// ============================================================

export interface ImportAttendanceBaselineData {
  subject_id: string;
  total_conducted: number;
  total_attended: number;
  source: 'pdf_import' | 'manual' | 'legacy_import';
  import_batch_id?: string;
  semester?: string;
  academic_term_id?: string;
  notes?: string;
}

export interface DocumentParseResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

export interface ParsedCalendarEvent {
  title: string;
  description?: string;
  event_type: 'holiday' | 'exam' | 'exam_period' | 'assignment_due' | 'registration_deadline' | 'college_event' | 'other';
  start_date: string; // YYYY-MM-DD
  end_date?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  confidence: number; // 0.0 to 1.0
  raw_text?: string;
}

export interface ParsedTimetableEntry {
  title: string;
  subject_name?: string;
  subject_code?: string;
  day_of_week: number; // 0-6 (Mon-Sun)
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  location?: string;
  event_type: 'class' | 'lab' | 'tutorial' | 'seminar' | 'other';
  color?: string;
  confidence: number;
  raw_text?: string;
}

export interface TimetableImportData {
  events: ParsedTimetableEntry[];
  subjects: Array<{
    name: string;
    code: string;
    color: string;
  }>;
  metadata: {
    total_entries: number;
    parsed_at: string;
    confidence_avg: number;
  };
}

export interface AcademicCalendarImportData {
  events: ParsedCalendarEvent[];
  metadata: {
    total_events: number;
    parsed_at: string;
    confidence_avg: number;
    date_range?: { start: string; end: string };
  };
}

export interface QuickCheckResult {
  leave_days: number;
  average_classes_per_day: number;
  estimated_classes_missed: number;
  new_total_classes: number;
  projected_attendance: number;
  percentage_point_decrease: number;
  current_attendance: number;
}

export interface ClassSkipResult {
  skip_classes: number;
  new_total_classes: number;
  projected_attendance: number;
  percentage_point_decrease: number;
  current_attendance: number;
}

export interface TargetReachResult {
  target_percentage: number;
  current_percentage: number;
  classes_needed: number;
  days_needed: number | null;
  is_target_achieved: boolean;
  is_impossible: boolean;
  message: string;
}

export interface ExactDayPlanItem {
  date: string;
  day_name: string;
  type: 'attendance' | 'leave';
  classes_count: number;
  cumulative_total_classes: number;
  cumulative_attended_classes: number;
  projected_attendance: number;
  is_holiday: boolean;
  is_weekend: boolean;
}

export interface ExactDayPlanResult {
  items: ExactDayPlanItem[];
  final_attendance: number;
  total_days: number;
  total_leave_days: number;
  total_attendance_days: number;
}

export interface HolidayPreviewRow {
  leave_days: number;
  estimated_classes_missed: number;
  projected_total_classes: number;
  projected_attendance: number;
  percentage_change: number;
  status: 'safe' | 'warning' | 'danger';
  meets_target: boolean;
}

// ============================================================
// ATTENDANCE PLANNER CALCULATION ENGINE
// ============================================================

/**
 * Calculate current attendance percentage
 */
export function calculateCurrentAttendance(attended: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((attended / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Quick Check: If I take leave
 */
export function calculateQuickCheck(input: {
  leave_days: number;
  average_classes_per_day: number;
  current_total_classes: number;
  current_attended_classes: number;
}): QuickCheckResult {
  const { leave_days, average_classes_per_day, current_total_classes, current_attended_classes } = input;
  
  const current_attendance = calculateCurrentAttendance(current_attended_classes, current_total_classes);
  const estimated_classes_missed = leave_days * average_classes_per_day;
  const new_total_classes = current_total_classes + estimated_classes_missed;
  const projected_attendance = calculateCurrentAttendance(current_attended_classes, new_total_classes);
  const percentage_point_decrease = Math.round((current_attendance - projected_attendance) * 100) / 100;
  
  return {
    leave_days,
    average_classes_per_day,
    estimated_classes_missed: Math.round(estimated_classes_missed * 100) / 100,
    new_total_classes,
    projected_attendance,
    percentage_point_decrease,
    current_attendance,
  };
}

/**
 * Class-by-Class: If I skip classes
 */
export function calculateClassSkip(input: {
  skip_classes: number;
  current_total_classes: number;
  current_attended_classes: number;
}): ClassSkipResult {
  const { skip_classes, current_total_classes, current_attended_classes } = input;
  
  const current_attendance = calculateCurrentAttendance(current_attended_classes, current_total_classes);
  const new_total_classes = current_total_classes + skip_classes;
  const projected_attendance = calculateCurrentAttendance(current_attended_classes, new_total_classes);
  const percentage_point_decrease = Math.round((current_attendance - projected_attendance) * 100) / 100;
  
  return {
    skip_classes,
    new_total_classes,
    projected_attendance,
    percentage_point_decrease,
    current_attendance,
  };
}

/**
 * Goal: Reach a target attendance percentage
 */
export function calculateTargetReach(input: {
  target_percentage: number;
  current_total_classes: number;
  current_attended_classes: number;
  average_classes_per_day?: number;
}): TargetReachResult {
  const { target_percentage, current_total_classes, current_attended_classes, average_classes_per_day } = input;
  
  const current_percentage = calculateCurrentAttendance(current_attended_classes, current_total_classes);
  
  // If already at or above target
  if (current_percentage >= target_percentage) {
    return {
      target_percentage,
      current_percentage,
      classes_needed: 0,
      days_needed: average_classes_per_day ? 0 : null,
      is_target_achieved: true,
      is_impossible: false,
      message: `Target already achieved! Current attendance: ${current_percentage.toFixed(2)}%`,
    };
  }
  
  // If target is 100% and there are any missed classes, it's impossible
  if (target_percentage >= 100 && current_attended_classes < current_total_classes) {
    return {
      target_percentage,
      current_percentage,
      classes_needed: -1,
      days_needed: null,
      is_target_achieved: false,
      is_impossible: true,
      message: 'Cannot reach 100% attendance with existing absences. You would need to attend infinite classes.',
    };
  }
  
  // Calculate minimum n such that (A + n) / (T + n) >= target/100
  // n >= (target * T / 100 - A) / (1 - target / 100)
  const target_ratio = target_percentage / 100;
  const numerator = target_ratio * current_total_classes - current_attended_classes;
  const denominator = 1 - target_ratio;
  
  if (denominator <= 0) {
    return {
      target_percentage,
      current_percentage,
      classes_needed: -1,
      days_needed: null,
      is_target_achieved: false,
      is_impossible: true,
      message: 'Target percentage is not achievable with current parameters.',
    };
  }
  
  const classes_needed = Math.ceil(numerator / denominator);
  const final_classes_needed = Math.max(0, classes_needed);
  
  let days_needed: number | null = null;
  if (average_classes_per_day && average_classes_per_day > 0) {
    days_needed = Math.ceil(final_classes_needed / average_classes_per_day);
  }
  
  return {
    target_percentage,
    current_percentage,
    classes_needed: final_classes_needed,
    days_needed,
    is_target_achieved: false,
    is_impossible: false,
    message: `Need to attend ${final_classes_needed} consecutive classes to reach ${target_percentage}%`,
  };
}

/**
 * Exact Day Planner
 */
export function calculateExactDayPlan(input: {
  start_date: string;
  planned_days: { date: string; type: 'attendance' | 'leave'; classes_count?: number }[];
  current_total_classes: number;
  current_attended_classes: number;
  average_classes_per_day?: number;
  holidays?: { date: string; is_recurring?: boolean }[];
}): ExactDayPlanResult {
  const { start_date, planned_days, current_total_classes, current_attended_classes, average_classes_per_day = 6, holidays = [] } = input;
  
  // Create a map of holidays for quick lookup
  const holidayMap = new Map<string, boolean>();
  holidays.forEach(h => {
    holidayMap.set(h.date, true);
    // If recurring, add yearly occurrences (simplified - just check month/day)
    if (h.is_recurring) {
      const [, month, day] = h.date.split('-');
      // Could expand for recurring holidays, but for now just use exact date
    }
  });
  
  const items: ExactDayPlanItem[] = [];
  let cumulative_total = current_total_classes;
  let cumulative_attended = current_attended_classes;
  let total_leave_days = 0;
  let total_attendance_days = 0;
  
  // Sort planned days by date
  const sortedDays = [...planned_days].sort((a, b) => a.date.localeCompare(b.date));
  
  sortedDays.forEach(day => {
    const date = new Date(day.date);
    const day_name = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const is_weekend = date.getDay() === 0 || date.getDay() === 6;
    const is_holiday = holidayMap.has(day.date) || is_weekend;
    
    let classes_count = day.classes_count;
    if (!classes_count) {
      // Use average if not specified
      classes_count = Math.round(average_classes_per_day);
    }
    
    let item: ExactDayPlanItem;
    
    if (day.type === 'attendance') {
      cumulative_total += classes_count;
      cumulative_attended += classes_count;
      total_attendance_days++;
      item = {
        date: day.date,
        day_name,
        type: 'attendance',
        classes_count,
        cumulative_total_classes: cumulative_total,
        cumulative_attended_classes: cumulative_attended,
        projected_attendance: calculateCurrentAttendance(cumulative_attended, cumulative_total),
        is_holiday,
        is_weekend,
      };
    } else {
      // Leave day
      cumulative_total += classes_count;
      // attended stays the same
      total_leave_days++;
      item = {
        date: day.date,
        day_name,
        type: 'leave',
        classes_count,
        cumulative_total_classes: cumulative_total,
        cumulative_attended_classes: cumulative_attended,
        projected_attendance: calculateCurrentAttendance(cumulative_attended, cumulative_total),
        is_holiday,
        is_weekend,
      };
    }
    
    items.push(item);
  });
  
  const final_attendance = items.length > 0 
    ? items[items.length - 1].projected_attendance 
    : calculateCurrentAttendance(current_attended_classes, current_total_classes);
  
  return {
    items,
    final_attendance,
    total_days: items.length,
    total_leave_days,
    total_attendance_days,
  };
}

/**
 * Holiday Impact / Preview Table
 */
export function calculateHolidayPreview(input: {
  leave_scenarios: number[];
  current_total_classes: number;
  current_attended_classes: number;
  average_classes_per_day: number;
  target_percentage: number;
}): HolidayPreviewRow[] {
  const { leave_scenarios, current_total_classes, current_attended_classes, average_classes_per_day, target_percentage } = input;
  
  const current_attendance = calculateCurrentAttendance(current_attended_classes, current_total_classes);
  
  return leave_scenarios.map(leave_days => {
    const result = calculateQuickCheck({
      leave_days,
      average_classes_per_day,
      current_total_classes,
      current_attended_classes,
    });
    
    const percentage_change = result.projected_attendance - current_attendance;
    const meets_target = result.projected_attendance >= target_percentage;
    
    let status: 'safe' | 'warning' | 'danger';
    if (meets_target) {
      status = 'safe';
    } else if (result.projected_attendance >= target_percentage - 5) {
      status = 'warning';
    } else {
      status = 'danger';
    }
    
    return {
      leave_days,
      estimated_classes_missed: result.estimated_classes_missed,
      projected_total_classes: result.new_total_classes,
      projected_attendance: result.projected_attendance,
      percentage_change: Math.round(percentage_change * 100) / 100,
      status,
      meets_target,
    };
  });
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

// Helper schema for datetime-local input that accepts empty strings
export const datetimeLocalString = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().datetime({ local: true }).optional().nullable()
);

export const taskSchemaBase = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'archived']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: datetimeLocalString,
  estimated_minutes: z.number().positive().optional().nullable(),
  tags: z.array(z.string()).default([]),
  parent_task_id: z.string().uuid().optional().nullable(),
});

export const taskSchema = taskSchemaBase.transform(data => ({
  ...data,
  due_date: data.due_date === '' ? null : data.due_date,
}));

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
  start_time: z.string().datetime({ local: true }).transform(val => {
    // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO with seconds
    if (val.includes('T') && !val.endsWith('Z') && !val.includes('+') && !val.includes('-', 15)) {
      const parts = val.split('T');
      if (parts[1] && parts[1].split(':').length === 2) {
        return `${val}:00`;
      }
    }
    return val;
  }),
  end_time: z.string().datetime({ local: true }).transform(val => {
    // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO with seconds
    if (val.includes('T') && !val.endsWith('Z') && !val.includes('+') && !val.includes('-', 15)) {
      const parts = val.split('T');
      if (parts[1] && parts[1].split(':').length === 2) {
        return `${val}:00`;
      }
    }
    return val;
  }),
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

// College Management schemas
export const academicTermSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  start_date: z.string().date(),
  end_date: z.string().date(),
  is_current: z.boolean().default(false),
});

export const subjectSchema = z.object({
  academic_term_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  faculty: z.string().max(100).optional().nullable(),
  credits: z.number().int().positive().default(3),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
  icon: z.string().optional(),
  description: z.string().max(500).optional(),
  attendance_threshold: z.number().int().min(0).max(100).default(75),
});

export const attendanceRecordSchema = z.object({
  subject_id: z.string().uuid(),
  date: z.string().date(),
  status: z.enum(['present', 'absent', 'late', 'excused']).default('present'),
  class_session_number: z.number().int().positive().optional().nullable(),
  notes: z.string().max(500).optional(),
});

export const academicTaskSchema = z.object({
  subject_id: z.string().uuid().optional().nullable(),
  academic_type: z.enum(['assignment', 'exam', 'quiz', 'project', 'homework', 'other']).optional().nullable(),
  weight: z.number().min(0).max(100).optional().nullable(),
  score_obtained: z.number().min(0).optional().nullable(),
  max_score: z.number().positive().optional().nullable(),
  submission_date: z.string().datetime().optional().nullable(),
});

// Attendance Planner schemas
export const attendancePlannerConfigSchema = z.object({
  target_percentage: z.number().min(1).max(100).default(75),
  average_classes_per_day: z.number().positive().default(6),
  total_classes: z.number().int().nonnegative().default(0),
  attended_classes: z.number().int().nonnegative().default(0),
  use_timetable: z.boolean().default(false),
  start_date: z.string().date().optional().nullable(),
});

export const quickCheckSchema = z.object({
  leave_days: z.number().int().nonnegative(),
  average_classes_per_day: z.number().positive(),
  current_total_classes: z.number().int().nonnegative(),
  current_attended_classes: z.number().int().nonnegative(),
});

export const classSkipSchema = z.object({
  skip_classes: z.number().int().nonnegative(),
  current_total_classes: z.number().int().nonnegative(),
  current_attended_classes: z.number().int().nonnegative(),
});

export const targetReachSchema = z.object({
  target_percentage: z.number().min(1).max(100),
  current_total_classes: z.number().int().nonnegative(),
  current_attended_classes: z.number().int().nonnegative(),
  average_classes_per_day: z.number().positive().optional(),
});

export const exactDayPlanSchema = z.object({
  start_date: z.string().date(),
  planned_days: z.array(z.object({
    date: z.string().date(),
    type: z.enum(['attendance', 'leave']),
    classes_count: z.number().int().positive().optional(),
  })),
  current_total_classes: z.number().int().nonnegative(),
  current_attended_classes: z.number().int().nonnegative(),
  average_classes_per_day: z.number().positive().optional(),
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
export type AcademicTermForm = z.infer<typeof academicTermSchema>;
export type SubjectForm = z.infer<typeof subjectSchema>;
export type AttendanceRecordForm = z.infer<typeof attendanceRecordSchema>;
export type AcademicTaskForm = z.infer<typeof academicTaskSchema>;

// Attendance Planner types
export type AttendancePlannerConfigForm = z.infer<typeof attendancePlannerConfigSchema>;
export type QuickCheckForm = z.infer<typeof quickCheckSchema>;
export type ClassSkipForm = z.infer<typeof classSkipSchema>;
export type TargetReachForm = z.infer<typeof targetReachSchema>;
export type ExactDayPlanForm = z.infer<typeof exactDayPlanSchema>;