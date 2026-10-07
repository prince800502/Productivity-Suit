'use client';

import { useState } from 'react';
import { User, Bell, Moon, Sun, Monitor, Shield, Palette, Globe, CreditCard, Download, Trash2, LogOut, Mail, Key, Phone, Camera, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Switch, Badge, Avatar, Modal, Tabs, Alert, AlertTitle, AlertDescription
} from '@productivity-suite/ui';
import { useAuth, signOut, updateProfile, uploadAvatar, updatePassword } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@productivity-suite/ui';
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

// NotificationPreferences schema is now part of profileSchema

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
  const { user, profile, updateProfile: updateProfileHook } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    watch: watchProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      currency: profile?.currency || 'USD',
      monthly_budget: profile?.monthly_budget || null,
      theme: profile?.theme || 'system',
      notification_preferences: profile?.notification_preferences || {
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
      const { error } = await updateProfileHook(data);
      if (error) throw error;
      toast({
        type: 'success',
        title: 'Success',
        message: 'Profile updated successfully',
      });
      resetProfile(data);
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
      setAvatarPreview(data?.publicUrl || null);
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
      />

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          <Card>
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

          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={watchProfile('notification_preferences.email_notifications')}
                      onChange={checked => registerProfile('notification_preferences.email_notifications').onChange({ target: { checked } })}
                      label=""
                      description=""
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Push Notifications</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive push notifications on your devices</p>
                    </div>
                    <Switch
                      checked={watchProfile('notification_preferences.push_notifications')}
                      onChange={checked => registerProfile('notification_preferences.push_notifications').onChange({ target: { checked } })}
                      label=""
                      description=""
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Daily Summary</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Get a daily summary of your activity</p>
                    </div>
                    <Switch
                      checked={watchProfile('notification_preferences.daily_summary')}
                      onChange={checked => registerProfile('notification_preferences.daily_summary').onChange({ target: { checked } })}
                      label=""
                      description=""
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Weekly Report</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive a weekly productivity report</p>
                    </div>
                    <Switch
                      checked={watchProfile('notification_preferences.weekly_report')}
                      onChange={checked => registerProfile('notification_preferences.weekly_report').onChange({ target: { checked } })}
                      label=""
                      description=""
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Budget Alerts</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified when approaching budget limits</p>
                    </div>
                    <Switch
                      checked={watchProfile('notification_preferences.budget_alerts')}
                      onChange={checked => registerProfile('notification_preferences.budget_alerts').onChange({ target: { checked } })}
                      label=""
                      description=""
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Task Reminders</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Reminders for upcoming and overdue tasks</p>
                    </div>
                    <Switch
                      checked={watchProfile('notification_preferences.task_reminders')}
                      onChange={checked => registerProfile('notification_preferences.task_reminders').onChange({ target: { checked } })}
                      label=""
                      description=""
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">Routine Reminders</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Reminders for your daily routines</p>
                    </div>
                    <Switch
                      checked={watchProfile('notification_preferences.routine_reminders')}
                      onChange={checked => registerProfile('notification_preferences.routine_reminders').onChange({ target: { checked } })}
                      label=""
                      description=""
                    />
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
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
                  { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
                  { value: 'system', label: 'System', icon: Monitor, description: 'Match your system setting' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => registerProfile('theme').onChange({ target: { value: option.value } })}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      watchProfile('theme') === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <option.icon className="w-6 h-6" />
                    </div>
                    <p className="text-center font-medium text-neutral-900 dark:text-white">{option.label}</p>
                    <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">{option.description}</p>
                    {watchProfile('theme') === option.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
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
          <Card>
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

          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
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
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>Download a copy of all your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Download JSON file with all your data</p>
                </div>
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>Export Data</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
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