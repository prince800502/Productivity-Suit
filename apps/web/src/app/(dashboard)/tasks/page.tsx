'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Filter, Search, MoreHorizontal, CheckCircle, Flag, Calendar, Tag, GripVertical } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Badge, Modal, Tabs, Dropdown
} from '@productivity-suite/ui';
import { useToast } from '@productivity-suite/ui';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleTaskStatus, useTaskStats } from '@productivity-suite/core';
import { taskSchema, TaskForm, TaskStatus, TaskPriority } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { priorityColors, statusColors } from '@productivity-suite/ui';

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filters, setFilters] = useState<{ status: TaskStatus | ''; priority: TaskPriority | ''; search: string }>({ status: '', priority: '', search: '' });

  const { data: tasks, isLoading, refetch } = useTasks(filters as any);
  const { data: stats } = useTaskStats();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleStatus = useToggleTaskStatus();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'todo',
      priority: 'medium',
      tags: [],
      due_date: '',
    },
  });

  const onSubmit = async (data: TaskForm) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, updates: data });
      } else {
        await createTask.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingTask(null);
      reset();
      refetch();
      toast({ type: 'success', title: editingTask ? 'Task updated' : 'Task created' });
    } catch (error: any) {
      console.error('Failed to save task:', error);
      toast({ type: 'error', title: 'Error', message: error.message || 'Failed to save task' });
    }
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Delete this task? This action cannot be undone.')) {
      try {
        await deleteTask.mutateAsync(taskId);
        toast({ type: 'success', title: 'Task deleted' });
        refetch();
      } catch (error: any) {
        toast({ type: 'error', title: 'Error', message: error.message || 'Failed to delete task' });
      }
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setValue('title', task.title);
    setValue('description', task.description || '');
    setValue('status', task.status);
    setValue('priority', task.priority);
    // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
    const dueDate = task.due_date
      ? new Date(task.due_date).toISOString().slice(0, 16)
      : '';
    setValue('due_date', dueDate);
    setValue('estimated_minutes', task.estimated_minutes || '');
    setValue('tags', task.tags || []);
    setIsModalOpen(true);
  };

  const handleStatusChange = (task: any, newStatus: TaskStatus) => {
    toggleStatus.mutate({ id: task.id, status: newStatus });
  };

  const tasksByStatus = statusOptions.map(s => ({
    ...s,
    tasks: tasks?.filter(t => t.status === s.value) || [],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Tasks</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage your tasks and projects</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={view}
            onChange={e => setView(e.target.value as 'board' | 'list')}
            options={[
              { value: 'board', label: 'Kanban Board' },
              { value: 'list', label: 'List View' },
            ]}
            className="w-40 glass-input"
          />
          <Button onClick={() => { setEditingTask(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
            New Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="default" padding="md" glass={true}>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats?.total || 0}</p>
        </Card>
        <Card variant="default" padding="md" glass={true}>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Completed</p>
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">{stats?.completed || 0}</p>
        </Card>
        <Card variant="default" padding="md" glass={true}>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">In Progress</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats?.in_progress || 0}</p>
        </Card>
        <Card variant="default" padding="md" glass={true}>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Overdue</p>
          <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">{stats?.overdue || 0}</p>
        </Card>
      </div>

      {/* Kanban Board */}
      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {tasksByStatus.map(column => (
            <Card key={column.value} variant="default" glass={true} className="w-72 flex-1 h-[calc(100vh-300px)] flex flex-col">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusColors[column.value] }}
                  />
                  <CardTitle className="text-sm capitalize">{column.label}</CardTitle>
                  <Badge size="sm" variant="outline">{column.tasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="p-3 space-y-2 min-h-[200px]">
                  {column.tasks.map(task => (
                    <div
                      key={task.id}
                      className="p-3 glass-card hover:shadow-glass-hover transition-shadow cursor-pointer"
                      onClick={() => handleEdit(task)}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleStatusChange(task, task.status === 'done' ? 'todo' : 'done'); }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            task.status === 'done'
                              ? 'bg-success-500 border-success-500 text-white'
                              : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-500'
                          }`}
                        >
                          {task.status === 'done' && <CheckCircle className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Badge
                          size="sm"
                          variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'primary' : 'default'}
                        >
                          {task.priority}
                        </Badge>
                        {task.tags && task.tags.length > 0 && (
                          <Badge size="sm" variant="outline">
                            {task.tags[0]}
                            {task.tags.length > 1 && <span className="ml-1">+{task.tags.length - 1}</span>}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<MoreHorizontal className="w-4 h-4" />}
                          onClick={e => { e.stopPropagation(); handleDelete(task.id); }}
                          className="ml-auto"
                        />
                      </div>
                    </div>
                  ))}
                  {column.tasks.length === 0 && (
                    <div className="p-3 text-center text-neutral-400 dark:text-neutral-500 text-sm">
                      No tasks
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => { setEditingTask(null); reset(); setValue('status', column.value); setIsModalOpen(true); }}>
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card variant="default" glass={true}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>{tasks?.length || 0} tasks</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Search..." icon={<Search className="w-4 h-4" />} value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} className="w-64 glass-input" />
              <Select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as TaskStatus | '' }))} options={[{ value: '', label: 'All Status' }, ...statusOptions]} className="w-36 glass-input" />
              <Select value={filters.priority} onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value as TaskPriority | '' }))} options={[{ value: '', label: 'All Priority' }, ...priorityOptions]} className="w-36 glass-input" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse glass-card" />)}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow"
                    onClick={() => handleEdit(task)}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); handleStatusChange(task, task.status === 'done' ? 'todo' : 'done'); }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        task.status === 'done'
                          ? 'bg-success-500 border-success-500 text-white'
                          : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-500'
                      }`}
                    >
                      {task.status === 'done' && <CheckCircle className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        <Badge
                          size="sm"
                          variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'primary' : 'default'}
                        >
                          {task.priority}
                        </Badge>
                        {task.tags && task.tags.map((tag: string) => (
                          <Badge key={tag} size="sm" variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} onClick={e => { e.stopPropagation(); handleDelete(task.id); }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">No tasks found</p>
                <Button onClick={() => { setEditingTask(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                  Create your first task
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); reset(); }}
        title={editingTask ? 'Edit Task' : 'New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="What needs to be done?" error={errors.title?.message} {...register('title')} required />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              error={errors.status?.message}
              {...register('status')}
            />
            <Select
              label="Priority"
              options={priorityOptions}
              error={errors.priority?.message}
              {...register('priority')}
            />
          </div>
          <Input
            label="Due Date (optional)"
            type="datetime-local"
            error={errors.due_date?.message}
            {...register('due_date')}
          />
          <Input
            label="Estimated Minutes (optional)"
            type="number"
            placeholder="30"
            error={errors.estimated_minutes?.message}
            {...register('estimated_minutes', { valueAsNumber: true })}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Tags</label>
            <Input
              placeholder="Add tags (comma separated)"
              value={watch('tags')?.join(', ') || ''}
              onChange={e => setValue('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingTask(null); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}