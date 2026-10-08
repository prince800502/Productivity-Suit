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

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'task_reminder': return <Clock className="w-4 h-4" />;
    case 'habit_reminder': return <Target className="w-4 h-4" />;
    case 'budget_warning': return <AlertTriangle className="w-4 h-4" />;
    case 'budget_exceeded': return <AlertTriangle className="w-4 h-4" />;
    case 'subscription_renewal': return <CreditCard className="w-4 h-4" />;
    case 'goal_deadline': return <Flag className="w-4 h-4" />;
    case 'pomodoro_reminder': return <Timer className="w-4 h-4" />;
    case 'schedule_reminder': return <Calendar className="w-4 h-4" />;
    case 'routine_reminder': return <Repeat className="w-4 h-4" />;
    case 'milestone_due': return <Flag className="w-4 h-4" />;
    case 'weekly_report': return <Trophy className="w-4 h-4" />;
    case 'achievement': return <Trophy className="w-4 h-4" />;
    case 'streak_milestone': return <Flame className="w-4 h-4" />;
    case 'custom': return <Bell className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

function getNotificationColor(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent': return 'text-danger-600 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800';
    case 'high': return 'text-warning-600 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800';
    case 'normal': return 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
    case 'low': return 'text-neutral-600 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    default: return 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
  }
}

function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return diffMins + 'm ago';
  if (diffHours < 24) return diffHours + 'h ago';
  if (diffDays < 7) return diffDays + 'd ago';
  return format(date, 'MMM d, yyyy');
}

function renderNotificationItem(
  notification: any,
  getNotificationColor: (priority: any) => string,
  getNotificationIcon: (type: any) => React.ReactNode,
  formatNotificationTime: (dateString: string) => string,
  handleMarkAsRead: (id: string) => void,
  handleArchive: (id: string) => void,
  handleDelete: (id: string) => void
) {
  return (
    <div 
      key={notification.id} 
      className={notification.is_read ? 'bg-white dark:bg-neutral-900 p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800' : 'bg-primary-50 dark:bg-primary-900/20 p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800'}
    >
      <div className={'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ' + getNotificationColor(notification.priority)}>
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={notification.is_read ? 'font-medium text-neutral-900 dark:text-white' : 'font-semibold text-neutral-900 dark:text-white'}>
              {notification.title}
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{notification.message}</p>
          </div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
            {formatNotificationTime(notification.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notification.action_url && notification.action_label && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = notification.action_url}>
              {notification.action_label}
            </Button>
          )}
          {!notification.is_read && (
            <Button variant="ghost" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleMarkAsRead(notification.id)} />
          )}
          <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => handleArchive(notification.id)} />
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} />
            }
            items={[
              { label: 'Delete', value: 'delete', icon: Trash2 as any, danger: true },
            ]}
            onSelect={(value) => value === 'delete' && handleDelete(notification.id)}
            align="right"
          />
        </div>
      </div>
    </div>
  );
}

function NotificationList({
  isLoading,
  notifications,
  getNotificationColor,
  getNotificationIcon,
  formatNotificationTime,
  handleMarkAsRead,
  handleArchive,
  handleDelete,
}: {
  isLoading: boolean;
  notifications: any[];
  getNotificationColor: (priority: any) => string;
  getNotificationIcon: (type: any) => React.ReactNode;
  formatNotificationTime: (dateString: string) => string;
  handleMarkAsRead: (id: string) => void;
  handleArchive: (id: string) => void;
  handleDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }
  if (notifications && notifications.length > 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {notifications.map(notification => renderNotificationItem(
              notification,
              getNotificationColor,
              getNotificationIcon,
              formatNotificationTime,
              handleMarkAsRead,
              handleArchive,
              handleDelete
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Bell className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">No notifications found</p>
      </CardContent>
    </Card>
  );
}

function EmailNotificationsList({ watch, register }: { watch: any; register: any }) {
  const items = [
    { key: 'email_enabled', label: 'Email Notifications', desc: 'Receive notifications via email' },
    { key: 'email_daily_summary', label: 'Daily Summary', desc: 'Get a daily summary of your activity' },
    { key: 'email_weekly_report', label: 'Weekly Report', desc: 'Receive a weekly productivity report' },
    { key: 'email_budget_alerts', label: 'Budget Alerts', desc: 'Get notified when approaching budget limits' },
    { key: 'email_task_reminders', label: 'Task Reminders', desc: 'Reminders for upcoming and overdue tasks' },
    { key: 'email_routine_reminders', label: 'Routine Reminders', desc: 'Reminders for your daily routines' },
    { key: 'email_habit_reminders', label: 'Habit Reminders', desc: 'Reminders for your daily habits' },
    { key: 'email_goal_deadlines', label: 'Goal Deadlines', desc: 'Get notified about approaching goal deadlines' },
    { key: 'email_subscription_renewals', label: 'Subscription Renewals', desc: 'Get notified about upcoming subscription renewals' },
  ];
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between">
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">{item.label}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
          </div>
          <Switch checked={watch(item.key)} onChange={(e) => register(item.key).onChange(e)} label={item.label} description={item.desc} />
        </div>
      ))}
    </div>
  );
}

function PushNotificationsList({ watch, register }: { watch: any; register: any }) {
  const items = [
    { key: 'push_enabled', label: 'Push Notifications', desc: 'Receive push notifications on your devices' },
    { key: 'push_task_reminders', label: 'Task Reminders', desc: 'Push reminders for upcoming and overdue tasks' },
    { key: 'push_routine_reminders', label: 'Routine Reminders', desc: 'Push reminders for your daily routines' },
    { key: 'push_habit_reminders', label: 'Habit Reminders', desc: 'Push reminders for your daily habits' },
    { key: 'push_budget_warnings', label: 'Budget Warnings', desc: 'Push warnings when approaching budget limits' },
    { key: 'push_subscription_renewals', label: 'Subscription Renewals', desc: 'Push notifications for subscription renewals' },
    { key: 'push_goal_deadlines', label: 'Goal Deadlines', desc: 'Push notifications for goal deadlines' },
    { key: 'push_pomodoro_reminders', label: 'Pomodoro Reminders', desc: 'Push reminders for Pomodoro sessions' },
    { key: 'push_schedule_reminders', label: 'Schedule Reminders', desc: 'Push reminders for scheduled events' },
  ];
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between">
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">{item.label}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
          </div>
          <Switch checked={watch(item.key)} onChange={(e) => register(item.key).onChange(e)} label={item.label} description={item.desc} />
        </div>
      ))}
    </div>
  );
}

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

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof notificationPreferencesSchema>>({
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

      <Tabs value={activeTab} onChange={(value: string) => setActiveTab(value as 'all' | 'unread')} tabs={[
        { value: 'all', label: 'All' },
        { value: 'unread', label: 'Unread ' + (unreadCount && unreadCount > 0 ? '(' + unreadCount + ')' : '') },
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

      <NotificationList
        isLoading={isLoading}
        notifications={notifications || []}
        getNotificationColor={getNotificationColor}
        getNotificationIcon={getNotificationIcon}
        formatNotificationTime={formatNotificationTime}
        handleMarkAsRead={handleMarkAsRead}
        handleArchive={handleArchive}
        handleDelete={handleDelete}
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
            <EmailNotificationsList watch={watch} register={register} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">Push Notifications</h3>
            <PushNotificationsList watch={watch} register={register} />
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
              <Switch checked={watch('batch_similar')} onChange={(e) => register('batch_similar').onChange(e)} label="" description="" />
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

export default NotificationsPage;