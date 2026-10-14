'use client';

import React from 'react';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { Plus, Target, CheckCircle, RotateCcw, Trash2, Edit, Calendar, ChevronLeft, ChevronRight, X, Flame, Undo2 } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Input, Select, Modal, Textarea, Switch, Tabs
} from '@productivity-suite/ui';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit, useCompleteHabit, useUndoHabitCompletion, useHabitStreak, useHabitSkips, useSkipHabit, useUndoHabitSkip, useArchiveHabit, useRestoreHabit, useHabitStats, useTodayHabits, HabitForm, HabitCompletionForm, HabitSkipForm } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const habitSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  frequency: z.enum(['daily', 'weekly', 'custom']),
  days_of_week: z.array(z.number().min(0).max(6)).default([]),
  times_per_period: z.number().int().positive().default(1),
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  reminder_enabled: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0ea5e9'),
  icon: z.string().optional(),
});

const habitCompletionSchema = z.object({
  habit_id: z.string().uuid(),
  date: z.string().date(),
  count: z.number().int().positive().default(1),
  note: z.string().max(200).optional(),
  mood: z.number().int().min(1).max(5).optional(),
});

const habitSkipSchema = z.object({
  habit_id: z.string().uuid(),
  date: z.string().date(),
  reason: z.string().max(200).optional(),
});

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function TodayHabitsList({ todayHabits, handleCompleteHabit, handleUndoCompletion }: any) {
  if (!todayHabits || todayHabits.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">No habits for today</p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">Create a habit to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todayHabits.map((th: { habit: { id: string; color: string; icon?: string; name: string; times_per_period: number; frequency: string }; is_completed: boolean; completion_count?: number }) => {
        const isComplete = th.is_completed;
        return (
          <div key={th.habit.id} className="flex items-center gap-4 p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow">
            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-12 p-0"
              onClick={() => isComplete ? handleUndoCompletion(th.habit.id) : handleCompleteHabit(th.habit.id)}
              disabled={isComplete}
              aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
            >
              {isComplete ? (
                <CheckCircle className="w-6 h-6 text-success-500" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: th.habit.color }}>
                  {th.habit.icon ? <span className="text-lg">{th.habit.icon}</span> : <Target className="w-5 h-5" />}
                </div>
                <div>
                  <p className={`font-medium ${isComplete ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                    {th.habit.name}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {th.habit.times_per_period > 1 ? `${th.completion_count || 0}/${th.habit.times_per_period}` : isComplete ? 'Completed' : 'Not completed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm" className="capitalize">
                  {th.habit.frequency === 'daily' ? 'Daily' : th.habit.frequency === 'weekly' ? 'Weekly' : 'Custom'}
                </Badge>
                {th.habit.times_per_period > 1 && (
                  <Badge variant="primary" size="sm">
                    {th.completion_count || 0}/{th.habit.times_per_period}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AllHabitsList({ habits, habitsLoading, handleEdit, deleteHabit, selectedDays, setSelectedDays }: any) {
  if (habitsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse glass-card" />)}
      </div>
    );
  }

  if (habits && habits.length > 0) {
    return (
      <div className="space-y-3">
        {habits.map((habit: { id: string; color: string; icon?: string; name: string; frequency: string; times_per_period: number; description?: string; streak_count?: number; reminder_time?: string }) => (
          <div key={habit.id} className="flex items-center gap-4 p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: habit.color }}>
              {habit.icon ? <span className="text-xl">{habit.icon}</span> : <Target className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-neutral-900 dark:text-white">{habit.name}</h3>
                <Badge variant={habit.frequency === 'daily' ? 'primary' : habit.frequency === 'weekly' ? 'secondary' : 'outline'} size="sm">
                  {habit.frequency === 'daily' ? 'Daily' : habit.frequency === 'weekly' ? 'Weekly' : 'Custom'}
                </Badge>
                {habit.times_per_period > 1 && (
                  <Badge variant="outline" size="sm">{habit.times_per_period}x</Badge>
                )}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">{habit.description || 'No description'}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {habit.reminder_time && (
                  <span className="flex items-center gap-1">
                    <span>🔔</span>
                    {habit.reminder_time}
                  </span>
                )}
                <span className="flex items-center gap-1 text-success-600 dark:text-success-400">
                  <RotateCcw className="w-3 h-3" />
                  {habit.streak_count || 0} day streak
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(habit)} />
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this habit?')) deleteHabit.mutate(habit.id); }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
      <p className="text-neutral-500 dark:text-neutral-400 mb-4">No habits yet</p>
      <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">Create your first habit to start building streaks</p>
    </div>
  );
}

const StatsTabContent = ({ selectedHabitId, allHabitsStats, heatmapArray, heatmapYear, format, setHeatmapYear }: any) => (
  <div className="space-y-6">
    <Card variant="default" glass={true}>
      <CardHeader>
        <CardTitle>Habit Statistics</CardTitle>
        <CardDescription>Track your progress and streaks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass-card p-6 rounded-xl text-center">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Habits</p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{allHabitsStats?.total_habits || 0}</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Active Habits</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{allHabitsStats?.active_habits || 0}</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Longest Streak</p>
            <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">{allHabitsStats?.longest_streak || 0} days</p>
          </div>
        </div>

        {selectedHabitId && allHabitsStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Completion Rate</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{allHabitsStats.completion_rate?.toFixed(1) || 0}%</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Current Streak</p>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">{allHabitsStats.current_streak || 0} 🔥</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Completions</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{allHabitsStats.total_completions || 0}</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Best Streak</p>
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">{allHabitsStats.best_streak || 0}</p>
              </div>
            </div>

            {/* Heatmap */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Activity Heatmap ({heatmapYear})</h3>
              <div className="grid grid-cols-7 gap-1">
                {heatmapArray.map((day: { date: string; count: number; intensity: number; is_today: boolean; is_future: boolean }) => (
                  <div
                    key={day.date}
                    className="aspect-square rounded transition-colors cursor-pointer"
                    style={{
                      backgroundColor: day.is_future
                        ? 'transparent'
                        : day.intensity === 0
                        ? 'rgba(148, 163, 184, 0.15)'
                        : day.intensity === 1
                        ? 'rgba(59, 130, 246, 0.3)'
                        : day.intensity === 2
                        ? 'rgba(59, 130, 246, 0.5)'
                        : day.intensity === 3
                        ? 'rgba(59, 130, 246, 0.7)'
                        : 'rgba(59, 130, 246, 0.9)',
                      border: day.is_today ? '2px solid #3b82f6' : 'none',
                      borderRadius: '4px',
                    }}
                    title={`${format(new Date(day.date), 'MMM d, yyyy')}: ${day.count} completion${day.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'stats'>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());

  const { data: habits, isLoading: habitsLoading, refetch } = useHabits();
  const { data: todayHabits } = useTodayHabits();
  const { data: allHabitsStats } = useHabitStats(selectedHabitId || '');
  const { data: heatmapData } = useHabitStats(selectedHabitId || '');

  const heatmapArray = heatmapData?.heatmap_data || [];

  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const completeHabit = useCompleteHabit();
  const undoHabitCompletion = useUndoHabitCompletion();
  const skipHabit = useSkipHabit();
  const undoHabitSkip = useUndoHabitSkip();
  const archiveHabit = useArchiveHabit();
  const restoreHabit = useRestoreHabit();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof habitSchema>>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      frequency: 'daily',
      days_of_week: [],
      times_per_period: 1,
      reminder_enabled: true,
      color: '#0ea5e9',
    },
  });

  const frequency = watch('frequency');

  const onSubmit = async (data: z.infer<typeof habitSchema>) => {
    try {
      const habitData = {
        ...data,
        days_of_week: data.frequency === 'custom' ? selectedDays : [],
      };
      if (editingHabit) {
        await updateHabit.mutateAsync({ id: editingHabit.id, updates: habitData });
      } else {
        await createHabit.mutateAsync(habitData);
      }
      setIsModalOpen(false);
      setEditingHabit(null);
      setSelectedDays([]);
      reset();
      refetch();
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  };

  const handleEdit = (habit: any) => {
    setEditingHabit(habit);
    setValue('name', habit.name);
    setValue('description', habit.description || '');
    setValue('frequency', habit.frequency);
    setValue('times_per_period', habit.times_per_period);
    setValue('reminder_time', habit.reminder_time || '');
    setValue('reminder_enabled', habit.reminder_enabled);
    setValue('color', habit.color);
    setValue('icon', habit.icon || '');
    setSelectedDays(habit.days_of_week || []);
    setIsModalOpen(true);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleCompleteHabit = async (habitId: string, date: string = format(new Date(), 'yyyy-MM-dd')) => {
    await completeHabit.mutateAsync({ habit_id: habitId, date, count: 1 });
    refetch();
  };

  const handleUndoCompletion = async (habitId: string, date: string = format(new Date(), 'yyyy-MM-dd')) => {
    await undoHabitCompletion.mutateAsync({ habitId, date });
    refetch();
  };

  const handleSkipHabit = async (habitId: string, date: string = format(new Date(), 'yyyy-MM-dd')) => {
    await skipHabit.mutateAsync({ habit_id: habitId, date, reason: '' });
    refetch();
  };

  const handleUndoSkip = async (habitId: string, date: string = format(new Date(), 'yyyy-MM-dd')) => {
    await undoHabitSkip.mutateAsync({ habitId, date });
    refetch();
  };

  const handleArchive = async (id: string) => {
    if (confirm('Archive this habit?')) {
      await archiveHabit.mutateAsync(id);
      refetch();
    }
  };

  const handleRestore = async (id: string) => {
    await restoreHabit.mutateAsync(id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Habits</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Build habits and track your daily routines</p>
        </div>
        <Button onClick={() => { setEditingHabit(null); setSelectedDays([]); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          New Habit
        </Button>
      </div>

      <Tabs value={activeTab} onChange={(value: string) => setActiveTab(value as 'today' | 'all' | 'stats')} tabs={[
        { value: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
        { value: 'all', label: 'All Habits', icon: <Target className="w-4 h-4" /> },
        { value: 'stats', label: 'Statistics', icon: <Flame className="w-4 h-4" /> },
      ]} fullWidth variant="glass" />

      {activeTab === 'today' && (
        <div className="space-y-6">
          <Card variant="default" glass={true}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Habits</CardTitle>
                <CardDescription>{format(new Date(), 'EEEE, MMMM d')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <TodayHabitsList 
                todayHabits={todayHabits} 
                handleCompleteHabit={handleCompleteHabit} 
                handleUndoCompletion={handleUndoCompletion} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-6">
          <Card variant="default" glass={true}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Habits</CardTitle>
                <CardDescription>{habits?.length || 0} habits total</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AllHabitsList 
                habits={habits} 
                habitsLoading={habitsLoading} 
                handleEdit={handleEdit} 
                deleteHabit={deleteHabit} 
                selectedDays={selectedDays} 
                setSelectedDays={setSelectedDays}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'stats' && (
        <StatsTabContent 
          selectedHabitId={selectedHabitId}
          setSelectedHabitId={setSelectedHabitId}
          allHabitsStats={allHabitsStats}
          heatmapArray={heatmapData?.heatmap_data || []}
          heatmapYear={heatmapYear}
          setHeatmapYear={setHeatmapYear}
          format={format}
        />
      )}

      {/* Create/Edit Habit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingHabit(null); setSelectedDays([]); reset(); }}
        title={editingHabit ? 'Edit Habit' : 'New Habit'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" placeholder="Morning meditation" error={errors.name?.message} {...register('name')} required />
          <Input label="Description (optional)" placeholder="What does this habit involve?" {...register('description')} />
          <Select
            label="Frequency"
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'custom', label: 'Custom' },
            ]}
            error={errors.frequency?.message}
            {...register('frequency')}
            required
          />
          <Input label="Times per period" type="number" min={1} max={10} error={errors.times_per_period?.message} {...register('times_per_period', { valueAsNumber: true })} />
          {frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Days of Week</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day, index) => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(index)}
                      onChange={e => e.target.checked ? setSelectedDays([...selectedDays, index]) : setSelectedDays(selectedDays.filter(d => d !== index))}
                      className="w-4 h-4 rounded border-neutral-300/50 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              label="Reminder Time (optional)"
              type="time"
              {...register('reminder_time')}
              placeholder="HH:MM"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('reminder_enabled')}
                className="w-4 h-4 rounded border-neutral-300/50 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Enable reminder</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Icon (emoji)" placeholder="🧘" {...register('icon')} />
            <Input label="Color" type="color" {...register('color')} />
          </div>
          <Input label="Description (optional)" placeholder="What does this habit involve?" {...register('description')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingHabit(null); setSelectedDays([]); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}