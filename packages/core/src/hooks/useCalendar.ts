import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  CalendarSource, CalendarEvent, CalendarSyncLog,
  CalendarSourceForm, CalendarEventForm, CalendarProvider,
  CalendarDay, CalendarWeek, CalendarMonth,
  CalendarAttendee, CalendarReminder
} from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, isSameDay, isSameMonth } from 'date-fns';

// Query keys
export const calendarKeys = {
  all: ['calendar'] as const,
  sources: () => [...calendarKeys.all, 'sources'] as const,
  source: (id: string) => [...calendarKeys.sources(), id] as const,
  events: (filters: Record<string, unknown>) => [...calendarKeys.all, 'events', filters] as const,
  event: (id: string) => [...calendarKeys.all, 'event', id] as const,
  weekly: (weekStart: string) => [...calendarKeys.all, 'weekly', weekStart] as const,
  monthly: (month: string) => [...calendarKeys.all, 'monthly', month] as const,
  daily: (date: string) => [...calendarKeys.all, 'daily', date] as const,
  syncLog: (sourceId: string) => [...calendarKeys.all, 'sync-log', sourceId] as const,
  today: () => [...calendarKeys.all, 'today'] as const,
};

// ============================================================
// CALENDAR SOURCES
// ============================================================

export function useCalendarSources() {
  return useQuery({
    queryKey: calendarKeys.sources(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_sources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CalendarSource[];
    },
  });
}

export function useCalendarSource(id: string) {
  return useQuery({
    queryKey: calendarKeys.source(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_sources')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as CalendarSource;
    },
    enabled: !!id,
  });
}

export function useCreateCalendarSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (source: CalendarSourceForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_sources')
        .insert({ ...source, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as CalendarSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.sources() });
    },
  });
}

export function useUpdateCalendarSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarSourceForm> }) => {
      const { data, error } = await supabase
        .from('calendar_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CalendarSource;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.sources() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.source(id) });
    },
  });
}

export function useDeleteCalendarSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_sources').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.sources() });
    },
  });
}

export function useSyncCalendarSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      // This would call a Supabase Edge Function to sync with the calendar provider
      // For now, we'll just update the last_synced_at timestamp
      const { data, error } = await supabase
        .from('calendar_sources')
        .update({ 
          last_synced_at: new Date().toISOString(),
          sync_error: null 
        })
        .eq('id', sourceId)
        .select()
        .single();
      if (error) throw error;
      return data as CalendarSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.sources() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.events({}) });
    },
  });
}

// ============================================================
// CALENDAR EVENTS
// ============================================================

export function useCalendarEvents(filters?: {
  calendar_source_id?: string;
  start_date?: string;
  end_date?: string;
  event_type?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: calendarKeys.events(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (filters?.calendar_source_id) {
        query = query.eq('calendar_source_id', filters.calendar_source_id);
      }
      if (filters?.start_date) {
        query = query.gte('start_time', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('end_time', filters.end_date);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: calendarKeys.event(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as CalendarEvent;
    },
    enabled: !!id,
  });
}

// Weekly view
export function useWeeklyCalendarEvents(weekStart: string) {
  return useQuery({
    queryKey: calendarKeys.weekly(weekStart),
    queryFn: async () => {
      const start = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;

      // Group events by day
      const eventsByDay = new Map<number, CalendarEvent[]>();
      days.forEach((_, index) => {
        eventsByDay.set(index, []);
      });

      (events as CalendarEvent[]).forEach(event => {
        const eventDate = new Date(event.start_time);
        const dayIndex = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1; // Convert to Mon=0
        const dayEvents = eventsByDay.get(dayIndex) || [];
        dayEvents.push(event);
        eventsByDay.set(dayIndex, dayEvents);
      });

      return {
        week_start: format(start, 'yyyy-MM-dd'),
        days: Array.from(eventsByDay.entries()).map(([dayIndex, dayEvents]) => ({
          day_index: dayIndex,
          date: format(days[dayIndex], 'yyyy-MM-dd'),
          day_name: format(days[dayIndex], 'EEEE'),
          events: dayEvents.sort((a, b) => 
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          ),
        })),
      };
    },
    enabled: !!weekStart,
  });
}

// Monthly view
export function useMonthlyCalendarEvents(month: string) {
  return useQuery({
    queryKey: calendarKeys.monthly(month),
    queryFn: async () => {
      const start = startOfMonth(new Date(month));
      const end = endOfMonth(new Date(month));
      const weeks = [];
      
      let currentWeekStart = startOfWeek(start, { weekStartsOn: 1 });
      while (currentWeekStart <= end) {
        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        weeks.push({
          week_start: format(currentWeekStart, 'yyyy-MM-dd'),
          week_end: format(weekEnd, 'yyyy-MM-dd'),
        });
        currentWeekStart = addWeeks(currentWeekStart, 1);
      }

      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;

      return {
        month,
        weeks,
        events: events as CalendarEvent[],
      };
    },
    enabled: !!month,
  });
}

// Today's events
export function useTodayCalendarEvents() {
  return useQuery({
    queryKey: calendarKeys.today(),
    queryFn: async () => {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}

// Events for a specific day
export function useDailyCalendarEvents(date: string) {
  return useQuery({
    queryKey: calendarKeys.daily(date),
    queryFn: async () => {
      const start = startOfDay(new Date(date)).toISOString();
      const end = endOfDay(new Date(date)).toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!date,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: CalendarEventForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...event, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarEventForm> }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

// ============================================================
// CALENDAR SYNC LOG
// ============================================================

export function useCalendarSyncLog(sourceId: string) {
  return useQuery({
    queryKey: calendarKeys.syncLog(sourceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_sync_log')
        .select('*')
        .eq('calendar_source_id', sourceId)
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as CalendarSyncLog[];
    },
    enabled: !!sourceId,
  });
}

// ============================================================
// CALENDAR VIEW HELPERS
// ============================================================

// Generate calendar month structure
export function useCalendarMonth(month: string) {
  return useQuery({
    queryKey: [...calendarKeys.all, 'month-view', month],
    queryFn: async () => {
      const start = startOfMonth(new Date(month));
      const end = endOfMonth(new Date(month));
      
      // Get events for the month
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());
      
      // Get holidays
      const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      const days = eachDayOfInterval({ start, end });
      const calendarDays: CalendarDay[] = days.map(day => {
        const dayEvents = (events || []).filter((e: CalendarEvent) => 
          isSameDay(new Date(e.start_time), day)
        );
        
        const holiday = (holidays || []).find((h: { date: string; name: string }) => h.date === format(day, 'yyyy-MM-dd'));
        
        return {
          date: format(day, 'yyyy-MM-dd'),
          day_number: day.getDate(),
          is_current_month: true,
          is_today: isSameDay(day, new Date()),
          is_weekend: day.getDay() === 0 || day.getDay() === 6,
          events: dayEvents as CalendarEvent[],
          has_holiday: !!holiday,
          holiday_name: holiday?.name || null,
        };
      });

      // Group into weeks
      const weeks: CalendarWeek[] = [];
      let currentWeek: CalendarDay[] = [];
      
      calendarDays.forEach((day, index) => {
        currentWeek.push(day);
        if (day.date.endsWith('Sun') || index === calendarDays.length - 1) {
          // Fill remaining days if needed
          while (currentWeek.length < 7) {
            const lastDay = currentWeek[currentWeek.length - 1];
            const nextDay = new Date(lastDay.date);
            nextDay.setDate(nextDay.getDate() + 1);
            currentWeek.push({
              date: format(nextDay, 'yyyy-MM-dd'),
              day_number: nextDay.getDate(),
              is_current_month: isSameMonth(nextDay, start),
              is_today: isSameDay(nextDay, new Date()),
              is_weekend: nextDay.getDay() === 0 || nextDay.getDay() === 6,
              events: [],
              has_holiday: false,
              holiday_name: null,
            });
          }
          weeks.push({
            week_start: format(new Date(currentWeek[0].date), 'yyyy-MM-dd'),
            days: currentWeek,
          });
          currentWeek = [];
        }
      });

      return {
        month,
        weeks,
      } as CalendarMonth;
    },
    enabled: !!month,
  });
}

// ============================================================
// GOOGLE CALENDAR INTEGRATION HELPERS (Architecture)
// ============================================================

// These functions would be called from Supabase Edge Functions
// They are prepared here for the integration architecture

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  recurrence?: string[];
  status?: string;
  colorId?: string;
  htmlLink?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
}

// Convert our CalendarEvent to Google Calendar format
export function calendarEventToGoogle(event: CalendarEvent): Partial<GoogleCalendarEvent> {
  const startDate = event.start_time.split('T')[0];
  const endDate = event.end_time.split('T')[0];
  
  return {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: {
      dateTime: event.all_day ? undefined : event.start_time,
      date: event.all_day ? startDate : undefined,
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.all_day ? undefined : event.end_time,
      date: event.all_day ? endDate : undefined,
      timeZone: event.timezone,
    },
    recurrence: event.recurrence_rule ? [event.recurrence_rule] : undefined,
    status: event.status,
    colorId: event.color ? getGoogleColorId(event.color) : undefined,
    attendees: event.attendees?.map(a => ({ email: a.email, displayName: a.name ?? undefined, responseStatus: a.status })),
    reminders: {
      useDefault: false,
      overrides: event.reminders?.map(r => ({ method: r.method === 'popup' ? 'popup' : r.method, minutes: r.minutes_before })),
    },
  };
}

// Convert Google Calendar event to our format
export function googleEventToCalendarEvent(
  googleEvent: GoogleCalendarEvent, 
  sourceId: string,
  sourceColor: string
): Omit<CalendarEventForm, 'user_id'> {
  const isAllDay = !!googleEvent.start.date;
  
  return {
    calendar_source_id: sourceId,
    external_id: googleEvent.id,
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description ?? undefined,
    location: googleEvent.location ?? undefined,
    start_time: isAllDay 
      ? `${googleEvent.start.date}T00:00:00.000Z` 
      : googleEvent.start.dateTime || '',
    end_time: isAllDay 
      ? `${googleEvent.end.date}T23:59:59.999Z` 
      : googleEvent.end.dateTime || '',
    all_day: isAllDay,
    timezone: googleEvent.start.timeZone || 'UTC',
    recurrence_rule: googleEvent.recurrence?.[0],
    status: (googleEvent.status as any) || 'confirmed',
    visibility: 'default',
    color: googleEvent.colorId ? getColorFromGoogleId(googleEvent.colorId) : sourceColor,
    is_recurring: !!googleEvent.recurrence?.length,
    event_type: 'personal',
    meeting_url: googleEvent.htmlLink,
    attendees: googleEvent.attendees?.map(a => ({ 
      email: a.email, 
      name: a.displayName ?? undefined, 
      status: (a.responseStatus as 'tentative' | 'needsAction' | 'accepted' | 'declined') || 'needsAction',
      response: a.responseStatus === 'accepted' ? true : a.responseStatus === 'declined' ? false : undefined 
    })) || [],
    reminders: googleEvent.reminders?.overrides?.map(o => ({ 
      method: o.method === 'email' ? 'email' : 'popup', 
      minutes_before: o.minutes 
    })) || [],
  };
}

// Google Calendar color mapping
const GOOGLE_COLOR_MAP: Record<string, string> = {
  '1': '#7986cb', // Lavender
  '2': '#33b679', // Sage
  '3': '#8e24aa', // Grape
  '4': '#e67c73', // Flamingo
  '5': '#f6bf26', // Banana
  '6': '#f4511e', // Tangerine
  '7': '#039be5', // Peacock
  '8': '#616161', // Graphite
  '9': '#3f51b5', // Blueberry
  '10': '#0b8043', // Basil
  '11': '#d50000', // Tomato
};

function getGoogleColorId(hex: string): string {
  const entry = Object.entries(GOOGLE_COLOR_MAP).find(([, v]) => v.toLowerCase() === hex.toLowerCase());
  return entry?.[0] || '1';
}

function getColorFromGoogleId(id: string): string {
  return GOOGLE_COLOR_MAP[id] || '#0ea5e9';
}

// ============================================================
// ICS IMPORT/EXPORT
// ============================================================

// Parse ICS content to calendar events
export function parseICS(icsContent: string): Omit<CalendarEventForm, 'user_id'>[] {
  // This is a simplified parser - in production use a proper ICS library like ics-parser
  const events: Omit<CalendarEventForm, 'user_id'>[] = [];
  const lines = icsContent.split('\n').map(l => l.trim());
  
  let currentEvent: Partial<CalendarEventForm> = {};
  let inEvent = false;
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        event_type: 'personal',
        is_recurring: false,
      };
    } else if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.title) {
        events.push(currentEvent as Omit<CalendarEventForm, 'user_id'>);
      }
      inEvent = false;
    } else if (inEvent) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      switch (key) {
        case 'SUMMARY':
          currentEvent.title = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'DTSTART':
          currentEvent.start_time = parseICSDateTime(value);
          break;
        case 'DTEND':
          currentEvent.end_time = parseICSDateTime(value);
          break;
        case 'RRULE':
          currentEvent.recurrence_rule = value;
          currentEvent.is_recurring = true;
          break;
        case 'STATUS':
          currentEvent.status = value.toLowerCase() as any;
          break;
      }
    }
  }
  
  return events;
}

function parseICSDateTime(value: string): string {
  // Simplified - handle basic formats
  // Format: 20240115T100000Z or 20240115 (date only)
  if (value.length === 8) {
    // Date only
    return `${value.substring(0,4)}-${value.substring(4,6)}-${value.substring(6,8)}T00:00:00.000Z`;
  }
  if (value.length >= 15) {
    // DateTime
    return `${value.substring(0,4)}-${value.substring(4,6)}-${value.substring(6,8)}T${value.substring(9,11)}:${value.substring(11,13)}:${value.substring(13,15)}.000Z`;
  }
  return new Date().toISOString();
}

// Export events to ICS format
export function exportToICS(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Productivity Suite//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach(event => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@productivity-suite`);
    lines.push(`DTSTAMP:${format(new Date(event.created_at), "yyyyMMdd'T'HHmmss'Z'")}`);
    lines.push(`SUMMARY:${escapeICSString(event.title)}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSString(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeICSString(event.location)}`);
    }
    
    const start = formatICSDateTimeForExport(event.start_time, event.all_day);
    const end = formatICSDateTimeForExport(event.end_time, event.all_day);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    
    if (event.recurrence_rule) {
      lines.push(`RRULE:${event.recurrence_rule}`);
    }
    if (event.status) {
      lines.push(`STATUS:${event.status.toUpperCase()}`);
    }
    
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICSDateTimeForExport(dateTime: string, allDay: boolean): string {
  const date = new Date(dateTime);
  if (allDay) {
    return format(date, "yyyyMMdd");
  }
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

function escapeICSString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// ============================================================
// HELPER: Get start/end of day
// ============================================================

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}