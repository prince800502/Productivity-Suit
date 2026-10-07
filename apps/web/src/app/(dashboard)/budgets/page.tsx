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
import { categoryColors, categoryIcons, formatCurrency } from '@productivity-suite/ui';
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

// Budget Tab Component
function BudgetTabContent({
  activeTab,
  setActiveTab,
  currentMonth,
  currentBudget,
  budgetProgress,
  budgets,
  budgetsLoading,
  categories,
  categoryColors,
  categoryIcons,
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
      <Tabs value={activeTab} onChange={(value: string) => {}} tabs={[
        { value: 'budget', label: 'Budgets', icon: <PiggyBank className="w-4 h-4" /> },
        { value: 'savings', label: 'Savings Goals', icon: <Target className="w-4 h-4" /> },
      ]} fullWidth />

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Budgets</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Track your monthly spending against budgets</p>
          </div>
          <Button onClick={() => {}} icon={<Plus className="w-4 h-4" />}>
            New Budget
          </Button>
        </div>

        <div>Budget tab content placeholder</div>
      </div>
    </div>
  );
}

// Savings Tab Component
function SavingsTabContent({
  activeTab,
  setActiveTab,
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
  deleteSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  deleteContribution,
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
        <Button onClick={() => {}} icon={<Plus className="w-4 h-4" />}>
          New Goal
        </Button>
      </div>

      <div>Savings tab content placeholder</div>
    </div>
  );
}

export default function BudgetsPage() {
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

  const { register: regContrib, handleSubmit: handleSubmitContrib, reset: resetContrib, formState: { errors: contribErrors, isSubmitting: contribSubmitting } } = useForm<SavingsContributionForm>({
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
      ]} fullWidth />

      {activeTab === 'budget' && <BudgetTabContent />}
      {activeTab === 'savings' && <SavingsTabContent />}
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