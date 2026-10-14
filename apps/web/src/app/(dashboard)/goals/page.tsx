'use client';

import React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Target, Flag, Edit, Trash2, CheckCircle, ChevronDown, ChevronUp, Link as LinkIcon, Calendar, AlertTriangle, List, Columns, X, Repeat } from 'lucide-react';
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
  goal_id: z.string().uuid().optional().nullable(),
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
  setEditingGoal,
  reset,
  setIsModalOpen,
  setValue,
}: any) {
  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <Card variant="default" glass={true}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Goals</CardTitle>
              <CardDescription>{goals?.length || 0} goals</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon={<Columns className="w-4 h-4" />} onClick={() => setViewMode('board')}>
                Board
              </Button>
              <Button variant="ghost" size="sm" icon={<List className="w-4 h-4" />} onClick={() => setViewMode('list')}>
                List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse glass-card" />)}
              </div>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map((goal: { id: string; title: string; description: string | null; color: string; icon: string | null; priority: string; category: string | null; target_date: string | null; status: string; progress: number }) => {
                  const linkedTasks = goalTaskLinks?.filter((l: { goal_id: string }) => l.goal_id === goal.id) || [];
                  const linkedRoutines = goalRoutineLinks?.filter((l: { goal_id: string }) => l.goal_id === goal.id) || [];
                  return (
                    <div key={goal.id} className="flex items-center gap-4 p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow">
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
            const statusGoals = goals?.filter((g: { status: string }) => g.status === status) || [];
            return (
              <Card key={status} variant="default" glass={true} className="w-72 flex-1 h-[calc(100vh-300px)] flex flex-col">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status === 'done' ? '#22c55e' : status === 'in_progress' ? '#3b82f6' : status === 'review' ? '#8b5cf6' : '#94a3b8' }} />
                    <CardTitle className="text-sm capitalize">{status.replace('_', ' ')}</CardTitle>
                    <Badge size="sm" variant="outline">{statusGoals.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="p-3 space-y-2 min-h-[200px]">
                    {statusGoals.map((goal: { id: string; title: string; color: string; progress: number; priority: string; icon?: string | null }) => (
                      <div
                        key={goal.id}
                        className="p-3 glass-card hover:shadow-glass-hover transition-shadow cursor-pointer"
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

function GoalDetailContent({
  activeTab,
  setActiveTab,
  editingGoal,
  setEditingGoal,
  reset,
  goals,
  goalTaskLinks,
  goalRoutineLinks,
  tasks,
  routines,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  goalTaskLinksLoading,
  goalRoutineLinksLoading,
  handleEditGoal,
  handleLinkTask,
  handleUnlinkTask,
  handleLinkRoutine,
  handleUnlinkRoutine,
  setEditingGoalDetail,
  resetDetail,
  setIsModalOpenDetail,
  setValueDetail,
}: any) {
  if (!editingGoal) return null;

  return (
    <Modal
      isOpen={!!editingGoal}
      onClose={() => { setEditingGoalDetail(null); resetDetail(); }}
      title="Goal Details"
      size="lg"
    >
      <>
        <Tabs value={activeTab} onChange={(value: string) => setActiveTab(value as 'details' | 'milestones' | 'tasks' | 'routines')} tabs={[
          { value: 'details', label: 'Details', icon: <Flag className="w-4 h-4" /> },
          { value: 'milestones', label: 'Milestones', icon: <Target className="w-4 h-4" /> },
          { value: 'tasks', label: 'Tasks', icon: <Columns className="w-4 h-4" /> },
          { value: 'routines', label: 'Routines', icon: <Repeat className="w-4 h-4" /> },
        ]} fullWidth variant="glass" />

        {activeTab === 'details' && (
          <div className="space-y-6">
            <Card variant="default" glass={true}>
              <CardHeader>
                <CardTitle>Goal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: editingGoal.color }}>
                    {editingGoal.icon ? <span className="text-2xl">{editingGoal.icon}</span> : <Flag className="w-8 h-8" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">{editingGoal.title}</p>
                    <p className="text-neutral-500 dark:text-neutral-400">{editingGoal.description || 'No description'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Priority</p>
                    <Badge variant={editingGoal.priority === 'urgent' ? 'danger' : editingGoal.priority === 'high' ? 'warning' : editingGoal.priority === 'medium' ? 'primary' : 'default'} size="lg">
                      {editingGoal.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Status</p>
                    <Badge variant="outline" size="lg" className="capitalize">{editingGoal.status.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Progress</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{editingGoal.progress}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Target Date</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{editingGoal.target_date ? format(new Date(editingGoal.target_date), 'MMM d, yyyy') : 'Not set'}</p>
                  </div>
                </div>
                <Progress value={editingGoal.progress} max={100} showLabel label={`${editingGoal.progress}% complete`} size="lg" />
                <div className="flex items-center gap-3">
                  <Input
                    label="Update Progress"
                    type="number"
                    min={0}
                    max={100}
                    value={editingGoal.progress}
                    onChange={e => updateGoalProgress.mutate({ id: editingGoal.id, progress: Number(e.target.value) })}
                  />
                  <Button onClick={() => { setEditingGoalDetail(null); resetDetail(); }}>Back to List</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <Card variant="default" glass={true}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>Track major checkpoints toward your goal</CardDescription>
                </div>
                <Button onClick={() => { setValueDetail('goal_id', editingGoal.id); setIsModalOpenDetail(true); }} icon={<Plus className="w-4 h-4" />}>
                  Add Milestone
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">No milestones yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <Card variant="default" glass={true}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Linked Tasks</CardTitle>
                  <CardDescription>Tasks that contribute to this goal</CardDescription>
                </div>
                <Button variant="outline" size="sm" icon={<LinkIcon className="w-4 h-4" />} onClick={() => handleLinkTask(editingGoal.id)}>
                  Link Task
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">No linked tasks</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'routines' && (
          <div className="space-y-6">
            <Card variant="default" glass={true}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Linked Routines</CardTitle>
                  <CardDescription>Routines that support this goal</CardDescription>
                </div>
                <Button variant="outline" size="sm" icon={<Repeat className="w-4 h-4" />} onClick={() => handleLinkRoutine(editingGoal.id)}>
                  Link Routine
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">No linked routines</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    </Modal>
  );
}

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState<string>('list');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const { data: goals, isLoading: goalsLoading, refetch } = useGoals();
  const { data: goalTaskLinks } = useGoalTaskLinks('');
  const { data: goalRoutineLinks } = useGoalRoutineLinks('');
  const { data: tasks } = useTasks({ limit: 100 });
  const { data: routines } = useRoutines();

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const updateGoalProgress = useUpdateGoalProgress();
  const linkTaskToGoal = useLinkTaskToGoal();
  const unlinkTaskFromGoal = useUnlinkTaskFromGoal();
  const linkRoutineToGoal = useLinkRoutineToGoal();
  const unlinkRoutineFromGoal = useUnlinkRoutineFromGoal();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'active',
      priority: 'medium',
      color: '#0ea5e9',
    },
  });

  const onSubmit = async (data: GoalForm) => {
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

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setValue('title', goal.title);
    setValue('description', goal.description || '');
    setValue('status', goal.status);
    setValue('priority', goal.priority);
    setValue('category', goal.category || '');
    setValue('color', goal.color);
    setValue('icon', goal.icon || '');
    setValue('target_date', goal.target_date || '');
    setValue('progress', goal.progress);
    setIsModalOpen(true);
  };

  const handleLinkTask = (goalId: string) => {
    // @ts-ignore - goal_id is not in GoalForm type but needed for linking tasks
    setValue('goal_id', goalId);
    setIsModalOpen(true);
  };

  const handleLinkRoutine = (goalId: string) => {
    // @ts-ignore - goal_id is not in GoalForm type but needed for linking routines
    setValue('goal_id', goalId);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onChange={setActiveTab} tabs={[
        { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
        { value: 'board', label: 'Board', icon: <Columns className="w-4 h-4" /> },
      ]} fullWidth variant="glass" />

      {activeTab === 'list' && (
        <GoalsListContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
          goals={goals}
          goalsLoading={goalsLoading}
          refetch={refetch}
          goalTaskLinks={goalTaskLinks}
          goalRoutineLinks={goalRoutineLinks}
          refetchTaskLinks={refetch}
          refetchRoutineLinks={refetch}
          tasks={tasks}
          routines={routines}
          createGoal={createGoal}
          updateGoal={updateGoal}
          deleteGoal={deleteGoal}
          updateGoalProgress={updateGoalProgress}
          linkTaskToGoal={linkTaskToGoal}
          unlinkTaskFromGoal={unlinkTaskFromGoal}
          linkRoutineToGoal={linkRoutineToGoal}
          unlinkRoutineFromGoal={unlinkRoutineFromGoal}
          handleEditGoal={handleEditGoal}
          handleLinkTask={handleLinkTask}
          handleUnlinkTask={() => {}}
          handleLinkRoutine={handleLinkRoutine}
          handleUnlinkRoutine={() => {}}
          setEditingGoal={setEditingGoal}
          reset={reset}
          setIsModalOpen={setIsModalOpen}
          setValue={setValue}
        />
      )}

      {activeTab === 'board' && (
        <div className="space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(['active', 'completed', 'paused', 'archived', 'cancelled'] as const).map(status => {
              const statusGoals = goals?.filter((g: { status: string }) => g.status === status) || [];
              const statusColors: Record<string, string> = {
                active: '#3b82f6',
                completed: '#22c55e',
                paused: '#f59e0b',
                archived: '#6b7280',
                cancelled: '#ef4444',
              };
              return (
                <Card key={status} variant="default" glass={true} className="w-72 flex-1 h-[calc(100vh-300px)] flex flex-col">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                      <CardTitle className="text-sm capitalize">{status.replace('_', ' ')}</CardTitle>
                      <Badge size="sm" variant="outline">{statusGoals.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-0">
                    <div className="p-3 space-y-2 min-h-[200px]">
                      {statusGoals.map((goal: { id: string; title: string; color: string; progress: number; priority: string; icon?: string | null }) => (
                        <div
                          key={goal.id}
                          className="p-3 glass-card hover:shadow-glass-hover transition-shadow cursor-pointer"
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
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingGoal(null); reset(); }}
        title="New Goal"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Learn TypeScript" error={errors.title?.message} {...register('title')} required />
          <Textarea label="Description (optional)" placeholder="What do you want to achieve?" {...register('description')} rows={3} />
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
            <Input label="Target Date (optional)" type="date" error={errors.target_date?.message} {...register('target_date')} />
            <Input label="Category (optional)" placeholder="Personal, Work, Health..." {...register('category')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Icon (emoji)" placeholder="🎯" {...register('icon')} />
            <Input label="Color" type="color" {...register('color')} />
          </div>
          <Textarea label="Description (optional)" placeholder="What do you want to achieve?" {...register('description')} rows={3} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingGoal(null); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Goal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}