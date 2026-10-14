-- College Management System Database Migration
-- Supports: Subjects, Attendance Tracking, Timetable, Assignments/Exams

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ACADEMIC TERMS (Semesters/Years)
-- ============================================================

CREATE TABLE public.academic_terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "Fall 2024", "Spring 2025"
    code TEXT NOT NULL, -- e.g., "FA24", "SP25"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, code)
);

-- ============================================================
-- SUBJECTS
-- ============================================================

CREATE TABLE public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "Calculus I"
    code TEXT NOT NULL, -- e.g., "MATH101"
    faculty TEXT, -- Professor/Instructor name
    credits INTEGER DEFAULT 3 CHECK (credits > 0),
    color TEXT DEFAULT '#3b82f6',
    icon TEXT,
    description TEXT,
    -- Attendance configuration
    attendance_threshold INTEGER DEFAULT 75, -- Minimum percentage required
    total_classes_scheduled INTEGER DEFAULT 0, -- For attendance calculation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, academic_term_id, code)
);

-- ============================================================
-- ATTENDANCE RECORDS (Per class/session)
-- ============================================================

CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

CREATE TABLE public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status public.attendance_status NOT NULL DEFAULT 'present',
    class_session_number INTEGER, -- Optional: which class number in the semester (1, 2, 3...)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate attendance for same subject on same date
    UNIQUE(user_id, subject_id, date)
);

-- ============================================================
-- ASSIGNMENTS & EXAMS (Extended from tasks with academic context)
-- ============================================================

-- We'll use the existing tasks table with subject_id and academic context
-- Add subject_id to tasks via ALTER TABLE
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS academic_type TEXT CHECK (academic_type IN ('assignment', 'exam', 'quiz', 'project', 'homework', 'other'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS weight DECIMAL(5, 2); -- Percentage weight for grade calculation
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS score_obtained DECIMAL(5, 2);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS max_score DECIMAL(5, 2);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT FALSE;

-- Index for subject-based task queries
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON public.tasks(user_id, subject_id) WHERE subject_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_academic_type ON public.tasks(user_id, academic_type) WHERE academic_type IS NOT NULL;

-- ============================================================
-- GRADE TRACKING (Optional - for future grade calculation)
-- ============================================================

CREATE TABLE public.subject_grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    weight DECIMAL(5, 2) NOT NULL, -- Weight in final grade (%)
    score_obtained DECIMAL(5, 2),
    max_score DECIMAL(5, 2) NOT NULL,
    percentage DECIMAL(5, 2) GENERATED ALWAYS AS (CASE WHEN max_score > 0 THEN (score_obtained / max_score) * 100 ELSE 0 END) STORED,
    letter_grade TEXT, -- A+, A, A-, B+, etc.
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Academic terms
CREATE INDEX idx_academic_terms_user_current ON public.academic_terms(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_academic_terms_user_active ON public.academic_terms(user_id, is_active, start_date DESC);

-- Subjects
CREATE INDEX idx_subjects_user_term ON public.subjects(user_id, academic_term_id, is_active);
CREATE INDEX idx_subjects_term_active ON public.subjects(academic_term_id, is_active) WHERE is_active = TRUE;

-- Attendance
CREATE INDEX idx_attendance_user_subject ON public.attendance_records(user_id, subject_id, date DESC);
CREATE INDEX idx_attendance_subject_date ON public.attendance_records(subject_id, date);
CREATE INDEX idx_attendance_user_date ON public.attendance_records(user_id, date DESC);

-- Subject grades
CREATE INDEX idx_subject_grades_user_subject ON public.subject_grades(user_id, subject_id);
CREATE INDEX idx_subject_grades_task ON public.subject_grades(task_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies: academic_terms
CREATE POLICY "Users can view own academic terms" ON public.academic_terms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own academic terms" ON public.academic_terms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own academic terms" ON public.academic_terms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own academic terms" ON public.academic_terms FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: subjects
CREATE POLICY "Users can view own subjects" ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects" ON public.subjects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: attendance_records
CREATE POLICY "Users can view own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON public.attendance_records FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: subject_grades
CREATE POLICY "Users can view own grades" ON public.subject_grades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grades" ON public.subject_grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grades" ON public.subject_grades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grades" ON public.subject_grades FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================

CREATE TRIGGER update_academic_terms_updated_at BEFORE UPDATE ON public.academic_terms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subject_grades_updated_at BEFORE UPDATE ON public.subject_grades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.academic_terms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subject_grades;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to calculate attendance percentage for a subject
CREATE OR REPLACE FUNCTION public.calculate_attendance_percentage(
    p_subject_id UUID,
    p_user_id UUID
)
RETURNS DECIMAL(5, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_present INTEGER;
    v_result DECIMAL(5, 2);
BEGIN
    -- Count total classes (present + absent + late, excluding excused)
    SELECT COUNT(*) INTO v_total
    FROM public.attendance_records
    WHERE subject_id = p_subject_id
      AND user_id = p_user_id
      AND status IN ('present', 'absent', 'late');

    -- Count present + late (both count as attended)
    SELECT COUNT(*) INTO v_present
    FROM public.attendance_records
    WHERE subject_id = p_subject_id
      AND user_id = p_user_id
      AND status IN ('present', 'late');

    IF v_total = 0 THEN
        RETURN 100.00; -- No classes yet = 100%
    END IF;

    v_result := ROUND((v_present::DECIMAL / v_total) * 100, 2);
    RETURN v_result;
END;
$$;

-- Function to get attendance summary for a subject
CREATE OR REPLACE FUNCTION public.get_attendance_summary(
    p_subject_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    total_classes INTEGER,
    attended INTEGER,
    missed INTEGER,
    excused INTEGER,
    percentage DECIMAL(5, 2),
    classes_needed_for_threshold INTEGER,
    classes_can_miss INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_threshold INTEGER;
    v_total INTEGER;
    v_attended INTEGER;
    v_missed INTEGER;
    v_excused INTEGER;
    v_percentage DECIMAL(5, 2);
    v_needed INTEGER;
    v_can_miss INTEGER;
BEGIN
    -- Get threshold from subject
    SELECT attendance_threshold INTO v_threshold
    FROM public.subjects
    WHERE id = p_subject_id AND user_id = p_user_id;

    IF v_threshold IS NULL THEN
        v_threshold := 75;
    END IF;

    -- Get counts
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('present', 'absent', 'late')),
        COUNT(*) FILTER (WHERE status IN ('present', 'late')),
        COUNT(*) FILTER (WHERE status = 'absent'),
        COUNT(*) FILTER (WHERE status = 'excused')
    INTO v_total, v_attended, v_missed, v_excused
    FROM public.attendance_records
    WHERE subject_id = p_subject_id AND user_id = p_user_id;

    -- Calculate percentage
    IF v_total = 0 THEN
        v_percentage := 100.00;
    ELSE
        v_percentage := ROUND((v_attended::DECIMAL / v_total) * 100, 2);
    END IF;

    -- Calculate classes needed to reach threshold
    IF v_percentage >= v_threshold THEN
        v_needed := 0;
    ELSE
        -- Solve: (v_attended + x) / (v_total + x) >= v_threshold / 100
        -- x >= (v_threshold * v_total / 100 - v_attended) / (1 - v_threshold / 100)
        v_needed := CEIL((v_threshold * v_total / 100.0 - v_attended) / (1 - v_threshold / 100.0));
        IF v_needed < 0 THEN v_needed := 0; END IF;
    END IF;

    -- Calculate classes that can be missed without falling below threshold
    IF v_total = 0 THEN
        v_can_miss := 0;
    ELSE
        -- Solve: v_attended / (v_total + x) >= v_threshold / 100
        -- x <= (v_attended * 100 / v_threshold) - v_total
        v_can_miss := FLOOR((v_attended * 100.0 / v_threshold) - v_total);
        IF v_can_miss < 0 THEN v_can_miss := 0; END IF;
    END IF;

    RETURN QUERY SELECT v_total, v_attended, v_missed, v_excused, v_percentage, v_needed, v_can_miss;
END;
$$;

-- Function to ensure only one current term per user
CREATE OR REPLACE FUNCTION public.enforce_single_current_term()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.is_current THEN
        UPDATE public.academic_terms
        SET is_current = FALSE
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_enforce_single_current_term
    BEFORE INSERT OR UPDATE ON public.academic_terms
    FOR EACH ROW EXECUTE FUNCTION public.enforce_single_current_term();

-- Function to update subject's total_classes_scheduled based on schedule_events
CREATE OR REPLACE FUNCTION public.update_subject_scheduled_classes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This could be enhanced to count schedule_events linked to subject
    -- For now, manual update or trigger from schedule_events if we add subject_id there
    RETURN NEW;
END;
$$;