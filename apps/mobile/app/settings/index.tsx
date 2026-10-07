import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { useTheme } from '@/providers/ThemeProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NotificationPreferences } from '@productivity-suite/core';
import { useExpenses, useTasks, useRoutines, usePomodoroSessions, useScheduleEvents, useHolidays } from '@productivity-suite/core';

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

const tabs = [
  { value: 'profile', label: 'Profile', icon: 'person' },
  { value: 'notifications', label: 'Notifications', icon: 'notifications' },
  { value: 'appearance', label: 'Appearance', icon: 'menu' },
  { value: 'security', label: 'Security', icon: 'shield-check' },
  { value: 'data', label: 'Data & Privacy', icon: 'cloud-download' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, updateProfile: updateProfileHook, signOut, updatePassword } = useAuth();
  const { mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    watch: watchProfile,
    setValue: setValueProfile,
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
    setIsLoading(true);
    try {
      const { error } = await updateProfileHook(data);
      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully');
      resetProfile(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      const { error } = await updatePassword(data.newPassword);
      if (error) throw error;
      Alert.alert('Success', 'Password updated successfully');
      resetPassword();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    setIsLoading(true);
    try {
      await signOut();
      Alert.alert('Success', 'Signed out everywhere');
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all data for export
  const { data: allExpenses } = useExpenses({ limit: 10000 });
  const { data: allTasks } = useTasks({ limit: 10000 });
  const { data: allRoutines } = useRoutines();
  const { data: allPomodoroSessions } = usePomodoroSessions({ limit: 10000 });
  const { data: allScheduleEvents } = useScheduleEvents();
  const { data: allHolidays } = useHolidays();

  function convertToCSV(data: any[], headers: string[]): string {
    const rows = [headers.join(',')];
    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }

  const handleExportData = async () => {
    if (!user) return;
    
    const exportData = {
      exportDate: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      profile,
      expenses: allExpenses || [],
      tasks: allTasks || [],
      routines: allRoutines || [],
      pomodoroSessions: allPomodoroSessions || [],
      scheduleEvents: allScheduleEvents || [],
      holidays: allHolidays || [],
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `productivity-suite-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;

    try {
      await Share.share({
        title: 'Export Data',
        message: json,
        url: `data:application/json;base64,${btoa(json)}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.tabButton,
                  activeTab === tab.value && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.value ? '#0ea5e9' : '#6b7280'} />
                <Text style={[styles.tabButtonText, activeTab === tab.value && styles.tabButtonTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Profile Information</Text>
                <Text style={styles.cardSubtitle}>Update your personal information</Text>
              </View>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} style={styles.form}>
                <View style={styles.avatarSection}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(profile?.full_name || user?.email || 'U')[0].toUpperCase()}</Text>
                  </View>
                  <Button variant="outline" size="sm" style={styles.avatarButton} onPress={() => Alert.alert('Not implemented', 'Avatar upload coming soon')}>
                    <Text>Change Avatar</Text>
                  </Button>
                </View>
                <View style={styles.formRow}>
                  <Input style={styles.formRowChild} label="Full Name" placeholder="John Doe" error={profileErrors.full_name?.message} {...registerProfile('full_name')} />
                  <View style={[styles.modalSelect, styles.formRowChild]}>
                    <Text style={styles.modalSelectLabel}>Currency</Text>
                    <View style={styles.selectContainer}>
                      {currencies.map(c => (
                        <TouchableOpacity
                          key={c.value}
                          style={[styles.currencyOption, watchProfile('currency') === c.value && styles.currencyOptionSelected]}
                          onPress={() => registerProfile('currency').onChange({ target: { value: c.value } })}
                        >
                          <Text style={[styles.currencyOptionText, watchProfile('currency') === c.value && styles.currencyOptionTextActive]}>{c.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                <Input
                  label="Monthly Budget (optional)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={profileErrors.monthly_budget?.message}
                  {...registerProfile('monthly_budget', { valueAsNumber: true })}
                />
                <View style={styles.modalActions}>
                  <Button style={styles.modalActionButton} loading={isSubmittingProfile || isLoading} onPress={handleSubmitProfile(onSubmitProfile)}>
                    <Text>Save Changes</Text>
                  </Button>
                </View>
              </form>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Account Information</Text>
                <Text style={styles.cardSubtitle}>Your account details</Text>
              </View>
              <View style={styles.accountInfo}>
                <View style={styles.accountInfoItem}>
                  <Text style={styles.accountInfoLabel}>Email</Text>
                  <Text style={styles.accountInfoValue}>{user?.email}</Text>
                </View>
                <View style={styles.accountInfoItem}>
                  <Text style={styles.accountInfoLabel}>Member Since</Text>
                  <Text style={styles.accountInfoValue}>{user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown'}</Text>
                </View>
                <View style={styles.accountInfoItem}>
                  <Text style={styles.accountInfoLabel}>Last Sign In</Text>
                  <Text style={styles.accountInfoValue}>{user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMMM d, yyyy h:mm a') : 'Never'}</Text>
                </View>
                <View style={styles.accountInfoItem}>
                  <Text style={styles.accountInfoLabel}>Provider</Text>
                  <Text style={styles.accountInfoValue}>{user?.app_metadata?.provider ? user.app_metadata.provider.charAt(0).toUpperCase() + user.app_metadata.provider.slice(1) : 'Email'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Notification Preferences</Text>
                <Text style={styles.cardSubtitle}>Choose how you want to be notified</Text>
              </View>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} style={styles.form}>
                <View style={styles.notificationList}>
                  {[
                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive push notifications on your devices' },
                    { key: 'daily_summary', label: 'Daily Summary', desc: 'Get a daily summary of your activity' },
                    { key: 'weekly_report', label: 'Weekly Report', desc: 'Receive a weekly productivity report' },
                    { key: 'budget_alerts', label: 'Budget Alerts', desc: 'Get notified when approaching budget limits' },
                    { key: 'task_reminders', label: 'Task Reminders', desc: 'Reminders for upcoming and overdue tasks' },
                    { key: 'routine_reminders', label: 'Routine Reminders', desc: 'Reminders for your daily routines' },
                  ].map(item => {
                    const notifPrefs = watchProfile('notification_preferences') as NotificationPreferences | undefined;
                    const value = notifPrefs?.[item.key as keyof NotificationPreferences] ?? false;
                    return (
                      <View key={item.key} style={styles.notificationItem}>
                        <View style={styles.notificationInfo}>
                          <Text style={styles.notificationLabel}>{item.label}</Text>
                          <Text style={styles.notificationDesc}>{item.desc}</Text>
                        </View>
                        <Switch
                          value={value}
                          onValueChange={checked => {
                            const defaultPrefs: NotificationPreferences = {
                              email_notifications: true,
                              push_notifications: true,
                              daily_summary: true,
                              weekly_report: false,
                              budget_alerts: true,
                              task_reminders: true,
                              routine_reminders: true,
                            };
                            const currentPrefs = (watchProfile('notification_preferences') as NotificationPreferences | undefined) || defaultPrefs;
                            setValueProfile('notification_preferences', { ...currentPrefs, [item.key]: checked });
                          }}
                          trackColor={{ false: '#d1d5db', true: '#0ea5e9' }}
                          thumbColor="#ffffff"
                        />
                      </View>
                    );
                  })}
                </View>
                <View style={styles.modalActions}>
                  <Button style={styles.modalActionButton} loading={isSubmittingProfile || isLoading} onPress={handleSubmitProfile(onSubmitProfile)}>
                    <Text>Save Preferences</Text>
                  </Button>
                </View>
              </form>
            </View>
          </View>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Theme</Text>
                <Text style={styles.cardSubtitle}>Choose your preferred color scheme</Text>
              </View>
              <View style={styles.themeOptions}>
                {[
                  { value: 'light', label: 'Light', icon: 'sunny', description: 'Always use light mode' },
                  { value: 'dark', label: 'Dark', icon: 'moon', description: 'Always use dark mode' },
                  { value: 'system', label: 'System', icon: 'time', description: 'Match your system setting' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setMode(option.value as 'light' | 'dark' | 'system')}
                    style={[
                      styles.themeOption,
                      mode === option.value && styles.themeOptionActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={option.icon as any} size={28} color={mode === option.value ? '#0ea5e9' : '#6b7280'} />
                    <Text style={[styles.themeOptionLabel, mode === option.value && styles.themeOptionLabelActive]}>{option.label}</Text>
                    <Text style={styles.themeOptionDesc}>{option.description}</Text>
                    {mode === option.value && (
                      <View style={styles.themeOptionCheck}>
                        <Ionicons name="checkmark" size={20} color="#0ea5e9" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Language</Text>
                <Text style={styles.cardSubtitle}>Choose your preferred language</Text>
              </View>
              <View style={styles.selectContainer}>
                {[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'zh', label: 'Chinese' },
                  { value: 'ja', label: 'Japanese' },
                  { value: 'ko', label: 'Korean' },
                ].map(lang => (
                  <TouchableOpacity
                    key={lang.value}
                    style={styles.languageOption}
                    onPress={() => Alert.alert('Not implemented', 'Language switching coming soon')}
                  >
                    <Text style={styles.languageOptionText}>{lang.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Change Password</Text>
                <Text style={styles.cardSubtitle}>Update your password to keep your account secure</Text>
              </View>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} style={styles.form}>
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
                <View style={styles.modalActions}>
                  <Button style={styles.modalActionButton} loading={isSubmittingPassword || isLoading} onPress={handleSubmitPassword(onSubmitPassword)}>
                    <Text>Update Password</Text>
                  </Button>
                </View>
              </form>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Two-Factor Authentication</Text>
                <Text style={styles.cardSubtitle}>Add an extra layer of security to your account</Text>
              </View>
              <View style={styles.securityItem}>
                <View>
                  <Text style={styles.securityItemTitle}>2FA Status</Text>
                  <Text style={styles.securityItemDesc}>Two-factor authentication is not enabled</Text>
                </View>
                <Button variant="outline" onPress={() => Alert.alert('Not implemented', '2FA coming soon')}>
                  <Text>Enable 2FA</Text>
                </Button>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Active Sessions</Text>
                <Text style={styles.cardSubtitle}>Manage your active login sessions</Text>
              </View>
              <View style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Ionicons name="time" size={24} color="#6b7280" />
                  <View>
                    <Text style={styles.sessionTitle}>Current Session</Text>
                    <Text style={styles.sessionDesc}>React Native • Active now</Text>
                  </View>
                </View>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>Current</Text>
                </View>
              </View>
              <Text style={styles.sessionNote}>Only showing current session</Text>
            </View>
          </View>
        )}

        {/* Data & Privacy Tab */}
        {activeTab === 'data' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Export Your Data</Text>
                <Text style={styles.cardSubtitle}>Download a copy of all your data</Text>
              </View>
              <View style={styles.dataItem}>
                <View>
                  <Text style={styles.dataItemTitle}>Export Data</Text>
                  <Text style={styles.dataItemDesc}>Download JSON file with all your data</Text>
                </View>
                <Button variant="outline" onPress={handleExportData}>
                  <Ionicons name="download" size={18} color="#0ea5e9" />
                </Button>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Delete Account</Text>
                <Text style={styles.cardSubtitle}>Permanently delete your account and all data</Text>
              </View>
              <View style={styles.dangerZone}>
                <View style={styles.alertBox}>
                  <Ionicons name="alert" size={24} color="#ef4444" />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>This action is irreversible</Text>
                    <Text style={styles.alertDesc}>
                      Deleting your account will permanently remove all your data including expenses, tasks, routines, schedule, and settings. This cannot be undone.
                    </Text>
                  </View>
                </View>
                <Button variant="danger" onPress={() => setDeleteConfirm(true)}>
                  <Ionicons name="trash" size={18} color="#ffffff" />
                  <Text style={{ marginLeft: 8 }}>Delete Account</Text>
                </Button>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Sign Out Everywhere</Text>
                <Text style={styles.cardSubtitle}>Sign out of all active sessions on all devices</Text>
              </View>
              <View style={styles.dataItem}>
                <View>
                  <Text style={styles.dataItemTitle}>Sign Out All Sessions</Text>
                  <Text style={styles.dataItemDesc}>You will need to sign in again on all devices</Text>
                </View>
                <Button variant="outline" loading={isLoading} onPress={handleSignOutAll}>
                  <Ionicons name="close" size={18} color="#0ea5e9" />
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Productivity Suite v0.1.0</Text>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      {deleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <TouchableOpacity onPress={() => setDeleteConfirm(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Are you absolutely sure? This will permanently delete your account and all data.
              </Text>
              <Input
                label="Type 'DELETE' to confirm"
                placeholder="DELETE"
                onChangeText={text => text === 'DELETE' && setDeleteConfirm(false)}
              />
              <View style={styles.modalActions}>
                <Button variant="outline" style={styles.modalActionButton} onPress={() => setDeleteConfirm(false)}>
                  <Text>Cancel</Text>
                </Button>
                <Button variant="danger" style={styles.modalActionButton} onPress={() => { setDeleteConfirm(false); Alert.alert('Success', 'Account deleted (demo)'); }}>
                  <Text>Delete Account</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsScroll: {
    gap: 8,
    paddingHorizontal: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0ea5e9',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#0ea5e9',
  },
  tabContent: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  form: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowChild: {
    flex: 1,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarButton: {
    flex: 1,
  },
  modalSelect: {
    gap: 8,
  },
  modalSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectContainer: {
    gap: 4,
  },
  currencyOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  currencyOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#0ea5e9',
  },
  currencyOptionText: {
    fontSize: 13,
    color: '#1a1a2e',
    textAlign: 'center',
  },
  currencyOptionTextActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  notificationList: {
    gap: 0,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    backgroundColor: '#fafafa',
  },
  themeOptionActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#eff6ff',
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  themeOptionLabelActive: {
    color: '#0ea5e9',
  },
  themeOptionDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  themeOptionCheck: {
    marginLeft: 'auto',
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#1a1a2e',
  },
  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  securityItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  securityItemDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  sessionDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  sessionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
  },
  sessionNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dataItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  dataItemDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  dangerZone: {
    gap: 16,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 20,
  },
  accountInfo: {
    gap: 12,
  },
  accountInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  accountInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  accountInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  versionInfo: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalActionButton: {
    flex: 1,
  },
});