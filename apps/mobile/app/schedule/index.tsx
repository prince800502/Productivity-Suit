import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { useScheduleEvents, useCreateScheduleEvent, useUpdateScheduleEvent, useDeleteScheduleEvent, useWeeklySchedule, useTodaySchedule, useHolidays, useCreateHoliday, useDeleteHoliday } from '@productivity-suite/core';
import { scheduleEventSchema, ScheduleEventForm, ScheduleEventType } from '@productivity-suite/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import { Input } from '@/components/Input';

const eventTypes: { value: ScheduleEventType; label: string; icon: string; color: string }[] = [
  { value: 'class', label: 'Class', icon: 'school', color: '#3b82f6' },
  { value: 'work', label: 'Work', icon: 'briefcase', color: '#22c55e' },
  { value: 'personal', label: 'Personal', icon: 'person', color: '#8b5cf6' },
  { value: 'appointment', label: 'Appointment', icon: 'medical', color: '#f59e0b' },
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleScreen() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: weeklySchedule } = useWeeklySchedule(format(weekStart, 'yyyy-MM-dd'));
  const { data: todaySchedule } = useTodaySchedule();
  const { data: holidays } = useHolidays();

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
    } catch (error) {
      Alert.alert('Error', 'Failed to save event');
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

  const todayEvents = todaySchedule?.events || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Schedule</Text>
            <Text style={styles.subtitle}>Manage your weekly schedule and classes</Text>
          </View>
          <Button onPress={() => { setEditingEvent(null); reset(); setIsModalOpen(true); }}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </Button>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity style={styles.weekNavButton} onPress={() => setWeekStart(subWeeks(weekStart, 1))} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#0ea5e9" />
          </TouchableOpacity>
          <View style={styles.weekNavCenter}>
            <Text style={styles.weekNavTitle}>
              {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </Text>
            <Text style={styles.weekNavSubtitle}>Week {format(weekStart, 'w')}</Text>
          </View>
          <TouchableOpacity style={styles.weekNavButton} onPress={() => setWeekStart(addWeeks(weekStart, 1))} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color="#0ea5e9" />
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View>
              <Text style={styles.todayTitle}>Today</Text>
              <Text style={styles.todaySubtitle}>
                {todayEvents.length} events • {todaySchedule?.is_holiday ? `Holiday: ${todaySchedule.holiday_name}` : format(new Date(), 'EEEE, MMMM d')}
              </Text>
            </View>
          </View>
          <View style={styles.todayContent}>
            {todayEvents.length > 0 ? (
              <View style={styles.todayList}>
                {todayEvents.map(event => (
                  <TouchableOpacity key={event.id} style={styles.todayEvent} onPress={() => handleEdit(event)} activeOpacity={0.8}>
                    <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventTime}>
                        {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                        {event.location && ` • ${event.location}`}
                      </Text>
                    </View>
                    <View style={[styles.eventTypeBadge, { backgroundColor: `${eventTypes.find(e => e.value === event.event_type)?.color}20` }]}>
                      <Text style={[styles.eventTypeBadgeText, { color: eventTypes.find(e => e.value === event.event_type)?.color }]}>{event.event_type}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyToday}>
                <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyTodayText}>
                  {todaySchedule?.is_holiday ? `Enjoy your holiday: ${todaySchedule.holiday_name}!` : 'No events scheduled for today'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Weekly View */}
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>Weekly View</Text>
            <Text style={styles.weeklySubtitle}>Tap a time slot to add event</Text>
          </View>
          <View style={styles.weeklyGrid}>
            {/* Day Headers */}
            <View style={styles.weeklyHeaderRow}>
              <View style={styles.timeColumnHeader} />
              {daysOfWeek.map((day, index) => {
                const dayDate = eachDayOfInterval({ start: startOfWeek(weekStart, { weekStartsOn: 1 }), end: endOfWeek(weekStart, { weekStartsOn: 1 }) })[index];
                const isHolidayDay = isHoliday(format(dayDate, 'yyyy-MM-dd'));
                const isTodayDay = isToday(dayDate);
                return (
                  <View key={day} style={styles.dayColumnHeader}>
                    <Text style={[styles.dayHeaderText, isTodayDay && styles.dayHeaderTextToday]}>{day}</Text>
                    <Text style={[styles.dayHeaderDate, isTodayDay && styles.dayHeaderDateToday]}>{format(dayDate, 'd')}</Text>
                    {isHolidayDay && <Text style={styles.holidayBadge}>🎉</Text>}
                  </View>
                );
              })}
            </View>
            {/* Time Slots */}
            <FlatList
              data={Array.from({ length: 28 }, (_, i) => i)}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item: hourIndex }) => {
                const hour = 6 + Math.floor(hourIndex / 2);
                const minute = hourIndex % 2 === 0 ? '00' : '30';
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                
                return (
                  <View style={styles.timeRow}>
                    <View style={styles.timeLabel}>
                      <Text style={styles.timeLabelText}>
                        {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:${minute} PM` : `${hour}:${minute} AM`}
                      </Text>
                    </View>
                    {daysOfWeek.map((_, dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={styles.timeSlot}
                        onPress={() => {
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
                        activeOpacity={0.7}
                      >
                        {weeklySchedule?.days[dayIndex]?.events
                          .filter((event: any) => {
                            const eventStart = event.start_time.slice(11, 16);
                            const eventEnd = event.end_time.slice(11, 16);
                            return eventStart <= timeStr && eventEnd > timeStr;
                          })
                          .map((event: any) => (
                            <TouchableOpacity
                              key={event.id}
                              style={[
                                styles.eventBlock,
                                { backgroundColor: event.color, top: 0, height: '100%' },
                              ]}
                              onPress={e => { e.stopPropagation(); handleEdit(event); }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.eventBlockTitle}>{event.title}</Text>
                              <Text style={styles.eventBlockTime}>{event.start_time.slice(11, 16)} - {event.end_time.slice(11, 16)}</Text>
                            </TouchableOpacity>
                          ))}
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }}
            />
          </View>
        </View>

        {/* Holidays */}
        <View style={styles.holidaysCard}>
          <View style={styles.holidaysHeader}>
            <Text style={styles.holidaysTitle}>Holidays</Text>
            <Button size="sm" onPress={() => { setHolidayName(''); setHolidayDate(format(new Date(), 'yyyy-MM-dd')); setShowHolidayModal(true); }}>
              <Ionicons name="add" size={16} color="#ffffff" /> Add Holiday
            </Button>
          </View>
          <View style={styles.holidaysContent}>
            {holidays && holidays.length > 0 ? (
              <View style={styles.holidaysList}>
                {holidays.slice(0, 10).map(holiday => (
                  <TouchableOpacity key={holiday.id} style={styles.holidayItem} onPress={() => handleEdit(holiday)} activeOpacity={0.8}>
                    <View style={styles.holidayIcon}><Ionicons name="calendar" size={24} color="#f59e0b" /></View>
                    <View style={styles.holidayContent}>
                      <Text style={styles.holidayTitle}>{holiday.name}</Text>
                      <Text style={styles.holidayDate}>{format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}</Text>
                    </View>
                    <TouchableOpacity onPress={e => { e.stopPropagation(); if (confirm('Delete this holiday?')) deleteHoliday.mutate(holiday.id); }} style={styles.holidayDelete}>
                      <Ionicons name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHolidays}>
                <Text style={styles.emptyHolidaysText}>No holidays added yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Event Modal */}
      {isModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'New Event'}</Text>
              <TouchableOpacity onPress={() => { setIsModalOpen(false); setEditingEvent(null); reset(); }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Input label="Title" placeholder="Math 101" error={errors.title?.message} {...register('title')} required />
                <Input label="Description (optional)" placeholder="Room 204, Prof. Smith" {...register('description')} />
                <Input label="Location (optional)" placeholder="Building A, Room 204" {...register('location')} />
                <View style={styles.modalRow}>
                  <Input style={styles.modalRowChild}
                    label="Start Time"
                    type="datetime-local"
                    error={errors.start_time?.message}
                    {...register('start_time')}
                    required
                  />
                  <Input style={styles.modalRowChild}
                    label="End Time"
                    type="datetime-local"
                    error={errors.end_time?.message}
                    {...register('end_time')}
                    required
                  />
                </View>
                <View style={styles.modalRow}>
                  <View style={[styles.modalSelect, styles.modalRowChild]}>
                    <Text style={styles.modalSelectLabel}>Day of Week</Text>
                    <View style={styles.selectContainer}>
                      {[
                        { value: 0, label: 'Monday' },
                        { value: 1, label: 'Tuesday' },
                        { value: 2, label: 'Wednesday' },
                        { value: 3, label: 'Thursday' },
                        { value: 4, label: 'Friday' },
                        { value: 5, label: 'Saturday' },
                        { value: 6, label: 'Sunday' },
                      ].map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.selectOption, watch('day_of_week') === opt.value && styles.selectOptionSelected]}
                          onPress={() => setValue('day_of_week', opt.value)}
                        >
                          <Text style={[styles.selectOptionText, watch('day_of_week') === opt.value && styles.selectOptionTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {errors.day_of_week && <Text style={styles.errorText}>{errors.day_of_week.message}</Text>}
                  </View>
                  <View style={[styles.modalSelect, styles.modalRowChild]}>
                    <Text style={styles.modalSelectLabel}>Event Type</Text>
                    <View style={styles.selectContainer}>
                      {eventTypes.map(e => (
                        <TouchableOpacity
                          key={e.value}
                          style={[styles.selectOption, watch('event_type') === e.value && styles.selectOptionSelected]}
                          onPress={() => setValue('event_type', e.value)}
                        >
                          <Text style={[styles.selectOptionText, watch('event_type') === e.value && styles.selectOptionTextActive]}>{e.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {errors.event_type && <Text style={styles.errorText}>{errors.event_type.message}</Text>}
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <View style={[styles.modalSelect, styles.modalRowChild]}>
                    <Text style={styles.modalSelectLabel}>Color</Text>
                    <View style={styles.colorInput}>
                      <Text style={styles.colorValue}>{watch('color')}</Text>
                    </View>
                  </View>
                  <View style={[styles.modalSelect, styles.modalRowChild]}>
                    <Text style={styles.modalSelectLabel}>Recurring</Text>
                    <TouchableOpacity
                      style={[styles.toggleButton, watch('is_recurring') && styles.toggleButtonActive]}
                      onPress={() => setValue('is_recurring', !watch('is_recurring'))}
                    >
                      <View style={[styles.toggleThumb, watch('is_recurring') && styles.toggleThumbActive]} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.modalActions}>
                  <Button variant="outline" style={styles.modalActionButton} onPress={() => { setIsModalOpen(false); setEditingEvent(null); reset(); }}>
                    <Text>Cancel</Text>
                  </Button>
                  <Button style={styles.modalActionButton} loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
                    <Text>{editingEvent ? 'Save Changes' : 'Create Event'}</Text>
                  </Button>
                </View>
              </form>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Holiday</Text>
              <TouchableOpacity onPress={() => setShowHolidayModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Input label="Name" placeholder="Winter Break" value={holidayName} onChangeText={setHolidayName} />
              <Input label="Date" type="date" value={holidayDate} onChangeText={setHolidayDate} />
              <View style={styles.modalActions}>
                <Button variant="outline" style={styles.modalActionButton} onPress={() => setShowHolidayModal(false)}>
                  <Text>Cancel</Text>
                </Button>
                <Button style={styles.modalActionButton} onPress={() => { createHoliday.mutate({ name: holidayName, date: holidayDate, is_recurring: false }); setShowHolidayModal(false); }}>
                  <Text>Add Holiday</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  weekNavButton: {
    padding: 8,
  },
  weekNavCenter: {
    alignItems: 'center',
  },
  weekNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  weekNavSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  todayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  todayHeader: {
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  todaySubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  todayContent: {},
  todayList: {
    gap: 8,
  },
  todayEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
  },
  eventColorBar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
  },
  eventContent: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  eventTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  eventTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyToday: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTodayText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  weeklyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  weeklyHeader: {
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  weeklySubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  weeklyGrid: {
    overflow: 'hidden',
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 8,
  },
  timeColumnHeader: {
    width: 60,
  },
  dayColumnHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  dayHeaderTextToday: {
    color: '#0ea5e9',
  },
  dayHeaderDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  dayHeaderDateToday: {
    color: '#0ea5e9',
  },
  holidayBadge: {
    fontSize: 10,
  },
  timeRow: {
    flexDirection: 'row',
  },
  timeLabel: {
    width: 60,
    paddingTop: 12,
    paddingRight: 8,
  },
  timeLabelText: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  timeSlot: {
    flex: 1,
    height: 40,
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
    position: 'relative',
  },
  eventBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 4,
    padding: 2,
    paddingHorizontal: 4,
  },
  eventBlockTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  eventBlockTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
  },
  holidaysCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  holidaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  holidaysTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  holidaysContent: {},
  holidaysList: {
    gap: 8,
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
  },
  holidayIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayContent: {
    flex: 1,
  },
  holidayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  holidayDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  holidayDelete: {
    padding: 8,
  },
  emptyHolidays: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHolidaysText: {
    fontSize: 14,
    color: '#9ca3af',
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
  modalSelect: {
    gap: 8,
  },
  modalSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectContainer: {
    gap: 4,
  },
  selectOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  selectOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#0ea5e9',
  },
  selectOptionText: {
    fontSize: 13,
    color: '#1a1a2e',
    textAlign: 'center',
  },
  selectOptionTextActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  colorInput: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  colorValue: {
    fontSize: 14,
    color: '#1a1a2e',
  },
  toggleButton: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#0ea5e9',
    alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleThumbActive: {
    // positioned by alignItems flex-end
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
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