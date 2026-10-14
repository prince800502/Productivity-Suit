'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Bell, Moon, Sun, Monitor, Shield, Palette, Globe, CreditCard, Download, Trash2, LogOut, Mail, Key, Phone, Camera, Check, AlertCircle, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Switch, Badge, Avatar, Modal, Tabs, Alert, AlertTitle, AlertDescription,
  cn
} from '@productivity-suite/ui';
import { useAuth, signOut, updateProfile, uploadAvatar, updatePassword } from '@productivity-suite/core';
import { useTheme, type ThemeMode } from '@productivity-suite/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@productivity-suite/ui';
import { useExpenses } from '@productivity-suite/core';
import { useBudgets, useSavingsGoals } from '@productivity-suite/core';
import { useGoals } from '@productivity-suite/core';
import { useTasks } from '@productivity-suite/core';
import { useHabits } from '@productivity-suite/core';
import { useRoutines } from '@productivity-suite/core';
import { useScheduleEvents } from '@productivity-suite/core';
import { useNotifications } from '@productivity-suite/core';
import { useRecurringExpenses } from '@productivity-suite/core';
import { saveAs } from 'file-saver';
import type { NotificationPreferences } from '@productivity-suite/core';

const profileSchema = z.object({
  full_name: z.string().min(2).max(50).optional(),
  currency: z.string().optional(),
  monthly_budget: z.number().positive().optional().nullable(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notification_preferences: z.object({
    email_notifications: z.boolean(),
    push_notifications: z.boolean(),
    daily_summary: z.boolean(),
    weekly_report: z.boolean(),
    budget_alerts: z.boolean(),
    task_reminders: z.boolean(),
    routine_reminders: z.boolean(),
  }).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' },
];

export default function SettingsPage() {
  const { user, profile, updateProfile: updateProfileHook, profileLoaded } = useAuth();
  const { mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Track form initialization to prevent overwriting user edits
  const formInitializedRef = useRef(false);
  const hasUserEditsRef = useRef(false);

  // Fetch data for exports
  const { data: expenses } = useExpenses({ limit: 10000 });
  const { data: budgets } = useBudgets({ limit: 100 });
  const { data: savingsGoals } = useSavingsGoals({ limit: 100 });
  const { data: goals } = useGoals({ limit: 100 });
  const { data: tasks } = useTasks({ limit: 1000 });
  const { data: habits } = useHabits();
  const { data: routines } = useRoutines();
  const { data: scheduleEvents } = useScheduleEvents();
  const { data: notifications } = useNotifications({ limit: 1000 });
  const { data: recurringExpenses } = useRecurringExpenses({ limit: 100 });

  const handleExportJSON = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        profile: {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name,
          currency: profile?.currency,
          monthly_budget: profile?.monthly_budget,
          theme: profile?.theme,
          notification_preferences: profile?.notification_preferences,
        },
        expenses: expenses || [],
        budgets: budgets || [],
        savingsGoals: savingsGoals || [],
        goals: goals || [],
        tasks: tasks || [],
        habits: habits || [],
        routines: routines || [],
        scheduleEvents: scheduleEvents || [],
        notifications: notifications || [],
        recurringExpenses: recurringExpenses || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      saveAs(blob, `productivity-suite-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
      toast({ type: 'success', title: 'Success', message: 'Data exported successfully' });
    } catch (error: any) {
      toast({ type: 'error', title: 'Error', message: error.message || 'Failed to export data' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExpensesCSV = async () => {
    if (!expenses || expenses.length === 0) {
      toast({ type: 'info', title: 'No Data', message: 'No expenses to export' });
      return;
    }
    setIsExporting(true);
    try {
      const headers = ['Date', 'Category', 'Description', 'Amount', 'Recurring'];
      const rows = (expenses || []).map(e => [
        e.date,
        e.category,
        e.description || '',
        e.amount.toString(),
        e.is_recurring ? 'Yes' : 'No'
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast({ type: 'success', title: 'Success', message: 'Expenses exported to CSV' });
    } catch (error: any) {
      toast({ type: 'error', title: 'Error', message: error.message || 'Failed to export expenses' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTasksCSV = async () => {
    if (!tasks || tasks.length === 0) {
      toast({ type: 'info', title: 'No Data', message: 'No tasks to export' });
      return;
    }
    setIsExporting(true);
    try {
      const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Estimated Minutes', 'Tags'];
      const rows = (tasks || []).map(t => [
        t.title,
        t.description || '',
        t.status,
        t.priority,
        t.due_date ? format(new Date(t.due_date), 'yyyy-MM-dd') : '',
        t.estimated_minutes?.toString() || '',
        (t.tags || []).join(';')
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast({ type: 'success', title: 'Success', message: 'Tasks exported to CSV' });
    } catch (error: any) {
      toast({ type: 'error', title: 'Error', message: error.message || 'Failed to export tasks' });
    } finally {
      setIsExporting(false);
    }
  };

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    watch: watchProfile,
    setValue: setValueProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile, isDirty: isProfileDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      currency: profile?.currency || 'USD',
      monthly_budget: profile?.monthly_budget || null,
      theme: profile?.theme || 'system',
      notification_preferences: (profile?.notification_preferences as { email_notifications: boolean; push_notifications: boolean; daily_summary: boolean; weekly_report: boolean; budget_alerts: boolean; task_reminders: boolean; routine_reminders: boolean }) || {
        email_notifications: true,
        push_notifications: true,
        daily_summary: true,
        weekly_report: false,
        budget_alerts: true,
        task_reminders: true,
        routine_reminders: true,
      },
    },
  });

  // Initialize form with profile data when it loads (only once, and only if user hasn't made edits)
  useEffect(() => {
    if (profileLoaded && profile && !formInitializedRef.current && !hasUserEditsRef.current) {
      resetProfile({
        full_name: profile.full_name || '',
        currency: profile.currency || 'USD',
        monthly_budget: profile.monthly_budget || null,
        theme: profile.theme || 'system',
        notification_preferences: (profile.notification_preferences as any) || {
          email_notifications: true,
          push_notifications: true,
          daily_summary: true,
          weekly_report: false,
          budget_alerts: true,
          task_reminders: true,
          routine_reminders: true,
        },
      });
      formInitializedRef.current = true;
    }
  }, [profileLoaded, profile, resetProfile]);

  // Track user edits to prevent overwriting
  useEffect(() => {
    hasUserEditsRef.current = isProfileDirty;
  }, [isProfileDirty]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitProfile = async (data: ProfileForm) => {
    try {
      // Merge submitted notification_preferences with existing profile data to preserve
      // fields not in the form schema (quiet_hours, timezone, max_daily_notifications, etc.)
      const existingPrefs = (profile?.notification_preferences as any) || {};
      const submittedPrefs = (data.notification_preferences as any) || {};
      const mergedPrefs = {
        ...existingPrefs,
        ...submittedPrefs,
        // Ensure the 7 schema fields are explicitly set from submitted data
        email_notifications: submittedPrefs.email_notifications ?? existingPrefs.email_notifications,
        push_notifications: submittedPrefs.push_notifications ?? existingPrefs.push_notifications,
        daily_summary: submittedPrefs.daily_summary ?? existingPrefs.daily_summary,
        weekly_report: submittedPrefs.weekly_report ?? existingPrefs.weekly_report,
        budget_alerts: submittedPrefs.budget_alerts ?? existingPrefs.budget_alerts,
        task_reminders: submittedPrefs.task_reminders ?? existingPrefs.task_reminders,
        routine_reminders: submittedPrefs.routine_reminders ?? existingPrefs.routine_reminders,
      };

      const apiData = {
        ...data,
        notification_preferences: mergedPrefs,
      };
      const { data: returnedProfile, error } = await updateProfileHook(apiData as any);
      if (error) throw error;
      toast({
        type: 'success',
        title: 'Success',
        message: 'Profile updated successfully',
      });
      // Reset form with the verified returned data from the database
      if (returnedProfile) {
        resetProfile({
          full_name: returnedProfile.full_name || '',
          currency: returnedProfile.currency || 'USD',
          monthly_budget: returnedProfile.monthly_budget || null,
          theme: returnedProfile.theme || 'system',
          notification_preferences: (returnedProfile.notification_preferences as any) || {
            email_notifications: true,
            push_notifications: true,
            daily_summary: true,
            weekly_report: false,
            budget_alerts: true,
            task_reminders: true,
            routine_reminders: true,
          },
        });
      } else {
        resetProfile(data);
      }
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update profile',
      });
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    try {
      const { error } = await updatePassword(data.newPassword);
      if (error) throw error;
      toast({
        type: 'success',
        title: 'Success',
        message: 'Password updated successfully',
      });
      resetPassword();
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update password',
      });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    try {
      const { data, error } = await uploadAvatar(user.id, file);
      if (error) throw error;
      const publicUrl = data?.publicUrl || null;
      setAvatarPreview(publicUrl);
      // Persist avatar URL to profile
      const { error: profileError } = await updateProfileHook({ avatar_url: publicUrl });
      if (profileError) throw profileError;
      toast({
        type: 'success',
        title: 'Success',
        message: 'Avatar updated',
      });
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to upload avatar',
      });
    }
  };

  const tabs = [
    { value: 'profile', label: 'Profile', icon: <User className="w-4 h-4 mr-2" /> },
    { value: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 mr-2" /> },
    { value: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4 mr-2" /> },
    { value: 'security', label: 'Security', icon: <Shield className="w-4 h-4 mr-2" /> },
    { value: 'data', label: 'Data & Privacy', icon: <Download className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={tabs}
        fullWidth
        className="w-full"
        variant="glass"
      />

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar
                    src={avatarPreview || user?.user_metadata?.avatar_url}
                    name={profile?.full_name || user?.email}
                    size="xl"
                  />
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()} icon={<Camera className="w-4 h-4" />}>
                      Change Avatar
                    </Button>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">JPG, PNG up to 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" placeholder="John Doe" error={profileErrors.full_name?.message} {...registerProfile('full_name')} />
                  <Select
                    label="Currency"
                    options={currencies}
                    error={profileErrors.currency?.message}
                    {...registerProfile('currency')}
                  />
                </div>
                <Input
                  label="Monthly Budget (optional)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={profileErrors.monthly_budget?.message}
                  {...registerProfile('monthly_budget', { valueAsNumber: true })}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="submit" loading={isSubmittingProfile}>Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
                  <p className="text-neutral-900 dark:text-white">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Member Since</label>
                  <p className="text-neutral-900 dark:text-white">{user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Last Sign In</label>
                  <p className="text-neutral-900 dark:text-white">{user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMMM d, yyyy h:mm a') : 'Never'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Provider</label>
                  <p className="text-neutral-900 dark:text-white capitalize">{user?.app_metadata?.provider || 'Email'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fade-in">
          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                <div className="space-y-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'email_enabled', label: 'Enable Email Notifications', desc: 'Master toggle for all email notifications' },
                      { key: 'email_daily_summary', label: 'Daily Summary', desc: 'Get a daily summary of your activity' },
                      { key: 'email_weekly_report', label: 'Weekly Report', desc: 'Receive a weekly productivity report' },
                      { key: 'email_budget_alerts', label: 'Budget Alerts', desc: 'Get notified when approaching budget limits' },
                      { key: 'email_task_reminders', label: 'Task Reminders', desc: 'Reminders for upcoming and overdue tasks' },
                      { key: 'email_routine_reminders', label: 'Routine Reminders', desc: 'Reminders for your daily routines' },
                      { key: 'email_habit_reminders', label: 'Habit Reminders', desc: 'Reminders for your habits' },
                      { key: 'email_goal_deadlines', label: 'Goal Deadlines', desc: 'Notifications for approaching goal deadlines' },
                      { key: 'email_subscription_renewals', label: 'Subscription Renewals', desc: 'Alerts for upcoming subscription payments' },
                    ].map(item => {
                      const notifPrefs = (watchProfile('notification_preferences') || {}) as Record<string, boolean>;
                      return (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{item.label}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                          </div>
                          <Switch
                            checked={notifPrefs[item.key] ?? false}
                            onChange={e => setValueProfile('notification_preferences', { ...notifPrefs, [item.key]: e.target.checked } as any)}
                            label=""
                            description=""
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'push_enabled', label: 'Enable Push Notifications', desc: 'Master toggle for all push notifications' },
                      { key: 'push_task_reminders', label: 'Task Reminders', desc: 'Push reminders for upcoming and overdue tasks' },
                      { key: 'push_routine_reminders', label: 'Routine Reminders', desc: 'Push reminders for your daily routines' },
                      { key: 'push_habit_reminders', label: 'Habit Reminders', desc: 'Push reminders for your habits' },
                      { key: 'push_budget_warnings', label: 'Budget Warnings', desc: 'Push alerts when approaching budget limits' },
                      { key: 'push_subscription_renewals', label: 'Subscription Renewals', desc: 'Push alerts for upcoming subscription payments' },
                      { key: 'push_goal_deadlines', label: 'Goal Deadlines', desc: 'Push notifications for approaching goal deadlines' },
                      { key: 'push_pomodoro_reminders', label: 'Pomodoro Reminders', desc: 'Push notifications for Pomodoro sessions' },
                      { key: 'push_schedule_reminders', label: 'Schedule Reminders', desc: 'Push reminders for scheduled events' },
                    ].map(item => {
                      const notifPrefs = (watchProfile('notification_preferences') || {}) as Record<string, boolean>;
                      return (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{item.label}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                          </div>
                          <Switch
                            checked={notifPrefs[item.key] ?? false}
                            onChange={e => setValueProfile('notification_preferences', { ...notifPrefs, [item.key]: e.target.checked } as any)}
                            label=""
                            description=""
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Timing & Frequency</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Quiet Hours Start</label>
                        <Input
                          type="time"
                          value={(watchProfile('notification_preferences') as any)?.quiet_hours_start || '22:00'}
                          onChange={e => setValueProfile('notification_preferences', { ...((watchProfile('notification_preferences') as any) || {}), quiet_hours_start: e.target.value } as any)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Quiet Hours End</label>
                        <Input
                          type="time"
                          value={(watchProfile('notification_preferences') as any)?.quiet_hours_end || '08:00'}
                          onChange={e => setValueProfile('notification_preferences', { ...((watchProfile('notification_preferences') as any) || {}), quiet_hours_end: e.target.value } as any)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Timezone</label>
                        <Input
                          value={(watchProfile('notification_preferences') as any)?.timezone || 'UTC'}
                          onChange={e => setValueProfile('notification_preferences', { ...((watchProfile('notification_preferences') as any) || {}), timezone: e.target.value } as any)}
                          placeholder="UTC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Max Daily Notifications</label>
                        <Input
                          type="number"
                          min="1"
                          max="200"
                          value={(watchProfile('notification_preferences') as any)?.max_daily_notifications || 50}
                          onChange={e => setValueProfile('notification_preferences', { ...((watchProfile('notification_preferences') as any) || {}), max_daily_notifications: Number(e.target.value) } as any)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">Batch Similar Notifications</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Group similar notifications together</p>
                      </div>
                      <Switch
                        checked={(watchProfile('notification_preferences') as any)?.batch_similar ?? true}
                        onChange={checked => setValueProfile('notification_preferences', { ...((watchProfile('notification_preferences') as any) || {}), batch_similar: checked } as any)}
                        label=""
                        description=""
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="submit" loading={isSubmittingProfile}>Save Preferences</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 animate-fade-in">
          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
                  { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
                  { value: 'system', label: 'System', icon: Monitor, description: 'Match your system setting' },
                ] as const).map(option => (
                  <button
                    key={option.value}
                    onClick={async () => {
                      setMode(option.value as ThemeMode);
                      const { error } = await updateProfileHook({ theme: option.value });
                      if (error) {
                        toast({ type: 'error', title: 'Error', message: 'Failed to update theme preference' });
                        setMode(mode);
                      }
                    }}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all',
                      mode === option.value
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                        : 'border-neutral-200/50 dark:border-neutral-700/50 hover:border-neutral-300/50 dark:hover:border-neutral-600/50'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <option.icon className="w-6 h-6" />
                    </div>
                    <p className="text-center font-medium text-neutral-900 dark:text-white">{option.label}</p>
                    <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">{option.description}</p>
                    {mode === option.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Language</CardTitle>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'zh', label: 'Chinese' },
                  { value: 'ja', label: 'Japanese' },
                  { value: 'ko', label: 'Korean' },
                ]}
                defaultValue="en"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  error={passwordErrors.currentPassword?.message}
                  {...registerPassword('currentPassword')}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  error={passwordErrors.newPassword?.message}
                  {...registerPassword('newPassword')}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  error={passwordErrors.confirmPassword?.message}
                  {...registerPassword('confirmPassword')}
                  required
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="submit" loading={isSubmittingPassword}>Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">2FA Status</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Two-factor authentication is not enabled</p>
                </div>
                <Button variant="outline" icon={<Shield className="w-4 h-4" />}>Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl glass-card">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Current Session</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Chrome on Windows • Active now</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Current</Badge>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Only showing current session in demo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data & Privacy Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-fade-in">
          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>Download a copy of all your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl glass-card">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">Complete Backup (JSON)</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Download all your data in a single JSON file</p>
                  </div>
                  <Button
                    variant="primary"
                    icon={<FileJson className="w-4 h-4" />}
                    onClick={handleExportJSON}
                    disabled={isExporting}
                    loading={isExporting}
                  >
                    {isExporting ? 'Preparing...' : 'Export JSON'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl glass-card">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">Expenses (CSV)</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Download expenses in spreadsheet format</p>
                  </div>
                  <Button
                    variant="outline"
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    onClick={handleExportExpensesCSV}
                    disabled={isExporting}
                    loading={isExporting}
                  >
                    Export CSV
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl glass-card">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">Tasks (CSV)</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Download tasks in spreadsheet format</p>
                  </div>
                  <Button
                    variant="outline"
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    onClick={handleExportTasksCSV}
                    disabled={isExporting}
                    loading={isExporting}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <div>
                  <AlertTitle>This action is irreversible</AlertTitle>
                  <AlertDescription>
                    Deleting your account will permanently remove all your data including expenses, tasks, routines, schedule, and settings. This cannot be undone.
                  </AlertDescription>
                </div>
              </Alert>
              <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteConfirm(true)}>
                Delete Account
              </Button>
            </CardContent>
          </Card>

          <Card variant="default" glass={true}>
            <CardHeader>
              <CardTitle>Sign Out Everywhere</CardTitle>
              <CardDescription>Sign out of all active sessions on all devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Sign Out All Sessions</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">You will need to sign in again on all devices</p>
                </div>
                <Button variant="outline" icon={<LogOut className="w-4 h-4" />} onClick={async () => { await signOut(); toast({ type: 'success', title: 'Success', message: 'Signed out everywhere' }); }}>
                  Sign Out Everywhere
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Delete Account"
      >
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Are you absolutely sure? This will permanently delete your account and all data.
        </p>
        <Input
          label="Type 'DELETE' to confirm"
          placeholder="DELETE"
          onChange={e => e.target.value === 'DELETE' && setDeleteConfirm(false)}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { setDeleteConfirm(false); toast({ type: 'success', title: 'Success', message: 'Account deleted (demo)' }); }}>
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  );
}