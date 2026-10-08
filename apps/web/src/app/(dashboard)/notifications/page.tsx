'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Bell, Mail, Check, X, Filter, Settings, Trash2, AlertTriangle, Clock, Target, CreditCard, Flag, Timer, Calendar, Repeat, Flame, Trophy } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Modal, Tabs, Dropdown, Switch, Input, Select
} from '@productivity-suite/ui';
import { useNotifications, useUnreadCount, useCreateNotification, useMarkNotificationRead, useMarkAllNotificationsRead, useArchiveNotification, useDeleteNotification, useNotificationPreferences, useUpdateNotificationPreferences, NotificationType, NotificationPriority, NotificationChannel } from '@productivity-suite/core';
import { formatCurrency } from '@productivity-suite/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const notificationPreferencesSchema = z.object({
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


function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: notifications, isLoading, refetch } = useNotifications({ 
    is_read: activeTab === 'unread' ? false : undefined,
    type: filterType !== 'all' ? filterType : undefined,
    limit: 50
  });
  const { data: unreadCount } = useUnreadCount();
  const { data: preferences } = useNotificationPreferences();

  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const archiveNotification = useArchiveNotification();
  const deleteNotification = useDeleteNotification();
  const updatePreferences = useUpdateNotificationPreferences();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof notificationPreferencesSchema>>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      in_app_enabled: true,
      email_enabled: true,
      email_daily_summary: true,
      email_weekly_report: false,
      email_budget_alerts: true,
      email_task_reminders: true,
      email_routine_reminders: true,
      email_habit_reminders: true,
      email_goal_deadlines: true,
      email_subscription_renewals: true,
      push_enabled: true,
      push_task_reminders: true,
      push_routine_reminders: true,
      push_habit_reminders: true,
      push_budget_warnings: true,
      push_subscription_renewals: true,
      push_goal_deadlines: true,
      push_pomodoro_reminders: true,
      push_schedule_reminders: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'UTC',
      max_daily_notifications: 50,
      batch_similar: true,
    },
  });

  useEffect(() => {
    if (preferences) {
      reset(preferences as any);
    }
  }, [preferences, reset]);

  const onSubmitPreferences = async (data: z.infer<typeof notificationPreferencesSchema>) => {
    try {
      await updatePreferences.mutateAsync(data);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
    refetch();
  };

  const handleArchive = async (id: string) => {
    await archiveNotification.mutateAsync(id);
    refetch();
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteNotification.mutateAsync(deleteConfirm);
      refetch();
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Notifications</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Stay updated with your productivity activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Settings className="w-4 h-4" />} onClick={() => setIsPreferencesOpen(true)}>
            Preferences
          </Button>
          {unreadCount && unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={async () => { await markAllAsRead.mutateAsync(); refetch(); }}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={[
        { value: 'all', label: 'All' },
        { value: 'unread', label: `Unread ${unreadCount && unreadCount > 0 ? `(${unreadCount})` : ''}` },
      ]} fullWidth />

      <div className="flex items-center justify-between mb-4">
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'task_reminder', label: 'Task Reminders' },
            { value: 'habit_reminder', label: 'Habit Reminders' },
            { value: 'budget_warning', label: 'Budget Warnings' },
            { value: 'budget_exceeded', label: 'Budget Exceeded' },
            { value: 'subscription_renewal', label: 'Subscription Renewals' },
            { value: 'goal_deadline', label: 'Goal Deadlines' },
            { value: 'pomodoro_reminder', label: 'Pomodoro Reminders' },
            { value: 'schedule_reminder', label: 'Schedule Reminders' },
            { value: 'routine_reminder', label: 'Routine Reminders' },
            { value: 'milestone_due', label: 'Milestone Due' },
            { value: 'weekly_report', label: 'Weekly Reports' },
            { value: 'achievement', label: 'Achievements' },
            { value: 'streak_milestone', label: 'Streak Milestones' },
            { value: 'custom', label: 'Custom' },
          ]}
          className="w-48"
        />
      </div>

      <NotificationsContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filterType={filterType}
        setFilterType={setFilterType}
        isPreferencesOpen={isPreferencesOpen}
        setIsPreferencesOpen={setIsPreferencesOpen}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        notifications={notifications}
        isLoading={isLoading}
        refetch={refetch}
        unreadCount={unreadCount}
        preferences={preferences}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
        archiveNotification={archiveNotification}
        deleteNotification={deleteNotification}
        updatePreferences={updatePreferences}
        register={register}
        handleSubmit={handleSubmit}
        reset={reset}
        formState={formState}
        watch={watch}
        onSubmitPreferences={onSubmitPreferences}
      />

      {/* Preferences Modal */}
      <Modal isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)} title="Notification Preferences" size="lg">
        <form onSubmit={handleSubmit(onSubmitPreferences)} className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">In-App Notifications</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Enable In-App Notifications</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Show notifications within the app</p>
              </div>
              <Switch checked={watch('in_app_enabled')} onChange={(e) => register('in_app_enabled').onChange(e)} label="" description="" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">Email Notifications</h3>
            <div className="space-y-3">
              {[
                { key: 'email_enabled', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'email_daily_summary', label: 'Daily Summary', desc: 'Get a daily summary of your activity' },
                { key: 'email_weekly_report', label: 'Weekly Report', desc: 'Receive a weekly productivity report' },
                { key: 'email_budget_alerts', label: 'Budget Alerts', desc: 'Get notified when approaching budget limits' },
                { key: 'email_task_reminders', label: 'Task Reminders', desc: 'Reminders for upcoming and overdue tasks' },
                { key: 'email_routine_reminders', label: 'Routine Reminders', desc: 'Reminders for your daily routines' },
                { key: 'email_habit_reminders', label: 'Habit Reminders', desc: 'Reminders for your daily habits' },
                { key: 'email_goal_deadlines', label: 'Goal Deadlines', desc: 'Get notified about approaching goal deadlines' },
                { key: 'email_subscription_renewals', label: 'Subscription Renewals', desc: 'Get notified about upcoming subscription renewals' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                  </div>
                  <Switch checked={watch(item.key)} onChange={(e) => register(item.key).onChange(e)} label={item.label} description={item.desc} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">Push Notifications</h3>
            <div className="space-y-3">
              {[
                { key: 'push_enabled', label: 'Push Notifications', desc: 'Receive push notifications on your devices' },
                { key: 'push_task_reminders', label: 'Task Reminders', desc: 'Push reminders for upcoming and overdue tasks' },
                { key: 'push_routine_reminders', label: 'Routine Reminders', desc: 'Push reminders for your daily routines' },
                { key: 'push_habit_reminders', label: 'Habit Reminders', desc: 'Push reminders for your daily habits' },
                { key: 'push_budget_warnings', label: 'Budget Warnings', desc: 'Push warnings when approaching budget limits' },
                { key: 'push_subscription_renewals', label: 'Subscription Renewals', desc: 'Push notifications for subscription renewals' },
                { key: 'push_goal_deadlines', label: 'Goal Deadlines', desc: 'Push notifications for goal deadlines' },
                { key: 'push_pomodoro_reminders', label: 'Pomodoro Reminders', desc: 'Push reminders for Pomodoro sessions' },
                { key: 'push_schedule_reminders', label: 'Schedule Reminders', desc: 'Push reminders for scheduled events' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                  </div>
                  <Switch checked={watch(item.key)} onChange={(e) => register(item.key).onChange(e)} label={item.label} description={item.desc} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">Timing & Frequency</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quiet Hours Start" type="time" {...register('quiet_hours_start')} />
              <Input label="Quiet Hours End" type="time" {...register('quiet_hours_end')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Timezone" {...register('timezone')} />
              <Input label="Max Daily Notifications" type="number" min="1" max="200" {...register('max_daily_notifications', { valueAsNumber: true })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Batch Similar Notifications</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Group similar notifications together</p>
              </div>
              <Switch checked={watch('batch_similar')} onChange={(e) => register('batch_similar').onChange(e)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setIsPreferencesOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save Preferences</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Notification" size="sm">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">Are you sure you want to delete this notification? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

