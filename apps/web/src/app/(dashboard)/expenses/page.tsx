'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Filter, Download, Search, ChevronDown } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Badge, Avatar, Dropdown, Modal, Tabs, Progress
} from '@productivity-suite/ui';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useCategoryTotals, useMonthlyBudget } from '@productivity-suite/core';
import { expenseSchema, ExpenseForm, ExpenseCategory } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoryColors, categoryIcons, formatCurrency } from '@productivity-suite/ui';

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<(ExpenseForm & { id: string }) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '' as ExpenseCategory | '',
    startDate: '',
    endDate: '',
    search: '',
  });

  const { data: expenses, isLoading, refetch } = useExpenses(filters as any);
  const { data: categoryTotals } = useCategoryTotals(
    filters.startDate || format(new Date(), 'yyyy-MM-01'),
    filters.endDate || format(new Date(), 'yyyy-MM-dd')
  );
  const { data: monthlyBudget } = useMonthlyBudget(format(new Date(), 'yyyy-MM'));

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      is_recurring: false,
    },
  });

  const onSubmit = async (data: ExpenseForm) => {
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense.id, updates: data });
      } else {
        await createExpense.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      reset();
      refetch();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense({
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || '',
      date: expense.date,
      is_recurring: expense.is_recurring,
      recurring_frequency: expense.recurring_frequency,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteExpense.mutateAsync(deleteConfirm);
        refetch();
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
      setDeleteConfirm(null);
    }
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Expenses</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Track your spending and stay within budget</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>
            Filters
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button onClick={() => { setEditingExpense(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>Track your spending against your monthly budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Spent</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(monthlyBudget?.spent || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Budget</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(monthlyBudget?.budget || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Remaining</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(monthlyBudget?.remaining || 0)}
              </p>
            </div>
          </div>
          <Progress
            value={monthlyBudget?.percentage || 0}
            max={100}
            showLabel
            label={`${monthlyBudget?.percentage?.toFixed(1) || 0}% of budget used`}
            variant={monthlyBudget && monthlyBudget.percentage > 90 ? 'danger' : monthlyBudget && monthlyBudget.percentage > 70 ? 'warning' : 'primary'}
          />
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>By Category</CardTitle>
          <CardDescription>This month's spending breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const total = categoryTotals?.[cat.value] || 0;
              const percentage = monthlyBudget?.budget && monthlyBudget.budget > 0
                ? (total / monthlyBudget.budget) * 100
                : 0;
              return (
                <div key={cat.value} className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${categoryColors[cat.value]}20` }}
                    >
                      <span className="text-lg">{categoryIcons[cat.value]}</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{cat.label}</span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(total)}
                  </p>
                  <div className="mt-2 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: categoryColors[cat.value],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>{expenses?.length || 0} expenses • Total: {formatCurrency(totalExpenses)}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search..."
              icon={<Search className="w-4 h-4" />}
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-64"
            />
            <Select
              value={filters.category}
              onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as ExpenseCategory | '' }))}
              options={[{ value: '', label: 'All Categories' }, ...categories]}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              ))}
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: categoryColors[expense.category] }}
                  >
                    <span className="text-lg">{categoryIcons[expense.category]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">{expense.description || expense.category}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">{expense.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" icon={<ChevronDown className="w-4 h-4" />} onClick={() => handleEdit(expense)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">No expenses found</p>
              <Button onClick={() => { setEditingExpense(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Add your first expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); reset(); }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
            required
          />
          <Select
            label="Category"
            options={categories}
            error={errors.category?.message}
            {...register('category')}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="What did you buy?"
            {...register('description')}
          />
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              {...register('is_recurring')}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <label htmlFor="recurring" className="text-sm text-neutral-700 dark:text-neutral-300">
              Recurring expense
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingExpense(null); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Expense"
      >
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}