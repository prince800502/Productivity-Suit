'use client';

import React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, CreditCard, RotateCcw, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Badge, Progress, Modal, Switch, Tabs
} from '@productivity-suite/ui';
import { useRecurringExpenses, useCreateRecurringExpense, useUpdateRecurringExpense, useDeleteRecurringExpense, useToggleRecurringExpenseActive, useUpcomingPayments, useMonthlySubscriptionTotal, RecurringExpenseForm, RecurringExpense, RecurringFrequency, UpcomingPayment } from '@productivity-suite/core';
import { categoryColors, categoryIcons, formatCurrency } from '@productivity-suite/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categories = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

const recurringExpenseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.union([
    z.literal('food'),
    z.literal('transport'),
    z.literal('shopping'),
    z.literal('entertainment'),
    z.literal('health'),
    z.literal('education'),
    z.literal('utilities'),
    z.literal('other'),
  ]),
  frequency: z.union([
    z.literal('daily'),
    z.literal('weekly'),
    z.literal('monthly'),
    z.literal('yearly'),
  ]),
  start_date: z.string().date(),
  end_date: z.string().date().optional().nullable(),
  reminder_days_before: z.number().int().min(0).max(30).default(3),
  payment_method: z.string().max(50).optional(),
  auto_create_expense: z.boolean().default(true),
});

function getFrequencyLabel(freq: RecurringFrequency) {
  switch (freq) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'yearly': return 'Yearly';
    default: return freq;
  }
}

function getDaysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function RecurringExpensesContent({
  activeTab,
  setActiveTab,
  expenses,
  isLoading,
  refetch,
  upcomingPayments,
  monthlyTotal,
  categoryColors,
  categoryIcons,
  formatCurrency,
  format,
  getFrequencyLabel,
  getDaysUntil,
  isModalOpen,
  setIsModalOpen,
  editingExpense,
  setEditingExpense,
  reset,
  handleEdit,
  deleteRecurringExpense,
  toggleActive,
  createRecurringExpense,
  updateRecurringExpense,
  errors,
  isSubmitting,
  register,
  handleSubmit,
  setValue,
  onSubmit,
}: any) {
  return (
    <div>
      <Tabs value={activeTab} onChange={setActiveTab} tabs={[
        { value: 'active', label: 'Active' },
        { value: 'upcoming', label: 'Upcoming' },
      ]} fullWidth className="mt-6" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{activeTab === 'active' ? 'Active Subscriptions' : 'All Recurring Expenses'}</CardTitle>
            <CardDescription>{activeTab === 'active' ? 'Manage your active subscriptions' : 'View all recurring expenses'}</CardDescription>
          </div>
          <Button onClick={() => { setEditingExpense(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Recurring Expense
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense: RecurringExpense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${categoryColors[expense.category]}20` }}>
                      <span className="text-xl">{categoryIcons[expense.category]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${!expense.is_active ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                          {expense.name}
                        </p>
                        {!expense.is_active && <Badge variant="default" size="sm">Inactive</Badge>}
                        {expense.is_active && <Badge variant="success" size="sm">Active</Badge>}
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{expense.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="font-medium">{formatCurrency(expense.amount, expense.currency)}</span>
                        <Badge variant="outline" size="sm" className="capitalize">{expense.frequency}</Badge>
                        <Badge variant="outline" size="sm">{expense.category}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Next: {format(new Date(expense.next_payment_date), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={expense.is_active}
                      onChange={(e) => toggleActive.mutate({ id: expense.id, is_active: e.target.checked })}
                      label=""
                      description=""
                    />
                    <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(expense)} />
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this recurring expense?')) deleteRecurringExpense.mutate(expense.id); }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">No recurring expenses yet</p>
              <Button onClick={() => { setEditingExpense(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Add your first recurring expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingExpense(null); reset(); }} title={editingExpense ? 'Edit Recurring Expense' : 'New Recurring Expense'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" placeholder="Netflix" error={errors.name?.message} {...register('name')} required />
          <Input label="Description (optional)" placeholder="Monthly subscription" {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount', { valueAsNumber: true })} required />
            <Select label="Currency" options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'INR', label: 'INR (₹)' },
            ]} error={errors.currency?.message} {...register('currency')} required />
          </div>
          <Select label="Category" options={categories} error={errors.category?.message} {...register('category')} required />
          <Select label="Frequency" options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ]} error={errors.frequency?.message} {...register('frequency')} required />
          <Input label="Start Date" type="date" error={errors.start_date?.message} {...register('start_date')} required />
          <Input label="End Date (optional)" type="date" error={errors.end_date?.message} {...register('end_date')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Reminder Days Before" type="number" min="0" max="30" step="1" error={errors.reminder_days_before?.message} {...register('reminder_days_before', { valueAsNumber: true })} />
            <Input label="Payment Method (optional)" placeholder="Credit Card, Bank Transfer..." {...register('payment_method')} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="auto_create" {...register('auto_create_expense')} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500" />
            <label htmlFor="auto_create" className="text-sm text-neutral-700 dark:text-neutral-300">Auto-create expense on payment</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingExpense(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingExpense ? 'Save Changes' : 'Create Recurring Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function RecurringExpensesPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const { data: expenses, isLoading, refetch } = useRecurringExpenses({ is_active: activeTab === 'active' });
  const { data: upcomingPayments } = useUpcomingPayments(30);
  const { data: monthlyTotal } = useMonthlySubscriptionTotal();

  const createRecurringExpense = useCreateRecurringExpense();
  const updateRecurringExpense = useUpdateRecurringExpense();
  const deleteRecurringExpense = useDeleteRecurringExpense();
  const toggleActive = useToggleRecurringExpenseActive();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof recurringExpenseSchema>>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      currency: 'USD',
      frequency: 'monthly',
      reminder_days_before: 3,
      auto_create_expense: true,
    },
  });

  const onSubmit = async (data: z.infer<typeof recurringExpenseSchema>) => {
    try {
      if (editingExpense) {
        await updateRecurringExpense.mutateAsync({ id: editingExpense.id, updates: data });
      } else {
        await createRecurringExpense.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      reset();
      refetch();
    } catch (error) {
      console.error('Failed to save recurring expense:', error);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setValue('name', expense.name);
    setValue('description', expense.description || '');
    setValue('amount', expense.amount);
    setValue('currency', expense.currency);
    setValue('category', expense.category);
    setValue('frequency', expense.frequency);
    setValue('start_date', expense.start_date);
    setValue('end_date', expense.end_date || '');
    setValue('reminder_days_before', expense.reminder_days_before);
    setValue('payment_method', expense.payment_method || '');
    setValue('auto_create_expense', expense.auto_create_expense);
    setIsModalOpen(true);
  };

  const getFrequencyLabel = (freq: RecurringFrequency) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return freq;
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Recurring Expenses</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage subscriptions and recurring payments</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          Add Recurring Expense
        </Button>
      </div>

      {/* Monthly Total */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Monthly Subscription Total</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(monthlyTotal || 0, 'USD')}
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingPayments && upcomingPayments.length > 0 ? (
            <div className="space-y-3">
              {upcomingPayments.map(payment => {
                const daysUntil = getDaysUntil(payment.next_payment_date);
                const isOverdue = daysUntil < 0;
                const isDueSoon = daysUntil <= 3 && daysUntil >= 0;
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${categoryColors[payment.category]}20` }}>
                        <span className="text-xl">{categoryIcons[payment.category]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{payment.name}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatCurrency(payment.amount, payment.currency)} • {getFrequencyLabel(payment.frequency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-medium ${isOverdue ? 'text-danger-600' : isDueSoon ? 'text-warning-600' : 'text-neutral-900 dark:text-white'}`}>
                          {isOverdue ? 'Overdue' : daysUntil === 0 ? 'Due Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {format(new Date(payment.next_payment_date), 'MMM d')}
                        </p>
                      </div>
                      <Badge variant={isOverdue ? 'danger' : isDueSoon ? 'warning' : 'default'} size="sm">
                        {payment.category}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">No upcoming payments in the next 30 days</p>
            </div>
          )}
        </CardContent>
      </Card>

      <RecurringExpensesContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expenses={expenses}
        isLoading={isLoading}
        refetch={refetch}
        upcomingPayments={upcomingPayments}
        monthlyTotal={monthlyTotal}
        categoryColors={categoryColors}
        categoryIcons={categoryIcons}
        formatCurrency={formatCurrency}
        format={format}
        getFrequencyLabel={getFrequencyLabel}
        getDaysUntil={getDaysUntil}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingExpense={editingExpense}
        setEditingExpense={setEditingExpense}
        reset={reset}
        handleEdit={handleEdit}
        deleteRecurringExpense={deleteRecurringExpense}
        toggleActive={toggleActive}
        createRecurringExpense={createRecurringExpense}
        updateRecurringExpense={updateRecurringExpense}
        errors={errors}
        isSubmitting={isSubmitting}
        register={register}
        handleSubmit={handleSubmit}
        setValue={setValue}
        onSubmit={onSubmit}
      />
    </div>
  );
}

