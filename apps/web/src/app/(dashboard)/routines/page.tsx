'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Target, CheckCircle, RotateCcw, Trash2, Edit, MoreHorizontal, Sun, Moon, Calendar, Repeat, Clock } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Input, Select, Modal, Switch, Avatar, Progress
} from '@productivity-suite/ui';
import { useRoutines, useCreateRoutine, useUpdateRoutine, useDeleteRoutine, useCompleteRoutine, useToggleRoutineActive, useRoutineStats, useTodayRoutines } from '@productivity-suite/core';
import { routineSchema, RoutineForm, RoutineFrequency } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const frequencies: { value: RoutineFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
  { value: 'weekends', label: 'Weekends', description: 'Saturday and Sunday' },
  { value: 'custom', label: 'Custom', description: 'Specific days of the week' },
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RoutinesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const { data: routines, isLoading, refetch } = useRoutines();
  const { data: todayRoutines } = useTodayRoutines();
  const { data: stats } = useRoutineStats();

  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();
  const deleteRoutine = useDeleteRoutine();
  const completeRoutine = useCompleteRoutine();
  const toggleActive = useToggleRoutineActive();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoutineForm>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      frequency: 'daily',
      days_of_week: [],
      time_of_day: '',
    },
  });

  const frequency = watch('frequency');

  const onSubmit = async (data: RoutineForm) => {
    try {
      const routineData = {
        ...data,
        days_of_week: data.frequency === 'custom' ? selectedDays : [],
      };
      if (editingRoutine) {
        await updateRoutine.mutateAsync({ id: editingRoutine.id, updates: routineData });
      } else {
        await createRoutine.mutateAsync(routineData);
      }
      setIsModalOpen(false);
      setEditingRoutine(null);
      setSelectedDays([]);
      reset();
      refetch();
    } catch (error) {
      console.error('Failed to save routine:', error);
    }
  };

  const handleEdit = (routine: any) => {
    setEditingRoutine(routine);
    setValue('name', routine.name);
    setValue('description', routine.description || '');
    setValue('frequency', routine.frequency);
    setValue('time_of_day', routine.time_of_day || '');
    setSelectedDays(routine.days_of_week || []);
    setIsModalOpen(true);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const completedToday = todayRoutines?.filter(r => r.streak_count > 0).length || 0;
  const totalToday = todayRoutines?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Routines</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Build habits and track your daily routines</p>
        </div>
        <Button onClick={() => { setEditingRoutine(null); reset(); setSelectedDays([]); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          New Routine
        </Button>
      </div>

      {/* Today's Routines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today's Routines</CardTitle>
            <CardDescription>{completedToday} of {totalToday} completed • {format(new Date(), 'EEEE, MMMM d')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {todayRoutines && todayRoutines.length > 0 ? (
            <div className="space-y-3">
              {todayRoutines.map(routine => (
                <div key={routine.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-12 w-12 p-0"
                    onClick={() => completeRoutine.mutate(routine.id)}
                    disabled={routine.streak_count > 0}
                    aria-label={routine.streak_count > 0 ? 'Completed' : 'Mark complete'}
                  >
                    {routine.streak_count > 0 ? (
                      <CheckCircle className="w-6 h-6 text-success-500" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${routine.streak_count > 0 ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                      {routine.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {routine.time_of_day && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {routine.time_of_day}
                        </span>
                      )}
                      <Badge variant="outline" size="sm" className="capitalize">
                        {routine.frequency.replace('_', ' ')}
                      </Badge>
                      {routine.streak_count > 0 && (
                        <span className="flex items-center gap-1 text-success-600 dark:text-success-400">
                          <RotateCcw className="w-3 h-3" />
                          {routine.streak_count} day streak
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={e => { e.stopPropagation(); handleEdit(routine); }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">No routines for today</p>
              <Button onClick={() => { setEditingRoutine(null); reset(); setSelectedDays([]); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Create a routine
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Active Routines</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats?.active || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Completion Rate</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">{stats?.completion_rate?.toFixed(0) || 0}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Current Streak</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">{stats?.current_streak || 0} 🔥</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Longest Streak</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats?.longest_streak || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* All Routines */}
      <Card>
        <CardHeader>
          <CardTitle>All Routines</CardTitle>
          <CardDescription>Manage your recurring routines</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
            </div>
          ) : routines && routines.length > 0 ? (
            <div className="space-y-3">
              {routines.map(routine => (
                <div key={routine.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${!routine.is_active ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                        {routine.name}
                      </p>
                      <Badge variant={routine.is_active ? 'success' : 'default'} size="sm">
                        {routine.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">{routine.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      {routine.time_of_day && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {routine.time_of_day}
                        </span>
                      )}
                      <Badge variant="outline" size="sm" className="capitalize">
                        {routine.frequency.replace('_', ' ')}
                      </Badge>
                      {routine.frequency === 'custom' && routine.days_of_week.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {routine.days_of_week.map(d => daysOfWeek[d]).join(', ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-success-600 dark:text-success-400">
                        <RotateCcw className="w-3 h-3" />
                        {routine.streak_count} day streak
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={routine.is_active}
                      onChange={(e: { target: { checked: boolean } }) => toggleActive.mutate({ id: routine.id, is_active: e.target.checked })}
                      label=""
                      description=""
                    />
                    <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(routine)} />
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this routine?')) deleteRoutine.mutate(routine.id); }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">No routines yet</p>
              <Button onClick={() => { setEditingRoutine(null); reset(); setSelectedDays([]); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Create your first routine
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Routine Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRoutine(null); setSelectedDays([]); reset(); }}
        title={editingRoutine ? 'Edit Routine' : 'New Routine'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" placeholder="Morning meditation" error={errors.name?.message} {...register('name')} required />
          <Input label="Description (optional)" placeholder="What does this routine involve?" {...register('description')} />
          <Select
            label="Frequency"
            options={frequencies}
            error={errors.frequency?.message}
            {...register('frequency')}
            required
          />
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
          <Input
            label="Time of Day (optional)"
            type="time"
            error={errors.time_of_day?.message}
            {...register('time_of_day')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingRoutine(null); setSelectedDays([]); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingRoutine ? 'Save Changes' : 'Create Routine'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}