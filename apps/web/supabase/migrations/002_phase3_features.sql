-- Phase 3: Personal Productivity OS Database Migration
-- Budgets, Goals, Habits, Notifications, Recurring Expenses, Calendar Events

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BUDGETS & FINANCIAL GOALS
-- ============================================================

-- Monthly budgets (enhanced from profiles.monthly_budget)
CREATE TABLE public.budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month DATE NOT NULL, -- First day of month (e.g., '2024-01-01')
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'USD',
    alert_threshold INTEGER DEFAULT 80, -- Percentage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Category budgets
CREATE TABLE public.category_budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    alert_threshold INTEGER DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(budget_id, category)
);

-- Savings goals
CREATE TABLE public.savings_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
    currency TEXT DEFAULT 'USD',
    target_date DATE,
    icon TEXT,
    color TEXT DEFAULT '#0ea5e9',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings goal contributions
CREATE TABLE public.savings_contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    savings_goal_id UUID REFERENCES public.savings_goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly financial summary (materialized view or table for quick access)
CREATE TABLE public.monthly_financial_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month DATE NOT NULL, -- First day of month
    total_income DECIMAL(12, 2) DEFAULT 0,
    total_expenses DECIMAL(12, 2) DEFAULT 0,
    net_savings DECIMAL(12, 2) DEFAULT 0,
    savings_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
    budget_amount DECIMAL(12, 2) DEFAULT 0,
    budget_spent DECIMAL(12, 2) DEFAULT 0,
    budget_remaining DECIMAL(12, 2) DEFAULT 0,
    budget_percentage DECIMAL(5, 2) DEFAULT 0,
    top_category TEXT,
    top_category_amount DECIMAL(12, 2) DEFAULT 0,
    subscription_total DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- ============================================================
-- RECURRING EXPENSES & SUBSCRIPTIONS
-- ============================================================

-- Recurring expenses (enhanced from expenses.is_recurring)
CREATE TABLE public.recurring_expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE, -- Optional end date
    next_payment_date DATE NOT NULL,
    last_payment_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 3, -- Days before to remind
    payment_method TEXT, -- 'card', 'bank', 'cash', 'upi', etc.
    auto_create_expense BOOLEAN DEFAULT TRUE, -- Auto-create expense on payment
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring expense payments log
CREATE TABLE public.recurring_expense_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recurring_expense_id UUID REFERENCES public.recurring_expenses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    paid_on DATE NOT NULL,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL, -- Link to created expense
    status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'failed', 'skipped', 'pending')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOALS SYSTEM
-- ============================================================

-- Goals
CREATE TABLE public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    start_date DATE DEFAULT CURRENT_DATE,
    progress DECIMAL(5, 2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT, -- 'career', 'health', 'finance', 'learning', 'personal', etc.
    icon TEXT,
    color TEXT DEFAULT '#0ea5e9',
    parent_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL, -- For sub-goals
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal milestones
CREATE TABLE public.goal_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    order_index INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal links to tasks
CREATE TABLE public.goal_task_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(goal_id, task_id)
);

-- Goal links to habits/routines
CREATE TABLE public.goal_routine_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(goal_id, routine_id)
);

-- ============================================================
-- HABIT TRACKER
-- ============================================================

-- Habits (separate from routines for more granular tracking)
CREATE TABLE public.habits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
    days_of_week INTEGER[] DEFAULT '{}', -- For custom frequency: 0=Sun, 6=Sat
    times_per_period INTEGER DEFAULT 1, -- For weekly: how many times per week
    reminder_time TIME, -- Time of day for reminder
    reminder_enabled BOOLEAN DEFAULT TRUE,
    color TEXT DEFAULT '#0ea5e9',
    icon TEXT,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit completions (daily log)
CREATE TABLE public.habit_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL, -- Date of completion (for easy querying)
    count INTEGER DEFAULT 1, -- For habits with times_per_period > 1
    note TEXT,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5), -- Optional mood tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

-- Habit streaks (computed but cached for performance)
CREATE TABLE public.habit_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    streak_start_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id)
);

-- Habit skip days (when user intentionally skips)
CREATE TABLE public.habit_skips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

-- ============================================================
-- CALENDAR INTEGRATION (Enhanced Schedule)
-- ============================================================

-- Calendar sources (Google, Outlook, Apple, local)
CREATE TABLE public.calendar_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'ical', 'local')),
    external_id TEXT, -- Provider's calendar ID
    access_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted
    token_expires_at TIMESTAMPTZ,
    color TEXT DEFAULT '#0ea5e9',
    is_primary BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events (enhanced from schedule_events)
CREATE TABLE public.calendar_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    calendar_source_id UUID REFERENCES public.calendar_sources(id) ON DELETE SET NULL,
    external_id TEXT, -- Provider's event ID
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'UTC',
    recurrence_rule TEXT, -- RRULE string for recurring events
    recurrence_exception_dates DATE[], -- EXDATE
    recurrence_id TEXT, -- For exceptions to recurring events
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    visibility TEXT DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private', 'confidential')),
    color TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    event_type TEXT DEFAULT 'personal' CHECK (event_type IN ('class', 'work', 'personal', 'appointment', 'focus', 'break')),
    meeting_url TEXT,
    attendees JSONB DEFAULT '[]', -- [{email, name, status, response}]
    reminders JSONB DEFAULT '[]', -- [{method: 'email'|'popup', minutes_before}]
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar sync log
CREATE TABLE public.calendar_sync_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    calendar_source_id UUID REFERENCES public.calendar_sources(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    events_synced INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deleted INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- SMART NOTIFICATIONS
-- ============================================================

-- Notifications (enhanced from reminders)
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'task_reminder', 'habit_reminder', 'budget_warning', 'budget_exceeded',
        'subscription_renewal', 'goal_deadline', 'pomodoro_reminder', 
        'schedule_reminder', 'routine_reminder', 'milestone_due',
        'weekly_report', 'achievement', 'streak_milestone', 'custom'
    )),
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    related_entity_type TEXT, -- 'task', 'habit', 'goal', 'budget', 'recurring_expense', 'event', 'routine'
    related_entity_id UUID,
    action_url TEXT, -- Deep link for action
    action_label TEXT, -- Button label
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ, -- For future notifications
    sent_at TIMESTAMPTZ,
    delivery_channels TEXT[] DEFAULT '{"in_app"}', -- 'in_app', 'email', 'push', 'sms'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences (enhanced from profiles.notification_preferences)
CREATE TABLE public.notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    -- In-app
    in_app_enabled BOOLEAN DEFAULT TRUE,
    -- Email
    email_enabled BOOLEAN DEFAULT TRUE,
    email_daily_summary BOOLEAN DEFAULT TRUE,
    email_weekly_report BOOLEAN DEFAULT FALSE,
    email_budget_alerts BOOLEAN DEFAULT TRUE,
    email_task_reminders BOOLEAN DEFAULT TRUE,
    email_routine_reminders BOOLEAN DEFAULT TRUE,
    email_habit_reminders BOOLEAN DEFAULT TRUE,
    email_goal_deadlines BOOLEAN DEFAULT TRUE,
    email_subscription_renewals BOOLEAN DEFAULT TRUE,
    -- Push
    push_enabled BOOLEAN DEFAULT TRUE,
    push_task_reminders BOOLEAN DEFAULT TRUE,
    push_routine_reminders BOOLEAN DEFAULT TRUE,
    push_habit_reminders BOOLEAN DEFAULT TRUE,
    push_budget_warnings BOOLEAN DEFAULT TRUE,
    push_subscription_renewals BOOLEAN DEFAULT TRUE,
    push_goal_deadlines BOOLEAN DEFAULT TRUE,
    push_pomodoro_reminders BOOLEAN DEFAULT TRUE,
    push_schedule_reminders BOOLEAN DEFAULT TRUE,
    -- Timing
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    -- Frequency
    max_daily_notifications INTEGER DEFAULT 50,
    batch_similar BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI PRODUCTIVITY (Architecture preparation)
-- ============================================================

-- AI providers configuration
CREATE TABLE public.ai_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'ollama', 'custom')),
    name TEXT NOT NULL,
    api_key_encrypted TEXT, -- Encrypted
    base_url TEXT, -- For custom/Ollama
    model TEXT NOT NULL,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    capabilities TEXT[] DEFAULT '{"chat", "completion", "embedding"}',
    rate_limit_rpm INTEGER DEFAULT 60, -- Requests per minute
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider, name)
);

-- AI conversations
CREATE TABLE public.ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ai_provider_id UUID REFERENCES public.ai_providers(id) ON DELETE SET NULL,
    title TEXT,
    system_prompt TEXT,
    model TEXT,
    temperature DECIMAL(3, 2),
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI messages
CREATE TABLE public.ai_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    tool_call_id TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI commands/actions log
CREATE TABLE public.ai_commands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
    command_text TEXT NOT NULL,
    parsed_intent TEXT,
    parsed_entities JSONB DEFAULT '{}',
    actions JSONB DEFAULT '[]', -- Array of actions to execute
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
    result JSONB,
    error_message TEXT,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly AI reports
CREATE TABLE public.ai_weekly_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    report_data JSONB NOT NULL, -- Full report structure
    summary TEXT,
    insights JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    generated_by_ai_provider_id UUID REFERENCES public.ai_providers(id) ON DELETE SET NULL,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Budgets
CREATE INDEX idx_budgets_user_month ON public.budgets(user_id, month DESC);
CREATE INDEX idx_category_budgets_budget ON public.category_budgets(budget_id);

-- Savings goals
CREATE INDEX idx_savings_goals_user ON public.savings_goals(user_id, is_completed, target_date);
CREATE INDEX idx_savings_contributions_goal ON public.savings_contributions(savings_goal_id);

-- Recurring expenses
CREATE INDEX idx_recurring_expenses_user_active ON public.recurring_expenses(user_id, is_active, next_payment_date);
CREATE INDEX idx_recurring_expenses_next_payment ON public.recurring_expenses(next_payment_date, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_recurring_payments_expense ON public.recurring_expense_payments(recurring_expense_id);
CREATE INDEX idx_recurring_payments_user ON public.recurring_expense_payments(user_id, paid_on DESC);

-- Goals
CREATE INDEX idx_goals_user_status ON public.goals(user_id, status, priority);
CREATE INDEX idx_goals_user_target_date ON public.goals(user_id, target_date);
CREATE INDEX idx_goal_milestones_goal ON public.goal_milestones(goal_id, order_index);
CREATE INDEX idx_goal_task_links_goal ON public.goal_task_links(goal_id);
CREATE INDEX idx_goal_task_links_task ON public.goal_task_links(task_id);
CREATE INDEX idx_goal_routine_links_goal ON public.goal_routine_links(goal_id);

-- Habits
CREATE INDEX idx_habits_user ON public.habits(user_id, archived_at);
CREATE INDEX idx_habit_completions_habit_date ON public.habit_completions(habit_id, date DESC);
CREATE INDEX idx_habit_completions_user_date ON public.habit_completions(user_id, date DESC);
CREATE INDEX idx_habit_streaks_habit ON public.habit_streaks(habit_id);
CREATE INDEX idx_habit_skips_habit_date ON public.habit_skips(habit_id, date);

-- Calendar
CREATE INDEX idx_calendar_sources_user ON public.calendar_sources(user_id);
CREATE INDEX idx_calendar_events_user_time ON public.calendar_events(user_id, start_time, end_time);
CREATE INDEX idx_calendar_events_source ON public.calendar_events(calendar_source_id);
CREATE INDEX idx_calendar_events_external ON public.calendar_events(external_id);
CREATE INDEX idx_calendar_events_recurring ON public.calendar_events(user_id, is_recurring, start_time);
CREATE INDEX idx_calendar_sync_log_source ON public.calendar_sync_log(calendar_source_id, started_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_user_scheduled ON public.notifications(user_id, scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_related ON public.notifications(related_entity_type, related_entity_id);
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);

-- AI
CREATE INDEX idx_ai_providers_user ON public.ai_providers(user_id, is_active);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_commands_user ON public.ai_commands(user_id, created_at DESC);
CREATE INDEX idx_ai_weekly_reports_user ON public.ai_weekly_reports(user_id, week_start DESC);

-- Monthly financial summary
CREATE INDEX idx_monthly_summary_user ON public.monthly_financial_summary(user_id, month DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_financial_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expense_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_routine_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: budgets
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: category_budgets
CREATE POLICY "Users can view own category budgets" ON public.category_budgets FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.budgets WHERE id = budget_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own category budgets" ON public.category_budgets FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.budgets WHERE id = budget_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own category budgets" ON public.category_budgets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.budgets WHERE id = budget_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own category budgets" ON public.category_budgets FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.budgets WHERE id = budget_id AND user_id = auth.uid())
);

-- RLS Policies: savings_goals
CREATE POLICY "Users can view own savings goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: savings_contributions
CREATE POLICY "Users can view own savings contributions" ON public.savings_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings contributions" ON public.savings_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings contributions" ON public.savings_contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings contributions" ON public.savings_contributions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: monthly_financial_summary
CREATE POLICY "Users can view own monthly summary" ON public.monthly_financial_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly summary" ON public.monthly_financial_summary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly summary" ON public.monthly_financial_summary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monthly summary" ON public.monthly_financial_summary FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: recurring_expenses
CREATE POLICY "Users can view own recurring expenses" ON public.recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring expenses" ON public.recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring expenses" ON public.recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring expenses" ON public.recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: recurring_expense_payments
CREATE POLICY "Users can view own recurring payments" ON public.recurring_expense_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring payments" ON public.recurring_expense_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring payments" ON public.recurring_expense_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring payments" ON public.recurring_expense_payments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: goals
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: goal_milestones
CREATE POLICY "Users can view own goal milestones" ON public.goal_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goal milestones" ON public.goal_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goal milestones" ON public.goal_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goal milestones" ON public.goal_milestones FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: goal_task_links
CREATE POLICY "Users can view own goal task links" ON public.goal_task_links FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own goal task links" ON public.goal_task_links FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own goal task links" ON public.goal_task_links FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);

-- RLS Policies: goal_routine_links
CREATE POLICY "Users can view own goal routine links" ON public.goal_routine_links FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own goal routine links" ON public.goal_routine_links FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own goal routine links" ON public.goal_routine_links FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);

-- RLS Policies: habits
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: habit_completions
CREATE POLICY "Users can view own habit completions" ON public.habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit completions" ON public.habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit completions" ON public.habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit completions" ON public.habit_completions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: habit_streaks
CREATE POLICY "Users can view own habit streaks" ON public.habit_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit streaks" ON public.habit_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit streaks" ON public.habit_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit streaks" ON public.habit_streaks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: habit_skips
CREATE POLICY "Users can view own habit skips" ON public.habit_skips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit skips" ON public.habit_skips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit skips" ON public.habit_skips FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: calendar_sources
CREATE POLICY "Users can view own calendar sources" ON public.calendar_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar sources" ON public.calendar_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar sources" ON public.calendar_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar sources" ON public.calendar_sources FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: calendar_events
CREATE POLICY "Users can view own calendar events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: calendar_sync_log
CREATE POLICY "Users can view own calendar sync log" ON public.calendar_sync_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar sync log" ON public.calendar_sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies: notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: notification_preferences
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: ai_providers
CREATE POLICY "Users can view own AI providers" ON public.ai_providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI providers" ON public.ai_providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI providers" ON public.ai_providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI providers" ON public.ai_providers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: ai_conversations
CREATE POLICY "Users can view own AI conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: ai_messages
CREATE POLICY "Users can view own AI messages" ON public.ai_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own AI messages" ON public.ai_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own AI messages" ON public.ai_messages FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);

-- RLS Policies: ai_commands
CREATE POLICY "Users can view own AI commands" ON public.ai_commands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI commands" ON public.ai_commands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI commands" ON public.ai_commands FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI commands" ON public.ai_commands FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: ai_weekly_reports
CREATE POLICY "Users can view own AI weekly reports" ON public.ai_weekly_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI weekly reports" ON public.ai_weekly_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI weekly reports" ON public.ai_weekly_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI weekly reports" ON public.ai_weekly_reports FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_budgets_updated_at BEFORE UPDATE ON public.category_budgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_savings_contributions_updated_at BEFORE UPDATE ON public.savings_contributions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_financial_summary_updated_at BEFORE UPDATE ON public.monthly_financial_summary
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_expenses_updated_at BEFORE UPDATE ON public.recurring_expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_expense_payments_updated_at BEFORE UPDATE ON public.recurring_expense_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_milestones_updated_at BEFORE UPDATE ON public.goal_milestones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habit_completions_updated_at BEFORE UPDATE ON public.habit_completions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habit_streaks_updated_at BEFORE UPDATE ON public.habit_streaks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habit_skips_updated_at BEFORE UPDATE ON public.habit_skips
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_sources_updated_at BEFORE UPDATE ON public.calendar_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON public.ai_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_expense_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_task_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_routine_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_skips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;