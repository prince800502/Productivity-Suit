import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { useExpenses, useDailySpending, useWeeklySpending, useMonthlyBudget } from '@productivity-suite/core';
import { useTasks, useTodayTasks, useOverdueTasks, useTaskStats } from '@productivity-suite/core';
import { usePomodoroSessions, useTodayPomodoro, usePomodoroStats } from '@productivity-suite/core';
import { useRoutines, useTodayRoutines, useRoutineStats } from '@productivity-suite/core';
import { useScheduleEvents, useTodaySchedule } from '@productivity-suite/core';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const [weekStart] = useState(() => format(new Date(), 'yyyy-MM-dd', { weekStartsOn: 1 }));
  const today = format(new Date(), 'yyyy-MM-dd');
  const [refreshing, setRefreshing] = useState(false);

  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses({ limit: 5 });
  const { data: dailySpending } = useDailySpending(today);
  const { data: weeklySpending } = useWeeklySpending(weekStart);
  const { data: monthlyBudget } = useMonthlyBudget(format(new Date(), 'yyyy-MM'));

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useTodayTasks();
  const { data: overdueTasks } = useOverdueTasks();
  const { data: taskStats } = useTaskStats();

  const { data: pomodoroSessions } = useTodayPomodoro();
  const { data: pomodoroStats } = usePomodoroStats();

  const { data: routines, isLoading: routinesLoading, refetch: refetchRoutines } = useTodayRoutines();
  const { data: routineStats } = useRoutineStats();

  const { data: todaySchedule } = useTodaySchedule();

  const loading = expensesLoading || tasksLoading || routinesLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchExpenses(),
      refetchTasks(),
      refetchRoutines(),
    ]);
    setRefreshing(false);
  };

  const completedToday = tasks?.filter(t => t.status === 'done').length || 0;
  const totalToday = tasks?.length || 0;

  const focusMinutesToday = pomodoroSessions
    ?.filter(s => s.type === 'focus' && s.status === 'completed')
    .reduce((sum, s) => sum + s.completed_minutes, 0) || 0;

  const completedRoutines = routines?.filter(r => r.streak_count > 0).length || 0;
  const totalRoutines = routines?.length || 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
      }
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
          </Text>
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Button variant="ghost" size="sm" onPress={() => router.push('/pomodoro')}>
            <Text>Focus</Text>
          </Button>
          <Button variant="outline" size="sm" onPress={() => router.push('/tasks')}>
            <Text>+ Quick Add</Text>
          </Button>
        </View>
      </View>

      {/* Key Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View>
              <Text style={styles.statLabel}>Today's Spending</Text>
              <Text style={styles.statValue}>${dailySpending?.total?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.statIconContainer}>
              <Ionicons name="card" size={24} color="#0ea5e9" />
            </View>
          </View>
          <View style={styles.statChange}>
            <Ionicons name="trending-down" size={14} color="#22c55e" />
            <Text style={styles.statChangeText}>12% vs yesterday</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View>
              <Text style={styles.statLabel}>Monthly Budget</Text>
              <Text style={styles.statValue}>
                ${monthlyBudget?.spent?.toFixed(2) || '0'} / ${monthlyBudget?.budget?.toFixed(2) || '0'}
              </Text>
            </View>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash" size={24} color="#0ea5e9" />
            </View>
          </View>
          <View style={styles.statChange}>
            {(monthlyBudget && monthlyBudget.percentage > 80 ? (
              <>
                <Ionicons name="trending-up" size={14} color="#ef4444" />
                <Text style={[styles.statChangeText, { color: '#ef4444' }]}>{monthlyBudget.percentage.toFixed(0)}% used</Text>
              </>
            ) : (
              <>
                <Ionicons name="trending-down" size={14} color="#22c55e" />
                <Text style={[styles.statChangeText, { color: '#22c55e' }]}>{100 - (monthlyBudget?.percentage || 0)}% remaining</Text>
              </>
            ))}
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View>
              <Text style={styles.statLabel}>Tasks Completed</Text>
              <Text style={styles.statValue}>{completedToday} / {totalToday}</Text>
            </View>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            </View>
          </View>
          <View style={styles.statChange}>
            <Ionicons name="trending-up" size={14} color="#22c55e" />
            <Text style={styles.statChangeText}>{taskStats?.completion_rate ? Math.round(taskStats.completion_rate) : 0}% completion rate</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardContent}>
            <View>
              <Text style={styles.statLabel}>Focus Time</Text>
              <Text style={styles.statValue}>{focusMinutesToday}m</Text>
            </View>
            <View style={styles.statIconContainer}>
              <Ionicons name="timer" size={24} color="#f59e0b" />
            </View>
          </View>
          <View style={styles.statChange}>
            <Ionicons name="trending-up" size={14} color="#f59e0b" />
            <Text style={styles.statChangeText}>{pomodoroStats?.total_focus_minutes ? Math.round(pomodoroStats.total_focus_minutes / 60) : 0}h this week</Text>
          </View>
        </View>
      </View>

      {/* Main Content Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <Button variant="ghost" size="sm" onPress={() => router.push('/tasks')}>
            <Text>View All</Text>
          </Button>
        </View>

        {tasks && tasks.length > 0 ? (
          <View style={styles.list}>
            {tasks.slice(0, 5).map(task => (
              <TouchableOpacity key={task.id} style={styles.listItem} onPress={() => router.push('/tasks')}>
                <View style={[
                  styles.taskCheckbox,
                  task.status === 'done' && styles.checkboxChecked,
                ]}>
                  {task.status === 'done' && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <View style={styles.taskContent}>
                  <Text style={[
                    styles.taskTitle,
                    task.status === 'done' && styles.taskCompleted,
                  ]}>
                    {task.title}
                  </Text>
                  {task.due_date && (
                    <Text style={styles.taskDue}>
                      Due {format(new Date(task.due_date), 'h:mm a')}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.priorityBadge,
                  task.priority === 'urgent' && styles.priorityDanger,
                  task.priority === 'high' && styles.priorityWarning,
                  task.priority === 'medium' && styles.priorityPrimary,
                  task.priority === 'low' && styles.priorityDefault,
                ]}>
                  <Text style={styles.priorityBadgeText}>{task.priority}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {tasks.length > 5 && (
              <Button variant="ghost" size="sm" style={styles.viewAllButton} onPress={() => router.push('/tasks')}>
                <Text>View all {tasks.length} tasks</Text>
              </Button>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No tasks for today</Text>
            <Button size="sm" style={styles.emptyButton} onPress={() => router.push('/tasks')}>
              <Text>Add your first task</Text>
            </Button>
          </View>
        )}
      </View>

      {/* Today's Routines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Routines</Text>
          <Button variant="ghost" size="sm" onPress={() => router.push('/routines')}>
            <Text>View All</Text>
          </Button>
        </View>

        {routines && routines.length > 0 ? (
          <View style={styles.list}>
            {routines.map(routine => (
              <TouchableOpacity key={routine.id} style={styles.listItem} onPress={() => router.push('/routines')}>
                <View style={styles.routineIcon}>
                  <Ionicons name="flag" size={24} color="#0ea5e9" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={[
                    styles.taskTitle,
                    routine.streak_count > 0 && styles.taskCompleted,
                  ]}>
                    {routine.name}
                  </Text>
                  {routine.time_of_day && (
                    <Text style={styles.taskDue}>{routine.time_of_day}</Text>
                  )}
                </View>
                <View style={styles.routineStreak}>
                  {routine.streak_count > 0 && (
                    <Text style={styles.streakText}>
                      🔥 {routine.streak_count}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No routines scheduled for today</Text>
            <Button size="sm" style={styles.emptyButton} onPress={() => router.push('/routines')}>
              <Text>Create a routine</Text>
            </Button>
          </View>
        )}
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Button variant="ghost" size="sm" onPress={() => router.push('/schedule')}>
            <Text>View Week</Text>
          </Button>
        </View>

        {todaySchedule?.events && todaySchedule.events.length > 0 ? (
          <View style={styles.list}>
            {todaySchedule.events.map(event => (
              <TouchableOpacity key={event.id} style={styles.listItem} onPress={() => router.push('/schedule')}>
                <View
                  style={[
                    styles.scheduleColorBar,
                    { backgroundColor: event.color },
                  ]}
                />
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{event.title}</Text>
                  <Text style={styles.taskDue}>
                    {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                    {event.location && ` • ${event.location}`}
                  </Text>
                </View>
                <View style={styles.priorityBadgeOutline}>
                  <Text style={styles.priorityBadgeTextOutline}>{event.event_type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {todaySchedule?.is_holiday
                ? `Enjoy your holiday: ${todaySchedule.holiday_name}!`
                : 'No events scheduled for today'}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          <Button variant="outline" style={styles.quickActionButton} onPress={() => router.push('/expenses')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="card" size={28} color="#0ea5e9" />
            </View>
            <Text style={styles.quickActionLabel}>Add Expense</Text>
          </Button>
          <Button variant="outline" style={styles.quickActionButton} onPress={() => router.push('/tasks')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="add-circle" size={28} color="#22c55e" />
            </View>
            <Text style={styles.quickActionLabel}>New Task</Text>
          </Button>
          <Button variant="outline" style={styles.quickActionButton} onPress={() => router.push('/pomodoro')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="timer" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.quickActionLabel}>Start Focus</Text>
          </Button>
          <Button variant="outline" style={styles.quickActionButton} onPress={() => router.push('/routines')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="flag" size={28} color="#8b5cf6" />
            </View>
            <Text style={styles.quickActionLabel}>Add Routine</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  taskCheckbox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
  },
  checkboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDue: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  routineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineStreak: {
    alignItems: 'flex-end',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  scheduleColorBar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityDanger: {
    backgroundColor: '#fef2f2',
  },
  priorityWarning: {
    backgroundColor: '#fffbeb',
  },
  priorityPrimary: {
    backgroundColor: '#eff6ff',
  },
  priorityDefault: {
    backgroundColor: '#f3f4f6',
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  priorityBadgeOutline: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  priorityBadgeTextOutline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  viewAllButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});