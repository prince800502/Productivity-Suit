import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleTaskStatus, useTaskStats, useTodayTasks } from '@productivity-suite/core';
import { taskSchema, TaskForm, TaskStatus, TaskPriority } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import { Input } from '@/components/Input';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: '#6b7280' },
  { value: 'in_progress', label: 'In Progress', color: '#0ea5e9' },
  { value: 'review', label: 'Review', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#22c55e' },
  { value: 'archived', label: 'Archived', color: '#9ca3af' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#0ea5e9' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export default function TasksScreen() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [view, setView] = useState<'board' | 'list'>('list');
  const [filters, setFilters] = useState<{ status: TaskStatus | ''; priority: TaskPriority | ''; search: string }>({ status: '', priority: '', search: '' });
  const [refreshing, setRefreshing] = useState(false);

  const { data: tasks, isLoading, refetch } = useTasks(filters as any);
  const { data: stats } = useTaskStats();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleStatus = useToggleTaskStatus();

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
    } catch (error) {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setValue('title', task.title);
    setValue('description', task.description || '');
    setValue('status', task.status);
    setValue('priority', task.priority);
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

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask.mutate(id) },
    ]);
  };

  const tasksByStatus = statusOptions.map(s => ({
    ...s,
    tasks: tasks?.filter(t => t.status === s.value) || [],
  }));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>Manage your tasks and projects</Text>
          </View>
          <View style={styles.headerRight}>
            <Button variant="ghost" size="sm" onPress={() => { setEditingTask(null); reset(); setIsModalOpen(true); }}>
              <Ionicons name="add" size={20} color="#0ea5e9" />
            </Button>
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleButton, view === 'board' && styles.viewToggleButtonActive]}
            onPress={() => setView('board')}
          >
            <Ionicons name="grid" size={20} color={view === 'board' ? '#ffffff' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, view === 'list' && styles.viewToggleButtonActive]}
            onPress={() => setView('list')}
          >
            <Ionicons name="list" size={20} color={view === 'list' ? '#ffffff' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{stats?.total || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats?.completed || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>In Progress</Text>
            <Text style={[styles.statValue, { color: '#0ea5e9' }]}>{stats?.in_progress || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overdue</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats?.overdue || 0}</Text>
          </View>
        </View>

        {/* Kanban Board */}
        {view === 'board' && (
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardContainer}>
            {tasksByStatus.map(column => (
              <View key={column.value} style={styles.boardColumn}>
                <View style={styles.boardColumnHeader}>
                  <View style={styles.boardColumnTitle}>
                    <View style={[styles.statusDot, { backgroundColor: column.color }]} />
                    <Text style={styles.boardColumnTitleText}>{column.label}</Text>
                    <Text style={styles.boardColumnCount}>{column.tasks.length}</Text>
                  </View>
                </View>
                <View style={styles.boardColumnContent}>
                  {column.tasks.map(task => (
                    <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => handleEdit(task)} activeOpacity={0.8}>
                      <View style={styles.taskCardContent}>
                        <View style={styles.taskCardHeader}>
                          <TouchableOpacity
                            onPress={e => { e.stopPropagation(); handleStatusChange(task, task.status === 'done' ? 'todo' : 'done'); }}
                            style={[styles.taskCheckbox, task.status === 'done' && styles.taskCheckboxChecked]}
                          >
                            {task.status === 'done' && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.taskCardTitle, task.status === 'done' && styles.taskCardTitleCompleted]}>{task.title}</Text>
                        {task.due_date && (
                          <View style={styles.taskCardDue}>
                            <Ionicons name="calendar" size={12} color="#6b7280" />
                            <Text style={styles.taskCardDueText}>{format(new Date(task.due_date), 'MMM d')}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.taskCardFooter}>
                        <View style={[styles.priorityBadge, { backgroundColor: `${priorityOptions.find(p => p.value === task.priority)?.color}20` }]}>
                          <Text style={[styles.priorityBadgeText, { color: priorityOptions.find(p => p.value === task.priority)?.color }]}>{task.priority}</Text>
                        </View>
                        {task.tags && task.tags.length > 0 && (
                          <View style={styles.taskCardTags}>
                            <Text style={styles.taskCardTag}>{task.tags[0]}</Text>
                            {task.tags.length > 1 && <Text style={styles.taskCardTag}>+{task.tags.length - 1}</Text>}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                  {column.tasks.length === 0 && (
                    <View style={styles.emptyColumn}>
                      <Text style={styles.emptyColumnText}>No tasks</Text>
                    </View>
                  )}
                </View>
                <Button variant="ghost" size="sm" style={styles.addTaskButton} onPress={() => { setEditingTask(null); reset(); setValue('status', column.value); setIsModalOpen(true); }}>
                  <Ionicons name="add" size={16} color="#0ea5e9" /> Add Task
                </Button>
              </View>
            ))}
          </ScrollView>
        )}

        {/* List View */}
        {view === 'list' && (
          <View style={styles.listContainer}>
            {tasks && tasks.length > 0 ? (
              <View style={styles.list}>
                {tasks.map(task => (
                  <TouchableOpacity key={task.id} style={styles.listItem} onPress={() => handleEdit(task)} activeOpacity={0.8}>
                    <TouchableOpacity
                      onPress={e => { e.stopPropagation(); handleStatusChange(task, task.status === 'done' ? 'todo' : 'done'); }}
                      style={[styles.taskCheckbox, task.status === 'done' && styles.taskCheckboxChecked]}
                    >
                      {task.status === 'done' && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                    </TouchableOpacity>
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, task.status === 'done' && styles.taskCompleted]}>{task.title}</Text>
                      {task.due_date && (
                        <View style={styles.taskDueRow}>
                          <Ionicons name="calendar" size={14} color="#6b7280" />
                          <Text style={styles.taskDue}>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</Text>
                        </View>
                      )}
                      <View style={styles.taskMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: `${priorityOptions.find(p => p.value === task.priority)?.color}20` }]}>
                          <Text style={[styles.priorityBadgeText, { color: priorityOptions.find(p => p.value === task.priority)?.color }]}>{task.priority}</Text>
                        </View>
                        {task.tags && task.tags.map((tag: string) => (
                          <View key={tag} style={[styles.tagBadge, { backgroundColor: '#f3f4f6' }]}>
                            <Text style={styles.tagBadgeText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity onPress={e => { e.stopPropagation(); handleDelete(task.id); }} style={styles.deleteButton}>
                      <Ionicons name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No tasks found</Text>
                <Button size="sm" style={styles.emptyButton} onPress={() => { setEditingTask(null); reset(); setIsModalOpen(true); }}>
                  <Text>Create your first task</Text>
                </Button>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
              <TouchableOpacity onPress={() => { setIsModalOpen(false); setEditingTask(null); reset(); }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Input label="Title" placeholder="What needs to be done?" error={errors.title?.message} {...register('title')} required />
                <View style={styles.modalRow}>
                  <View style={styles.modalSelect}>
                    <Text style={styles.modalSelectLabel}>Status</Text>
                    <SelectOptions options={statusOptions} value={watch('status')} onChange={e => setValue('status', e.target.value as TaskStatus)} />
                    {errors.status && <Text style={styles.errorText}>{errors.status.message}</Text>}
                  </View>
                  <View style={styles.modalSelect}>
                    <Text style={styles.modalSelectLabel}>Priority</Text>
                    <SelectOptions options={priorityOptions} value={watch('priority')} onChange={e => setValue('priority', e.target.value as TaskPriority)} />
                    {errors.priority && <Text style={styles.errorText}>{errors.priority.message}</Text>}
                  </View>
                </View>
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
                <View style={styles.tagsInput}>
                  <Text style={styles.tagsLabel}>Tags (comma separated)</Text>
                  <Input
                    placeholder="work, personal, urgent"
                    value={watch('tags')?.join(', ') || ''}
                    onChangeText={text => setValue('tags', text.split(',').map(t => t.trim()).filter(Boolean))}
                  />
                </View>
                <View style={styles.modalActions}>
                  <Button variant="outline" style={styles.modalActionButton} onPress={() => { setIsModalOpen(false); setEditingTask(null); reset(); }}>
                    <Text>Cancel</Text>
                  </Button>
                  <Button style={styles.modalActionButton} loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
                    <Text>{editingTask ? 'Save Changes' : 'Create Task'}</Text>
                  </Button>
                </View>
              </form>
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// Simple select options component for mobile
interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectOptionsProps {
  options: SelectOption[];
  value: string;
  onChange: (e: { target: { value: string } }) => void;
}

function SelectOptions({ options, value, onChange }: SelectOptionsProps) {
  return (
    <View style={styles.selectContainer}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.selectOption, value === opt.value && styles.selectOptionSelected]}
          onPress={() => onChange({ target: { value: opt.value } })}
        >
          <Text style={[styles.selectOptionText, value === opt.value && { color: '#0ea5e9', fontWeight: '600' }]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingTop: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    width: '40%',
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  boardContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    minHeight: 400,
  },
  boardColumn: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    flex: 1,
  },
  boardColumnHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  boardColumnTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  boardColumnTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
  },
  boardColumnCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  boardColumnContent: {
    flex: 1,
    padding: 8,
    gap: 8,
    minHeight: 300,
  },
  taskCard: {
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  taskCardContent: {
    flex: 1,
  },
  taskCardHeader: {
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
  },
  taskCheckboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  taskCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  taskCardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskCardDue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  taskCardDueText: {
    fontSize: 11,
    color: '#6b7280',
  },
  taskCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskCardTags: {
    flexDirection: 'row',
    gap: 4,
  },
  taskCardTag: {
    fontSize: 10,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyColumn: {
    padding: 16,
    alignItems: 'center',
  },
  emptyColumnText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  addTaskButton: {
    margin: 12,
    marginTop: 8,
  },
  listContainer: {
    gap: 8,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  taskDue: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRowChild: {
    flex: 1,
  },
  tagsInput: {
    gap: 8,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalSelect: {
    flex: 1,
    gap: 8,
  },
  modalSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  selectContainer: {
    gap: 4,
  },
  selectOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  selectOptionSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#1a1a2e',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalActionButton: {
    flex: 1,
  },
});