'use client';

import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, GraduationCap, Clock, MapPin, Edit, Trash2, Download, BookOpen } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, Input, Select, Modal
} from '@productivity-suite/ui';
import {
  useCreateScheduleEvent, useUpdateScheduleEvent, useDeleteScheduleEvent,
  useWeeklySchedule, useTodaySchedule, useHolidays, useDeleteHoliday,
  useSubjects, useCurrentAcademicTerm, ScheduleEventType
} from '@productivity-suite/core';
import { scheduleEventSchema, ScheduleEventForm } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@productivity-suite/ui';
import { ConfirmationModal } from '@productivity-suite/ui';

const eventTypes: { value: ScheduleEventType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'class', label: 'Class', icon: GraduationCap, color: 'bg-blue-500' },
  { value: 'work', label: 'Work', icon: Calendar, color: 'bg-green-500' },
  { value: 'personal', label: 'Personal', icon: MapPin, color: 'bg-purple-500' },
  { value: 'appointment', label: 'Appointment', icon: Clock, color: 'bg-orange-500' },
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CollegeTimetablePage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'event' | 'holiday' | null>(null);
  
  const { data: currentTerm } = useCurrentAcademicTerm();
  const { data: subjects } = useSubjects(currentTerm?.id);
  const { data: weeklySchedule } = useWeeklySchedule(format(weekStart, 'yyyy-MM-dd'));
  const { data: todaySchedule } = useTodaySchedule();
  const { data: holidays } = useHolidays();

  const createEvent = useCreateScheduleEvent();
  const updateEvent = useUpdateScheduleEvent();
  const deleteEvent = useDeleteScheduleEvent();
  const deleteHoliday = useDeleteHoliday();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleEventForm>({
    resolver: zodResolver(scheduleEventSchema),
    defaultValues: {
      start_time: '',
      end_time: '',
      day_of_week: 0,
      color: '#3b82f6',
      is_recurring: true,
      event_type: 'class',
    },
  });

  const onSubmit = async (data: ScheduleEventForm) => {
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, updates: data });
        toast({ type: 'success', title: 'Event updated' });
      } else {
        await createEvent.mutateAsync(data);
        toast({ type: 'success', title: 'Event created' });
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      reset();
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to save event' });
      console.error('Failed to save event:', error);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setValue('title', event.title);
    setValue('description', event.description || '');
    setValue('location', event.location || '');
    setValue('start_time', event.start_time.slice(0, 16));
    setValue('end_time', event.end_time.slice(0, 16));
    setValue('day_of_week', event.day_of_week);
    setValue('color', event.color);
    setValue('is_recurring', event.is_recurring);
    setValue('event_type', event.event_type);
    setIsModalOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteEvent.mutateAsync(deleteConfirmId);
      toast({ type: 'success', title: 'Event deleted' });
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete event' });
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmType(null);
    }
  };

  const handleDeleteHoliday = (holidayId: string) => {
    setDeleteConfirmId(holidayId);
    setDeleteConfirmType('holiday');
  };

  const confirmDeleteHoliday = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteHoliday.mutateAsync(deleteConfirmId);
      toast({ type: 'success', title: 'Holiday deleted' });
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete holiday' });
    } finally {
      setDeleteConfirmId(null);
      setDeleteConfirmType(null);
    }
  };

  const isHoliday = (date: string) => holidays?.some(h => h.date === date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">College Timetable</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage your weekly class schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => setShowImport(true)}>
            Import
          </Button>
          <Button onClick={() => { setEditingEvent(null); reset(); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Class
          </Button>
        </div>
      </div>

      {/* Term Info */}
      {currentTerm && (
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4">
          <div className="flex items-center gap-4">
            <GraduationCap className="w-6 h-6" />
            <div>
              <p className="font-semibold">{currentTerm.name}</p>
              <p className="text-sm opacity-80">
                {format(new Date(currentTerm.start_date), 'MMM d, yyyy')} - {format(new Date(currentTerm.end_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Week Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setWeekStart(subWeeks(weekStart, 1))} />
          <div className="text-center">
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Week {format(weekStart, 'w')}</p>
          </div>
          <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={() => setWeekStart(addWeeks(weekStart, 1))} />
        </div>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today</CardTitle>
            <CardDescription>
              {todaySchedule?.events.length || 0} classes • {todaySchedule?.is_holiday ? `Holiday: ${todaySchedule.holiday_name}` : format(new Date(), 'EEEE, MMMM d')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {todaySchedule?.events && todaySchedule.events.length > 0 ? (
            <div className="space-y-3">
              {todaySchedule.events.map(event => {
                const subject = subjects?.find(s => s.id === event.subject_id);
                return (
                  <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <div className="w-3 h-16 rounded-l-lg" style={{ backgroundColor: event.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white">{event.title}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}</span>
                        {event.location && <span>• {event.location}</span>}
                        {subject && <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded">{subject.code}</span>}
                      </p>
                    </div>
                    <Badge variant="outline" size="sm" className="capitalize">{event.event_type}</Badge>
                    <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(event)} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">
                {todaySchedule?.is_holiday ? `Enjoy your holiday: ${todaySchedule.holiday_name}!` : 'No classes scheduled for today'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly View */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
          <CardDescription>Click a time slot to add or edit classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="w-24 py-2 px-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Time</th>
                  {daysOfWeek.map((day, index) => {
                    const dayDate = eachDayOfInterval({ start: startOfWeek(weekStart, { weekStartsOn: 1 }), end: endOfWeek(weekStart, { weekStartsOn: 1 }) })[index];
                    const isHolidayDay = isHoliday(format(dayDate, 'yyyy-MM-dd'));
                    const isTodayDay = isToday(dayDate);
                    return (
                      <th key={day} className="py-2 px-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                        <div className="flex flex-col items-center gap-1">
                          <span>{day}</span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-white">
                            {format(dayDate, 'd')}
                          </span>
                          {isHolidayDay && <span className="text-xs text-warning-600 dark:text-warning-400">🎉</span>}
                          {isTodayDay && <span className="text-xs text-primary-600 dark:text-primary-400">Today</span>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 28 }, (_, i) => i).map(hourIndex => {
                  const hour = 6 + Math.floor(hourIndex / 2);
                  const minute = hourIndex % 2 === 0 ? '00' : '30';
                  const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;

                  return (
                    <tr key={timeStr} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="w-24 py-1 px-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                        {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:${minute} PM` : `${hour}:${minute} AM`}
                      </td>
                      {daysOfWeek.map((_, dayIndex) => (
                        <td key={dayIndex} className="relative py-1 px-1 min-h-[60px]">
                          {weeklySchedule?.days[dayIndex]?.events
                            .filter((event: any) => {
                              const eventStart = event.start_time.slice(11, 16);
                              const eventEnd = event.end_time.slice(11, 16);
                              return eventStart <= timeStr && eventEnd > timeStr;
                            })
                            .map((event: any) => {
                              const eventStart = event.start_time.slice(11, 16);
                              const eventEnd = event.end_time.slice(11, 16);
                              const subject = subjects?.find(s => s.id === event.subject_id);
                              return (
                                <div
                                  key={event.id}
                                  className="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded-lg text-xs p-1.5 truncate cursor-pointer hover:scale-[1.02] transition-transform z-10"
                                  style={{
                                    backgroundColor: event.color,
                                    color: '#fff',
                                    zIndex: 10,
                                  }}
                                  onClick={() => handleEdit(event)}
                                >
                                  <p className="font-medium truncate">{event.title}</p>
                                  {subject && <p className="text-[10px] opacity-90 truncate">{subject.code}</p>}
                                  <p className="opacity-80 truncate">{eventStart} - {eventEnd}</p>
                                </div>
                              );
                            })}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute inset-0 h-full w-full p-0 opacity-0 hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const dayDate = eachDayOfInterval({ start: startOfWeek(weekStart, { weekStartsOn: 1 }), end: endOfWeek(weekStart, { weekStartsOn: 1 }) })[dayIndex];
                              setEditingEvent(null);
                              reset();
                              setValue('day_of_week', dayIndex);
                              setValue('start_time', `${format(dayDate, 'yyyy-MM-dd')}T${timeStr}`);
                              const nextHour = minute === '30' ? hour + 1 : hour;
                              const nextMinute = minute === '30' ? '00' : '30';
                              setValue('end_time', `${format(dayDate, 'yyyy-MM-dd')}T${nextHour.toString().padStart(2, '0')}:${nextMinute}`);
                              setIsModalOpen(true);
                            }}
                          >
                            <span className="sr-only">Add event</span>
                          </Button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Legend */}
      {subjects && subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Your subjects for {currentTerm?.name || 'this term'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: subject.color }}>
                    {subject.icon ? <span className="text-sm">{subject.icon}</span> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{subject.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{subject.code} • {subject.credits} credits</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Holidays</CardTitle>
            <CardDescription>Upcoming holidays and breaks</CardDescription>
          </div>
          <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowImport(true)}>
            Add Holiday
          </Button>
        </CardHeader>
        <CardContent>
          {holidays && holidays.length > 0 ? (
            <div className="space-y-2">
              {holidays.slice(0, 5).map(holiday => (
                <div key={holiday.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{holiday.name}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteHoliday(holiday.id)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">No holidays added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null); reset(); }}
        title={editingEvent ? 'Edit Class' : 'New Class'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Calculus I Lecture" error={errors.title?.message} {...register('title')} required />
          <Input label="Description (optional)" placeholder="Room 204, Prof. Smith" {...register('description')} />
          <Input label="Location (optional)" placeholder="Building A, Room 204" {...register('location')} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              error={errors.start_time?.message}
              {...register('start_time')}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              error={errors.end_time?.message}
              {...register('end_time')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Day of Week"
              options={[
                { value: '0', label: 'Monday' },
                { value: '1', label: 'Tuesday' },
                { value: '2', label: 'Wednesday' },
                { value: '3', label: 'Thursday' },
                { value: '4', label: 'Friday' },
                { value: '5', label: 'Saturday' },
                { value: '6', label: 'Sunday' },
              ]}
              error={errors.day_of_week?.message}
              {...register('day_of_week')}
              required
            />
            <Select
              label="Event Type"
              options={eventTypes.map(e => ({ value: e.value, label: e.label }))}
              error={errors.event_type?.message}
              {...register('event_type')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Color"
              type="color"
              {...register('color')}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="recurring"
                {...register('is_recurring')}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="recurring" className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">Recurring weekly</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingEvent(null); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingEvent ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import Schedule"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-neutral-600 dark:text-neutral-400">
            Upload an ICS (iCalendar) or CSV file to import your schedule.
          </p>
          <Input
            label="File"
            type="file"
            accept=".ics,.csv"
            onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
          <div className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ICS/iCalendar files (.ics)</li>
              <li>CSV files with columns: title, start_time, end_time, day_of_week, description, location, color, event_type</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button onClick={() => setShowImport(false)}>Import</Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        onClose={() => { setDeleteConfirmId(null); setDeleteConfirmType(null); }}
        onConfirm={deleteConfirmType === 'event' ? confirmDeleteEvent : confirmDeleteHoliday}
        title={deleteConfirmType === 'event' ? 'Delete Event' : 'Delete Holiday'}
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteConfirmType === 'event' ? deleteEvent.isPending : deleteHoliday.isPending}
      />
    </div>
  );
}

async function handleImport(file: File) {
  const content = await file.text();
  // Import logic would go here
  console.log('Import:', file.name, content.slice(0, 200));
}