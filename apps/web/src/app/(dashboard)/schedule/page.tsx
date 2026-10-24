'use client';

import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, GraduationCap, Clock, MapPin, MoreHorizontal, Edit, Trash2, Download, Upload, BookOpen } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Input, Select, Modal, Textarea
} from '@productivity-suite/ui';
import {
  useScheduleEvents, useCreateScheduleEvent, useUpdateScheduleEvent, useDeleteScheduleEvent,
  useWeeklySchedule, useTodaySchedule, useHolidays, useCreateHoliday, useDeleteHoliday,
  useSubjects, useCurrentAcademicTerm, ScheduleEvent, SubjectWithTerm
} from '@productivity-suite/core';
import { scheduleEventSchema, ScheduleEventForm, ScheduleEventType } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@productivity-suite/ui';

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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: currentTerm } = useCurrentAcademicTerm();
  const { data: subjects } = useSubjects(currentTerm?.id);
  const { data: weeklySchedule } = useWeeklySchedule(format(weekStart, 'yyyy-MM-dd'));
  const { data: todaySchedule } = useTodaySchedule();
  const { data: holidays } = useHolidays();
  const { toast } = useToast();

  const createEvent = useCreateScheduleEvent();
  const updateEvent = useUpdateScheduleEvent();
  const deleteEvent = useDeleteScheduleEvent();
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
      } else {
        await createEvent.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      reset();
      toast({ type: 'success', title: editingEvent ? 'Event updated' : 'Event created' });
    } catch (error: any) {
      console.error('Failed to save event:', error);
      toast({ type: 'error', title: 'Error', message: error.message || 'Failed to save event' });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Delete this event? This action cannot be undone.')) {
      try {
        await deleteEvent.mutateAsync(eventId);
        toast({ type: 'success', title: 'Event deleted' });
      } catch (error: any) {
        toast({ type: 'error', title: 'Error', message: error.message || 'Failed to delete event' });
      }
    }
  };

  const handleImportFile = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    try {
      const content = await importFile.text();
      const events: Omit<ScheduleEventForm, 'user_id'>[] = [];
      
      if (importFile.name.endsWith('.csv')) {
        // Parse CSV
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v: string) => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((h: string, idx: number) => { row[h] = values[idx] || ''; });
          
          if (row.title && row.start_time && row.end_time && row.day_of_week !== undefined) {
            events.push({
              title: row.title,
              description: row.description || '',
              location: row.location || '',
              start_time: row.start_time,
              end_time: row.end_time,
              day_of_week: parseInt(row.day_of_week, 10),
              color: row.color || '#3b82f6',
              is_recurring: row.is_recurring !== 'false',
              event_type: (row.event_type as ScheduleEventType) || 'class',
            });
          }
        }
      } else if (importFile.name.endsWith('.ics')) {
        // Basic ICS parsing
        const eventBlocks = content.split('BEGIN:VEVENT');
        for (let i = 1; i < eventBlocks.length; i++) {
          const block = eventBlocks[i];
          const getProp = (prop: string) => {
            const match = block.match(new RegExp(`${prop}:([^\r\n]*)`));
            return match ? match[1].trim() : '';
          };
          
          const summary = getProp('SUMMARY');
          const dtstart = getProp('DTSTART');
          const dtend = getProp('DTEND');
          const location = getProp('LOCATION');
          const description = getProp('DESCRIPTION');
          const rrule = getProp('RRULE');
          
          if (summary && dtstart && dtend) {
            // Parse ICS datetime format (YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS)
            const parseICSDate = (dateStr: string) => {
              const clean = dateStr.replace(/Z$/, '').replace(/-/g, '').replace(/:/g, '');
              if (clean.length >= 15) {
                return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}T${clean.slice(9,11)}:${clean.slice(11,13)}:${clean.slice(13,15)}`;
              }
              return '';
            };
            
            const startTime = parseICSDate(dtstart);
            const endTime = parseICSDate(dtend);
            const dayMatch = dtstart.match(/^(\d{8})T/);
            
            if (startTime && endTime && dayMatch) {
              const date = new Date(`${dayMatch[1].slice(0,4)}-${dayMatch[1].slice(4,6)}-${dayMatch[1].slice(6,8)}`);
              const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert to 0=Mon
              
              events.push({
                title: summary,
                description: description || '',
                location: location || '',
                start_time: startTime,
                end_time: endTime,
                day_of_week: dayOfWeek,
                color: '#3b82f6',
                is_recurring: !!rrule,
                event_type: 'class',
              });
            }
          }
        }
      }
      
      if (events.length === 0) {
        toast({ type: 'error', title: 'Error', message: 'No valid events found in file' });
        return;
      }
      
      // Create events in bulk
      for (let i = 0; i < events.length; i++) {
        await createEvent.mutateAsync(events[i]);
      }
      
      toast({ type: 'success', title: 'Success', message: `Imported ${events.length} events` });
      setShowImport(false);
      setImportFile(null);
    } catch (error: any) {
      console.error('Import failed:', error);
      toast({ type: 'error', title: 'Error', message: error.message || 'Import failed' });
    } finally {
      setIsImporting(false);
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

  const isHoliday = (date: string) => holidays?.some(h => h.date === date);

  // Today's Schedule content extracted to avoid JSX ternary parsing issues
  const todayScheduleContent = (() => {
    if (todaySchedule?.events && todaySchedule.events.length > 0) {
      return (
        <div className="space-y-3">
          {todaySchedule.events.map((event) => {
            const subject = subjects?.find((s) => s.id === event.subject_id);
            return (
              <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow">
                <div className="w-3 h-16 rounded-l-xl" style={{ backgroundColor: event.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-white">{event.title}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}</span>
                    {event.location && <span>â€¢ {event.location}</span>}
                    {subject && <span className="px-2 py-0.5 bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded">{subject.code}</span>}
                  </p>
                </div>
                <Badge variant="outline" size="sm" className="capitalize">{event.event_type}</Badge>
                <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(event)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteEvent(event.id)} />
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400">
          {todaySchedule?.is_holiday ? `Enjoy your holiday: ${todaySchedule.holiday_name}!` : 'No classes scheduled for today'}
        </p>
      </div>
    );
  })();

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
        <Card variant="default" glass={true} className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-primary-200/50 dark:border-primary-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-primary-700 dark:text-primary-300">{currentTerm.name}</p>
                <p className="text-sm text-primary-600 dark:text-primary-400">
                  {format(new Date(currentTerm.start_date), 'MMM d, yyyy')} - {format(new Date(currentTerm.end_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Navigation */}
      <Card variant="default" glass={true} className="p-4">
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
      <Card variant="default" glass={true}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today</CardTitle>
            <CardDescription>
              {todaySchedule?.events.length || 0} classes â€¢ {todaySchedule?.is_holiday ? `Holiday: ${todaySchedule.holiday_name}` : format(new Date(), 'EEEE, MMMM d')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {todayScheduleContent}
        </CardContent>
      </Card>

      {/* Weekly View */}
      <Card variant="default" glass={true}>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
          <CardDescription>Click a time slot to add or edit classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200/50 dark:border-neutral-800/50">
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
                          {isHolidayDay && <span className="text-xs text-warning-600 dark:text-warning-400">ðŸŽ‰</span>}
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
                  const nextTimeStr = `${(hour + (minute === '30' ? 1 : 0)).toString().padStart(2, '0')}:${minute === '30' ? '00' : '30'}`;

                  return (
                    <tr key={timeStr} className="border-b border-neutral-100/50 dark:border-neutral-800/50">
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
        <Card variant="default" glass={true}>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Your subjects for {currentTerm?.name || 'this term'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center gap-2 p-2 rounded-xl glass-card">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: subject.color }}>
                    {subject.icon ? <span className="text-sm">{subject.icon}</span> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{subject.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{subject.code} â€¢ {subject.credits} credits</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays */}
      <Card variant="default" glass={true}>
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
                <div key={holiday.id} className="flex items-center justify-between p-3 rounded-xl glass-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning-100/50 dark:bg-warning-900/30 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{holiday.name}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this holiday?')) deleteHoliday.mutate(holiday.id); }} />
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
        onClose={() => { setShowImport(false); setImportFile(null); }}
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
            onChange={e => e.target.files?.[0] && setImportFile(e.target.files[0])}
          />
          {importFile && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <div className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ICS/iCalendar files (.ics)</li>
              <li>CSV files with columns: title, start_time, end_time, day_of_week, description, location, color, event_type</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowImport(false); setImportFile(null); }}>Cancel</Button>
            <Button onClick={handleImportFile} disabled={!importFile || isImporting} loading={isImporting}>
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


