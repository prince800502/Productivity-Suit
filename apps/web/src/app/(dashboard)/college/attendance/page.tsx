'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock, AlertCircle, MinusCircle, Download, MoreHorizontal, BookOpen, Calculator } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, Dropdown, ScrollArea
} from '@productivity-suite/ui';
import {
  useSubjects, useAttendanceRecords, useAttendanceSummary, useCreateAttendanceRecord,
  useUpdateAttendanceRecord, useDeleteAttendanceRecord, useSubjectWithAttendance,
  SubjectWithTerm, AttendanceRecord, AttendanceStatus
} from '@productivity-suite/core';
import { useCurrentAcademicTerm } from '@productivity-suite/core';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import { useToast } from '@productivity-suite/ui';
import { ConfirmationModal } from '@productivity-suite/ui';

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  present: { label: 'Present', icon: CheckCircle, color: 'text-success-600 dark:text-success-400', bgColor: 'bg-success-100 dark:bg-success-900/30' },
  absent: { label: 'Absent', icon: XCircle, color: 'text-danger-600 dark:text-danger-400', bgColor: 'bg-danger-100 dark:bg-danger-900/30' },
  late: { label: 'Late', icon: Clock, color: 'text-warning-600 dark:text-warning-400', bgColor: 'bg-warning-100 dark:bg-warning-900/30' },
  excused: { label: 'Excused', icon: AlertCircle, color: 'text-primary-600 dark:text-primary-400', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
};

function SubjectSelector({ subjects, value, onChange, placeholder, className }: {
  subjects: SubjectWithTerm[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none pr-10 ${className || ''}`}
      >
        <option value="">{placeholder}</option>
        {subjects.map(s => (
          <option key={s.id} value={s.id} style={{ color: s.color }}>
            {s.name} ({s.code})
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Calendar className="w-4 h-4 text-neutral-400" />
      </div>
    </div>
  );
}

function AttendanceDayCell({ 
  date, 
  record, 
  onSetStatus,
  isCurrentMonth,
  isToday: isTodayDate
}: {
  date: Date;
  record: AttendanceRecord | undefined;
  onSetStatus: (status: AttendanceStatus) => void;
  isCurrentMonth: boolean;
  isToday: boolean;
}) {
  const status = record?.status;
  const config = status ? statusConfig[status] : null;
  
  if (!isCurrentMonth) {
    return (
      <div className="aspect-square border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-center">
        <span className="text-sm text-neutral-300 dark:text-neutral-600">{format(date, 'd')}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !record && onSetStatus('present')}
      className={`relative aspect-square border ${isTodayDate ? 'border-primary-500' : 'border-neutral-200 dark:border-neutral-700'} 
        ${status && config ? config.bgColor : 'bg-white dark:bg-neutral-800'} 
        hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex flex-col items-center justify-center p-1`}
      style={{ minHeight: '80px' }}
    >
      <span className={`text-sm font-medium ${isTodayDate ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-white'}`}>
        {format(date, 'd')}
      </span>
      {status && config && (
        <div className="flex items-center gap-1 mt-1">
          <config.icon className={`w-3.5 h-3.5 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      )}
      {record?.class_session_number && (
        <span className="absolute top-1 right-1 text-xs text-neutral-400 bg-white/80 dark:bg-neutral-800/80 px-1 rounded">
          #{record.class_session_number}
        </span>
      )}
      {/* Status selector overlay */}
      {!status && (
        <div className="absolute inset-0 bg-white/90 dark:bg-neutral-900/90 flex flex-col items-center justify-center gap-1 rounded opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-xs text-neutral-500">Mark attendance</span>
          <div className="flex gap-1">
            {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => {
              const config = statusConfig[s];
              const Icon = config.icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={e => { e.stopPropagation(); onSetStatus(s); }}
                  className={`p-1.5 rounded ${config.bgColor} hover:opacity-80 transition-opacity`}
                  title={config.label}
                >
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </button>
  );
}

export default function CollegeAttendancePage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [showSessionNumber, setShowSessionNumber] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { data: currentTerm } = useCurrentAcademicTerm();
  const { data: subjects } = useSubjects(currentTerm?.id);
  const { data: attendanceRecords } = useAttendanceRecords(selectedSubjectId);
  const { data: attendanceSummary } = useAttendanceSummary(selectedSubjectId);
  const { data: subjectWithAttendance } = useSubjectWithAttendance(selectedSubjectId);
  
  const createRecord = useCreateAttendanceRecord();
  const updateRecord = useUpdateAttendanceRecord();
  const deleteRecord = useDeleteAttendanceRecord();
  const { toast } = useToast() as { toast: (options: { type: 'success' | 'error' | 'warning' | 'info' | 'default'; title: string; message?: string }) => string; dismiss: (id: string) => void; dismissAll: () => void };

  const subject = subjectWithAttendance;
  const recordsMap = new Map(attendanceRecords?.map(r => [r.date, r]) || []);
  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleSetStatus = async (date: Date, status: AttendanceStatus) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingRecord = recordsMap.get(dateStr);
    
    try {
      if (existingRecord) {
        await updateRecord.mutateAsync({ 
          id: existingRecord.id, 
          updates: { status, class_session_number: showSessionNumber ? (existingRecord.class_session_number || 1) + 1 : existingRecord.class_session_number } 
        });
      } else {
        await createRecord.mutateAsync({ 
          subject_id: selectedSubjectId, 
          date: dateStr, 
          status,
          class_session_number: showSessionNumber ? 1 : null 
        });
      }
      toast({ type: 'success', title: 'Attendance updated', message: `Marked as ${status}` });
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to update attendance' });
      console.error('Failed to update attendance:', error);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    setDeleteConfirmId(recordId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteRecord.mutateAsync({ id: deleteConfirmId, subjectId: selectedSubjectId });
      toast({ type: 'success', title: 'Deleted', message: 'Attendance record removed' });
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete record' });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleExport = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) return;
    
    const headers = ['Date', 'Day', 'Status', 'Session', 'Notes'];
    const rows = attendanceRecords.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      format(new Date(r.date), 'EEEE'),
      r.status,
      r.class_session_number ? `#${r.class_session_number}` : '',
      r.notes || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `attendance-${subject?.code || 'export'}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  if (!selectedSubjectId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Attendance Tracker</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Record and track class attendance</p>
          </div>
        </div>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Select a Subject</CardTitle>
            <CardDescription>Choose a subject to start tracking attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectSelector 
              subjects={subjects || []} 
              value={selectedSubjectId} 
              onChange={(value) => setSelectedSubjectId(value)} 
              placeholder="Choose a subject..."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendedCount = attendanceRecords?.filter(r => r.status === 'present' || r.status === 'late').length || 0;
  const totalCount = attendanceRecords?.filter(r => r.status !== 'excused').length || 0;
  const percentage = totalCount > 0 ? (attendedCount / totalCount) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Attendance Tracker</h1>
          <p className="text-neutral-500 dark:text-neutral-400">{subject?.name} ({subject?.code})</p>
        </div>
        <div className="flex items-center gap-3">
          <SubjectSelector 
            subjects={subjects || []} 
            value={selectedSubjectId} 
            onChange={(value) => setSelectedSubjectId(value)} 
            placeholder="Switch subject..."
            className="w-64"
          />
          <Button variant="outline" size="sm" icon={<Calculator className="w-4 h-4" />} asChild>
            <Link href="/college/attendance/calculator">Calculator</Link>
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
          Export
        </Button>
        </div>
      </div>

      {/* Subject Header with Stats */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                {subject?.icon ? <span className="text-2xl">{subject.icon}</span> : <BookOpen className="w-7 h-7" />}
              </div>
              <div>
                <p className="text-sm opacity-80">{subject?.code} • {subject?.faculty || 'No faculty'}</p>
                <p className="text-xl font-bold">{subject?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{percentage.toFixed(1)}%</p>
                <p className="text-sm opacity-80">Attendance Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{attendedCount} / {totalCount}</p>
                <p className="text-sm opacity-80">Classes Attended</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{subject?.attendance_threshold}%</p>
                <p className="text-sm opacity-80">Threshold</p>
              </div>
            </div>
          </div>
          {subject && percentage < subject.attendance_threshold && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Below threshold!</p>
                <p className="text-sm opacity-80">
                  Need {attendanceSummary?.classes_needed_for_threshold || 0} more classes to reach {subject.attendance_threshold}%.
                  Can miss {attendanceSummary?.classes_can_miss || 0} more classes.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>{format(viewMonth, 'MMMM yyyy')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setViewMonth(subMonths(viewMonth, 1))} />
            <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={() => setViewMonth(addMonths(viewMonth, 1))} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: startOfMonth(viewMonth).getDay() === 0 ? 6 : startOfMonth(viewMonth).getDay() - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50" />
              ))}
              {/* Days of month */}
              {days.map(date => {
                const record = recordsMap.get(format(date, 'yyyy-MM-dd'));
                return (
                  <AttendanceDayCell
                    key={date.toISOString()}
                    date={date}
                    record={record}
                    onSetStatus={status => handleSetStatus(date, status)}
                    isCurrentMonth={true}
                    isToday={isToday(date)}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4">
            {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => {
              const config = statusConfig[s];
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${config.bgColor}`} />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{config.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>{attendanceRecords?.length || 0} records this term</CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showSessionNumber}
              onChange={e => setShowSessionNumber(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            Show session numbers
          </label>
        </CardHeader>
        <CardContent>
          {attendanceRecords && attendanceRecords.length > 0 ? (
            <ScrollArea className="max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Day</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Session</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Notes</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => {
                    const config = statusConfig[record.status];
                    return (
                      <tr key={record.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="py-3 px-3 text-sm text-neutral-900 dark:text-white font-mono">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-3 text-sm text-neutral-500 dark:text-neutral-400">
                          {format(new Date(record.date), 'EEEE')}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
                            <config.icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                          {record.class_session_number ? `#${record.class_session_number}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                          {record.notes || '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Dropdown
                            trigger={
                              <Button variant="ghost" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} />
                            }
                            items={[
                              { label: 'Present', value: 'present', icon: CheckCircle as any },
                              { label: 'Absent', value: 'absent', icon: XCircle as any },
                              { label: 'Late', value: 'late', icon: Clock as any },
                              { label: 'Excused', value: 'excused', icon: AlertCircle as any },
                              { divider: true },
                              { label: 'Delete', value: 'delete', icon: MinusCircle as any, danger: true },
                            ]}
                            onSelect={value => {
                              if (value === 'delete') {
                                handleDeleteRecord(record.id);
                              } else if (value !== record.status) {
                                handleSetStatus(new Date(record.date), value as AttendanceStatus);
                              }
                            }}
                            align="right"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No attendance records yet</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">Click on a date in the calendar above to mark attendance</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Attendance Record"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteRecord.isPending}
      />
    </div>
  );
}