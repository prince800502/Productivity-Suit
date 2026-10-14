'use client';

import { useState, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, TrendingUp, Filter, Download, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Select, Badge, Tabs
} from '@productivity-suite/ui';
import { useExpenses, useCategoryTotals, useMonthlyBudget, useTasks, useTaskStats, usePomodoroStats, useRoutineStats } from '@productivity-suite/core';
import { saveAs } from 'file-saver';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const { data: expenses } = useExpenses({ startDate, endDate });
  const { data: categoryTotals } = useCategoryTotals(startDate, endDate);
  const { data: monthlyBudget } = useMonthlyBudget(format(new Date(), 'yyyy-MM'));
  const { data: taskStats } = useTaskStats();
  const { data: pomodoroStats } = usePomodoroStats();
  const { data: routineStats } = useRoutineStats();

  // Prepare chart data
  const dailyExpenses = expenses?.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) acc[date] = { date, total: 0, categories: {} };
    acc[date].total += expense.amount;
    acc[date].categories[expense.category] = (acc[date].categories[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, { date: string; total: number; categories: Record<string, number> }>) || {};

  const dailyData = Object.values(dailyExpenses).sort((a, b) => a.date.localeCompare(b.date));

  const categoryData = Object.entries(categoryTotals || {}).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[index % COLORS.length],
  }));

  const taskStatusData = [
    { name: 'Completed', value: taskStats?.completed || 0, color: '#22c55e' },
    { name: 'In Progress', value: taskStats?.in_progress || 0, color: '#3b82f6' },
    { name: 'To Do', value: (taskStats?.total || 0) - (taskStats?.completed || 0) - (taskStats?.in_progress || 0), color: '#94a3b8' },
    { name: 'Overdue', value: taskStats?.overdue || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const pomodoroTypeData = [
    { name: 'Focus', value: pomodoroStats?.by_type?.focus || 0, color: '#0ea5e9' },
    { name: 'Short Break', value: pomodoroStats?.by_type?.short_break || 0, color: '#22c55e' },
    { name: 'Long Break', value: pomodoroStats?.by_type?.long_break || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Weekly comparison calculations
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });

    const thisWeekStartStr = format(thisWeekStart, 'yyyy-MM-dd');
    const thisWeekEndStr = format(thisWeekEnd, 'yyyy-MM-dd');
    const lastWeekStartStr = format(lastWeekStart, 'yyyy-MM-dd');
    const lastWeekEndStr = format(lastWeekEnd, 'yyyy-MM-dd');

    // This week expenses
    const thisWeekExpenses = expenses?.filter(e => e.date >= thisWeekStartStr && e.date <= thisWeekEndStr) || [];
    const lastWeekExpenses = expenses?.filter(e => e.date >= lastWeekStartStr && e.date <= lastWeekEndStr) || [];

    const thisWeekExpenseTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastWeekExpenseTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate percentage change for expenses
    const expenseChange = lastWeekExpenseTotal > 0 
      ? ((thisWeekExpenseTotal - lastWeekExpenseTotal) / lastWeekExpenseTotal) * 100
      : (thisWeekExpenseTotal > 0 ? 100 : 0);

    // For tasks and pomodoro, we need to use the stats which are already computed
    // Since we don't have weekly breakdown in the current stats, we'll compute from available data
    // For now, we'll use the total stats and note that weekly breakdown needs backend support
    // We'll show a placeholder with a note that this is a simplified calculation
    
    // This is a simplified calculation - in a real app, you'd query weekly stats from the backend
    // For now, we'll compute based on the available data
    const thisWeekTasks = 0; // Would need task completion dates
    const lastWeekTasks = 0;
    const taskChange = 0;

    const thisWeekFocus = 0; // Would need pomodoro session dates
    const lastWeekFocus = 0;
    const focusChange = 0;

    return {
      expenseChange,
      taskChange,
      focusChange,
      thisWeekExpenseTotal,
      lastWeekExpenseTotal,
    };
  }, [expenses]);

  const handleExport = () => {
    if (!expenses || expenses.length === 0) return;
    
    const headers = ['Date', 'Category', 'Description', 'Amount'];
    const rows = expenses.map(e => [
      e.date,
      e.category,
      e.description || '',
      e.amount.toString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Insights into your productivity and spending</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            options={[
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: 'quarter', label: 'Last 90 Days' },
              { value: 'year', label: 'Last Year' },
            ]}
            className="w-40"
          />
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Expenses</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                ${expenses?.reduce((sum, e) => sum + e.amount, 0).toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Tasks Completed</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">{taskStats?.completed || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Focus Time</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{pomodoroStats?.total_focus_minutes || 0}m</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Routine Streak</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">{routineStats?.current_streak || 0} 🔥</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Spending</CardTitle>
            <CardDescription>Your daily expenses over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                  <XAxis dataKey="date" tickFormatter={date => format(new Date(date), 'MMM d')} className="text-neutral-500 dark:text-neutral-400" />
                  <YAxis className="text-neutral-500 dark:text-neutral-400" tickFormatter={val => `$${val}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>How your money is distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Status */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Distribution of your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Tasks']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Types */}
        <Card>
          <CardHeader>
            <CardTitle>Pomodoro Sessions</CardTitle>
            <CardDescription>Breakdown by session type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pomodoroTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                  <XAxis type="number" className="text-neutral-500 dark:text-neutral-400" />
                  <YAxis dataKey="name" type="category" className="text-neutral-500 dark:text-neutral-400" width={80} />
                  <Tooltip formatter={(value: number) => [value, 'Sessions']} />
                  <Bar dataKey="value">
                    {pomodoroTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Comparison</CardTitle>
          <CardDescription>This week vs last week (Mon-Sun)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-success-50 dark:bg-success-900/20">
              <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                {weeklyComparison.expenseChange >= 0 ? '+' : ''}{weeklyComparison.expenseChange.toFixed(1)}%
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Spending</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                This week: ${weeklyComparison.thisWeekExpenseTotal.toFixed(2)} | Last week: ${weeklyComparison.lastWeekExpenseTotal.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {weeklyComparison.taskChange >= 0 ? '+' : ''}{weeklyComparison.taskChange.toFixed(1)}%
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Tasks Completed</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Weekly task comparison requires completion date tracking
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20">
              <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">
                {weeklyComparison.focusChange >= 0 ? '+' : ''}{weeklyComparison.focusChange.toFixed(1)}%
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Focus Time</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Weekly focus comparison requires session date tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}