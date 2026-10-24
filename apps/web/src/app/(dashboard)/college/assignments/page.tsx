'use client';

import { useState } from 'react';
import { format, isBefore, isAfter } from 'date-fns';
import { Plus, BookOpen, Award, Edit, Trash2, Calendar, AlertTriangle, Filter, Download, Flag, Layout, List } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Input, Select, Modal, Textarea, Tabs, TabsList, TabsTrigger
} from '@productivity-suite/ui';
import {
  useAcademicTasks, useCreateAcademicTask,
  useUpdateAcademicTask, useDeleteAcademicTask, useSubjects, useCurrentAcademicTerm,
  AcademicTask, SubjectWithTerm, AcademicTaskType, taskSchemaBase
} from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@productivity-suite/ui';
import { ConfirmationModal } from '@productivity-suite/ui';

const academicTaskSchema = z.object({
  ...taskSchemaBase.omit({ due_date: true }).shape,
  due_date: z.string().datetime({ local: true }).optional().nullable(),
  subject_id: z.string().uuid().optional().nullable(),
  academic_type: z.enum(['assignment', 'exam', 'quiz', 'project', 'homework', 'other']).optional().nullable(),
  weight: z.number().min(0).max(100).optional().nullable(),
  score_obtained: z.number().min(0).optional().nullable(),
  max_score: z.number().positive().optional().nullable(),
  submission_date: z.string().datetime({ local: true }).optional().nullable(),
  is_graded: z.boolean().default(false),
});

const typeConfig: Record<AcademicTaskType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  exam: { label: 'Exam', icon: Award, color: 'text-danger-600 dark:text-danger-400', bgColor: 'bg-danger-100 dark:bg-danger-900/30' },
  quiz: { label: 'Quiz', icon: Award, color: 'text-warning-600 dark:text-warning-400', bgColor: 'bg-warning-100 dark:bg-warning-900/30' },
  assignment: { label: 'Assignment', icon: BookOpen, color: 'text-primary-600 dark:text-primary-400', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
  project: { label: 'Project', icon: Flag, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  homework: { label: 'Homework', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  other: { label: 'Other', icon: BookOpen, color: 'text-neutral-600 dark:text-neutral-400', bgColor: 'bg-neutral-100 dark:bg-neutral-800' },
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  high: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  medium: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  low: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
};

const statusColors: Record<string, string> = {
  todo: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
  in_progress: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  review: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  done: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  archived: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500',
};

function TaskCard({ task, subjects, onEdit, onDelete }: {
  task: AcademicTask;
  subjects: SubjectWithTerm[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const subject = task.subject_id ? subjects.find(s => s.id === task.subject_id) : null;
  const type = task.academic_type || 'other';
  const config = typeConfig[type];
  const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date()) && task.status !== 'done' && task.status !== 'archived';
  const daysUntil = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: config.bgColor.replace('bg-', 'bg-').replace('dark:bg-', 'dark:bg-') }}>
            <config.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-neutral-900 dark:text-white truncate">{task.title}</h3>
              <Badge variant="outline" size="sm" className={config.bgColor.replace('bg-', 'bg-').replace('dark:bg-', 'dark:bg-') + ' ' + config.color}>
                <config.icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              {subject && <Badge variant="primary" size="sm">{subject.code}</Badge>}
              <Badge variant="outline" size="sm" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
            </div>
            {task.description && <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">{task.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {task.due_date && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger-600 dark:text-danger-400 font-medium' : ''}`}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.due_date), 'MMM d, yyyy')}
                  {daysUntil !== null && daysUntil >= 0 && <span className="px-1.5 py-0.5 rounded text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{daysUntil === 0 ? 'Due today' : `${daysUntil}d left`}</span>}
                  {isOverdue && <AlertTriangle className="w-3 h-3" />}
                </span>
              )}
              {task.weight && (
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {task.weight}% weight
                  </span>
                </span>
              )}
              {task.score_obtained !== null && task.max_score && (
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded text-xs bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300">
                    {task.score_obtained}/{task.max_score} ({(task.score_obtained/task.max_score*100).toFixed(1)}%)
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" size="sm" className={statusColors[task.status]}>
            {task.status.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={onEdit} />
            <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={onDelete} />
          </div>
        </div>
      </div>
      {task.submission_date && task.status === 'done' && (
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
          Submitted: {format(new Date(task.submission_date), 'MMM d, yyyy h:mm a')}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, subjects, onEdit, onDelete }: {
  task: AcademicTask;
  subjects: SubjectWithTerm[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const subject = task.subject_id ? subjects.find(s => s.id === task.subject_id) : null;
  const type = task.academic_type || 'other';
  const config = typeConfig[type];
  const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date()) && task.status !== 'done' && task.status !== 'archived';
  
  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: config.bgColor }}>
            <config.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-white truncate max-w-xs">{task.title}</p>
            {subject && <p className="text-xs text-primary-600 dark:text-primary-400">{subject.code}</p>}
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-sm text-neutral-500 dark:text-neutral-400">
        <Badge variant="outline" size="sm" className={config.bgColor + ' ' + config.color}>
          <config.icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </td>
      <td className="py-3 px-3 text-sm text-neutral-900 dark:text-white font-mono">
        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy h:mm a') : 'No due date'}
        {isOverdue && <AlertTriangle className="w-3 h-3 ml-1 text-danger-500" />}
      </td>
      <td className="py-3 px-3 text-sm text-neutral-500 dark:text-neutral-400">
        {task.weight ? `${task.weight}%` : '—'}
      </td>
      <td className="py-3 px-3 text-sm">
        {task.score_obtained !== null && task.max_score ? (
          <span className="font-medium text-success-600 dark:text-success-400">
            {task.score_obtained}/{task.max_score} ({(task.score_obtained/task.max_score*100).toFixed(1)}%)
          </span>
        ) : task.is_graded ? (
          <span className="text-neutral-500 dark:text-neutral-400">Graded</span>
        ) : (
          <span className="text-neutral-400 dark:text-neutral-500">—</span>
        )}
      </td>
      <td className="py-3 px-3 text-sm">
        <Badge variant="outline" size="sm" className={statusColors[task.status]}>
          {task.status.replace('_', ' ')}
        </Badge>
      </td>
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={onEdit} />
          <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}

export default function CollegeAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'assignments' | 'exams' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'assignments' | 'exams' | 'upcoming');
  };
  
  const { data: currentTerm } = useCurrentAcademicTerm();
  const { data: subjects } = useSubjects(currentTerm?.id);
  const { data: allTasks } = useAcademicTasks({ subject_id: filterSubject || undefined });
  
  const createTask = useCreateAcademicTask();
  const updateTask = useUpdateAcademicTask();
  const deleteTask = useDeleteAcademicTask();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof academicTaskSchema>>({
    resolver: zodResolver(academicTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: null,
      estimated_minutes: null,
      tags: [],
      parent_task_id: null,
      subject_id: null,
      academic_type: 'assignment',
      weight: null,
      score_obtained: null,
      max_score: null,
      submission_date: null,
      is_graded: false,
    },
  });

  // Filter tasks based on active tab
  let filteredTasks = allTasks || [];
  if (activeTab === 'assignments') {
    filteredTasks = filteredTasks.filter(t => t.academic_type === 'assignment' || t.academic_type === 'homework' || t.academic_type === 'project');
  } else if (activeTab === 'exams') {
    filteredTasks = filteredTasks.filter(t => t.academic_type === 'exam' || t.academic_type === 'quiz');
  } else if (activeTab === 'upcoming') {
    filteredTasks = filteredTasks.filter(t => 
      t.due_date && 
      isAfter(new Date(t.due_date), new Date()) && 
      t.status !== 'done' && 
      t.status !== 'archived'
    ).sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime());
  }
  
  if (filterStatus) {
    filteredTasks = filteredTasks.filter(t => t.status === filterStatus);
  }

  const onSubmit = async (data: z.infer<typeof academicTaskSchema>) => {
    try {
      // Extract base task fields for the task hooks
      const baseTaskData = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date,
        estimated_minutes: data.estimated_minutes,
        tags: data.tags,
        parent_task_id: data.parent_task_id,
      };
      
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, updates: baseTaskData });
        toast({ type: 'success', title: 'Task updated' });
      } else {
        await createTask.mutateAsync(baseTaskData);
        toast({ type: 'success', title: 'Task created' });
      }
      setIsModalOpen(false);
      setEditingTask(null);
      reset();
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to save task' });
      console.error('Failed to save task:', error);
    }
  };

  const handleEdit = (task: AcademicTask) => {
    setEditingTask(task);
    setValue('title', task.title);
    setValue('description', task.description || '');
    setValue('status', task.status);
    setValue('priority', task.priority);
    setValue('due_date', task.due_date ? task.due_date.slice(0, 16) : '');
    setValue('estimated_minutes', task.estimated_minutes);
    setValue('tags', task.tags || []);
    setValue('subject_id', task.subject_id || '');
    setValue('academic_type', task.academic_type || 'assignment');
    setValue('weight', task.weight);
    setValue('score_obtained', task.score_obtained);
    setValue('max_score', task.max_score);
    setValue('submission_date', task.submission_date ? task.submission_date.slice(0, 16) : '');
    setValue('is_graded', task.is_graded);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteTask.mutateAsync(deleteConfirmId);
      toast({ type: 'success', title: 'Task deleted' });
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete task' });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const stats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'done').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    overdue: filteredTasks.filter(t => t.due_date && isBefore(new Date(t.due_date), new Date()) && t.status !== 'done' && t.status !== 'archived').length,
    exams: filteredTasks.filter(t => t.academic_type === 'exam' || t.academic_type === 'quiz').length,
    assignments: filteredTasks.filter(t => t.academic_type === 'assignment' || t.academic_type === 'homework' || t.academic_type === 'project').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Assignments & Exams</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Track all your academic work</p>
        </div>
        <Button onClick={() => { setEditingTask(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          Add Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">{stats.completed}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Completed</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.inProgress}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">In Progress</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">{stats.overdue}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Overdue</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">{stats.exams}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Exams/Quizzes</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.assignments}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Assignments</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Tabs value={activeTab} onChange={handleTabChange} className="flex-1">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="exams">Exams & Quizzes</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              options={[{ value: '', label: 'All Subjects' }, ...(subjects?.map(s => ({ value: s.id, label: s.code })) || [])]}
              placeholder="All Subjects"
              className="w-40"
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'review', label: 'Review' },
                { value: 'done', label: 'Done' },
              ]}
              placeholder="All Status"
              className="w-36"
            />
            <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>Filters</Button>
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>Export</Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon={viewMode === 'list' ? <List className="w-4 h-4" /> : <Layout className="w-4 h-4" />} 
              onClick={() => setViewMode(v => v === 'list' ? 'table' : 'list')}
            />
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length > 0 ? (
            viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subjects={subjects || []}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Task</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Type</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Due Date</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Weight</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Score</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Status</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        subjects={subjects || []}
                        onEdit={() => handleEdit(task)}
                        onDelete={() => handleDelete(task.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-2">No tasks found</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">
                {activeTab === 'upcoming' ? 'No upcoming deadlines - great job!' : 'Add your first assignment or exam'}
              </p>
              <Button onClick={() => { setEditingTask(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Add Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); reset(); }}
        title={editingTask ? 'Edit Task' : 'New Assignment/Exam'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Calculus Problem Set 3" error={errors.title?.message as string} {...register('title')} required />
          <Textarea label="Description (optional)" placeholder="Chapter 5, problems 1-20" {...register('description')} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Subject"
              options={[{ value: '', label: 'No Subject' }, ...(subjects?.map(s => ({ value: s.id, label: `${s.code} - ${s.name}` })) || [])]}
              error={errors.subject_id?.message as string}
              {...register('subject_id')}
            />
            <Select
              label="Type"
              options={[
                { value: 'assignment', label: 'Assignment' },
                { value: 'homework', label: 'Homework' },
                { value: 'project', label: 'Project' },
                { value: 'exam', label: 'Exam' },
                { value: 'quiz', label: 'Quiz' },
                { value: 'other', label: 'Other' },
              ]}
              error={errors.academic_type?.message as string}
              {...register('academic_type')}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Status"
              options={[
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'review', label: 'Review' },
                { value: 'done', label: 'Done' },
                { value: 'archived', label: 'Archived' },
              ]}
              error={errors.status?.message as string}
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
              error={errors.priority?.message as string}
              {...register('priority')}
              required
            />
            <Input
              label="Due Date"
              type="datetime-local"
              error={errors.due_date?.message as string}
              {...register('due_date')}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Weight %"
              type="number"
              min={0}
              max={100}
              step={0.1}
              error={errors.weight?.message as string}
              {...register('weight', { valueAsNumber: true })}
            />
            <Input
              label="Score Obtained"
              type="number"
              min={0}
              step={0.1}
              error={errors.score_obtained?.message as string}
              {...register('score_obtained', { valueAsNumber: true })}
            />
            <Input
              label="Max Score"
              type="number"
              min={0.1}
              step={0.1}
              error={errors.max_score?.message as string}
              {...register('max_score', { valueAsNumber: true })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Submission Date"
              type="datetime-local"
              error={errors.submission_date?.message as string}
              {...register('submission_date')}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_graded"
                {...register('is_graded')}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="is_graded" className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">Mark as Graded</label>
            </div>
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

      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteTask.isPending}
      />
    </div>
  );
}