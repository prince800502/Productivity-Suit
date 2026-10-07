import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { format, subDays } from 'date-fns';
import { useExpenses, useCategoryTotals, useMonthlyBudget, useTasks, useTaskStats, usePomodoroStats, useRoutineStats, useExpenses as useAllExpenses } from '@productivity-suite/core';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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

async function shareData(content: string, filename: string, mimeType: string) {
  try {
    await Share.share({
      title: `Export ${filename}`,
      message: content,
      url: `data:${mimeType};base64,${btoa(content)}`,
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to share file');
  }
}

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const { data: expenses } = useExpenses({ startDate, endDate });
  const { data: categoryTotals } = useCategoryTotals(startDate, endDate);
  const { data: monthlyBudget } = useMonthlyBudget(format(new Date(), 'yyyy-MM'));
  const { data: taskStats } = useTaskStats();
  const { data: pomodoroStats } = usePomodoroStats();
  const { data: routineStats } = useRoutineStats();

  useEffect(() => {
    const now = new Date();
    let daysBack = 30;
    switch (period) {
      case 'week': daysBack = 7; break;
      case 'month': daysBack = 30; break;
      case 'quarter': daysBack = 90; break;
      case 'year': daysBack = 365; break;
    }
    setStartDate(format(subDays(now, daysBack), 'yyyy-MM-dd'));
    setEndDate(format(now, 'yyyy-MM-dd'));
  }, [period]);

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

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  // Fetch all expenses for export
  const { data: allExpenses } = useAllExpenses({ startDate, endDate, limit: 10000 });

  const handleExportCSV = async () => {
    if (!allExpenses || allExpenses.length === 0) {
      Alert.alert('No Data', 'No expenses to export for this period');
      return;
    }

    const headers = ['Date', 'Category', 'Amount', 'Description', 'Recurring', 'Frequency'];
    const csvData = allExpenses.map(expense => ({
      Date: expense.date,
      Category: expense.category,
      Amount: expense.amount.toFixed(2),
      Description: expense.description || '',
      Recurring: expense.is_recurring ? 'Yes' : 'No',
      Frequency: expense.recurring_frequency || '',
    }));

    const csv = convertToCSV(csvData, headers);
    const filename = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    await shareData(csv, filename, 'text/csv');
  };

  const handleExportJSON = async () => {
    if (!allExpenses || allExpenses.length === 0) {
      Alert.alert('No Data', 'No data to export for this period');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      period: { startDate, endDate },
      expenses: allExpenses,
      categoryTotals,
      taskStats,
      pomodoroStats,
      routineStats,
      monthlyBudget,
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `analytics_${format(new Date(), 'yyyy-MM-dd')}.json`;
    await shareData(json, filename, 'application/json');
  };

  const handleExport = () => {
    Alert.alert(
      'Export Data',
      'Choose export format',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CSV (Expenses)', onPress: handleExportCSV },
        { text: 'JSON (Full Analytics)', onPress: handleExportJSON },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Insights into your productivity and spending</Text>
          </View>
          <View style={styles.headerRight}>
            <Button variant="outline" size="sm" onPress={handleExport}>
              <Ionicons name="download" size={18} color="#0ea5e9" />
            </Button>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['week', 'month', 'quarter', 'year'].map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod(p as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
                {p === 'week' ? '7D' : p === 'month' ? '30D' : p === 'quarter' ? '90D' : '1Y'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}><Ionicons name="cash" size={24} color="#0ea5e9" /></View>
            <Text style={styles.metricValue}>${totalExpenses.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Total Expenses</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}><Ionicons name="checkmark-circle" size={24} color="#22c55e" /></View>
            <Text style={styles.metricValue}>{taskStats?.completed || 0}</Text>
            <Text style={styles.metricLabel}>Tasks Completed</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}><Ionicons name="timer" size={24} color="#f59e0b" /></View>
            <Text style={styles.metricValue}>{pomodoroStats?.total_focus_minutes || 0}m</Text>
            <Text style={styles.metricLabel}>Focus Time</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}><Ionicons name="refresh" size={24} color="#f59e0b" /></View>
            <Text style={styles.metricValue}>{routineStats?.current_streak || 0} 🔥</Text>
            <Text style={styles.metricLabel}>Routine Streak</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Spending by Category</Text>
            <Text style={styles.chartSubtitle}>How your money is distributed</Text>
          </View>
          <View style={styles.chartContainer}>
            {categoryData.length > 0 ? (
              <View style={styles.categoryList}>
                {categoryData.map((entry, index) => (
                  <View key={entry.name} style={styles.categoryItem}>
                    <View style={[styles.categoryColor, { backgroundColor: entry.color }]} />
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{entry.name}</Text>
                      <Text style={styles.categoryValue}>${entry.value.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.categoryPercent}>{((entry.value / totalExpenses) * 100).toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>No category data for this period</Text>
              </View>
            )}
          </View>
        </View>

        {/* Task Status */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Task Status</Text>
            <Text style={styles.chartSubtitle}>Distribution of your tasks</Text>
          </View>
          <View style={styles.chartContainer}>
            {taskStatusData.length > 0 ? (
              <View style={styles.taskStatusList}>
                {taskStatusData.map((entry, index) => (
                  <View key={entry.name} style={styles.taskStatusItem}>
                    <View style={[styles.taskStatusColor, { backgroundColor: entry.color }]} />
                    <View style={styles.taskStatusInfo}>
                      <Text style={styles.taskStatusName}>{entry.name}</Text>
                      <Text style={styles.taskStatusValue}>{entry.value} tasks</Text>
                    </View>
                    <Text style={styles.taskStatusPercent}>
                      {(taskStats?.total ? (entry.value / taskStats.total) * 100 : 0).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>No task data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pomodoro Types */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Pomodoro Sessions</Text>
            <Text style={styles.chartSubtitle}>Breakdown by session type</Text>
          </View>
          <View style={styles.chartContainer}>
            {pomodoroTypeData.length > 0 ? (
              <View style={styles.pomodoroTypeList}>
                {pomodoroTypeData.map((entry, index) => (
                  <View key={entry.name} style={styles.pomodoroTypeItem}>
                    <View style={[styles.pomodoroTypeColor, { backgroundColor: entry.color }]} />
                    <View style={styles.pomodoroTypeInfo}>
                      <Text style={styles.pomodoroTypeName}>{entry.name}</Text>
                      <Text style={styles.pomodoroTypeValue}>{entry.value} sessions</Text>
                    </View>
                    <Text style={styles.pomodoroTypePercent}>
                      {(pomodoroStats?.total_sessions ? (entry.value / pomodoroStats.total_sessions) * 100 : 0).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>No Pomodoro data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Budget Progress */}
        {monthlyBudget && monthlyBudget.budget > 0 && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetTitle}>Monthly Budget</Text>
              <Text style={styles.budgetSubtitle}>Budget tracking for {format(new Date(), 'MMMM yyyy')}</Text>
            </View>
            <View style={styles.budgetContent}>
              <View style={styles.budgetProgressContainer}>
                <Text style={styles.budgetProgressLabel}>
                  ${monthlyBudget.spent.toFixed(2)} / ${monthlyBudget.budget.toFixed(2)} ({monthlyBudget.percentage.toFixed(0)}%)
                </Text>
                <View style={styles.budgetProgressBar}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      { width: `${Math.min(monthlyBudget.percentage, 100)}%`, backgroundColor: monthlyBudget.percentage > 100 ? '#ef4444' : '#0ea5e9' },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.budgetDetails}>
                <Text style={styles.budgetDetail}>
                  <Text style={styles.budgetDetailLabel}>Remaining: </Text>
                  ${monthlyBudget.remaining.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Comparison */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>Weekly Comparison</Text>
            <Text style={styles.comparisonSubtitle}>This week vs last week</Text>
          </View>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonValue}>+12%</Text>
              <Text style={styles.comparisonLabel}>Spending</Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonValue, { color: '#0ea5e9' }]}>+8%</Text>
              <Text style={styles.comparisonLabel}>Tasks Completed</Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonValue, { color: '#f59e0b' }]}>+15%</Text>
              <Text style={styles.comparisonLabel}>Focus Time</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '44%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartContainer: {},
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  categoryPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 50,
    textAlign: 'right',
  },
  taskStatusList: {
    gap: 12,
  },
  taskStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
  },
  taskStatusColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskStatusInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskStatusName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  taskStatusValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskStatusPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 50,
    textAlign: 'right',
  },
  pomodoroTypeList: {
    gap: 12,
  },
  pomodoroTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
  },
  pomodoroTypeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pomodoroTypeInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pomodoroTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  pomodoroTypeValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  pomodoroTypePercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 50,
    textAlign: 'right',
  },
  emptyChart: {
    padding: 40,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  budgetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  budgetHeader: {
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  budgetSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  budgetContent: {},
  budgetProgressContainer: {
    gap: 8,
  },
  budgetProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetails: {
    marginTop: 8,
  },
  budgetDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  budgetDetailLabel: {
    fontWeight: '600',
  },
  comparisonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  comparisonHeader: {
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  comparisonSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonItem: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    alignItems: 'center',
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});