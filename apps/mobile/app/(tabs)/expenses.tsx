import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useExpenses,
  useDailySpending,
  useWeeklySpending,
  useMonthlyBudget,
  useTaskStats,
} from '@productivity-suite/core';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from '@productivity-suite/core';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import type { Expense, ExpenseCategory, RecurringFrequency } from '@productivity-suite/core';

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'food' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: 'daily' as RecurringFrequency,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: dailySpending, isLoading: dailyLoading } = useDailySpending(
    formData.date
  );
  const { data: weeklySpending, isLoading: weeklyLoading } = useWeeklySpending(
    new Date().toISOString().split('T')[0]
  );
  const { data: monthlyBudget, isLoading: budgetLoading } = useMonthlyBudget(
    new Date().toISOString().split('T')[0]
  );

  const { data: expensesData, refetch: refetchExpenses } = useExpenses({ limit: 50 });
  const { data: taskStats } = useTaskStats();

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  useEffect(() => {
    setExpenses(expensesData || []);
    setIsLoading(false);
  }, [expensesData]);

  const onSubmit = async () => {
    try {
      await createExpenseMutation.mutateAsync({
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        is_recurring: formData.is_recurring,
        recurring_frequency: formData.recurring_frequency,
      });
      setFormData({
        amount: '',
        category: 'food',
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        recurring_frequency: 'daily',
      });
      setShowForm(false);
      refetchExpenses();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const onEditSubmit = async () => {
    try {
      await updateExpenseMutation.mutateAsync({
        id: editingId!,
        updates: {
          amount: Number(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          is_recurring: formData.is_recurring,
          recurring_frequency: formData.recurring_frequency,
        },
      });
      setEditingId(null);
      setShowForm(false);
      refetchExpenses();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteExpenseMutation.mutateAsync(id);
      refetchExpenses();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  useEffect(() => {
    if (isLoading || dailyLoading || weeklyLoading || budgetLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isLoading, dailyLoading, weeklyLoading, budgetLoading]);

  if (isLoading || dailyLoading || weeklyLoading || budgetLoading) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with stats */}
      <View style={styles.header}>
        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Text style={styles.statLabel}>Today's Spending</Text>
            <Text style={styles.statValue}>${(dailySpending?.total ?? 0).toFixed(2)}</Text>
          </View>
          <View style={styles.statRight}>
            <Ionicons name="trending-up" size={24} color="#22c55e" /> +12% vs yesterday
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>${(weeklySpending?.total ?? 0).toFixed(2)}</Text>
          </View>
          <View style={styles.statRight}>
            <Ionicons name="grid" size={24} color="#0ea5e9" /> 7-day total
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Text style={styles.statLabel}>Monthly Budget</Text>
            <Text style={styles.statValue}>
              ${(monthlyBudget?.spent ?? 0).toFixed(2)} / ${(monthlyBudget?.budget ?? 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statRight}>
            {monthlyBudget?.percentage ?? 0}% used
          </View>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.section}>
        <Button variant="outline" onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle" size={24} color="#0ea5e9" /> Add Expense
        </Button>
      </View>

      {/* Expenses List */}
      <View style={styles.list}>
        {expenses.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="menu" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubText}>Tap + to add your first expense</Text>
          </View>
        )}
        {expenses.map((expense) => (
          <View key={expense.id} style={styles.listItem}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>
                {expense.description || 'Unnamed expense'}
              </Text>
              <Text style={styles.itemSub}>{expense.date}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmount}>${expense.amount.toFixed(2)}</Text>
              <Button variant="ghost" size="sm" onPress={() => router.push('/expenses')}>
                <Text>Details</Text>
              </Button>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fafafa',
  },
  header: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLeft: {},
  statRight: {},
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  section: {
    marginBottom: 16,
  },
  loadingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    minWidth: 60,
    paddingVertical: 12,
  },
  list: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#737373',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  empty: {
    marginTop: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  itemSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  itemRight: {},
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ea5e9',
  },
});