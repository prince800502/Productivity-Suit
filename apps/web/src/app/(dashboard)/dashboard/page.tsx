'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  Wallet, TrendingUp, TrendingDown, Target, Timer, 
  Calendar, CheckCircle, AlertCircle, Plus, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, CreditCard, PiggyBank,
  Search, Zap, Flame, Target as TargetIcon, BarChart3, Waves
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Progress, Avatar, AvatarGroup, Tabs
} from '@productivity-suite/ui';
import { cn } from '@productivity-suite/ui';
import { useAuth } from '@productivity-suite/core';
import { 
  useExpenses, useDailySpending, useWeeklySpending, useMonthlyBudget,
  useTasks, useTodayTasks, useOverdueTasks, useTaskStats, useToggleTaskStatus,
  usePomodoroSessions, useTodayPomodoro, usePomodoroStats,
  useRoutines, useTodayRoutines, useRoutineStats,
  useScheduleEvents, useTodaySchedule,
  useCompleteRoutine
} from '@productivity-suite/core';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard = ({ title, value, change, changeLabel, icon: Icon, trend, variant = 'default' }: StatCardProps) => {
  const variantClasses = {
    default: 'glass-card hover-lift',
    primary: 'glass-card hover-lift border-primary-200/50 dark:border-primary-800/50',
    success: 'glass-card hover-lift border-success-200/50 dark:border-success-800/50',
    warning: 'glass-card hover-lift border-warning-200/50 dark:border-warning-800/50',
    danger: 'glass-card hover-lift border-danger-200/50 dark:border-danger-800/50',
  };

  const iconBg = {
    default: 'bg-gradient-to-br from-primary-500/30 to-primary-600/40 dark:from-primary-500/40 dark:to-primary-600/50',
    primary: 'bg-gradient-to-br from-primary-500/30 to-primary-600/40 dark:from-primary-500/40 dark:to-primary-600/50',
    success: 'bg-gradient-to-br from-success-500/30 to-success-600/40 dark:from-success-500/40 dark:to-success-600/50',
    warning: 'bg-gradient-to-br from-warning-500/30 to-warning-600/40 dark:from-warning-500/40 dark:to-warning-600/50',
    danger: 'bg-gradient-to-br from-danger-500/30 to-danger-600/40 dark:from-danger-500/40 dark:to-danger-600/50',
  };

  const iconColor = {
    default: 'text-primary-500 dark:text-primary-400',
    primary: 'text-primary-500 dark:text-primary-400',
    success: 'text-success-500 dark:text-success-400',
    warning: 'text-warning-500 dark:text-warning-400',
    danger: 'text-danger-500 dark:text-danger-400',
  };

  const valueGradientClass = {
    default: 'text-gradient-stat-default',
    primary: 'text-gradient-stat-primary',
    success: 'text-gradient-stat-success',
    warning: 'text-gradient-stat-warning',
    danger: 'text-gradient-stat-danger',
  };

  return (
    <Card variant="default" padding="md" glass={true} className={cn(variantClasses[variant], 'hover-lift', 'relative', 'overflow-hidden', 'glass-dashboard')}>
      <div className="absolute inset-0 bg-gradient-to-br opacity-5" style={{ background: `linear-gradient(135deg, ${variant === 'primary' ? 'rgba(117, 103, 255, 0.08)' : variant === 'success' ? 'rgba(16, 185, 129, 0.08)' : variant === 'warning' ? 'rgba(245, 158, 11, 0.08)' : variant === 'danger' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(117, 103, 255, 0.08)'}, transparent)` }} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">{title}</p>
          <p className={cn('mt-1 text-2xl font-bold truncate text-transparent', valueGradientClass[variant])}>{value}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg', iconBg[variant])}>
          <Icon className={cn('w-6 h-6', iconColor[variant])} />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 relative z-10">
          <span className={cn('text-sm font-medium', trend === 'up' ? 'text-success-500 dark:text-success-400' : trend === 'down' ? 'text-danger-500 dark:text-danger-400' : 'text-neutral-500 dark:text-neutral-400')}>
            {trend === 'up' && <ArrowUpRight className="w-4 h-4 mr-0.5" />}
            {trend === 'down' && <ArrowDownRight className="w-4 h-4 rotate-180 mr-0.5" />}
            {Math.abs(change)}%
          </span>
          {changeLabel && <span className="text-sm text-neutral-500 dark:text-neutral-400">{changeLabel}</span>}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${variant === 'primary' ? 'rgba(117, 103, 255, 0.3)' : variant === 'success' ? 'rgba(16, 185, 129, 0.3)' : variant === 'warning' ? 'rgba(245, 158, 11, 0.3)' : variant === 'danger' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(117, 103, 255, 0.3)'}, transparent)` }} />
    </Card>
  );
};

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [weekStart] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get user's display name
  const getDisplayName = () => {
    if (profile?.full_name?.trim()) return profile.full_name.trim();
    if (user?.user_metadata?.full_name?.trim()) return user.user_metadata.full_name.trim();
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  const displayName = getDisplayName();
  const timeOfDay = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';

  // Fetch data
  const { data: expenses, isLoading: expensesLoading } = useExpenses({ limit: 5 });
  const { data: dailySpending } = useDailySpending(today);
  const { data: weeklySpending } = useWeeklySpending(weekStart);
  const { data: monthlyBudget } = useMonthlyBudget(format(new Date(), 'yyyy-MM'));

  const { data: tasks, isLoading: tasksLoading } = useTodayTasks();
  const { data: overdueTasks } = useOverdueTasks();
  const { data: taskStats } = useTaskStats();
  const toggleStatus = useToggleTaskStatus();

  const { data: pomodoroSessions } = useTodayPomodoro();
  const { data: pomodoroStats } = usePomodoroStats();

  const { data: routines, isLoading: routinesLoading } = useTodayRoutines();
  const { data: routineStats } = useRoutineStats();
  const completeRoutine = useCompleteRoutine();

  const { data: todaySchedule } = useTodaySchedule();

  // Completed tasks today
  const completedToday = tasks?.filter(t => t.status === 'done').length || 0;
  const totalToday = tasks?.length || 0;

  // Focus minutes today
  const focusMinutesToday = pomodoroSessions
    ?.filter(s => s.type === 'focus' && s.status === 'completed')
    .reduce((sum, s) => sum + s.completed_minutes, 0) || 0;

  // Completed routines today
  const completedRoutines = routines?.filter(r => r.streak_count > 0).length || 0;
  const totalRoutines = routines?.length || 0;

  if (expensesLoading || tasksLoading || routinesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="glass-card h-24 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card h-64 animate-pulse" />
          <div className="glass-card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 page-enter">
      {/* Header - compact */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Waves className="text-2xl" aria-hidden="true" />
            Good {timeOfDay}, {displayName}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Here's what's happening today, {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Calendar className="w-4 h-4" />}>
            Today
          </Button>
          <Button variant="glass" size="sm" icon={<Plus className="w-4 h-4" />} className="press-scale">
            Quick Add
          </Button>
        </div>
      </div>

      {/* Key Stats - Staggered entrance */}
      <div className="stagger-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Spending"
          value={`${dailySpending?.total?.toFixed(2) || '0.00'}`}
          change={12}
          changeLabel="vs yesterday"
          trend="down"
          icon={CreditCard}
        />
        <StatCard
          title="Monthly Budget"
          value={`${monthlyBudget?.spent?.toFixed(2) || '0'} / ${monthlyBudget?.budget?.toFixed(2) || '0'}`}
          change={monthlyBudget?.percentage ? 100 - monthlyBudget.percentage : 0}
          changeLabel="remaining"
          trend={monthlyBudget && monthlyBudget.percentage > 80 ? 'up' : 'down'}
          icon={PiggyBank}
        />
        <StatCard
          title="Tasks Completed"
          value={`${completedToday} / ${totalToday}`}
          change={taskStats?.completion_rate ? Math.round(taskStats.completion_rate) : 0}
          changeLabel="completion rate"
          trend="up"
          icon={CheckCircle}
        />
        <StatCard
          title="Focus Time"
          value={`${focusMinutesToday}m`}
          change={pomodoroStats?.total_focus_minutes ? Math.round(pomodoroStats.total_focus_minutes / 60) : 0}
          changeLabel="total hours this week"
          trend="up"
          icon={Timer}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Tasks & Routines */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today's Tasks */}
          <Card variant="default" padding="md" glass={true} className="glass-dashboard-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>{tasks?.length || 0} tasks • {overdueTasks?.length || 0} overdue</CardDescription>
              </div>
              <Link href="/tasks" className="btn-ghost btn-sm">
                View All
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-xl glass-dashboard-subtle transition-all duration-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleStatus.mutate({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' })}
                        aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {task.status === 'done' ? (
                          <CheckCircle className="w-4 h-4 text-success-500" />
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-neutral-300 dark:border-neutral-600" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Due {format(new Date(task.due_date), 'h:mm a')}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'primary' : 'default'}
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                  {tasks.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/tasks">View all {tasks.length} tasks</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400">No tasks for today</p>
                  <Button size="sm" className="mt-3" asChild>
                    <Link href="/tasks">Add your first task</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Routines */}
          <Card variant="default" padding="md" glass={true} className="glass-dashboard-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Daily Routines</CardTitle>
                <CardDescription>{completedRoutines} of {totalRoutines} completed</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/routines">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {routines && routines.length > 0 ? (
                <div className="space-y-2">
                  {routines.map(routine => (
                    <div
                      key={routine.id}
                      className="flex items-center gap-3 p-3 rounded-xl glass-dashboard-subtle transition-all duration-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-100/50 dark:bg-primary-900/30 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${routine.streak_count > 0 ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                          {routine.name}
                        </p>
                        {routine.time_of_day && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{routine.time_of_day}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => completeRoutine.mutate(routine.id)}
                        disabled={routine.streak_count > 0}
                        aria-label={routine.streak_count > 0 ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {routine.streak_count > 0 ? (
                          <CheckCircle className="w-4 h-4 text-success-500" />
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-neutral-300 dark:border-neutral-600" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400">No routines scheduled for today</p>
                  <Button size="sm" className="mt-3" asChild>
                    <Link href="/routines">Create a routine</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card variant="default" padding="md" glass={true} className="glass-dashboard-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  {todaySchedule?.events.length || 0} events • {todaySchedule?.is_holiday ? `Holiday: ${todaySchedule.holiday_name}` : format(new Date(), 'EEEE, MMMM d')}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/schedule">View Week</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {todaySchedule?.events && todaySchedule.events.length > 0 ? (
                <div className="space-y-2">
                  {todaySchedule.events.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-xl glass-dashboard-subtle transition-all duration-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
                    >
                      <div
                        className="w-2 h-12 rounded-l-lg"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{event.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                      <Badge variant="outline" size="sm" className="capitalize">{event.event_type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400">
                    {todaySchedule?.is_holiday ? `Enjoy your holiday: ${todaySchedule.holiday_name}!` : 'No events scheduled for today'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card variant="default" padding="md" glass={true} className="glass-dashboard-hover hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks you can do right now</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="stagger-container grid grid-cols-2 gap-2">
                <Link href="/expenses/new">
                  <div className="glass-card-hover p-4 rounded-xl flex flex-col items-center justify-center gap-2 h-20 transition-all duration-300 group hover-lift press-scale">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-500/30 to-secondary-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Wallet className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white text-center">Add Expense</span>
                  </div>
                </Link>
                <Link href="/tasks/new">
                  <div className="glass-card-hover p-4 rounded-xl flex flex-col items-center justify-center gap-2 h-20 transition-all duration-300 group hover-lift press-scale">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 to-primary-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Plus className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white text-center">New Task</span>
                  </div>
                </Link>
                <Link href="/pomodoro">
                  <div className="glass-card-hover p-4 rounded-xl flex flex-col items-center justify-center gap-2 h-20 transition-all duration-300 group hover-lift press-scale">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500/30 to-warning-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Timer className="w-5 h-5 text-warning-500 dark:text-warning-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white text-center">Start Focus</span>
                  </div>
                </Link>
                <Link href="/routines/new">
                  <div className="glass-card-hover p-4 rounded-xl flex flex-col items-center justify-center gap-2 h-20 transition-all duration-300 group hover-lift press-scale">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tertiary-500/30 to-tertiary-600/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <TargetIcon className="w-5 h-5 text-tertiary-500 dark:text-tertiary-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white text-center">Add Routine</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Spending Chart */}
          <Card variant="default" padding="md" glass={true} className="glass-dashboard-hover">
            <CardHeader className="pb-3">
              <CardTitle>Weekly Spending</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-40 flex items-end justify-between gap-1.5">
                {weeklySpending?.daily.map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t transition-all hover:from-primary-400 hover:to-primary-300"
                      style={{
                        height: `${weeklySpending.total > 0 ? (day.total / weeklySpending.total) * 100 : 0}%`,
                        minHeight: '4px',
                      }}
                    />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {format(new Date(day.date), 'EEE')}
                    </span>
                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      ${day.total.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pomodoro Stats */}
          <Card variant="default" padding="md" glass={true} className="glass-dashboard-hover">
            <CardHeader className="pb-3">
              <CardTitle>Focus Stats</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-primary-50/50 dark:bg-primary-900/20 glass-subtle">
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {pomodoroStats?.total_focus_minutes || 0}m
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Focus Time</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-success-50/50 dark:bg-success-900/20 glass-subtle">
                  <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                    {pomodoroStats?.streak_days || 0}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Day Streak</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-warning-50/50 dark:bg-warning-900/20 glass-subtle">
                  <p className="text-2xl font-bold text-warning-700 dark:text-warning-300">
                    {pomodoroStats?.total_sessions || 0}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Sessions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary-50/50 dark:bg-secondary-900/20 glass-subtle">
                  <p className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
                    {pomodoroStats?.average_session_length || 0}m
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Session</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Routine Streak */}
          <Card variant="default" padding="md" glass={true} className="glass-dashboard-hover">
            <CardHeader className="pb-3">
              <CardTitle>Routine Streaks</CardTitle>
              <CardDescription>Keep the momentum going</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Current Streak</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Days in a row</p>
                </div>
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {routineStats?.current_streak || 0} 🔥
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Longest Streak</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Personal best</p>
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {routineStats?.longest_streak || 0}
                </div>
              </div>
              <Progress value={routineStats?.completion_rate || 0} showLabel label="This week's completion rate" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}