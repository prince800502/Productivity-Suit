import { parse } from 'csv-parse/sync';
import ICAL from 'ical.js';

export interface ParsedScheduleEvent {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  color: string;
  is_recurring: boolean;
  event_type: 'class' | 'work' | 'personal' | 'appointment';
}

export interface ParsedExpense {
  date: string;
  category: string;
  amount: number;
  description?: string;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency: string;
}

export interface ImportResult<T> {
  data: T[];
  errors: ImportError[];
  totalRows: number;
  validRows: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  rawData?: any;
}

const VALID_CATEGORIES = ['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other'] as const;
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
const VALID_EVENT_TYPES = ['class', 'work', 'personal', 'appointment'] as const;
const VALID_DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

const CATEGORY_MAP: Record<string, string> = {
  'food': 'food',
  'food & dining': 'food',
  'dining': 'food',
  'transport': 'transport',
  'transportation': 'transport',
  'shopping': 'shopping',
  'entertainment': 'entertainment',
  'health': 'health',
  'healthcare': 'health',
  'medical': 'health',
  'education': 'education',
  'learning': 'education',
  'utilities': 'utilities',
  'utility': 'utilities',
  'bills': 'utilities',
  'other': 'other',
  'misc': 'other',
  'miscellaneous': 'other',
};

const FREQUENCY_MAP: Record<string, string> = {
  'daily': 'daily',
  'day': 'daily',
  'weekly': 'weekly',
  'week': 'weekly',
  'monthly': 'monthly',
  'month': 'monthly',
  'yearly': 'yearly',
  'year': 'yearly',
  'annually': 'yearly',
};

const EVENT_TYPE_MAP: Record<string, string> = {
  'class': 'class',
  'lecture': 'class',
  'work': 'work',
  'job': 'work',
  'personal': 'personal',
  'appointment': 'appointment',
  'appt': 'appointment',
  'meeting': 'appointment',
  'doctor': 'appointment',
  'doctor appointment': 'appointment',
};

const DAY_MAP: Record<string, number> = {
  'monday': 0, 'mon': 0,
  'tuesday': 1, 'tue': 1, 'tues': 1,
  'wednesday': 2, 'wed': 2,
  'thursday': 3, 'thu': 3, 'thur': 3, 'thurs': 3,
  'friday': 4, 'fri': 4,
  'saturday': 5, 'sat': 5,
  'sunday': 6, 'sun': 6,
};

function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/[^\w\s]/g, '');
}

function parseColor(colorStr: string): string {
  const normalized = colorStr.trim();
  if (normalized.startsWith('#') && (normalized.length === 7 || normalized.length === 4)) {
    return normalized;
  }
  const colorMap: Record<string, string> = {
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#22c55e',
    'yellow': '#f59e0b',
    'orange': '#f97316',
    'purple': '#8b5cf6',
    'pink': '#ec4899',
    'teal': '#14b8a6',
    'indigo': '#6366f1',
    'cyan': '#06b6d4',
  };
  const lower = colorStr.toLowerCase();
  if (colorMap[lower]) return colorMap[lower];
  return '#3b82f6';
}

function parseTime(timeStr: string): string {
  const trimmed = timeStr.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3].toLowerCase();
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  return '09:00';
}

function parseDateTime(dateStr: string, timeStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  const time = parseTime(timeStr);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function parseDayOfWeek(dayStr: string): number {
  const normalized = dayStr.trim().toLowerCase().replace(/[^\w]/g, '');
  if (DAY_MAP[normalized] !== undefined) {
    return DAY_MAP[normalized];
  }
  const num = parseInt(dayStr, 10);
  if (!isNaN(num) && num >= 0 && num <= 6) {
    return num;
  }
  throw new Error(`Invalid day of week: ${dayStr}`);
}

export function parseCSVSchedule(content: string): ImportResult<ParsedScheduleEvent> {
  const errors: ImportError[] = [];
  const data: ParsedScheduleEvent[] = [];

  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });

    records.forEach((record: any, index: number) => {
      const rowNum = index + 2;
      const rowErrors: string[] = [];

      try {
        const title = record.title?.trim();
        if (!title) rowErrors.push('Title is required');

        const startTimeStr = record.start_time?.trim();
        const endTimeStr = record.end_time?.trim();
        if (!startTimeStr) rowErrors.push('Start time is required');
        if (!endTimeStr) rowErrors.push('End time is required');

        let dayOfWeek = 0;
        if (record.day_of_week !== undefined && record.day_of_week !== '') {
          dayOfWeek = parseDayOfWeek(record.day_of_week);
        } else {
          rowErrors.push('Day of week is required');
        }

        const eventTypeRaw = record.event_type?.trim().toLowerCase();
        let eventType: 'class' | 'work' | 'personal' | 'appointment' = 'personal';
        if (eventTypeRaw && EVENT_TYPE_MAP[eventTypeRaw]) {
          eventType = EVENT_TYPE_MAP[eventTypeRaw] as any;
        } else if (eventTypeRaw) {
          rowErrors.push(`Invalid event type: ${eventTypeRaw}`);
        }

        let color = '#3b82f6';
        if (record.color?.trim()) {
          color = parseColor(record.color.trim());
        }

        let start_time = '';
        let end_time = '';
        if (record.start_time && record.end_time) {
          const dateStr = record.date || new Date().toISOString().split('T')[0];
          try {
            start_time = parseDateTime(dateStr, record.start_time);
            end_time = parseDateTime(dateStr, record.end_time);
          } catch {
            start_time = parseDateTime(new Date().toISOString().split('T')[0], record.start_time);
            end_time = parseDateTime(new Date().toISOString().split('T')[0], record.end_time);
          }
        } else {
          rowErrors.push('Start time and end time are required');
        }

        if (rowErrors.length > 0) {
          rowErrors.forEach(err => {
            errors.push({ row: rowNum, message: err, rawData: record });
          });
        } else {
          data.push({
            title: title!,
            description: record.description?.trim() || '',
            location: record.location?.trim() || '',
            start_time,
            end_time,
            day_of_week: dayOfWeek,
            color,
            is_recurring: record.is_recurring !== 'false' && record.is_recurring !== '0',
            event_type: eventType,
          });
        }
      } catch (err) {
        errors.push({
          row: index + 2,
          message: err instanceof Error ? err.message : 'Unknown error',
          rawData: record,
        });
      }
    });

    return { data, errors, totalRows: records.length, validRows: data.length };
  } catch (err) {
    return {
      data: [],
      errors: [{ row: 0, message: err instanceof Error ? err.message : 'Failed to parse CSV' }],
      totalRows: 0,
      validRows: 0,
    };
  }
}

function icalDateToDate(icalDate: any): Date {
  if (!icalDate) return new Date();
  if (typeof icalDate.toJSDate === 'function') {
    return icalDate.toJSDate();
  }
  if (icalDate.year && icalDate.month && icalDate.day) {
    return new Date(icalDate.year, icalDate.month - 1, icalDate.day, 
      icalDate.hour || 0, icalDate.minute || 0, icalDate.second || 0);
  }
  return new Date(icalDate.toString());
}

export function parseICSSchedule(content: string): ImportResult<ParsedScheduleEvent> {
  const errors: ImportError[] = [];
  const data: ParsedScheduleEvent[] = [];

  try {
    const jcalData = ICAL.parse(content);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents('vevent');

    events.forEach((event: any, index: number) => {
      try {
        const vevent = new ICAL.Event(event);
        
        const title = vevent.summary || '';
        if (!title) {
          errors.push({ row: index + 1, message: 'Event title is required', rawData: vevent });
          return;
        }

        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        if (vevent.startDate) {
          startDate = icalDateToDate(vevent.startDate);
        }
        if (vevent.endDate) {
          endDate = icalDateToDate(vevent.endDate);
        }

        if (!startDate || !endDate) {
          errors.push({ row: index + 1, message: 'Event start and end times are required', rawData: vevent });
          return;
        }

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push({ row: index + 1, message: 'Invalid date format', rawData: vevent });
          return;
        }

        const dayOfWeek = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
        const start_time = startDate.toISOString();
        const end_time = endDate.toISOString();

        const categoryProps = (vevent as any).getAllProperties('category');
        const categories = categoryProps.map((p: any) => p.getFirstValue()) || [];
        const eventType = (EVENT_TYPE_MAP[categories[0]?.toLowerCase() || ''] as ParsedScheduleEvent['event_type']) || 'personal';
        const color = parseColor((vevent as any).getFirstPropertyValue('color') || '#3b82f6');
        const isRecurring = (vevent as any).isRecurring();

        data.push({
          title,
          description: vevent.description || '',
          location: vevent.location || '',
          start_time,
          end_time,
          day_of_week: dayOfWeek,
          color,
          is_recurring: isRecurring,
          event_type: eventType,
        });
      } catch (err) {
        errors.push({ row: index + 1, message: err instanceof Error ? err.message : 'Unknown error', rawData: event });
      }
    });

    return { data, errors, totalRows: events.length, validRows: data.length };
  } catch (err) {
    return {
      data: [],
      errors: [{ row: 0, message: err instanceof Error ? err.message : 'Failed to parse ICS' }],
      totalRows: 0,
      validRows: 0,
    };
  }
}

export function parseCSVExpenses(content: string): ImportResult<ParsedExpense> {
  const errors: ImportError[] = [];
  const data: ParsedExpense[] = [];

  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });

    records.forEach((record: any, index: number) => {
      const rowNum = index + 2;
      const rowErrors: string[] = [];

      try {
        const date = record.date?.trim();
        if (!date) rowErrors.push('Date is required');
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) rowErrors.push('Date must be in YYYY-MM-DD format');

        const categoryRaw = record.category?.trim().toLowerCase();
        let category: typeof VALID_CATEGORIES[number] = 'other';
        if (categoryRaw && CATEGORY_MAP[categoryRaw]) {
          category = CATEGORY_MAP[categoryRaw] as any;
        } else if (categoryRaw) {
          rowErrors.push(`Invalid category: ${categoryRaw}`);
        }

        const amountStr = record.amount?.trim();
        const amount = parseFloat(amountStr || '0');
        if (!amountStr) rowErrors.push('Amount is required');
        else if (isNaN(amount) || amount <= 0) rowErrors.push('Amount must be a positive number');

        const currency = record.currency?.trim().toUpperCase() || 'USD';

        const isRecurring = record.is_recurring?.toLowerCase() === 'true' || record.is_recurring === '1';
        let recurringFrequency: ParsedExpense['recurring_frequency'] = undefined;
        if (isRecurring) {
          const freqRaw = record.recurring_frequency?.trim().toLowerCase();
          if (freqRaw && FREQUENCY_MAP[freqRaw]) {
            recurringFrequency = FREQUENCY_MAP[freqRaw] as any;
          } else if (freqRaw) {
            rowErrors.push(`Invalid recurring frequency: ${freqRaw}`);
          } else {
            recurringFrequency = 'monthly';
          }
        }

        if (rowErrors.length > 0) {
          rowErrors.forEach(err => {
            errors.push({ row: rowNum, message: err, rawData: record });
          });
        } else {
          data.push({
            date: date!,
            category,
            amount,
            description: record.description?.trim() || '',
            is_recurring: isRecurring,
            recurring_frequency: recurringFrequency,
            currency,
          });
        }
      } catch (err) {
        errors.push({ row: rowNum, message: err instanceof Error ? err.message : 'Unknown error', rawData: record });
      }
    });

    return { data, errors, totalRows: records.length, validRows: data.length };
  } catch (err) {
    return {
      data: [],
      errors: [{ row: 0, message: err instanceof Error ? err.message : 'Failed to parse CSV' }],
      totalRows: 0,
      validRows: 0,
    };
  }
}