'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  Wallet, TrendingUp, TrendingDown, Target, Timer, 
  Calendar, CheckCircle, AlertCircle, Plus, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, CreditCard, PiggyBank
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Progress, Avatar, AvatarGroup, Tabs
} from '@productivity-suite/ui';
import { 
  useExpenses, useDailySpending, useWeeklySpending, useMonthlyBudget,
  useTasks, useTodayTasks, useOverdueTasks, useTaskStats,
  usePomodoroSessions, useTodayPomodoro, usePomodoroStats,
  useRoutines, useTodayRoutines, useRoutineStats,
  useScheduleEvents, useTodaySchedule,
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

const StatCard = ({ title, value, change, changeLabel, icon: Icon, trend, variant = 'default' }: StatCardProps) => (
  <Card variant="default" padding="md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
        <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
    </div>
    {change !== undefined && (
      <div className="mt-3 flex items-center gap-1">
        <span className={trend === 'up' ? 'text-success-600 dark:text-success-400' : trend === 'down' ? 'text-danger-600 dark:text-danger-400' : 'text-neutral-500 dark:text-neutral-400'}>
          {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
          {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(change)}%
        </span>
        {changeLabel && (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{changeLabel}</span>
        )}
      </div>
    )}
  </Card>
);

export default function DashboardPage() {
  const [weekStart] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch data
  const { data: expenses, isLoading: expensesLoading } = useExpenses({ limit: 5 });
  const { data: dailySpending } = useDailySpending(today);
  const { data: weeklySpending } = useWeeklySpending(weekStart);
  const { data: monthlyBudget } = useMonthlyBudget(format(new Date(), 'yyyy-MM'));

  const { data: tasks, isLoading: tasksLoading } = useTodayTasks();
  const { data: overdueTasks } = useOverdueTasks();
  const { data: taskStats } = useTaskStats();

  const { data: pomodoroSessions } = useTodayPomodoro();
  const { data: pomodoroStats } = usePomodoroStats();

  const { data: routines, isLoading: routinesLoading } = useTodayRoutines();
  const { data: routineStats } = useRoutineStats();

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
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-64 animate-pulse" />
          <div className="card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Here's what's happening today, {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Calendar className="w-4 h-4" />}>
            Today
          </Button>
          <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>
            Quick Add
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks & Routines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>{tasks?.length || 0} tasks • {overdueTasks?.length || 0} overdue</CardDescription>
              </div>
              <Link href="/tasks" className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] px-3 py-1.5 text-sm gap-1.5 bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-400 dark:text-neutral-300 dark:hover:bg-neutral-800">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {}}
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Routines</CardTitle>
                <CardDescription>{completedRoutines} of {totalRoutines} completed</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/routines">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {routines && routines.length > 0 ? (
                <div className="space-y-3">
                  {routines.map(routine => (
                    <div
                      key={routine.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
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
                        onClick={() => {}}
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  {todaySchedule?.events.length || 0} events • {todaySchedule?.is_holiday ? `Holiday: ${todaySchedule.holiday_name}` : 'Regular day'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/schedule">View Week</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {todaySchedule?.events && todaySchedule.events.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.events.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
                      <Badge
                        variant="outline"
                        size="sm"
                        className="capitalize"
                      >
                        {event.event_type}
                      </Badge>
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
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you can do right now</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link href="/expenses/new">
                    <Wallet className="w-6 h-6" />
                    <span className="text-sm">Add Expense</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link href="/tasks/new">
                    <Plus className="w-6 h-6" />
                    <span className="text-sm">New Task</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link href="/pomodoro">
                    <Timer className="w-6 h-6" />
                    <span className="text-sm">Start Focus</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link href="/routines/new">
                    <Target className="w-6 h-6" />
                    <span className="text-sm">Add Routine</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Spending Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Spending</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2">
                {weeklySpending?.daily.map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-400"
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
          <Card>
            <CardHeader>
              <CardTitle>Focus Stats</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {pomodoroStats?.total_focus_minutes || 0}m
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Focus Time</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-success-50 dark:bg-success-900/30">
                  <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                    {pomodoroStats?.streak_days || 0}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Day Streak</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/30">
                  <p className="text-2xl font-bold text-warning-700 dark:text-warning-300">
                    {pomodoroStats?.total_sessions || 0}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Sessions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/30">
                  <p className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
                    {pomodoroStats?.average_session_length || 0}m
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Session</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Routine Streak */}
          <Card>
            <CardHeader>
              <CardTitle>Routine Streaks</CardTitle>
              <CardDescription>Keep the momentum going</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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