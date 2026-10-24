'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Filter, Download, Search, ChevronDown, Filter as FilterIcon, X, Trash2 } from 'lucide-react';
import { cn } from '@productivity-suite/ui';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Badge, Avatar, Dropdown, Modal, Tabs, Progress
} from '@productivity-suite/ui';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useCategoryTotals, useMonthlyBudget } from '@productivity-suite/core';
import { useAuth } from '@productivity-suite/core';
import { expenseSchema, ExpenseForm, ExpenseCategory } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoryColors, formatCurrency, CategoryIcon } from '@productivity-suite/ui';
import { saveAs } from 'file-saver';
import { useToast } from '@productivity-suite/ui';

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
  const { profile } = useAuth();
  const userCurrency = profile?.currency || 'USD';
  
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

  const { toast } = useToast();

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
      toast({ type: 'success', title: editingExpense ? 'Expense updated' : 'Expense added' });
    } catch (error: any) {
      console.error('Failed to save expense:', error);
      toast({ type: 'error', title: 'Error', message: error.message || 'Failed to save expense' });
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
        toast({ type: 'success', title: 'Expense deleted' });
      } catch (error: any) {
        console.error('Failed to delete expense:', error);
        toast({ type: 'error', title: 'Error', message: error.message || 'Failed to delete expense' });
      }
      setDeleteConfirm(null);
    }
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  // Filters state
  const [filterOpen, setFilterOpen] = useState(false);

  // Export expenses to CSV
  const handleExport = () => {
    if (!expenses || expenses.length === 0) {
      toast({ type: 'info', title: 'No Data', message: 'No expenses to export' });
      return;
    }
    
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Recurring'];
    const rows = expenses.map(e => [
      e.date,
      e.category,
      e.description || '',
      e.amount.toString(),
      e.is_recurring ? 'Yes' : 'No'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({ type: 'success', title: 'Success', message: 'Expenses exported to CSV' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Expenses</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Track your spending and stay within budget</p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            trigger={
              <Button variant="outline" size="sm" icon={<FilterIcon className="w-4 h-4" />}>
                Filters
              </Button>
            }
            items={[
              { label: 'Filter by Category', value: 'category', icon: null },
              { label: 'Filter by Date Range', value: 'date', icon: null },
              { label: 'Search Description', value: 'search', icon: null },
              { divider: true },
              { label: 'Clear Filters', value: 'clear', icon: X as any },
            ]}
            onSelect={(value) => {
              if (value === 'clear') {
                setFilters({ category: '', startDate: '', endDate: '', search: '' });
              }
            }}
            align="right"
          />
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport} disabled={!expenses || expenses.length === 0}>
            Export
          </Button>
          <Button onClick={() => { setEditingExpense(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Budget Overview */}
      <Card variant="default" padding="md" glass={true}>
        <CardHeader className="pb-2">
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>Track your spending against your monthly budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Spent</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(monthlyBudget?.spent || 0, monthlyBudget?.currency || userCurrency)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Budget</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(monthlyBudget?.budget || 0, monthlyBudget?.currency || userCurrency)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Remaining</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(monthlyBudget?.remaining || 0, monthlyBudget?.currency || userCurrency)}
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
      <Card variant="default" padding="md" glass={true}>
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
                <div key={cat.value} className="p-4 rounded-xl glass-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${categoryColors[cat.value]}20` }}>
                      <CategoryIcon category={cat.value} size={20} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{cat.label}</span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(total, monthlyBudget?.currency || userCurrency)}
                  </p>
                  <div className="mt-2 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
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
      <Card variant="default" padding="md" glass={true}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>{expenses?.length || 0} expenses • Total: {formatCurrency(totalExpenses, userCurrency)}</CardDescription>
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
                <div key={i} className="h-16 animate-pulse glass-card" />
              ))}
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: categoryColors[expense.category] }}
                  >
                    <CategoryIcon category={expense.category} size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">{expense.description || expense.category}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">{expense.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(expense.amount, userCurrency)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" icon={<ChevronDown className="w-4 h-4" />} onClick={() => handleEdit(expense)} />
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(expense.id)} />
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
        description="Fill in the details below to add a new expense."
        size="md"
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingExpense(null); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" form="expense-form" loading={isSubmitting}>
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        }
      >
        <form id="expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
              required
              icon={<div className="text-neutral-400 dark:text-neutral-500">$</div>}
              iconPosition="left"
            />
            <Select
              label="Category"
              options={categories}
              error={errors.category?.message}
              {...register('category')}
              required
            />
          </div>
          <Input
            label="Description (optional)"
            placeholder="What did you buy?"
            {...register('description')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Date"
              type="date"
              error={errors.date?.message}
              {...register('date')}
              required
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                {...register('is_recurring')}
                className="sr-only peer"
              />
              <label htmlFor="recurring" className="flex items-center gap-3 cursor-pointer">
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                  'border-neutral-300 dark:border-neutral-600',
                  'peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 peer-focus:ring-offset-white dark:peer-focus:ring-offset-neutral-950',
                  'peer-checked:bg-primary-600 peer-checked:border-primary-600',
                  'peer-checked:dark:bg-primary-500 peer-checked:dark:border-primary-500',
                  'hover:border-primary-400 dark:hover:border-primary-500'
                )}>
                  <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Recurring expense
                </span>
              </label>
            </div>
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