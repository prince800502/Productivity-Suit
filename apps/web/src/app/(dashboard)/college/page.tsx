'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import {
  GraduationCap, BookOpen, Calendar, AlertTriangle, Clock,
  CheckCircle, XCircle, Plus, ChevronRight, Target,
  TrendingUp, Award, BarChart2, Edit, MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Progress, Avatar, Tabs, TabsList, TabsTrigger, TabsContent, Dropdown, ScrollArea
} from '@productivity-suite/ui';
import {
  useCollegeDashboard, useCurrentAcademicTerm, useSubjects, useUpcomingAssignments, useUpcomingExams,
  useTodayTimetable, useCreateAcademicTerm, AcademicTerm, SubjectWithTerm,
  TimetableEntry, AcademicTask, AcademicTaskType, CollegeDashboardData
} from '@productivity-suite/core';
import { useAuth } from '@productivity-suite/core';

const statusColors: Record<string, string> = {
  present: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  absent: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  late: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  excused: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
};

const typeColors: Record<string, string> = {
  exam: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  quiz: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  assignment: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  project: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  homework: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function StatCard({ title, value, icon: Icon, variant = 'default', trend, trendLabel }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  trend?: number;
  trendLabel?: string;
}) {
  const variantClasses = {
    default: 'bg-neutral-100 dark:bg-neutral-800',
    primary: 'bg-primary-100 dark:bg-primary-900/30',
    success: 'bg-success-100 dark:bg-success-900/30',
    warning: 'bg-warning-100 dark:bg-warning-900/30',
    danger: 'bg-danger-100 dark:bg-danger-900/30',
  };

  return (
    <Card variant="default" padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${variantClasses[variant]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span className={trend >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-sm text-neutral-500 dark:text-neutral-400">{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
}

function AttendanceAlertCard({ subject }: { subject: SubjectWithTerm & { attendance_summary: any } }) {
  const { attendance_summary } = subject;
  const isBelowThreshold = attendance_summary.percentage < subject.attendance_threshold;
  
  return (
    <div className={`p-4 rounded-lg border ${isBelowThreshold ? 'border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20' : 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white`} style={{ backgroundColor: subject.color }}>
              {subject.icon ? <span className="text-sm">{subject.icon}</span> : <BookOpen className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-neutral-900 dark:text-white truncate">{subject.name}</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{subject.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors['absent']}`}>
                {attendance_summary.percentage.toFixed(1)}%
              </span>
            </span>
            <span className="text-neutral-500 dark:text-neutral-400">
              Threshold: {subject.attendance_threshold}%
            </span>
            {attendance_summary.classes_needed_for_threshold > 0 && (
              <span className="flex items-center gap-1 text-warning-600 dark:text-warning-400">
                <AlertTriangle className="w-3 h-3" />
                Need {attendance_summary.classes_needed_for_threshold} more classes
              </span>
            )}
          </div>
        </div>
        <Progress 
          value={attendance_summary.percentage} 
          max={100} 
          size="sm" 
          className="w-32"
          showLabel 
          label={`${attendance_summary.attended}/${attendance_summary.total_classes}`}
        />
      </div>
    </div>
  );
}

export default function CollegeDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'timetable'>('overview');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'overview' | 'subjects' | 'timetable');
  };
  
  const { data: dashboard, isLoading } = useCollegeDashboard();
  const { data: currentTerm } = useCurrentAcademicTerm();
  const { data: subjects } = useSubjects(currentTerm?.id);
  const { data: upcomingAssignments } = useUpcomingAssignments();
  const { data: upcomingExams } = useUpcomingExams();
  const { data: todayTimetable } = useTodayTimetable(currentTerm?.id || '');
  const createTerm = useCreateAcademicTerm();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-64 animate-pulse" />
          <div className="card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  // If no current term, show setup prompt
  if (!currentTerm) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">College Management</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Set up your academic term to get started</p>
          </div>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Create Your First Term</CardTitle>
            <CardDescription>Set up your semester/quarter to start tracking subjects, attendance, and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTermForm onSuccess={() => window.location.reload()} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendanceSummary = dashboard?.attendance_summary || { total_subjects: 0, subjects_below_threshold: 0, overall_attendance: 100 };
  const todayClasses = todayTimetable?.events || [];
  const attendanceAlerts = dashboard?.attendance_alerts || [];
  const assignments = upcomingAssignments || [];
  const exams = upcomingExams || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">College Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {currentTerm?.name} • {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/college/subjects">
              <Plus className="w-4 h-4" />
              Add Subject
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/college/timetable">
              <Calendar className="w-4 h-4" />
              View Timetable
            </Link>
          </Button>
        </div>
      </div>

      {/* Term Info Banner */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Current Term</p>
                <p className="text-xl font-bold">{currentTerm?.name}</p>
                <p className="text-sm opacity-80">
                  {format(new Date(currentTerm?.start_date || ''), 'MMM d, yyyy')} - {format(new Date(currentTerm?.end_date || ''), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm opacity-80">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {attendanceSummary.total_subjects} Subjects
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {attendanceSummary.overall_attendance}% Overall Attendance
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Subjects This Term"
          value={attendanceSummary.total_subjects}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Overall Attendance"
          value={`${attendanceSummary.overall_attendance}%`}
          icon={Target}
          variant={attendanceSummary.overall_attendance >= 75 ? 'success' : 'warning'}
          trend={attendanceSummary.subjects_below_threshold > 0 ? -attendanceSummary.subjects_below_threshold : 0}
          trendLabel={attendanceSummary.subjects_below_threshold > 0 ? `${attendanceSummary.subjects_below_threshold} below threshold` : 'All above threshold'}
        />
        <StatCard
          title="Today's Classes"
          value={todayClasses.length}
          icon={Calendar}
          variant="default"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={assignments.length + exams.length}
          icon={Clock}
          variant={exams.length > 0 ? 'danger' : 'warning'}
        />
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="timetable">Today's Schedule</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Attendance Alerts & Today's Classes */}
            <div className="lg:col-span-2 space-y-6">
              {/* Attendance Alerts */}
              {attendanceAlerts.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Attendance Alerts</CardTitle>
                        <CardDescription className="text-xs">{attendanceAlerts.length} subject(s) below threshold</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {attendanceAlerts.map(subject => (
                        <AttendanceAlertCard key={subject.id} subject={subject} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Today's Classes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Today's Classes</CardTitle>
                    <CardDescription>{todayClasses.length} scheduled • {todayTimetable?.is_holiday ? `Holiday: ${todayTimetable.holiday_name}` : format(new Date(), 'EEEE, MMMM d')}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/college/timetable">View Full Week</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {todayClasses.length > 0 ? (
                    <div className="space-y-3">
                      {todayClasses.map(event => (
                        <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                          <div className="w-3 h-16 rounded-l-lg" style={{ backgroundColor: event.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 dark:text-white">{event.title}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                              <span>{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}</span>
                              {event.location && <span>• {event.location}</span>}
                              {event.subject && <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded">{event.subject.code}</span>}
                            </p>
                          </div>
                          <Badge variant="outline" size="sm" className="capitalize">{event.event_type}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                      <p className="text-neutral-500 dark:text-neutral-400">
                        {todayTimetable?.is_holiday ? `Enjoy your holiday: ${todayTimetable.holiday_name}!` : 'No classes scheduled for today'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Upcoming Deadlines & Quick Actions */}
            <div className="space-y-6">
              {/* Upcoming Assignments */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <CardTitle className="text-base">Upcoming Assignments</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/college/assignments">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {assignments.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {assignments.slice(0, 5).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: typeColors[task.academic_type || 'assignment'] }}>
                            <span className="text-xs font-medium" style={{ color: typeColors[task.academic_type || 'assignment'].replace('bg-', 'text-').replace('dark:bg-', 'dark:text-') }}>
                              {getTypeIcon(task.academic_type)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{task.title}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due {format(new Date(task.due_date || ''), 'MMM d, h:mm a')}
                              {task.subject && <span className="text-primary-600 dark:text-primary-400">• {task.subject.code}</span>}
                            </p>
                          </div>
                          <Badge variant="outline" size="sm" className={typeColors[task.academic_type || 'assignment']}>
                            {getTypeLabel(task.academic_type)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <BookOpen className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400 text-sm">No upcoming assignments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Exams */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                      <Award className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                    </div>
                    <CardTitle className="text-base">Upcoming Exams</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/college/assignments">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {exams.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {exams.slice(0, 5).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                            <Award className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{task.title}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date || ''), 'MMM d, h:mm a')}
                              {task.subject && <span className="text-primary-600 dark:text-primary-400">• {task.subject.code}</span>}
                            </p>
                          </div>
                          <Badge variant="danger" size="sm">Exam</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Award className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400 text-sm">No upcoming exams</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/college/subjects/new">
                        <Plus className="w-6 h-6" />
                        <span className="text-sm">Add Subject</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/college/attendance">
                        <CheckCircle className="w-6 h-6" />
                        <span className="text-sm">Mark Attendance</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/college/assignments/new">
                        <BookOpen className="w-6 h-6" />
                        <span className="text-sm">New Assignment</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                      <Link href="/college/timetable">
                        <Calendar className="w-6 h-6" />
                        <span className="text-sm">View Timetable</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>{subjects?.length || 0} subjects in {currentTerm?.name}</CardDescription>
              </div>
              <Button asChild>
                <Link href="/college/subjects/new"><Plus className="w-4 h-4" /> Add Subject</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {subjects && subjects.length > 0 ? (
                <div className="space-y-3">
                  {subjects.map(subject => {
                    const summary = dashboard?.attendance_alerts.find(s => s.id === subject.id)?.attendance_summary;
                    const percentage = summary?.percentage ?? 100;
                    const isBelowThreshold = percentage < subject.attendance_threshold;
                    
                    return (
                      <div key={subject.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: subject.color }}>
                          {subject.icon ? <span className="text-xl">{subject.icon}</span> : <BookOpen className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-neutral-900 dark:text-white">{subject.name}</h3>
                            <Badge variant="outline" size="sm">{subject.code}</Badge>
                            {subject.faculty && <Badge variant="secondary" size="sm">{subject.faculty}</Badge>}
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">{subject.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex-1 max-w-xs">
                              <Progress value={percentage} max={100} size="sm" showLabel label={`Attendance: ${percentage.toFixed(1)}%`} />
                            </div>
                            <span className={`text-sm font-medium ${isBelowThreshold ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>
                              {isBelowThreshold ? 'Below Threshold' : 'On Track'}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/college/subjects/${subject.id}`}>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">No subjects yet</p>
                  <Button asChild>
                    <Link href="/college/subjects/new">Add Your First Subject</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's Timetable Tab */}
        <TabsContent value="timetable">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>{todayTimetable?.is_holiday ? `Holiday: ${todayTimetable.holiday_name}` : format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              {todayClasses.length > 0 ? (
                <div className="space-y-3">
                  {todayClasses.map(event => (
                    <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="w-3 h-16 rounded-l-lg" style={{ backgroundColor: event.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-white">{event.title}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}</span>
                          {event.location && <span>• {event.location}</span>}
                          {event.subject && <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded">{event.subject.code}</span>}
                        </p>
                      </div>
                      <Badge variant="outline" size="sm" className="capitalize">{event.event_type}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/college/attendance?subject=${event.subject_id}`}>
                          <CheckCircle className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-2">
                    {todayTimetable?.is_holiday ? `Enjoy your holiday: ${todayTimetable.holiday_name}!` : 'No classes today'}
                  </p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                    {todayTimetable?.is_holiday ? 'Take a break and relax!' : 'Add classes to your timetable in the Schedule section'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getTypeIcon(type: AcademicTaskType | null): string {
  switch (type) {
    case 'exam': return 'A';
    case 'quiz': return 'Q';
    case 'assignment': return 'HW';
    case 'project': return 'P';
    case 'homework': return 'HW';
    default: return '•';
  }
}

function getTypeLabel(type: AcademicTaskType | null): string {
  switch (type) {
    case 'exam': return 'Exam';
    case 'quiz': return 'Quiz';
    case 'assignment': return 'Assignment';
    case 'project': return 'Project';
    case 'homework': return 'Homework';
    default: return 'Other';
  }
}

// Inline CreateTermForm to avoid circular dependency
function CreateTermForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 120), 'yyyy-MM-dd'),
    is_current: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTerm = useCreateAcademicTerm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTerm.mutateAsync(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create term:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Term Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Fall 2024"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Term Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="FA24"
            maxLength={10}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Start Date</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">End Date</label>
          <input
            type="date"
            value={formData.end_date}
            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_current"
          checked={formData.is_current}
          onChange={e => setFormData({ ...formData, is_current: e.target.checked })}
          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
        />
        <label htmlFor="is_current" className="text-sm text-neutral-700 dark:text-neutral-300">Set as current term</label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>Create Term</Button>
      </div>
    </form>
  );
}