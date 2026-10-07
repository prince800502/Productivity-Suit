import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useRoutines, useCreateRoutine, useUpdateRoutine, useDeleteRoutine, useCompleteRoutine, useToggleRoutineActive, useRoutineStats, useTodayRoutines } from '@productivity-suite/core';
import { routineSchema, RoutineForm, RoutineFrequency } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import { Input } from '@/components/Input';

const frequencies: { value: RoutineFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
  { value: 'weekends', label: 'Weekends', description: 'Saturday and Sunday' },
  { value: 'custom', label: 'Custom', description: 'Specific days of the week' },
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RoutinesScreen() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const { data: routines, isLoading, refetch } = useRoutines();
  const { data: todayRoutines } = useTodayRoutines();
  const { data: stats } = useRoutineStats();

  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();
  const deleteRoutine = useDeleteRoutine();
  const completeRoutine = useCompleteRoutine();
  const toggleActive = useToggleRoutineActive();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoutineForm>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      frequency: 'daily',
      days_of_week: [],
      time_of_day: '',
    },
  });

  const frequency = watch('frequency');

  const onSubmit = async (data: RoutineForm) => {
    try {
      const routineData = {
        ...data,
        days_of_week: data.frequency === 'custom' ? selectedDays : [],
      };
      if (editingRoutine) {
        await updateRoutine.mutateAsync({ id: editingRoutine.id, updates: routineData });
      } else {
        await createRoutine.mutateAsync(routineData);
      }
      setIsModalOpen(false);
      setEditingRoutine(null);
      setSelectedDays([]);
      reset();
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to save routine');
    }
  };

  const handleEdit = (routine: any) => {
    setEditingRoutine(routine);
    setValue('name', routine.name);
    setValue('description', routine.description || '');
    setValue('frequency', routine.frequency);
    setValue('time_of_day', routine.time_of_day || '');
    setSelectedDays(routine.days_of_week || []);
    setIsModalOpen(true);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const completedToday = todayRoutines?.filter(r => r.streak_count > 0).length || 0;
  const totalToday = todayRoutines?.length || 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Routines</Text>
            <Text style={styles.subtitle}>Build habits and track your daily routines</Text>
          </View>
          <Button onPress={() => { setEditingRoutine(null); reset(); setSelectedDays([]); setIsModalOpen(true); }}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </Button>
        </View>

        {/* Today's Routines */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View>
              <Text style={styles.todayTitle}>Today's Routines</Text>
              <Text style={styles.todaySubtitle}>{completedToday} of {totalToday} completed • {format(new Date(), 'EEEE, MMMM d')}</Text>
            </View>
          </View>
          <View style={styles.todayContent}>
            {todayRoutines && todayRoutines.length > 0 ? (
              <View style={styles.todayList}>
                {todayRoutines.map(routine => (
                  <TouchableOpacity key={routine.id} style={styles.todayItem} onPress={() => handleEdit(routine)} activeOpacity={0.8}>
                    <TouchableOpacity
                      onPress={e => { e.stopPropagation(); completeRoutine.mutate(routine.id); }}
                      style={[styles.completeButton, routine.streak_count > 0 && styles.completeButtonCompleted]}
                      disabled={routine.streak_count > 0}
                    >
                      {routine.streak_count > 0 ? (
                        <Ionicons name="checkmark" size={24} color="#ffffff" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={24} color="#d1d5db" />
                      )}
                    </TouchableOpacity>
                    <View style={styles.todayItemContent}>
                      <Text style={[styles.todayItemTitle, routine.streak_count > 0 && styles.todayItemTitleCompleted]}>{routine.name}</Text>
                      <View style={styles.todayItemMeta}>
                        {routine.time_of_day && (
                          <View style={styles.todayItemMetaItem}>
                            <Ionicons name="time" size={14} color="#6b7280" />
                            <Text style={styles.todayItemMetaText}>{routine.time_of_day}</Text>
                          </View>
                        )}
                        <View style={[styles.frequencyBadge, { backgroundColor: '#f3f4f6' }]}>
                          <Text style={styles.frequencyBadgeText}>{routine.frequency.replace('_', ' ')}</Text>
                        </View>
                        {routine.streak_count > 0 && (
                          <View style={styles.streakBadge}>
                            <Ionicons name="refresh" size={12} color="#22c55e" />
                            <Text style={styles.streakBadgeText}>{routine.streak_count} day streak</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={e => { e.stopPropagation(); handleEdit(routine); }} style={styles.editButton}>
                      <Ionicons name="create" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyToday}>
                <Ionicons name="flag-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyTodayText}>No routines for today</Text>
                <Button size="sm" style={styles.emptyButton} onPress={() => { setEditingRoutine(null); reset(); setSelectedDays([]); setIsModalOpen(true); }}>
                  <Text>Create a routine</Text>
                </Button>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}><Ionicons name="flag" size={24} color="#0ea5e9" /></View>
            <Text style={styles.statValue}>{stats?.active || 0}</Text>
            <Text style={styles.statLabel}>Active Routines</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}><Ionicons name="checkmark-circle" size={24} color="#22c55e" /></View>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats?.completion_rate?.toFixed(0) || 0}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}><Ionicons name="refresh" size={24} color="#f59e0b" /></View>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats?.current_streak || 0} 🔥</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}><Ionicons name="flag" size={24} color="#8b5cf6" /></View>
            <Text style={styles.statValue}>{stats?.longest_streak || 0}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* All Routines */}
        <View style={styles.allRoutinesCard}>
          <View style={styles.allRoutinesHeader}>
            <Text style={styles.allRoutinesTitle}>All Routines</Text>
            <Text style={styles.allRoutinesSubtitle}>Manage your recurring routines</Text>
          </View>
          <View style={styles.allRoutinesContent}>
            {isLoading ? (
              <View style={styles.loadingSkeleton}>
                {[1, 2, 3, 4].map(i => <View key={i} style={styles.skeletonItem} />)}
              </View>
            ) : routines && routines.length > 0 ? (
              <View style={styles.routinesList}>
                {routines.map(routine => (
                  <TouchableOpacity key={routine.id} style={styles.routineItem} onPress={() => handleEdit(routine)} activeOpacity={0.8}>
                    <View style={styles.routineIcon}><Ionicons name="flag" size={24} color="#0ea5e9" /></View>
                    <View style={styles.routineContent}>
                      <View style={styles.routineHeader}>
                        <Text style={[styles.routineTitle, !routine.is_active && styles.routineTitleInactive]}>{routine.name}</Text>
                        <View style={[styles.statusBadge, routine.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                          <Text style={[styles.statusBadgeText, routine.is_active ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive]}>{routine.is_active ? 'Active' : 'Paused'}</Text>
                        </View>
                      </View>
                      <Text style={styles.routineDescription}>{routine.description || 'No description'}</Text>
                      <View style={styles.routineMeta}>
                        {routine.time_of_day && (
                          <View style={styles.routineMetaItem}>
                            <Ionicons name="time" size={12} color="#6b7280" />
                            <Text style={styles.routineMetaText}>{routine.time_of_day}</Text>
                          </View>
                        )}
                        <View style={[styles.frequencyBadge, { backgroundColor: '#f3f4f6' }]}>
                          <Text style={styles.frequencyBadgeText}>{routine.frequency.replace('_', ' ')}</Text>
                        </View>
                        {routine.frequency === 'custom' && routine.days_of_week.length > 0 && (
                          <View style={styles.routineMetaItem}>
                            <Ionicons name="calendar" size={12} color="#6b7280" />
                            <Text style={styles.routineMetaText}>{routine.days_of_week.map(d => daysOfWeek[d]).join(', ')}</Text>
                          </View>
                        )}
                        <View style={styles.streakBadge}>
                          <Ionicons name="refresh" size={12} color="#22c55e" />
                          <Text style={styles.streakBadgeText}>{routine.streak_count} day streak</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.routineActions}>
                      <TouchableOpacity
                        onPress={e => { e.stopPropagation(); toggleActive.mutate({ id: routine.id, is_active: !routine.is_active }); }}
                        style={styles.actionButton}
                      >
                        <Ionicons name={routine.is_active ? 'pause' : 'play'} size={20} color={routine.is_active ? '#f59e0b' : '#22c55e'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={e => { e.stopPropagation(); handleEdit(routine); }} style={styles.actionButton}>
                        <Ionicons name="create" size={20} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={e => { e.stopPropagation(); if (confirm('Delete this routine?')) deleteRoutine.mutate(routine.id); }} style={styles.actionButton}>
                        <Ionicons name="trash" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyAll}>
                <Ionicons name="flag-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyAllText}>No routines yet</Text>
                <Button onPress={() => { setEditingRoutine(null); reset(); setSelectedDays([]); setIsModalOpen(true); }}>
                  <Text>Create your first routine</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Routine Modal */}
      {isModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingRoutine ? 'Edit Routine' : 'New Routine'}</Text>
              <TouchableOpacity onPress={() => { setIsModalOpen(false); setEditingRoutine(null); setSelectedDays([]); reset(); }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Input label="Name" placeholder="Morning meditation" error={errors.name?.message} {...register('name')} required />
                <Input label="Description (optional)" placeholder="What does this routine involve?" {...register('description')} />
                <View style={styles.modalSelect}>
                  <Text style={styles.modalSelectLabel}>Frequency</Text>
                  <View style={styles.selectContainer}>
                    {frequencies.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.frequencyOption, frequency === opt.value && styles.frequencyOptionSelected]}
                        onPress={() => setValue('frequency', opt.value)}
                      >
                        <View style={styles.frequencyOptionContent}>
                          <Text style={[styles.frequencyOptionLabel, frequency === opt.value && styles.frequencyOptionLabelActive]}>{opt.label}</Text>
                          <Text style={[styles.frequencyOptionDesc, frequency === opt.value && styles.frequencyOptionDescActive]}>{opt.description}</Text>
                        </View>
                        {frequency === opt.value && <Ionicons name="checkmark" size={20} color="#0ea5e9" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.frequency && <Text style={styles.errorText}>{errors.frequency.message}</Text>}
                </View>
                {frequency === 'custom' && (
                  <View style={styles.daysContainer}>
                    <Text style={styles.daysLabel}>Days of Week</Text>
                    <View style={styles.daysGrid}>
                      {daysOfWeek.map((day, index) => (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayButton, selectedDays.includes(index) && styles.dayButtonSelected]}
                          onPress={() => handleDayToggle(index)}
                        >
                          <Text style={[styles.dayButtonText, selectedDays.includes(index) && styles.dayButtonTextSelected]}>{day}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <Input
                  label="Time of Day (optional)"
                  type="time"
                  error={errors.time_of_day?.message}
                  {...register('time_of_day')}
                />
                <View style={styles.modalActions}>
                  <Button variant="outline" style={styles.modalActionButton} onPress={() => { setIsModalOpen(false); setEditingRoutine(null); setSelectedDays([]); reset(); }}>
                    <Text>Cancel</Text>
                  </Button>
                  <Button style={styles.modalActionButton} loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
                    <Text>{editingRoutine ? 'Save Changes' : 'Create Routine'}</Text>
                  </Button>
                </View>
              </form>
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 24,
  },
  headerLeft: {
    flex: 1,
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
  todayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  todayHeader: {
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  todaySubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  todayContent: {},
  todayList: {
    gap: 12,
  },
  todayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  todayItemContent: {
    flex: 1,
    minWidth: 0,
  },
  todayItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  todayItemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  todayItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  todayItemMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayItemMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  frequencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  frequencyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
  },
  editButton: {
    padding: 8,
  },
  emptyToday: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTodayText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  allRoutinesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  allRoutinesHeader: {
    marginBottom: 16,
  },
  allRoutinesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  allRoutinesSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  allRoutinesContent: {},
  loadingSkeleton: {
    gap: 12,
  },
  skeletonItem: {
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  routinesList: {
    gap: 12,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  routineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  routineContent: {
    flex: 1,
    minWidth: 0,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  routineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  routineTitleInactive: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeInactive: {
    backgroundColor: '#f3f4f6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: '#22c55e',
  },
  statusBadgeTextInactive: {
    color: '#9ca3af',
  },
  routineDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  routineMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routineMetaText: {
    fontSize: 11,
    color: '#6b7280',
  },
  routineActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    padding: 8,
  },
  emptyAll: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyAllText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
    maxHeight: '90%',
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
  modalSelect: {
    gap: 8,
  },
  modalSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectContainer: {
    gap: 8,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  frequencyOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#0ea5e9',
  },
  frequencyOptionContent: {
    flex: 1,
  },
  frequencyOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  frequencyOptionLabelActive: {
    color: '#0ea5e9',
  },
  frequencyOptionDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  frequencyOptionDescActive: {
    color: '#0ea5e9',
  },
  daysContainer: {
    gap: 8,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#0ea5e9',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
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