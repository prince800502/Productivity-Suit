'use client';

import React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Target, Flag, Edit, Trash2, CheckCircle, ChevronDown, ChevronUp, Link as LinkIcon, Calendar, AlertTriangle, List, Columns, X } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Badge, Progress, Modal, Tabs, Textarea
} from '@productivity-suite/ui';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useUpdateGoalProgress, useGoalMilestones, useCreateGoalMilestone, useUpdateGoalMilestone, useDeleteGoalMilestone, useGoalTaskLinks, useLinkTaskToGoal, useUnlinkTaskFromGoal, useGoalRoutineLinks, useLinkRoutineToGoal, useUnlinkRoutineFromGoal, GoalForm, GoalMilestoneForm } from '@productivity-suite/core';
import { useTasks } from '@productivity-suite/core';
import { useRoutines } from '@productivity-suite/core';
import { formatCurrency } from '@productivity-suite/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const goalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target_date: z.string().date().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().max(50).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
  parent_goal_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'completed', 'paused', 'archived', 'cancelled']).default('active'),
  progress: z.number().min(0).max(100).default(0),
});

const goalMilestoneSchema = z.object({
  goal_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target_date: z.string().date().optional().nullable(),
  order_index: z.number().int().nonnegative().default(0),
  is_completed: z.boolean().default(false),
  completed_at: z.string().datetime().optional().nullable(),
});

function GoalsListContent({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  goals,
  goalsLoading,
  refetch,
  goalTaskLinks,
  goalRoutineLinks,
  refetchTaskLinks,
  refetchRoutineLinks,
  tasks,
  routines,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  linkTaskToGoal,
  unlinkTaskFromGoal,
  linkRoutineToGoal,
  unlinkRoutineFromGoal,
  handleEditGoal,
  handleLinkTask,
  handleUnlinkTask,
  handleLinkRoutine,
  handleUnlinkRoutine,
}: any) {
  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Goals</CardTitle>
              <CardDescription>{goals?.length || 0} goals</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={<Columns className="w-4 h-4" />} onClick={() => setViewMode('board')}>
                Board
              </Button>
              <Button variant="outline" size="sm" icon={<List className="w-4 h-4" />} onClick={() => setViewMode('list')}>
                List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
              </div>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map(goal => {
                  const linkedTasks = goalTaskLinks?.filter(l => l.goal_id === goal.id) || [];
                  const linkedRoutines = goalRoutineLinks?.filter(l => l.goal_id === goal.id) || [];
                  return (
                    <div key={goal.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: goal.color }}>
                        {goal.icon ? <span className="text-xl">{goal.icon}</span> : <Flag className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900 dark:text-white">{goal.title}</h3>
                          <Badge variant={goal.priority === 'urgent' ? 'danger' : goal.priority === 'high' ? 'warning' : goal.priority === 'medium' ? 'primary' : 'default'} size="sm">
                            {goal.priority}
                          </Badge>
                          {goal.category && <Badge variant="outline" size="sm">{goal.category}</Badge>}
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">{goal.description || 'No description'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                          {goal.target_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(goal.target_date), 'MMM d, yyyy')}
                              {new Date(goal.target_date) < new Date() && goal.status !== 'completed' && <AlertTriangle className="w-3 h-3 text-warning-500" />}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {linkedTasks.length} tasks
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {linkedRoutines.length} routines
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={goal.progress} max={100} size="sm" className="w-32" />
                        <span className="text-sm font-medium w-10 text-right">{goal.progress}%</span>
                        <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEditGoal(goal)} />
                        <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this goal?')) deleteGoal.mutate(goal.id); }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Flag className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">No goals yet</p>
                <Button onClick={() => { setEditingGoal(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                  Create your first goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {['active', 'in_progress', 'review', 'done'].map(status => {
            const statusGoals = goals?.filter(g => g.status === status) || [];
            return (
              <Card key={status} className="w-72 flex-1 h-[calc(100vh-300px)] flex flex-col">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status === 'done' ? '#22c55e' : status === 'in_progress' ? '#3b82f6' : status === 'review' ? '#8b5cf6' : '#94a3b8' }} />
                    <CardTitle className="text-sm capitalize">{status.replace('_', ' ')}</CardTitle>
                    <Badge size="sm" variant="outline">{statusGoals.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="p-3 space-y-2 min-h-[200px]">
                    {statusGoals.map(goal => (
                      <div
                        key={goal.id}
                        className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer transition-colors"
                        onClick={() => handleEditGoal(goal)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: goal.color }}>
                            {goal.icon ? <span className="text-lg">{goal.icon}</span> : <Flag className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-neutral-900 dark:text-white">{goal.title}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                              <span>{goal.progress}%</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Badge size="sm" variant={goal.priority === 'urgent' ? 'danger' : goal.priority === 'high' ? 'warning' : goal.priority === 'medium' ? 'primary' : 'default'}>
                            {goal.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {statusGoals.length === 0 && (
                      <div className="p-3 text-center text-neutral-400 dark:text-neutral-500 text-sm">
                        No goals
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setEditingGoal(null); reset(); setValue('status', status); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4" />
                    Add Goal
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalsContent({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  goals,
  goalsLoading,
  refetch,
  goalTaskLinks,
  goalRoutineLinks,
  refetchTaskLinks,
  refetchRoutineLinks,
  tasks,
  routines,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  linkTaskToGoal,
  unlinkTaskFromGoal,
  linkRoutineToGoal,
  unlinkRoutineFromGoal,
  handleEditGoal,
  handleLinkTask,
  handleUnlinkTask,
  handleLinkRoutine,
  handleUnlinkRoutine,
  isModalOpen,
  setIsModalOpen,
  editingGoal,
  setEditingGoal,
  isMilestoneModalOpen,
  setIsMilestoneModalOpen,
  editingMilestone,
  setEditingMilestone,
  selectedGoalId,
  setSelectedGoalId,
  reset,
  resetMilestone,
  handleEditMilestone,
  handleMilestoneComplete,
  handleGoalProgressUpdate,
  register,
  regMilestone,
  handleSubmit,
  handleSubmitMilestone,
  setValue,
  onSubmit,
  onSubmitMilestone,
}: any) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Goals</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Track your long-term goals and milestones</p>
        </div>
        <Button onClick={() => { setEditingGoal(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          New Goal
        </Button>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={[
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'all', label: 'All' },
      ]} fullWidth />

      <div className="space-y-6">
        {viewMode === 'list' && <GoalsListContent {...{ activeTab, setActiveTab, viewMode, setViewMode, goals, goalsLoading, refetch, goalTaskLinks, goalRoutineLinks, refetchTaskLinks, refetchRoutineLinks, tasks, routines, createGoal, updateGoal, deleteGoal, updateGoalProgress, linkTaskToGoal, unlinkTaskFromGoal, linkRoutineToGoal, unlinkRoutineFromGoal, handleEditGoal, handleLinkTask, handleUnlinkTask, handleLinkRoutine, handleUnlinkRoutine }} />}

        {viewMode === 'board' && <GoalsListContent {...{ activeTab, setActiveTab, viewMode, setViewMode, goals, goalsLoading, refetch, goalTaskLinks, goalRoutineLinks, refetchTaskLinks, refetchRoutineLinks, tasks, routines, createGoal, updateGoal, deleteGoal, updateGoalProgress, linkTaskToGoal, unlinkTaskFromGoal, linkRoutineToGoal, unlinkRoutineFromGoal, handleEditGoal, handleLinkTask, handleUnlinkTask, handleLinkRoutine, handleUnlinkRoutine }} />}
      </div>

      {/* Create/Edit Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGoal(null); reset(); }} title={editingGoal ? 'Edit Goal' : 'New Goal'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Learn DSA" error={errors.title?.message} {...register('title')} required />
          <Textarea label="Description (optional)" placeholder="What does this goal involve?" {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'paused', label: 'Paused' },
                { value: 'archived', label: 'Archived' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              error={errors.status?.message}
              {...register('status')}
              required
            />
            <Select
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              error={errors.priority?.message}
              {...register('priority')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category (optional)" placeholder="Career, Health, Learning..." {...register('category')} />
            <Input label="Target Date (optional)" type="date" error={errors.target_date?.message} {...register('target_date')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Icon (emoji)" placeholder="🎯" {...register('icon')} />
            <Input label="Color" type="color" {...register('color')} />
          </div>
          <Input label="Progress" type="number" min="0" max="100" step="1" {...register('progress', { valueAsNumber: true })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingGoal(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Milestone Modal */}
      <Modal isOpen={isMilestoneModalOpen} onClose={() => { setIsMilestoneModalOpen(false); setEditingMilestone(null); resetMilestone(); }} title={editingMilestone ? 'Edit Milestone' : 'New Milestone'} size="md">
        <form onSubmit={handleSubmitMilestone(onSubmitMilestone)} className="space-y-4">
          <Input label="Title" placeholder="Complete DSA course" error={milestoneErrors.title?.message} {...regMilestone('title')} required />
          <Textarea label="Description (optional)" placeholder="What does this milestone involve?" {...regMilestone('description')} />
          <Input label="Target Date (optional)" type="date" error={milestoneErrors.target_date?.message} {...regMilestone('target_date')} />
          <Input label="Order Index" type="number" min="0" step="1" error={milestoneErrors.order_index?.message} {...regMilestone('order_index', { valueAsNumber: true })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="completed" {...regMilestone('is_completed')} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500" />
            <label htmlFor="completed" className="text-sm text-neutral-700 dark:text-neutral-300">Completed</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsMilestoneModalOpen(false); setEditingMilestone(null); resetMilestone(); }}>Cancel</Button>
            <Button type="submit" loading={milestoneSubmitting}>{editingMilestone ? 'Save Changes' : 'Create Milestone'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const { data: goals, isLoading: goalsLoading, refetch } = useGoals({ 
    status: activeTab === 'active' ? 'active' : activeTab === 'completed' ? 'completed' : undefined 
  });
  const { data: allGoals } = useGoals();
  const { data: tasks } = useTasks({ limit: 100 });
  const { data: routines } = useRoutines({ limit: 100 });

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const updateGoalProgress = useUpdateGoalProgress();

  const createGoalMilestone = useCreateGoalMilestone();
  const updateGoalMilestone = useUpdateGoalMilestone();
  const deleteGoalMilestone = useDeleteGoalMilestone();

  const { data: goalTaskLinks, refetch: refetchTaskLinks } = useGoalTaskLinks(selectedGoalId || '');
  const linkTaskToGoal = useLinkTaskToGoal();
  const unlinkTaskFromGoal = useUnlinkTaskFromGoal();

  const { data: goalRoutineLinks, refetch: refetchRoutineLinks } = useGoalRoutineLinks(selectedGoalId || '');
  const linkRoutineToGoal = useLinkRoutineToGoal();
  const unlinkRoutineFromGoal = useUnlinkRoutineFromGoal();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      status: 'active',
      priority: 'medium',
      progress: 0,
      color: '#0ea5e9',
    },
  });

  const { register: regMilestone, handleSubmit: handleSubmitMilestone, reset: resetMilestone, formState: { errors: milestoneErrors, isSubmitting: milestoneSubmitting } } = useForm<z.infer<typeof goalMilestoneSchema>>({
    resolver: zodResolver(goalMilestoneSchema),
    defaultValues: {
      is_completed: false,
      order_index: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof goalSchema>) => {
    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({ id: editingGoal.id, updates: data });
      } else {
        await createGoal.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingGoal(null);
      reset();
      refetch();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const onSubmitMilestone = async (data: z.infer<typeof goalMilestoneSchema>) => {
    try {
      if (editingMilestone) {
        await updateGoalMilestone.mutateAsync({ id: editingMilestone.id, updates: data });
      } else if (selectedGoalId) {
        await createGoalMilestone.mutateAsync({ ...data, goal_id: selectedGoalId });
      }
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
      resetMilestone();
    } catch (error) {
      console.error('Failed to save milestone:', error);
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setValue('title', goal.title);
    setValue('description', goal.description || '');
    setValue('target_date', goal.target_date || '');
    setValue('priority', goal.priority);
    setValue('category', goal.category || '');
    setValue('icon', goal.icon || '');
    setValue('color', goal.color);
    setValue('status', goal.status);
    setValue('progress', goal.progress);
    setValue('parent_goal_id', goal.parent_goal_id || '');
    setIsModalOpen(true);
  };

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone);
    regMilestone('title').setValue(milestone.title);
    regMilestone('description').setValue(milestone.description || '');
    regMilestone('target_date').setValue(milestone.target_date || '');
    regMilestone('order_index').setValue(milestone.order_index);
    regMilestone('is_completed').setValue(milestone.is_completed);
    setIsMilestoneModalOpen(true);
  };

  const handleMilestoneComplete = async (milestone: any) => {
    await updateGoalMilestone.mutateAsync({ 
      id: milestone.id, 
      updates: { 
        is_completed: !milestone.is_completed,
        completed_at: !milestone.is_completed ? new Date().toISOString() : null
      } 
    });
    refetch();
  };

  const handleGoalProgressUpdate = async (goal: any, progress: number) => {
    await updateGoalProgress.mutateAsync({ id: goal.id, progress: Math.max(0, Math.min(100, progress)) });
    refetch();
  };

  const handleLinkTask = (goalId: string, taskId: string) => {
    linkTaskToGoal.mutate({ goalId, taskId });
  };

  const handleUnlinkTask = (goalId: string, taskId: string) => {
    unlinkTaskFromGoal.mutate({ goalId, taskId });
  };

  const handleLinkRoutine = (goalId: string, routineId: string) => {
    linkRoutineToGoal.mutate({ goalId, routineId });
  };

  const handleUnlinkRoutine = (goalId: string, routineId: string) => {
    unlinkRoutineFromGoal.mutate({ goalId, routineId });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Goals</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Track your long-term goals and milestones</p>
        </div>
        <Button onClick={() => { setEditingGoal(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          New Goal
        </Button>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={[
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'all', label: 'All' },
      ]} fullWidth />

      <div className="space-y-6">
        {viewMode === 'list' && <GoalsListContent {...{ activeTab, setActiveTab, viewMode, setViewMode, goals, goalsLoading, refetch, goalTaskLinks, goalRoutineLinks, refetchTaskLinks, refetchRoutineLinks, tasks, routines, createGoal, updateGoal, deleteGoal, updateGoalProgress, linkTaskToGoal, unlinkTaskFromGoal, linkRoutineToGoal, unlinkRoutineFromGoal, handleEditGoal, handleLinkTask, handleUnlinkTask, handleLinkRoutine, handleUnlinkRoutine }} />}
        {viewMode === 'board' && <GoalsListContent {...{ activeTab, setActiveTab, viewMode, setViewMode, goals, goalsLoading, refetch, goalTaskLinks, goalRoutineLinks, refetchTaskLinks, refetchRoutineLinks, tasks, routines, createGoal, updateGoal, deleteGoal, updateGoalProgress, linkTaskToGoal, unlinkTaskFromGoal, linkRoutineToGoal, unlinkRoutineFromGoal, handleEditGoal, handleLinkTask, handleUnlinkTask, handleLinkRoutine, handleUnlinkRoutine }} />}
      </div>

      {/* Create/Edit Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGoal(null); reset(); }} title={editingGoal ? 'Edit Goal' : 'New Goal'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Learn DSA" error={errors.title?.message} {...register('title')} required />
          <Textarea label="Description (optional)" placeholder="What does this goal involve?" {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'paused', label: 'Paused' },
                { value: 'archived', label: 'Archived' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              error={errors.status?.message}
              {...register('status')}
              required
            />
            <Select
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              error={errors.priority?.message}
              {...register('priority')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category (optional)" placeholder="Career, Health, Learning..." {...register('category')} />
            <Input label="Target Date (optional)" type="date" error={errors.target_date?.message} {...register('target_date')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Icon (emoji)" placeholder="🎯" {...register('icon')} />
            <Input label="Color" type="color" {...register('color')} />
          </div>
          <Input label="Progress" type="number" min="0" max="100" step="1" {...register('progress', { valueAsNumber: true })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingGoal(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Milestone Modal */}
      <Modal isOpen={isMilestoneModalOpen} onClose={() => { setIsMilestoneModalOpen(false); setEditingMilestone(null); resetMilestone(); }} title={editingMilestone ? 'Edit Milestone' : 'New Milestone'} size="md">
        <form onSubmit={handleSubmitMilestone(onSubmitMilestone)} className="space-y-4">
          <Input label="Title" placeholder="Complete DSA course" error={milestoneErrors.title?.message} {...regMilestone('title')} required />
          <Textarea label="Description (optional)" placeholder="What does this milestone involve?" {...regMilestone('description')} />
          <Input label="Target Date (optional)" type="date" error={milestoneErrors.target_date?.message} {...regMilestone('target_date')} />
          <Input label="Order Index" type="number" min="0" step="1" error={milestoneErrors.order_index?.message} {...regMilestone('order_index', { valueAsNumber: true })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="completed" {...regMilestone('is_completed')} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500" />
            <label htmlFor="completed" className="text-sm text-neutral-700 dark:text-neutral-300">Completed</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsMilestoneModalOpen(false); setEditingMilestone(null); resetMilestone(); }}>Cancel</Button>
            <Button type="submit" loading={milestoneSubmitting}>{editingMilestone ? 'Save Changes' : 'Create Milestone'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
