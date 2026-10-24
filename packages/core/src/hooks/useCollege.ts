import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  AcademicTerm, AcademicTermForm,
  Subject, SubjectForm, SubjectWithTerm, SubjectAttendance,
  AttendanceRecord, AttendanceRecordForm, AttendanceSummary,
  AcademicTask, AcademicTaskType, AcademicTaskForm,
  SubjectGrade,
  TimetableEntry,
  ScheduleEvent,
  TaskForm,
  CollegeDashboardData
} from '../types';
import { 
  calculateQuickCheck, 
  calculateClassSkip, 
  calculateTargetReach, 
  calculateExactDayPlan, 
  calculateHolidayPreview,
  type QuickCheckResult,
  type ClassSkipResult,
  type TargetReachResult,
  type ExactDayPlanResult,
  type HolidayPreviewRow,
  type AttendancePlannerConfig
} from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, isBefore, isAfter } from 'date-fns';

// Query keys
export const collegeKeys = {
  all: ['college'] as const,
  terms: () => [...collegeKeys.all, 'terms'] as const,
  term: (id: string) => [...collegeKeys.terms(), id] as const,
  currentTerm: () => [...collegeKeys.terms(), 'current'] as const,
  subjects: (termId?: string) => [...collegeKeys.all, 'subjects', termId] as const,
  subject: (id: string) => [...collegeKeys.all, 'subject', id] as const,
  subjectWithAttendance: (id: string) => [...collegeKeys.all, 'subject-attendance', id] as const,
  attendance: (subjectId: string) => [...collegeKeys.all, 'attendance', subjectId] as const,
  attendanceSummary: (subjectId: string) => [...collegeKeys.all, 'attendance-summary', subjectId] as const,
  academicTasks: (filters?: { subject_id?: string; academic_type?: AcademicTaskType }) => [...collegeKeys.all, 'academic-tasks', filters] as const,
  timetable: (termId: string, weekStart: string) => [...collegeKeys.all, 'timetable', termId, weekStart] as const,
  dashboard: () => [...collegeKeys.all, 'dashboard'] as const,
  grades: (subjectId: string) => [...collegeKeys.all, 'grades', subjectId] as const,
};

// ============================================================
// ACADEMIC TERMS
// ============================================================

export function useAcademicTerms() {
  return useQuery({
    queryKey: collegeKeys.terms(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_terms')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as AcademicTerm[];
    },
  });
}

export function useCurrentAcademicTerm() {
  return useQuery({
    queryKey: collegeKeys.currentTerm(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_terms')
        .select('*')
        .eq('is_current', true)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as AcademicTerm | null;
    },
  });
}

export function useAcademicTerm(id: string) {
  return useQuery({
    queryKey: collegeKeys.term(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_terms')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as AcademicTerm;
    },
    enabled: !!id,
  });
}

export function useCreateAcademicTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (term: AcademicTermForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('academic_terms')
        .insert({ ...term, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as AcademicTerm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.terms() });
      queryClient.invalidateQueries({ queryKey: collegeKeys.currentTerm() });
    },
  });
}

export function useUpdateAcademicTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AcademicTermForm> }) => {
      const { data, error } = await supabase
        .from('academic_terms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AcademicTerm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.terms() });
      queryClient.invalidateQueries({ queryKey: collegeKeys.currentTerm() });
    },
  });
}

export function useDeleteAcademicTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('academic_terms').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.terms() });
      queryClient.invalidateQueries({ queryKey: collegeKeys.currentTerm() });
    },
  });
}

// ============================================================
// SUBJECTS
// ============================================================

export function useSubjects(termId?: string) {
  return useQuery({
    queryKey: collegeKeys.subjects(termId),
    queryFn: async () => {
      let query = supabase
        .from('subjects')
        .select(`
          *,
          academic_terms (*)
        `)
        .order('created_at', { ascending: false });

      if (termId) {
        query = query.eq('academic_term_id', termId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Subject & { academic_terms: AcademicTerm })[];
    },
    enabled: !!termId || true,
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: collegeKeys.subject(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          academic_terms (*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Subject & { academic_terms: AcademicTerm };
    },
    enabled: !!id,
  });
}

export function useSubjectWithAttendance(id: string) {
  return useQuery({
    queryKey: collegeKeys.subjectWithAttendance(id),
    queryFn: async () => {
      // Get subject with term
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select(`
          *,
          academic_terms (*)
        `)
        .eq('id', id)
        .single();
      if (subjectError) throw subjectError;

      // Get attendance summary using database function
      const { data: summary, error: summaryError } = await supabase
        .rpc('get_attendance_summary', { p_subject_id: id, p_user_id: (await supabase.auth.getUser()).data.user?.id });
      if (summaryError) throw summaryError;

      // Get recent attendance records
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('subject_id', id)
        .order('date', { ascending: false })
        .limit(20);
      if (recordsError) throw recordsError;

      return {
        ...subject,
        attendance_summary: summary[0] as AttendanceSummary,
        recent_records: records as AttendanceRecord[],
      } as SubjectAttendance;
    },
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subject: SubjectForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('subjects')
        .insert({ ...subject, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Subject;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.subjects(vars.academic_term_id) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.subjects() });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubjectForm> }) => {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Subject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.subjects() });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.subjects() });
    },
  });
}

// ============================================================
// ATTENDANCE RECORDS
// ============================================================

export function useAttendanceRecords(subjectId: string) {
  return useQuery({
    queryKey: collegeKeys.attendance(subjectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('subject_id', subjectId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!subjectId,
  });
}

export function useAttendanceSummary(subjectId: string) {
  return useQuery({
    queryKey: collegeKeys.attendanceSummary(subjectId),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('get_attendance_summary', { p_subject_id: subjectId, p_user_id: user.id });
      if (error) throw error;
      return data[0] as AttendanceSummary;
    },
    enabled: !!subjectId,
  });
}

export function useCreateAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: AttendanceRecordForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('attendance_records')
        .upsert({ ...record, user_id: user.id }, { onConflict: 'user_id,subject_id,date' })
        .select()
        .single();
      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.attendance(vars.subject_id) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.attendanceSummary(vars.subject_id) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.subjectWithAttendance(vars.subject_id) });
    },
  });
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AttendanceRecordForm> }) => {
      const { data, error } = await supabase
        .from('attendance_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.attendance(vars.updates.subject_id as string) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.attendanceSummary(vars.updates.subject_id as string) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.subjectWithAttendance(vars.updates.subject_id as string) });
    },
  });
}

export function useDeleteAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, subjectId }: { id: string; subjectId: string }) => {
      const { error } = await supabase.from('attendance_records').delete().eq('id', id);
      if (error) throw error;
      return { id, subjectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.attendance(result.subjectId) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.attendanceSummary(result.subjectId) });
      queryClient.invalidateQueries({ queryKey: collegeKeys.subjectWithAttendance(result.subjectId) });
    },
  });
}

// ============================================================
// ACADEMIC TASKS (Assignments, Exams, etc.)
// ============================================================

export function useAcademicTasks(filters?: { subject_id?: string; academic_type?: AcademicTaskType; status?: string }) {
  return useQuery({
    queryKey: collegeKeys.academicTasks(filters),
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subjects (*)
        `)
        .not('academic_type', 'is', null)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.subject_id) {
        query = query.eq('subject_id', filters.subject_id);
      }
      if (filters?.academic_type) {
        query = query.eq('academic_type', filters.academic_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AcademicTask[];
    },
  });
}

export function useUpcomingAcademicTasks(subjectId?: string, days = 14) {
  const futureDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: [...collegeKeys.academicTasks({ subject_id: subjectId }), 'upcoming', days],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subjects (*)
        `)
        .not('academic_type', 'is', null)
        .neq('status', 'done')
        .neq('status', 'archived')
        .lte('due_date', futureDate)
        .order('due_date', { ascending: true });

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AcademicTask[];
    },
  });
}

export function useUpcomingAssignments(subjectId?: string) {
  return useUpcomingAcademicTasks(subjectId, 14);
}

export function useUpcomingExams(subjectId?: string) {
  return useQuery({
    queryKey: [...collegeKeys.academicTasks({ subject_id: subjectId, academic_type: 'exam' }), 'upcoming'],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subjects (*)
        `)
        .eq('academic_type', 'exam')
        .neq('status', 'done')
        .neq('status', 'archived')
        .order('due_date', { ascending: true });

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AcademicTask[];
    },
  });
}

export function useCreateAcademicTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskForm & AcademicTaskForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get max order for positioning
      const { data: maxOrder } = await supabase
        .from('tasks')
        .select('order')
        .eq('user_id', user.id)
        .is('parent_task_id', task.parent_task_id || null)
        .order('order', { ascending: false })
        .limit(1);

      const order = (maxOrder?.[0]?.order ?? -1) + 1;

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user.id, order })
        .select()
        .single();
      if (error) throw error;
      return data as AcademicTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.academicTasks() });
      queryClient.invalidateQueries({ queryKey: collegeKeys.dashboard() });
    },
  });
}

export function useUpdateAcademicTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskForm & AcademicTaskForm> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AcademicTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.academicTasks() });
      queryClient.invalidateQueries({ queryKey: collegeKeys.dashboard() });
    },
  });
}

export function useDeleteAcademicTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.academicTasks() });
      queryClient.invalidateQueries({ queryKey: collegeKeys.dashboard() });
    },
  });
}

// ============================================================
// GRADES
// ============================================================

export function useSubjectGrades(subjectId: string) {
  return useQuery({
    queryKey: collegeKeys.grades(subjectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_grades')
        .select(`
          *,
          tasks (*)
        `)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (SubjectGrade & { tasks: AcademicTask })[];
    },
    enabled: !!subjectId,
  });
}

export function useCreateSubjectGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grade: Omit<SubjectGrade, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'percentage'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const percentage = grade.max_score > 0 && grade.score_obtained != null ? (grade.score_obtained / grade.max_score) * 100 : 0;
      const letterGrade = calculateLetterGradeFromPercentage(percentage);

      const { data, error } = await supabase
        .from('subject_grades')
        .insert({ 
          ...grade, 
          user_id: user.id,
          percentage,
          letter_grade: letterGrade,
          graded_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as SubjectGrade;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: collegeKeys.grades(vars.subject_id) });
    },
  });
}

function calculateLetterGradeFromPercentage(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

// ============================================================
// TIMETABLE
// ============================================================

export function useTimetable(termId: string, weekStart: string) {
  return useQuery({
    queryKey: collegeKeys.timetable(termId, weekStart),
    queryFn: async () => {
      const start = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(weekStart), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      // Get subjects for this term
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('academic_term_id', termId)
        .eq('is_active', true);

      const subjectMap = new Map<string, Subject>();
      subjects?.forEach((s: Subject) => subjectMap.set(s.id, s as Subject));

      // Get schedule events for this term's subjects
      const subjectIds = subjects?.map((s: Subject) => s.id) || [];
      
      // Filter: class events must belong to this term's subjects; non-class events (work, personal, appointment) are always shown
      let query = supabase
        .from('schedule_events')
        .select('*')
        .eq('is_recurring', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (subjectIds.length > 0) {
        // Include: (class events with subject_id in term's subjects) OR (non-class events)
        query = query.or(`and(event_type.eq.class,subject_id.in.(${subjectIds.join(',')})),and(event_type.neq.class)`);
      } else {
        // No subjects in term: only show non-class events
        query = query.neq('event_type', 'class');
      }

      const { data: events, error: eventsError } = await query;
      if (eventsError) throw eventsError;

      // Get holidays
      const { data: holidays, error: holidaysError } = await supabase
        .from('holidays')
        .select('*')
        .or(`date.gte.${format(start, 'yyyy-MM-dd')},date.lte.${format(end, 'yyyy-MM-dd')}`);
      if (holidaysError) throw holidaysError;

      const scheduleMap = new Map<number, TimetableEntry[]>();
      days.forEach((_, index) => scheduleMap.set(index, []));

      (events as ScheduleEvent[]).forEach(event => {
        const dayEvents = scheduleMap.get(event.day_of_week) || [];
        dayEvents.push(event as TimetableEntry);
        scheduleMap.set(event.day_of_week, dayEvents);
      });

      return {
        week_start: format(start, 'yyyy-MM-dd'),
        days: Array.from(scheduleMap.entries()).map(([dayIndex, events]) => ({
          day_index: dayIndex,
          date: format(days[dayIndex], 'yyyy-MM-dd'),
          day_name: format(days[dayIndex], 'EEEE'),
          events: events.sort((a, b) => a.start_time.localeCompare(b.start_time)),
          is_holiday: holidays.some((h: { date: string }) => h.date === format(days[dayIndex], 'yyyy-MM-dd')),
        })),
      };
    },
    enabled: !!termId && !!weekStart,
  });
}

export function useTodayTimetable(termId: string) {
  return useQuery({
    queryKey: [...collegeKeys.all, 'today-timetable', termId],
    queryFn: async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const dateStr = format(today, 'yyyy-MM-dd');

      // Get subjects for this term
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('academic_term_id', termId)
        .eq('is_active', true);

      const subjectMap = new Map<string, Subject>();
      subjects?.forEach((s: Subject) => subjectMap.set(s.id, s as Subject));

      const subjectIds = subjects?.map((s: Subject) => s.id) || [];

      // Get schedule events: class events must belong to this term's subjects; non-class events always shown
      let eventsQuery = supabase
        .from('schedule_events')
        .select('*')
        .eq('day_of_week', adjustedDayOfWeek)
        .eq('is_recurring', true)
        .order('start_time', { ascending: true });

      if (subjectIds.length > 0) {
        eventsQuery = eventsQuery.or(`and(event_type.eq.class,subject_id.in.(${subjectIds.join(',')})),and(event_type.neq.class)`);
      } else {
        eventsQuery = eventsQuery.neq('event_type', 'class');
      }

      const { data: events, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;

      // Get holidays
      const { data: holidays, error: holidaysError } = await supabase
        .from('holidays')
        .select('*')
        .eq('date', dateStr)
        .maybeSingle();
      if (holidaysError) throw holidaysError;

      return {
        date: dateStr,
        day_name: format(today, 'EEEE'),
        events: (events as TimetableEntry[]).map(e => ({
          ...e,
          subject: e.subject_id ? subjectMap.get(e.subject_id) : undefined,
        })),
        is_holiday: !!holidays,
        holiday_name: holidays?.name,
      };
    },
    enabled: !!termId,
  });
}

// ============================================================
// COLLEGE DASHBOARD
// ============================================================

export function useCollegeDashboard() {
  return useQuery({
    queryKey: collegeKeys.dashboard(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current term
      const { data: currentTerm } = await supabase
        .from('academic_terms')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .eq('is_active', true)
        .maybeSingle();

      if (!currentTerm) {
        return {
          current_term: null,
          subjects: [],
          today_classes: [],
          upcoming_assignments: [],
          upcoming_exams: [],
          attendance_alerts: [],
          attendance_summary: { total_subjects: 0, subjects_below_threshold: 0, overall_attendance: 0 },
        } as CollegeDashboardData;
      }

      // Get subjects with attendance
      const { data: subjects } = await supabase
        .from('subjects')
        .select(`
          *,
          academic_terms (*)
        `)
        .eq('academic_term_id', currentTerm.id)
        .eq('is_active', true);

      const subjectMap = new Map<string, Subject>();
      subjects?.forEach((s: Subject) => subjectMap.set(s.id, s as Subject));

      const subjectIds = subjects?.map((s: Subject) => s.id) || [];

      // Get attendance summaries for all subjects
      const attendanceSummaries: Record<string, AttendanceSummary> = {};
      if (subjectIds.length > 0) {
        for (const subjectId of subjectIds) {
          const { data: summary } = await supabase
            .rpc('get_attendance_summary', { p_subject_id: subjectId, p_user_id: user.id });
          if (summary) attendanceSummaries[subjectId] = summary[0];
        }
      }

      // Get today's classes
      const today = new Date();
      const dayOfWeek = today.getDay();
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const dateStr = format(today, 'yyyy-MM-dd');

      const { data: todayEvents } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('day_of_week', adjustedDayOfWeek)
        .eq('is_recurring', true)
        .order('start_time', { ascending: true });

      // Get upcoming assignments (next 14 days)
      const futureDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      
      const { data: upcomingAssignments } = await supabase
        .from('tasks')
        .select('*, subjects (*)')
        .eq('academic_type', 'assignment')
        .neq('status', 'done')
        .neq('status', 'archived')
        .lte('due_date', futureDate)
        .order('due_date', { ascending: true })
        .limit(10);

      // Get upcoming exams (next 30 days)
      const examFutureDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data: upcomingExams } = await supabase
        .from('tasks')
        .select('*, subjects (*)')
        .eq('academic_type', 'exam')
        .neq('status', 'done')
        .neq('status', 'archived')
        .lte('due_date', examFutureDate)
        .order('due_date', { ascending: true })
        .limit(10);

      // Build attendance alerts
      const attendanceAlerts = subjects
        ?.map((s: SubjectWithTerm) => {
          const summary = attendanceSummaries[s.id];
          return {
            ...s,
            attendance_summary: summary || { total_classes: 0, attended: 0, missed: 0, excused: 0, percentage: 100, classes_needed_for_threshold: 0, classes_can_miss: 0 },
            recent_records: [],
          } as SubjectAttendance;
        })
        .filter((s: SubjectAttendance) => s.attendance_summary.percentage < s.attendance_threshold && s.attendance_summary.total_classes > 0)
        || [];

      // Overall attendance
      let totalAttended = 0;
      let totalClasses = 0;
      Object.values(attendanceSummaries).forEach((s: AttendanceSummary) => {
        totalAttended += s.attended;
        totalClasses += s.total_classes;
      });

      return {
        current_term: currentTerm as AcademicTerm,
        subjects: (subjects || []) as SubjectWithTerm[],
        today_classes: (todayEvents || []).map((e: ScheduleEvent) => ({ ...e, subject: e.subject_id ? subjectMap?.get(e.subject_id) : undefined })) as TimetableEntry[],
        upcoming_assignments: (upcomingAssignments || []) as AcademicTask[],
        upcoming_exams: (upcomingExams || []) as AcademicTask[],
        attendance_alerts: attendanceAlerts,
        attendance_summary: {
          total_subjects: subjects?.length || 0,
          subjects_below_threshold: attendanceAlerts.length,
          overall_attendance: totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100,
        },
      } as CollegeDashboardData;
    },
  });
}

// Helper to get subject map
async function getSubjectMap(userId: string): Promise<Map<string, Subject>> {
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId);
  return new Map(subjects?.map((s: Subject) => [s.id, s as Subject]) || []);
}

// ============================================================
// ATTENDANCE PLANNER
// ============================================================

// Query keys
export const attendancePlannerKeys = {
  all: ['attendance-planner'] as const,
  config: () => [...attendancePlannerKeys.all, 'config'] as const,
  overallSummary: () => [...attendancePlannerKeys.all, 'overall-summary'] as const,
  baselines: () => [...attendancePlannerKeys.all, 'baselines'] as const,
};

// Overall attendance summary across all subjects
export function useOverallAttendanceSummary() {
  return useQuery({
    queryKey: attendancePlannerKeys.overallSummary(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current term
      const { data: currentTerm } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .eq('is_active', true)
        .maybeSingle();

      if (!currentTerm) {
        return {
          total_classes: 0,
          attended: 0,
          missed: 0,
          excused: 0,
          percentage: 100,
          subjects_count: 0,
        };
      }

      // Get all subjects for current term
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .eq('academic_term_id', currentTerm.id)
        .eq('is_active', true);

      const subjectIds = (subjects as { id: string }[] | null)?.map(s => s.id) || [];
      
      if (subjectIds.length === 0) {
        return {
          total_classes: 0,
          attended: 0,
          missed: 0,
          excused: 0,
          percentage: 100,
          subjects_count: 0,
        };
      }

      // Get attendance summary for all subjects
      let totalAttended = 0;
      let totalClasses = 0;
      let totalMissed = 0;
      let totalExcused = 0;

      for (const subjectId of subjectIds) {
        const { data: summary } = await supabase
          .rpc('get_attendance_summary', { p_subject_id: subjectId, p_user_id: user.id });
        if (summary && summary[0]) {
          totalAttended += summary[0].attended || 0;
          totalClasses += summary[0].total_classes || 0;
          totalMissed += summary[0].missed || 0;
          totalExcused += summary[0].excused || 0;
        }
      }

      const percentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100 * 100) / 100 : 100;

      return {
        total_classes: totalClasses,
        attended: totalAttended,
        missed: totalMissed,
        excused: totalExcused,
        percentage,
        subjects_count: subjectIds.length,
      };
    },
  });
}

// Calculation hooks
export function useQuickCheck(
  leave_days: number,
  average_classes_per_day: number,
  current_total_classes: number,
  current_attended_classes: number
): QuickCheckResult {
  return calculateQuickCheck({
    leave_days,
    average_classes_per_day,
    current_total_classes,
    current_attended_classes,
  });
}

export function useClassSkip(
  skip_classes: number,
  current_total_classes: number,
  current_attended_classes: number
): ClassSkipResult {
  return calculateClassSkip({
    skip_classes,
    current_total_classes,
    current_attended_classes,
  });
}

export function useTargetReach(
  target_percentage: number,
  current_total_classes: number,
  current_attended_classes: number,
  average_classes_per_day?: number
): TargetReachResult {
  return calculateTargetReach({
    target_percentage,
    current_total_classes,
    current_attended_classes,
    average_classes_per_day,
  });
}

export function useExactDayPlan(
  start_date: string,
  planned_days: { date: string; type: 'attendance' | 'leave'; classes_count?: number }[],
  current_total_classes: number,
  current_attended_classes: number,
  average_classes_per_day?: number,
  holidays?: { date: string; is_recurring?: boolean }[]
): ExactDayPlanResult {
  return calculateExactDayPlan({
    start_date,
    planned_days,
    current_total_classes,
    current_attended_classes,
    average_classes_per_day,
    holidays,
  });
}

export function useHolidayPreview(
  leave_scenarios: number[],
  current_total_classes: number,
  current_attended_classes: number,
  average_classes_per_day: number,
  target_percentage: number
): HolidayPreviewRow[] {
  return calculateHolidayPreview({
    leave_scenarios,
    current_total_classes,
    current_attended_classes,
    average_classes_per_day,
    target_percentage,
  });
}

// Holidays hook for the planner
export function usePlannerHolidays(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...attendancePlannerKeys.all, 'holidays', startDate, endDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('holidays')
        .select('*')
        .eq('user_id', user.id);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as { id: string; user_id: string; name: string; date: string; is_recurring: boolean }[];
    },
  });
}

// Re-export calculation functions and types for use in other modules
export {
  calculateQuickCheck,
  calculateClassSkip,
  calculateTargetReach,
  calculateExactDayPlan,
  calculateHolidayPreview,
} from '../types';

export type {
  QuickCheckResult,
  ClassSkipResult,
  TargetReachResult,
  ExactDayPlanResult,
  HolidayPreviewRow,
  AttendancePlannerConfig,
  ParsedCalendarEvent,
  ParsedTimetableEntry,
  TimetableImportData,
  AcademicCalendarImportData,
} from '../types';
