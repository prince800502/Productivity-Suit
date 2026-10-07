'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Play, Pause, SkipForward, RotateCcw, Settings, Target, BarChart3, Clock, Coffee, Brain } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Progress, Tabs, Modal, Input
} from '@productivity-suite/ui';
import { usePomodoroSessions, useCreatePomodoro, useCompletePomodoro, usePausePomodoro, useResumePomodoro, useCancelPomodoro, usePomodoroStats, useActivePomodoro } from '@productivity-suite/core';
import { POMODORO_PRESETS, usePomodoroTimer } from '@productivity-suite/core';
import { cn } from '@productivity-suite/ui';

const timerPresets = [
  { key: 'focus', label: 'Focus', icon: Brain, color: 'primary', defaultMinutes: 25 },
  { key: 'short_break', label: 'Short Break', icon: Coffee, color: 'success', defaultMinutes: 5 },
  { key: 'long_break', label: 'Long Break', icon: Clock, color: 'warning', defaultMinutes: 15 },
] as const;

export default function PomodoroPage() {
  const [activePreset, setActivePreset] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [showSettings, setShowSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState({
    focus: 25,
    short_break: 5,
    long_break: 15,
  });

  const { data: sessions, isLoading } = usePomodoroSessions({ limit: 10 });
  const { data: stats } = usePomodoroStats();
  const { data: activeSession } = useActivePomodoro();
  const createPomodoro = useCreatePomodoro();
  const completePomodoro = useCompletePomodoro();
  const pausePomodoro = usePausePomodoro();
  const resumePomodoro = useResumePomodoro();
  const cancelPomodoro = useCancelPomodoro();

  const timer = usePomodoroTimer(customMinutes[activePreset] || POMODORO_PRESETS[activePreset]);

  // Sync timer with active session
  useEffect(() => {
    if (activeSession && activeSession.type === activePreset) {
      if (activeSession.status === 'running' && !timer.isRunning) {
        timer.start();
      } else if (activeSession.status === 'paused' && timer.isRunning) {
        timer.pause();
      }
    }
  }, [activeSession, activePreset, timer]);

  const handleStart = async () => {
    if (activeSession) {
      if (activeSession.status === 'paused') {
        await resumePomodoro.mutateAsync(activeSession.id);
      } else {
        await pausePomodoro.mutateAsync(activeSession.id);
      }
    } else {
      await createPomodoro.mutateAsync({
        type: activePreset,
        duration_minutes: customMinutes[activePreset] || POMODORO_PRESETS[activePreset],
      });
      timer.start();
    }
  };

  const handlePause = async () => {
    if (activeSession) {
      await pausePomodoro.mutateAsync(activeSession.id);
    }
    timer.pause();
  };

  const handleReset = () => {
    timer.reset(customMinutes[activePreset] || POMODORO_PRESETS[activePreset]);
  };

  const handleComplete = async () => {
    if (activeSession) {
      await completePomodoro.mutateAsync({
        id: activeSession.id,
        completedMinutes: timer.completedMinutes,
      });
    }
    timer.reset(customMinutes[activePreset] || POMODORO_PRESETS[activePreset]);
  };

  const handleSkip = async () => {
    if (activeSession) {
      await cancelPomodoro.mutateAsync(activeSession.id);
    }
    timer.skip();
  };

  const handlePresetChange = (preset: 'focus' | 'short_break' | 'long_break') => {
    if (!activeSession || activeSession.status === 'completed' || activeSession.status === 'cancelled') {
      setActivePreset(preset);
      timer.reset(customMinutes[preset] || POMODORO_PRESETS[preset]);
    }
  };

  const currentPreset = timerPresets.find(p => p.key === activePreset)!;
  const progress = timer.progress;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Pomodoro Timer</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Stay focused with the Pomodoro technique</p>
        </div>
        <Button variant="outline" size="sm" icon={<Settings className="w-4 h-4" />} onClick={() => setShowSettings(true)}>
          Settings
        </Button>
      </div>

      {/* Timer Presets */}
      <div className="flex gap-2 mb-6">
        {timerPresets.map(preset => (
          <Button
            key={preset.key}
            variant={activePreset === preset.key ? 'primary' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => handlePresetChange(preset.key)}
            disabled={activeSession && (activeSession.status === 'running' || activeSession.status === 'paused') ? true : false}
          >
            <preset.icon className="w-4 h-4" />
            <span>{preset.label}</span>
            <Badge variant="outline" size="sm">
              {customMinutes[preset.key] || POMODORO_PRESETS[preset.key]}m
            </Badge>
          </Button>
        ))}
      </div>

      {/* Main Timer */}
      <Card className="p-8 text-center">
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-neutral-200 dark:text-neutral-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="90"
              cx="128"
              cy="128"
            />
            <circle
              className={currentPreset.color === 'primary' ? 'text-primary-500' : currentPreset.color === 'success' ? 'text-success-500' : 'text-warning-500'}
              strokeWidth="8"
              strokeDasharray="565"
              strokeDashoffset={565 * (1 - progress / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="90"
              cx="128"
              cy="128"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {timer.formattedTime}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
              {activePreset.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto mb-8">
          <Progress value={progress} showLabel label={`${progress.toFixed(0)}% complete`} size="lg" variant={currentPreset.color as any} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {activeSession && (activeSession.status === 'running' || activeSession.status === 'paused') ? (
            <>
              <Button
                variant={activeSession.status === 'running' ? 'outline' : 'primary'}
                size="lg"
                icon={activeSession.status === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                onClick={activeSession.status === 'running' ? handlePause : handleStart}
              >
                {activeSession.status === 'running' ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="outline" size="lg" icon={<RotateCcw className="w-5 h-5" />} onClick={handleReset}>
                Reset
              </Button>
              <Button variant="ghost" size="lg" icon={<SkipForward className="w-5 h-5" />} onClick={handleSkip}>
                Skip
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" size="lg" icon={<Play className="w-5 h-5" />} onClick={handleStart} className="w-32">
                Start
              </Button>
              <Button variant="outline" size="lg" icon={<RotateCcw className="w-5 h-5" />} onClick={handleReset}>
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Session Info */}
        {activeSession && (
          <div className="mt-6 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Session started at {format(new Date(activeSession.started_at), 'h:mm a')}
              {activeSession.task_id && ' • Linked to task'}
            </p>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats?.total_focus_minutes || 0}m</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Focus Time</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">{stats?.streak_days || 0}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Day Streak</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">{stats?.total_sessions || 0}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Sessions Completed</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{stats?.average_session_length || 0}m</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg Session</p>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your last 10 Pomodoro sessions</CardDescription>
          </div>
          <Tabs
            value={activePreset}
            onChange={(value: string) => setActivePreset(value as 'focus' | 'short_break' | 'long_break')}
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'focus', label: 'Focus' },
              { value: 'short_break', label: 'Short Break' },
              { value: 'long_break', label: 'Long Break' },
            ]}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map(session => (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: session.type === 'focus' ? 'rgba(14, 165, 233, 0.2)' : session.type === 'short_break' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    {session.type === 'focus' && <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                    {session.type === 'short_break' && <Coffee className="w-5 h-5 text-success-600 dark:text-success-400" />}
                    {session.type === 'long_break' && <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize text-neutral-900 dark:text-white">{session.type.replace('_', ' ')}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {format(new Date(session.started_at), 'MMM d, h:mm a')} • {session.completed_minutes} min
                    </p>
                  </div>
                  <Badge
                    variant={session.status === 'completed' ? 'success' : session.status === 'cancelled' ? 'danger' : 'default'}
                    size="sm"
                  >
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">No sessions yet</p>
              <Button variant="primary" icon={<Play className="w-4 h-4" />} onClick={handleStart}>
                Start your first session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Timer Settings"
        size="md"
      >
        <div className="space-y-4">
          {timerPresets.map(preset => (
            <div key={preset.key} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <preset.icon className={cn('w-5 h-5', preset.color === 'primary' ? 'text-primary-600' : preset.color === 'success' ? 'text-success-600' : 'text-warning-600')} />
                <span className="font-medium capitalize">{preset.label}</span>
              </div>
              <Input
                type="number"
                min={1}
                max={120}
                value={customMinutes[preset.key] || POMODORO_PRESETS[preset.key]}
                onChange={e => setCustomMinutes(prev => ({ ...prev, [preset.key]: parseInt(e.target.value) || POMODORO_PRESETS[preset.key] }))}
                className="w-24"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={() => setShowSettings(false)}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}