'use client';

import React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Target, PiggyBank, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Badge, Progress, Modal, Tabs
} from '@productivity-suite/ui';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useCurrentBudget, useBudgetProgress, useCategoryBudgets, useCreateCategoryBudget, useUpdateCategoryBudget, useDeleteCategoryBudget, useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, useAddSavingsContribution, BudgetForm, CategoryBudgetForm, SavingsGoalForm, SavingsContributionForm } from '@productivity-suite/core';
import { useAuth } from '@productivity-suite/core';
import { categoryColors, formatCurrency, CategoryIcon } from '@productivity-suite/ui';
import type { ExpenseCategory } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

function BudgetTabContent({
  currentMonth,
  currentBudget,
  budgetProgress,
  budgets,
  budgetsLoading,
  categories,
  categoryColors,
  formatCurrency,
  format,
  isBudgetModalOpen,
  setIsBudgetModalOpen,
  editingBudget,
  setEditingBudget,
  isCategoryBudgetModalOpen,
  setIsCategoryBudgetModalOpen,
  editingCategoryBudget,
  setEditingCategoryBudget,
  selectedBudgetId,
  setSelectedBudgetId,
  reset,
  resetCat,
  handleEditBudget,
  handleEditCategoryBudget,
  deleteBudget,
  createBudget,
  updateBudget,
  deleteCategoryBudget,
  budgetErrors,
  budgetSubmitting,
  catErrors,
  catSubmitting,
  register,
  regCat,
  handleSubmit,
  handleSubmitCat,
  setValue,
  setValueCat,
  onSubmitBudget,
  onSubmitCategoryBudget,
}: any) {
  return (
    <div>
      <Tabs value="budget" onChange={() => {}} tabs={[
        { value: 'budget', label: 'Budgets', icon: <PiggyBank className="w-4 h-4" /> },
        { value: 'savings', label: 'Savings Goals', icon: <Target className="w-4 h-4" /> },
      ]} fullWidth variant="glass" />

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Budgets</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Track your monthly spending against budgets</p>
          </div>
          <Button onClick={() => { setEditingBudget(null); setSelectedBudgetId(null); reset(); setIsBudgetModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
            New Budget
          </Button>
        </div>

        {currentBudget && budgetProgress && (
          <Card variant="default" padding="md" glass={true}>
            <CardHeader>
              <CardTitle>Current Month Budget</CardTitle>
              <CardDescription>{format(new Date(currentMonth + '-01'), 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Budget</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(budgetProgress.budget, budgetProgress.currency)}
                  </p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Spent</p>
                  <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                    {formatCurrency(budgetProgress.spent, budgetProgress.currency)}
                  </p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Remaining</p>
                  <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {formatCurrency(budgetProgress.remaining, budgetProgress.currency)}
                  </p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Progress</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {budgetProgress.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              <Progress 
                value={budgetProgress.percentage} 
                max={100}
                showLabel 
                label={`${budgetProgress.percentage.toFixed(1)}% of budget used`}
                variant={budgetProgress.percentage > 90 ? 'danger' : budgetProgress.percentage > 70 ? 'warning' : 'primary'}
                size="lg"
              />
            </CardContent>
          </Card>
        )}

        <Card variant="default" padding="md" glass={true}>
          <CardHeader className="pb-2">
            <CardTitle>Category Budgets</CardTitle>
            <CardDescription>{currentBudget ? 'Set limits for each spending category' : 'Create a monthly budget first'}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentBudget ? (
              <>
                {budgetProgress && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {categories.map((cat: { value: ExpenseCategory; label: string }) => {
                      const catData = (budgetProgress.categoryBreakdown as Record<ExpenseCategory, { spent: number; budget: number; percentage: number }>)[cat.value];
                      const percentage = catData?.budget && catData.budget > 0 ? (catData.spent / catData.budget) * 100 : 0;
                      const isOver = percentage > 100;
                      return (
                        <div key={cat.value} className="p-4 rounded-xl glass-card">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${categoryColors[cat.value]}20` }}>
                              <CategoryIcon category={cat.value} size={20} className="text-lg" />
                            </div>
                            <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{cat.label}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Spent: {formatCurrency(catData?.spent || 0, budgetProgress.currency)}</span>
                              <span>Budget: {formatCurrency(catData?.budget || 0, budgetProgress.currency)}</span>
                            </div>
                            <Progress value={percentage} max={100} variant={isOver ? 'danger' : percentage > 80 ? 'warning' : 'primary'} size="sm" />
                          </div>
                          <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => { setSelectedBudgetId(currentBudget.id); setEditingCategoryBudget(null); setValueCat('category', cat.value); setValueCat('amount', catData?.budget || 0); setIsCategoryBudgetModalOpen(true); }}>
                            {catData?.budget ? 'Edit' : 'Set Budget'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => { setSelectedBudgetId(currentBudget.id); setEditingCategoryBudget(null); resetCat(); setIsCategoryBudgetModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                    Add Category Budget
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <PiggyBank className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">No budget set for this month</p>
                <Button onClick={() => { setEditingBudget(null); reset(); setIsBudgetModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                  Create Budget
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="default" padding="md" glass={true}>
          <CardHeader>
            <CardTitle>Budget History</CardTitle>
            <CardDescription>Previous months' budgets and spending</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse glass-card" />)}
              </div>
            ) : budgets && budgets.length > 0 ? (
              <div className="space-y-3">
                {budgets.map((budget: { id: string; month: string; amount: number; currency: string }) => (
                  <div key={budget.id} className="flex items-center justify-between p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <PiggyBank className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{format(new Date(budget.month), 'MMMM yyyy')}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatCurrency(budget.amount, budget.currency)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEditBudget(budget)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this budget?')) deleteBudget.mutate(budget.id); }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PiggyBank className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">No budgets yet</p>
                <Button onClick={() => { setEditingBudget(null); reset(); setIsBudgetModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                  Create your first budget
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Modal */}
        <Modal isOpen={isBudgetModalOpen} onClose={() => { setIsBudgetModalOpen(false); setEditingBudget(null); reset(); }} title={editingBudget ? 'Edit Budget' : 'New Budget'} size="md">
          <form onSubmit={handleSubmit(onSubmitBudget)} className="space-y-4">
            <Input label="Month" type="month" error={budgetErrors.month?.message} {...register('month')} required />
            <Input label="Amount" type="number" step="0.01" placeholder="0.00" error={budgetErrors.amount?.message} {...register('amount', { valueAsNumber: true })} required />
            <Select label="Currency" options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'INR', label: 'INR (₹)' },
            ]} error={budgetErrors.currency?.message} {...register('currency')} required />
            <Input label="Alert Threshold (%)" type="number" min="0" max="100" step="1" error={budgetErrors.alert_threshold?.message} {...register('alert_threshold', { valueAsNumber: true })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsBudgetModalOpen(false); setEditingBudget(null); reset(); }}>Cancel</Button>
              <Button type="submit" loading={budgetSubmitting}>{editingBudget ? 'Save Changes' : 'Create Budget'}</Button>
            </div>
          </form>
        </Modal>

        {/* Category Budget Modal */}
        <Modal isOpen={isCategoryBudgetModalOpen} onClose={() => { setIsCategoryBudgetModalOpen(false); setEditingCategoryBudget(null); setSelectedBudgetId(null); resetCat(); }} title={editingCategoryBudget ? 'Edit Category Budget' : 'New Category Budget'} size="md">
          <form onSubmit={handleSubmitCat(onSubmitCategoryBudget)} className="space-y-4">
            <Select label="Category" options={categories} error={catErrors.category?.message} {...regCat('category')} required />
            <Input label="Budget Amount" type="number" step="0.01" placeholder="0.00" error={catErrors.amount?.message} {...regCat('amount', { valueAsNumber: true })} required />
            <Input label="Alert Threshold (%)" type="number" min="0" max="100" step="1" error={catErrors.alert_threshold?.message} {...regCat('alert_threshold', { valueAsNumber: true })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsCategoryBudgetModalOpen(false); setEditingCategoryBudget(null); setSelectedBudgetId(null); resetCat(); }}>Cancel</Button>
              <Button type="submit" loading={catSubmitting}>{editingCategoryBudget ? 'Save Changes' : 'Add Category Budget'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

function SavingsTabContent({
  savingsGoals,
  savingsLoading,
  formatCurrency,
  format,
  isSavingsGoalModalOpen,
  setIsSavingsGoalModalOpen,
  editingSavingsGoal,
  setEditingSavingsGoal,
  isContributionModalOpen,
  setIsContributionModalOpen,
  contributionGoalId,
  setContributionGoalId,
  resetSavings,
  resetContrib,
  handleEditSavingsGoal,
  handleAddContribution,
  deleteSavingsGoal: deleteSavingsGoalProp,
  createSavingsGoal,
  updateSavingsGoal,
  savingsErrors,
  savingsSubmitting,
  contribErrors,
  contribSubmitting,
  regSavings,
  regContrib,
  handleSubmitSavings,
  handleSubmitContrib,
  setValueSavings,
  setValueContrib,
  onSubmitSavingsGoal,
  onSubmitContribution,
}: any) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Savings Goals</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Track your progress towards financial goals</p>
        </div>
        <Button onClick={() => { setEditingSavingsGoal(null); resetSavings(); setIsSavingsGoalModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          New Goal
        </Button>
      </div>

      <Card variant="default" padding="md" glass={true}>
        <CardHeader>
          <CardTitle>Your Savings Goals</CardTitle>
          <CardDescription>Track progress and add contributions</CardDescription>
        </CardHeader>
        <CardContent>
          {savingsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse glass-card" />)}
            </div>
          ) : savingsGoals && savingsGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savingsGoals.map((goal: { id: string; target_amount: number; current_amount: number; is_completed: boolean; color: string; icon: string | null; name: string; description: string | null; currency: string; target_date: string | null }) => {
                const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                const isCompleted = goal.is_completed;
                return (
                  <Card key={goal.id} variant="default" glass={true} className={`overflow-hidden ${isCompleted ? 'border-success-300 dark:border-success-700 bg-success-50/50 dark:bg-success-900/20' : ''}`}>
                    <div className="h-3" style={{ backgroundColor: goal.color }} />
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: goal.color }}>
                            {goal.icon ? <span className="text-xl">{goal.icon}</span> : <Target className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{goal.name}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{goal.description || 'No description'}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <Badge variant="success" size="sm">Completed</Badge>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Saved</span>
                          <span className="font-medium">{formatCurrency(goal.current_amount, goal.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Target</span>
                          <span className="font-medium">{formatCurrency(goal.target_amount, goal.currency)}</span>
                        </div>
                        <Progress value={percentage} max={100} showLabel label={`${percentage.toFixed(1)}%`} variant={isCompleted ? 'success' : percentage > 80 ? 'warning' : 'primary'} />
                        {goal.target_date && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAddContribution(goal)} disabled={isCompleted}>
                          Add Money
                        </Button>
                        <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEditSavingsGoal(goal)} />
                        <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this goal?')) deleteSavingsGoalProp.mutate(goal.id); }} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">No savings goals yet</p>
              <Button onClick={() => { setEditingSavingsGoal(null); resetSavings(); setIsSavingsGoalModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Create your first goal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Goal Modal */}
      <Modal isOpen={isSavingsGoalModalOpen} onClose={() => { setIsSavingsGoalModalOpen(false); setEditingSavingsGoal(null); resetSavings(); }} title={editingSavingsGoal ? 'Edit Savings Goal' : 'New Savings Goal'} size="lg">
        <form onSubmit={handleSubmitSavings(onSubmitSavingsGoal)} className="space-y-4">
          <Input label="Name" placeholder="Emergency Fund" error={savingsErrors.name?.message} {...regSavings('name')} required />
          <Input label="Description (optional)" placeholder="What are you saving for?" {...regSavings('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Target Amount" type="number" step="0.01" placeholder="0.00" error={savingsErrors.target_amount?.message} {...regSavings('target_amount', { valueAsNumber: true })} required />
            <Input label="Current Amount" type="number" step="0.01" placeholder="0.00" error={savingsErrors.current_amount?.message} {...regSavings('current_amount', { valueAsNumber: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Currency" options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'INR', label: 'INR (₹)' },
            ]} error={savingsErrors.currency?.message} {...regSavings('currency')} required />
            <Input label="Target Date (optional)" type="date" error={savingsErrors.target_date?.message} {...regSavings('target_date')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Icon (emoji)" placeholder="🏠" {...regSavings('icon')} />
            <Input label="Color" type="color" {...regSavings('color')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsSavingsGoalModalOpen(false); setEditingSavingsGoal(null); resetSavings(); }}>Cancel</Button>
            <Button type="submit" loading={savingsSubmitting}>{editingSavingsGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </form>
      </Modal>

      {/* Contribution Modal */}
      <Modal isOpen={isContributionModalOpen} onClose={() => { setIsContributionModalOpen(false); setContributionGoalId(null); resetContrib(); }} title="Add Contribution" size="md">
        <form onSubmit={handleSubmitContrib(onSubmitContribution)} className="space-y-4">
          <Input label="Amount" type="number" step="0.01" placeholder="0.00" error={contribErrors.amount?.message} {...regContrib('amount', { valueAsNumber: true })} required />
          <Input label="Note (optional)" placeholder="Bonus, side hustle, etc." {...regContrib('note')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsContributionModalOpen(false); setContributionGoalId(null); resetContrib(); }}>Cancel</Button>
            <Button type="submit" loading={contribSubmitting}>Add Contribution</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function BudgetsPage() {
  const { profile } = useAuth();
  const userCurrency = profile?.currency || 'USD';
  
  const [activeTab, setActiveTab] = useState<'budget' | 'savings'>('budget');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [isCategoryBudgetModalOpen, setIsCategoryBudgetModalOpen] = useState(false);
  const [editingCategoryBudget, setEditingCategoryBudget] = useState<any>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isSavingsGoalModalOpen, setIsSavingsGoalModalOpen] = useState(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<any>(null);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: budgets, isLoading: budgetsLoading } = useBudgets({ limit: 12 });
  const { data: currentBudget } = useCurrentBudget();
  const { data: budgetProgress } = useBudgetProgress(currentMonth);
  const { data: savingsGoals, isLoading: savingsLoading } = useSavingsGoals({ limit: 10 });

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const createCategoryBudget = useCreateCategoryBudget();
  const updateCategoryBudget = useUpdateCategoryBudget();
  const deleteCategoryBudget = useDeleteCategoryBudget();

  const createSavingsGoal = useCreateSavingsGoal();
  const updateSavingsGoal = useUpdateSavingsGoal();
  const deleteSavingsGoal = useDeleteSavingsGoal();
  const addContribution = useAddSavingsContribution();

  const { register, handleSubmit, reset, setValue, formState: { errors: budgetErrors, isSubmitting: budgetSubmitting } } = useForm<BudgetForm>({
    defaultValues: { month: format(new Date(), 'yyyy-MM-01'), currency: 'USD', alert_threshold: 80 },
  });

  const { register: regCat, handleSubmit: handleSubmitCat, reset: resetCat, setValue: setValueCat, formState: { errors: catErrors, isSubmitting: catSubmitting } } = useForm<CategoryBudgetForm>({
    defaultValues: { alert_threshold: 80 },
  });

  const { register: regSavings, handleSubmit: handleSubmitSavings, reset: resetSavings, setValue: setValueSavings, formState: { errors: savingsErrors, isSubmitting: savingsSubmitting } } = useForm<SavingsGoalForm>({
    defaultValues: { currency: 'USD', current_amount: 0, color: '#0ea5e9' },
  });

  const { register: regContrib, handleSubmit: handleSubmitContrib, reset: resetContrib, setValue: setValueContrib, formState: { errors: contribErrors, isSubmitting: contribSubmitting } } = useForm<SavingsContributionForm>({
    defaultValues: { amount: 0 },
  });

  const onSubmitBudget = async (data: BudgetForm) => {
    try {
      if (editingBudget) {
        await updateBudget.mutateAsync({ id: editingBudget.id, updates: data });
      } else {
        await createBudget.mutateAsync(data);
      }
      setIsBudgetModalOpen(false);
      setEditingBudget(null);
      reset();
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  const onSubmitCategoryBudget = async (data: CategoryBudgetForm) => {
    try {
      if (editingCategoryBudget) {
        await updateCategoryBudget.mutateAsync({ id: editingCategoryBudget.id, updates: data });
      } else if (selectedBudgetId) {
        await createCategoryBudget.mutateAsync({ ...data, budget_id: selectedBudgetId });
      }
      setIsCategoryBudgetModalOpen(false);
      setEditingCategoryBudget(null);
      resetCat();
    } catch (error) {
      console.error('Failed to save category budget:', error);
    }
  };

  const onSubmitSavingsGoal = async (data: SavingsGoalForm) => {
    try {
      if (editingSavingsGoal) {
        await updateSavingsGoal.mutateAsync({ id: editingSavingsGoal.id, updates: data });
      } else {
        await createSavingsGoal.mutateAsync(data);
      }
      setIsSavingsGoalModalOpen(false);
      setEditingSavingsGoal(null);
      resetSavings();
    } catch (error) {
      console.error('Failed to save savings goal:', error);
    }
  };

  const onSubmitContribution = async (data: SavingsContributionForm) => {
    try {
      if (contributionGoalId) {
        await addContribution.mutateAsync({ ...data, savings_goal_id: contributionGoalId });
      }
      setIsContributionModalOpen(false);
      setContributionGoalId(null);
      resetContrib();
    } catch (error) {
      console.error('Failed to add contribution:', error);
    }
  };

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget);
    setValue('month', budget.month);
    setValue('amount', budget.amount);
    setValue('currency', budget.currency);
    setValue('alert_threshold', budget.alert_threshold);
    setIsBudgetModalOpen(true);
  };

  const handleEditCategoryBudget = (catBudget: any) => {
    setEditingCategoryBudget(catBudget);
    setValueCat('category', catBudget.category);
    setValueCat('amount', catBudget.amount);
    setValueCat('alert_threshold', catBudget.alert_threshold);
    setIsCategoryBudgetModalOpen(true);
  };

  const handleEditSavingsGoal = (goal: any) => {
    setEditingSavingsGoal(goal);
    setValueSavings('name', goal.name);
    setValueSavings('description', goal.description || '');
    setValueSavings('target_amount', goal.target_amount);
    setValueSavings('current_amount', goal.current_amount);
    setValueSavings('currency', goal.currency);
    setValueSavings('target_date', goal.target_date || '');
    setValueSavings('icon', goal.icon || '');
    setValueSavings('color', goal.color);
    setIsSavingsGoalModalOpen(true);
  };

  const handleAddContribution = (goal: any) => {
    setContributionGoalId(goal.id);
    setIsContributionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onChange={(value: string) => setActiveTab(value as 'budget' | 'savings')} tabs={[
        { value: 'budget', label: 'Budgets', icon: <PiggyBank className="w-4 h-4" /> },
        { value: 'savings', label: 'Savings Goals', icon: <Target className="w-4 h-4" /> },
      ]} fullWidth variant="glass" />

      {activeTab === 'budget' && (
        <BudgetTabContent
          currentMonth={currentMonth}
          currentBudget={currentBudget}
          budgetProgress={budgetProgress}
          budgets={budgets}
          budgetsLoading={budgetsLoading}
          categories={categories}
          categoryColors={categoryColors}
          formatCurrency={formatCurrency}
          format={format}
          isBudgetModalOpen={isBudgetModalOpen}
          setIsBudgetModalOpen={setIsBudgetModalOpen}
          editingBudget={editingBudget}
          setEditingBudget={setEditingBudget}
          isCategoryBudgetModalOpen={isCategoryBudgetModalOpen}
          setIsCategoryBudgetModalOpen={setIsCategoryBudgetModalOpen}
          editingCategoryBudget={editingCategoryBudget}
          setEditingCategoryBudget={setEditingCategoryBudget}
          selectedBudgetId={selectedBudgetId}
          setSelectedBudgetId={setSelectedBudgetId}
          reset={reset}
          resetCat={resetCat}
          handleEditBudget={handleEditBudget}
          handleEditCategoryBudget={handleEditCategoryBudget}
          deleteBudget={deleteBudget}
          createBudget={createBudget}
          updateBudget={updateBudget}
          deleteCategoryBudget={deleteCategoryBudget}
          budgetErrors={budgetErrors}
          budgetSubmitting={budgetSubmitting}
          catErrors={catErrors}
          catSubmitting={catSubmitting}
          register={register}
          regCat={regCat}
          handleSubmit={handleSubmit}
          handleSubmitCat={handleSubmitCat}
          setValue={setValue}
          setValueCat={setValueCat}
          onSubmitBudget={onSubmitBudget}
          onSubmitCategoryBudget={onSubmitCategoryBudget}
        />
      )}

      {activeTab === 'savings' && (
        <SavingsTabContent
          savingsGoals={savingsGoals}
          savingsLoading={savingsLoading}
          formatCurrency={formatCurrency}
          format={format}
          isSavingsGoalModalOpen={isSavingsGoalModalOpen}
          setIsSavingsGoalModalOpen={setIsSavingsGoalModalOpen}
          editingSavingsGoal={editingSavingsGoal}
          setEditingSavingsGoal={setEditingSavingsGoal}
          isContributionModalOpen={isContributionModalOpen}
          setIsContributionModalOpen={setIsContributionModalOpen}
          contributionGoalId={contributionGoalId}
          setContributionGoalId={setContributionGoalId}
          resetSavings={resetSavings}
          resetContrib={resetContrib}
          handleEditSavingsGoal={handleEditSavingsGoal}
          handleAddContribution={handleAddContribution}
          deleteSavingsGoal={deleteSavingsGoal}
          createSavingsGoal={createSavingsGoal}
          updateSavingsGoal={updateSavingsGoal}
          savingsErrors={savingsErrors}
          savingsSubmitting={savingsSubmitting}
          contribErrors={contribErrors}
          contribSubmitting={contribSubmitting}
          regSavings={regSavings}
          regContrib={regContrib}
          handleSubmitSavings={handleSubmitSavings}
          handleSubmitContrib={handleSubmitContrib}
          setValueSavings={setValueSavings}
          setValueContrib={setValueContrib}
          onSubmitSavingsGoal={onSubmitSavingsGoal}
          onSubmitContribution={onSubmitContribution}
        />
      )}
    </div>
  );
}

const budgetSchema = z.object({
  month: z.string().date(),
  amount: z.number().nonnegative(),
  currency: z.string().default('USD'),
  alert_threshold: z.number().min(0).max(100).default(80),
});

const categoryBudgetSchema = z.object({
  budget_id: z.string().uuid(),
  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other']),
  amount: z.number().nonnegative(),
  alert_threshold: z.number().min(0).max(100).default(80),
});

const savingsGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target_amount: z.number().positive(),
  current_amount: z.number().nonnegative().default(0),
  currency: z.string().default('USD'),
  target_date: z.string().date().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
});

const savingsContributionSchema = z.object({
  savings_goal_id: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().max(200).optional(),
});