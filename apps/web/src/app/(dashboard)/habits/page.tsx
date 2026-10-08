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
    register('name').setValue(habit.name);
    register('description').setValue(habit.description || '');
    register('frequency').setValue(habit.frequency);
    register('times_per_period').setValue(habit.times_per_period);
    register('reminder_time').setValue(habit.reminder_time || '');
    register('reminder_enabled').setValue(habit.reminder_enabled);
    register('color').setValue(habit.color);
    register('icon').setValue(habit.icon || '');
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

      <Tabs value={activeTab} onChange={setActiveTab} tabs={[
        { value: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
        { value: 'all', label: 'All Habits', icon: <Target className="w-4 h-4" /> },
        { value: 'stats', label: 'Statistics', icon: <Flame className="w-4 h-4" /> },
      ]} fullWidth />

      {activeTab === 'today' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Habits</CardTitle>
                <CardDescription>{format(new Date(), 'EEEE, MMMM d')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {todayHabits && todayHabits.length > 0 ? (
                <div className="space-y-3">
                  {todayHabits.map(th => {
                    const isComplete = th.is_completed;
                    const isSkipped = th.habit.archived_at ? false : false; // Would need skip data
                    return (
                      <div key={th.habit.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
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
                          <p className={`font-medium ${isComplete ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                            {th.habit.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            <Badge variant="outline" size="sm" className="capitalize">
                              {th.habit.frequency.replace('_', ' ')}
                            </Badge>
                            {th.habit.reminder_time && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {th.habit.reminder_time}
                              </span>
                            )}
                            {th.habit.times_per_period > 1 && (
                              <span>{th.completion_count}/{th.habit.times_per_period}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(th.habit)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">No habits for today</p>
                  <Button onClick={() => { setEditingHabit(null); setSelectedDays([]); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                    Create a habit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common habit actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => { setEditingHabit(null); setSelectedDays([]); reset(); setIsModalOpen(true); }}>
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">New Habit</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Habits</CardTitle>
                <CardDescription>Manage your recurring habits</CardDescription>
              </div>
              <Button onClick={() => { setEditingHabit(null); setSelectedDays([]); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                New Habit
              </Button>
            </CardHeader>
            <CardContent>
              {habitsLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
                </div>
              ) : habits && habits.length > 0 ? (
                <div className="space-y-3">
                  {habits.map(habit => (
                    <div key={habit.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${habit.color}20` }}>
                        {habit.icon ? <span className="text-2xl">{habit.icon}</span> : <Target className="w-6 h-6" style={{ color: habit.color }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${habit.archived_at ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                            {habit.name}
                          </p>
                          {habit.archived_at && <Badge variant="default" size="sm">Archived</Badge>}
                          {!habit.archived_at && <Badge variant="success" size="sm">Active</Badge>}
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">{habit.description || 'No description'}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                          <Badge variant="outline" size="sm" className="capitalize">
                            {habit.frequency.replace('_', ' ')}
                          </Badge>
                          {habit.frequency === 'custom' && habit.days_of_week.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {habit.days_of_week.map(d => daysOfWeek[d]).join(', ')}
                            </span>
                          )}
                          {habit.times_per_period > 1 && (
                            <Badge variant="outline" size="sm">{habit.times_per_period}x per period</Badge>
                          )}
                          {habit.reminder_time && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {habit.reminder_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {habit.archived_at ? (
                          <Button variant="ghost" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={() => handleRestore(habit.id)} />
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(habit)} />
                            <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleArchive(habit.id)} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">No habits yet</p>
                  <Button onClick={() => { setEditingHabit(null); setSelectedDays([]); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                    Create your first habit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {selectedHabitId ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Habit Statistics</CardTitle>
                    <CardDescription>Detailed analytics for your habit</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedHabitId(null)}>
                    <X className="w-4 h-4" />
                    Back to all habits
                  </Button>
                </CardHeader>
                <CardContent>
                  {allHabitsStats && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card padding="md" className="text-center">
                          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{allHabitsStats.total_completions}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Completions</p>
                        </Card>
                        <Card padding="md" className="text-center">
                          <p className="text-3xl font-bold text-success-600 dark:text-success-400">{allHabitsStats.current_streak}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Current Streak</p>
                        </Card>
                        <Card padding="md" className="text-center">
                          <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">{allHabitsStats.longest_streak}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Longest Streak</p>
                        </Card>
                        <Card padding="md" className="text-center">
                          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{allHabitsStats.completion_rate.toFixed(1)}%</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Completion Rate</p>
                        </Card>
                      </div>

                      {/* Heatmap */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Activity Heatmap ({heatmapYear})</h3>
                        <div className="flex items-center gap-2 mb-4">
                          <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setHeatmapYear(y => y - 1)} />
                          <span className="font-medium">{heatmapYear}</span>
                          <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={() => setHeatmapYear(y => y + 1)} />
                        </div>
                        <div className="flex flex-wrap gap-1" style={{ fontSize: '10px' }}>
                          {heatmapData?.map((day, index) => (
                            <div
                              key={day.date}
                              className={`w-4 h-4 rounded transition-colors ${
                                day.is_future ? 'bg-neutral-100 dark:bg-neutral-800' : 
                                day.intensity === 0 ? 'bg-neutral-200 dark:bg-neutral-700' :
                                day.intensity === 1 ? 'bg-primary-100 dark:bg-primary-900' :
                                day.intensity === 2 ? 'bg-primary-300 dark:bg-primary-700' :
                                day.intensity === 3 ? 'bg-primary-500 dark:bg-primary-500' :
                                'bg-primary-700 dark:bg-primary-300'
                              }`}
                              title={`${day.date}: ${day.count} completions`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-neutral-200 dark:bg-neutral-700" /> Less</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary-100 dark:bg-primary-900" /> More</div>
                        </div>
                      </div>

                      {/* Weekly breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Completions by Day of Week</h3>
                        <div className="grid grid-cols-7 gap-2">
                          {daysOfWeek.map((day, index) => (
                            <div key={day} className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{day}</p>
                              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                {allHabitsStats.completions_by_weekday[index] || 0}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Habit Statistics</CardTitle>
                <CardDescription>Select a habit to view detailed statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {habits?.map(habit => (
                    <Button
                      key={habit.id}
                      variant={selectedHabitId === habit.id ? 'primary' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => setSelectedHabitId(habit.id)}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${habit.color}20` }}>
                        {habit.icon ? <span className="text-xl">{habit.icon}</span> : <Target className="w-5 h-5" style={{ color: habit.color }} />}
                      </div>
                      <span className="text-sm font-medium">{habit.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Habit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingHabit(null); setSelectedDays([]); reset(); }} title={editingHabit ? 'Edit Habit' : 'New Habit'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" placeholder="Morning meditation" error={errors.name?.message} {...register('name')} required />
          <Textarea label="Description (optional)" placeholder="What does this habit involve?" {...register('description')} />
          <Select
            label="Frequency"
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'custom', label: 'Custom days' },
            ]}
            error={errors.frequency?.message}
            {...register('frequency')}
            required
          />
          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Times per Week</label>
              <Input type="number" min="1" max="7" step="1" error={errors.times_per_period?.message} {...register('times_per_period', { valueAsNumber: true })} />
            </div>
          )}
          {frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Days of Week</label>
              <div className="flex gap-2 flex-wrap">
                {daysOfWeek.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDays.includes(index)
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Reminder Time (optional)" type="time" error={errors.reminder_time?.message} {...register('reminder_time')} />
            <div className="flex items-center">
              <input type="checkbox" id="reminder_enabled" {...register('reminder_enabled')} className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500" />
              <label htmlFor="reminder_enabled" className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">Enable Reminder</label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Icon (emoji)" placeholder="🧘" {...register('icon')} />
            <Input label="Color" type="color" {...register('color')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingHabit(null); setSelectedDays([]); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingHabit ? 'Save Changes' : 'Create Habit'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}