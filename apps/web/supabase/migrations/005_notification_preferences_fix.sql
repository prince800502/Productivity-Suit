-- Fix for notification_preferences column in profiles table
-- Adds notification_preferences JSONB column to profiles table
-- Updates handle_new_user() to create default notification_preferences entry
-- Creates trigger to sync profiles.notification_preferences to notification_preferences table

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add notification_preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_notifications": true,
  "push_notifications": true,
  "daily_summary": true,
  "weekly_report": false,
  "budget_alerts": true,
  "task_reminders": true,
  "routine_reminders": true,
  "habit_reminders": true,
  "goal_deadlines": true,
  "subscription_renewals": true,
  "push_task_reminders": true,
  "push_routine_reminders": true,
  "push_habit_reminders": true,
  "push_budget_warnings": true,
  "push_subscription_renewals": true,
  "push_goal_deadlines": true,
  "push_pomodoro_reminders": true,
  "push_schedule_reminders": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "timezone": "UTC",
  "max_daily_notifications": 50,
  "batch_similar": true
}'::jsonb;

-- Update existing profiles to have default notification_preferences
UPDATE public.profiles 
SET notification_preferences = '{
  "email_notifications": true,
  "push_notifications": true,
  "daily_summary": true,
  "weekly_report": false,
  "budget_alerts": true,
  "task_reminders": true,
  "routine_reminders": true,
  "habit_reminders": true,
  "goal_deadlines": true,
  "subscription_renewals": true,
  "push_task_reminders": true,
  "push_routine_reminders": true,
  "push_habit_reminders": true,
  "push_budget_warnings": true,
  "push_subscription_renewals": true,
  "push_goal_deadlines": true,
  "push_pomodoro_reminders": true,
  "push_schedule_reminders": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "timezone": "UTC",
  "max_daily_notifications": 50,
  "batch_similar": true
}'::jsonb
WHERE notification_preferences IS NULL;

-- Function to sync profiles.notification_preferences to notification_preferences table
CREATE OR REPLACE FUNCTION public.sync_notification_preferences()
RETURNS TRIGGER AS $$
DECLARE
    merged_prefs JSONB;
BEGIN
    -- Only sync if notification_preferences column changed
    IF OLD.notification_preferences IS DISTINCT FROM NEW.notification_preferences THEN
        -- Merge new JSON with existing data to preserve fields not in the incoming JSON
        -- Convert existing notification_preferences row to JSONB and merge with new JSON
        SELECT COALESCE(
            jsonb_build_object(
                'email_notifications', np.email_enabled,
                'push_notifications', np.push_enabled,
                'daily_summary', np.email_daily_summary,
                'weekly_report', np.email_weekly_report,
                'budget_alerts', np.email_budget_alerts,
                'task_reminders', np.email_task_reminders,
                'routine_reminders', np.email_routine_reminders,
                'habit_reminders', np.email_habit_reminders,
                'goal_deadlines', np.email_goal_deadlines,
                'subscription_renewals', np.email_subscription_renewals,
                'push_task_reminders', np.push_task_reminders,
                'push_routine_reminders', np.push_routine_reminders,
                'push_habit_reminders', np.push_habit_reminders,
                'push_budget_warnings', np.push_budget_warnings,
                'push_subscription_renewals', np.push_subscription_renewals,
                'push_goal_deadlines', np.push_goal_deadlines,
                'push_pomodoro_reminders', np.push_pomodoro_reminders,
                'push_schedule_reminders', np.push_schedule_reminders,
                'quiet_hours_start', np.quiet_hours_start,
                'quiet_hours_end', np.quiet_hours_end,
                'timezone', np.timezone,
                'max_daily_notifications', np.max_daily_notifications,
                'batch_similar', np.batch_similar
            ), '{}'::jsonb) || COALESCE(NEW.notification_preferences, '{}'::jsonb)
        INTO merged_prefs
        FROM public.notification_preferences np
        WHERE np.user_id = NEW.id;
        
        -- If no existing row, use just the new JSON
        IF merged_prefs IS NULL THEN
            merged_prefs := COALESCE(NEW.notification_preferences, '{}'::jsonb);
        END IF;

        UPDATE public.notification_preferences
        SET 
            in_app_enabled = COALESCE(merged_prefs->>'email_notifications', 'true')::boolean,
            email_enabled = COALESCE(merged_prefs->>'email_notifications', 'true')::boolean,
            email_daily_summary = COALESCE(merged_prefs->>'daily_summary', 'true')::boolean,
            email_weekly_report = COALESCE(merged_prefs->>'weekly_report', 'false')::boolean,
            email_budget_alerts = COALESCE(merged_prefs->>'budget_alerts', 'true')::boolean,
            email_task_reminders = COALESCE(merged_prefs->>'task_reminders', 'true')::boolean,
            email_routine_reminders = COALESCE(merged_prefs->>'routine_reminders', 'true')::boolean,
            email_habit_reminders = COALESCE(merged_prefs->>'habit_reminders', 'true')::boolean,
            email_goal_deadlines = COALESCE(merged_prefs->>'goal_deadlines', 'true')::boolean,
            email_subscription_renewals = COALESCE(merged_prefs->>'subscription_renewals', 'true')::boolean,
            push_enabled = COALESCE(merged_prefs->>'push_notifications', 'true')::boolean,
            push_task_reminders = COALESCE(merged_prefs->>'push_task_reminders', 'true')::boolean,
            push_routine_reminders = COALESCE(merged_prefs->>'push_routine_reminders', 'true')::boolean,
            push_habit_reminders = COALESCE(merged_prefs->>'push_habit_reminders', 'true')::boolean,
            push_budget_warnings = COALESCE(merged_prefs->>'push_budget_warnings', 'true')::boolean,
            push_subscription_renewals = COALESCE(merged_prefs->>'push_subscription_renewals', 'true')::boolean,
            push_goal_deadlines = COALESCE(merged_prefs->>'push_goal_deadlines', 'true')::boolean,
            push_pomodoro_reminders = COALESCE(merged_prefs->>'push_pomodoro_reminders', 'true')::boolean,
            push_schedule_reminders = COALESCE(merged_prefs->>'push_schedule_reminders', 'true')::boolean,
            quiet_hours_start = COALESCE(merged_prefs->>'quiet_hours_start', '22:00'),
            quiet_hours_end = COALESCE(merged_prefs->>'quiet_hours_end', '08:00'),
            timezone = COALESCE(merged_prefs->>'timezone', 'UTC'),
            max_daily_notifications = COALESCE(merged_prefs->>'max_daily_notifications', '50')::int,
            batch_similar = COALESCE(merged_prefs->>'batch_similar', 'true')::boolean,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profiles.notification_preferences to notification_preferences table
DROP TRIGGER IF EXISTS trigger_sync_notification_preferences ON public.profiles;
CREATE TRIGGER trigger_sync_notification_preferences
    AFTER UPDATE OF notification_preferences ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_notification_preferences();

-- Update the handle_new_user() function to also create notification_preferences entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');

    -- Create default notification preferences entry
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification_preferences entry for existing users who don't have one
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np WHERE np.user_id = p.id
);