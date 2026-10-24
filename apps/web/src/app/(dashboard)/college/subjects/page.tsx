'use client';

import { useState } from 'react';
import { Plus, BookOpen, Edit, Trash2, Target, Clock, AlertTriangle } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, Progress, Modal, Input, Select, Textarea
} from '@productivity-suite/ui';
import {
  useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useSubjectWithAttendance, useAcademicTerms, SubjectWithTerm, SubjectForm
} from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@productivity-suite/ui';
import { ConfirmationModal } from '@productivity-suite/ui';

const subjectSchema = z.object({
  academic_term_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  faculty: z.string().max(100).optional().nullable(),
  credits: z.number().int().positive().default(3),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
  icon: z.string().optional(),
  description: z.string().max(500).optional(),
  attendance_threshold: z.number().int().min(0).max(100).default(75),
});

const presetIcons = ['📚', '🧮', '🔬', '💻', '📝', '🎨', '🎵', '🏃', '🌍', '⚖️', '🧠', '💰'];

function SubjectCard({ subject, attendanceSummary, onEdit, onDelete }: {
  subject: SubjectWithTerm;
  attendanceSummary: { percentage: number; total_classes: number; attended: number; classes_needed_for_threshold: number; classes_can_miss: number } | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const percentage = attendanceSummary?.percentage ?? 100;
  const isBelowThreshold = attendanceSummary && percentage < subject.attendance_threshold;
  const totalClasses = attendanceSummary?.total_classes ?? 0;
  
  return (
    <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: subject.color }}>
            {subject.icon ? <span className="text-xl">{subject.icon}</span> : <BookOpen className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-neutral-900 dark:text-white truncate">{subject.name}</h3>
              <Badge variant="primary" size="sm">{subject.code}</Badge>
              {subject.faculty && <Badge variant="outline" size="sm">{subject.faculty}</Badge>}
              <Badge variant="outline" size="sm">{subject.credits} credits</Badge>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">{subject.description || 'No description'}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Threshold: {subject.attendance_threshold}%
              </span>
              {totalClasses > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {attendanceSummary?.attended}/{totalClasses} classes
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-32 flex-shrink-0">
            <Progress 
              value={percentage} 
              max={100} 
              size="sm" 
              showLabel 
              label={`${percentage.toFixed(1)}%`}
              className={isBelowThreshold ? 'text-danger-600' : ''}
            />
          </div>
          {isBelowThreshold && (
            <span className="flex items-center gap-1 text-danger-600 dark:text-danger-400 text-sm font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Below threshold
            </span>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={onEdit} />
            <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={onDelete} />
          </div>
        </div>
      </div>
      {totalClasses > 0 && attendanceSummary && (
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
          <span>Need {attendanceSummary.classes_needed_for_threshold} more classes to reach threshold</span>
          <span className="mx-2">•</span>
          <span>Can miss {attendanceSummary.classes_can_miss} more classes</span>
        </div>
      )}
    </div>
  );
}

export default function CollegeSubjectsPage() {
  const [activeTermId, setActiveTermId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithTerm | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { data: terms } = useAcademicTerms();
  const { data: subjects, isLoading } = useSubjects(activeTermId);
  const { data: selectedSubjectAttendance } = useSubjectWithAttendance(editingSubject?.id || '');
  
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubjectForm>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      academic_term_id: '',
      name: '',
      code: '',
      faculty: '',
      credits: 3,
      color: '#3b82f6',
      icon: '',
      description: '',
      attendance_threshold: 75,
    },
  });

  // Auto-select first term if none selected
  if (terms && terms.length > 0 && !activeTermId) {
    setActiveTermId(terms[0].id);
  }

  const onSubmit = async (data: SubjectForm) => {
    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.id, updates: data });
        toast({ type: 'success', title: 'Subject updated' });
      } else {
        await createSubject.mutateAsync(data);
        toast({ type: 'success', title: 'Subject created' });
      }
      setIsModalOpen(false);
      setEditingSubject(null);
      reset();
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to save subject' });
      console.error('Failed to save subject:', error);
    }
  };

  const handleEdit = (subject: SubjectWithTerm) => {
    setEditingSubject(subject);
    setValue('academic_term_id', subject.academic_term_id);
    setValue('name', subject.name);
    setValue('code', subject.code);
    setValue('faculty', subject.faculty || '');
    setValue('credits', subject.credits);
    setValue('color', subject.color);
    setValue('icon', subject.icon || '');
    setValue('description', subject.description || '');
    setValue('attendance_threshold', subject.attendance_threshold);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteSubject.mutateAsync(deleteConfirmId);
      toast({ type: 'success', title: 'Subject deleted' });
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete subject' });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Subjects</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage your subjects and track attendance</p>
        </div>
        <Button onClick={() => { setEditingSubject(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          Add Subject
        </Button>
      </div>

      {/* Term Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Academic Term:</label>
          <Select
            value={activeTermId}
            onChange={(e) => setActiveTermId(e.target.value)}
            options={terms?.map(t => ({ value: t.id, label: `${t.name} (${t.code})` })) || []}
            placeholder="Select a term"
          />
        </div>
      </Card>

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>
            {subjects?.length || 0} subject{subjects?.length !== 1 ? 's' : ''} in {terms?.find(t => t.id === activeTermId)?.name || 'selected term'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
            </div>
          ) : subjects && subjects.length > 0 ? (
            <div className="space-y-3">
              {subjects.map(subject => {
                const attendance = selectedSubjectAttendance;
                return (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    attendanceSummary={attendance?.attendance_summary || null}
                    onEdit={() => handleEdit(subject)}
                    onDelete={() => handleDelete(subject.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-2">No subjects yet</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-4">
                Add your first subject to start tracking attendance and assignments
              </p>
              <Button onClick={() => { setEditingSubject(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Add Subject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSubject(null); reset(); }}
        title={editingSubject ? 'Edit Subject' : 'New Subject'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Academic Term"
            options={terms?.map(t => ({ value: t.id, label: `${t.name} (${t.code})` })) || []}
            error={errors.academic_term_id?.message}
            {...register('academic_term_id')}
            required
          />
          <Input label="Subject Name" placeholder="Calculus I" error={errors.name?.message} {...register('name')} required />
          <Input label="Subject Code" placeholder="MATH101" error={errors.code?.message} {...register('code')} required maxLength={20} />
          <Input label="Faculty (optional)" placeholder="Prof. Smith" {...register('faculty')} />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Credits"
              type="number"
              min={1}
              max={6}
              error={errors.credits?.message}
              {...register('credits', { valueAsNumber: true })}
              required
            />
            <Input
              label="Attendance Threshold %"
              type="number"
              min={0}
              max={100}
              error={errors.attendance_threshold?.message}
              {...register('attendance_threshold', { valueAsNumber: true })}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register('color')}
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer"
                />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{watch('color')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-24">Icon</label>
            <div className="flex flex-wrap gap-1">
              {presetIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`p-2 rounded-lg text-2xl transition-all ${watch('icon') === icon 
                    ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' 
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                  onClick={() => setValue('icon', icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Description (optional)" placeholder="Course description..." {...register('description')} rows={3} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingSubject(null); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This will also delete all attendance records. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteSubject.isPending}
      />
    </div>
  );
}