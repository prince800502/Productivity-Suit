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
import { useToast } from '@productivity-suite/ui';

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
  const { toast } = useToast();

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

  // Handle timer completion
  useEffect(() => {
    if (activeSession && activeSession.status === 'running' && timer.timeLeft === 0 && timer.completedMinutes > 0) {
      completePomodoro.mutateAsync({
        id: activeSession.id,
        completedMinutes: timer.completedMinutes,
      });
      timer.reset(customMinutes[activePreset] || POMODORO_PRESETS[activePreset]);
    }
  }, [timer.timeLeft, activeSession, timer.completedMinutes, activePreset, timer]);

  const handleStart = async () => {
    if (activeSession) {
      try {
        if (activeSession.status === 'paused') {
          await resumePomodoro.mutateAsync(activeSession.id);
          toast({ type: 'success', title: 'Session resumed' });
        } else {
          await pausePomodoro.mutateAsync(activeSession.id);
          toast({ type: 'success', title: 'Session paused' });
        }
      } catch (error: any) {
        toast({ type: 'error', title: 'Error', message: error.message || 'Failed to update session' });
      }
    } else {
      try {
        await createPomodoro.mutateAsync({
          type: activePreset,
          duration_minutes: customMinutes[activePreset] || POMODORO_PRESETS[activePreset],
        });
        toast({ type: 'success', title: 'Session started' });
        timer.start();
      } catch (error: any) {
        toast({ type: 'error', title: 'Error', message: error.message || 'Failed to create session' });
      }
    }
  };

  const handlePause = async () => {
    if (activeSession) {
      try {
        await pausePomodoro.mutateAsync(activeSession.id);
        toast({ type: 'success', title: 'Session paused' });
      } catch (error: any) {
        toast({ type: 'error', title: 'Error', message: error.message || 'Failed to pause session' });
      }
    }
    timer.pause();
  };

  const handleReset = () => {
    timer.reset(customMinutes[activePreset] || POMODORO_PRESETS[activePreset]);
  };

  const handleSkip = async () => {
    if (activeSession) {
      try {
        await cancelPomodoro.mutateAsync(activeSession.id);
        toast({ type: 'success', title: 'Session cancelled' });
      } catch (error: any) {
        toast({ type: 'error', title: 'Error', message: error.message || 'Failed to cancel session' });
      }
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
      <Card variant="default" glass={true} className="p-8 text-center">
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
      </Card>

      {/* Stats */}
      <Tabs value="sessions" onChange={() => {}} tabs={[
        { value: 'sessions', label: 'Sessions', icon: <Target className="w-4 h-4" /> },
        { value: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
      ]} fullWidth variant="glass" className="mt-8" />

      <div className="space-y-6">
        <Card variant="default" glass={true}>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your last 10 Pomodoro sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse glass-card" />)}
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl glass-card hover:shadow-glass-hover transition-shadow">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${session.type === 'focus' ? 'bg-primary-500' : session.type === 'short_break' ? 'bg-success-500' : 'bg-warning-500'}`}>
                      {session.type === 'focus' && <Brain className="w-6 h-6" />}
                      {session.type === 'short_break' && <Coffee className="w-6 h-6" />}
                      {session.type === 'long_break' && <Clock className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white capitalize">{session.type.replace('_', ' ')}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {session.duration_minutes}m • {format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant={session.status === 'completed' ? 'success' : session.status === 'cancelled' ? 'danger' : 'warning'} size="sm" className="capitalize">
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">No sessions yet</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">Start your first focus session above</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card variant="default" glass={true}>
          <CardHeader>
            <CardTitle>Focus Statistics</CardTitle>
            <CardDescription>Your productivity this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats?.total_focus_minutes || 0}m
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Focus Time</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {stats?.streak_days || 0}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Day Streak</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats?.total_sessions || 0}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Sessions</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                  {stats?.average_session_length || 0}m
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Session</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {timerPresets.map(preset => (
                <div key={preset.key} className="glass-card p-4 rounded-xl text-center">
                  <preset.icon className={`w-6 h-6 mx-auto mb-2 ${preset.color === 'primary' ? 'text-primary-500' : preset.color === 'success' ? 'text-success-500' : 'text-warning-500'}`} />
                  <p className="font-medium text-neutral-900 dark:text-white capitalize">{preset.label}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {preset.defaultMinutes}m default
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Timer Settings"
        size="md"
      >
        <div className="space-y-4">
          {timerPresets.map(preset => (
            <div key={preset.key} className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                {preset.label} Duration
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={customMinutes[preset.key]}
                  onChange={e => setCustomMinutes(prev => ({ ...prev, [preset.key]: Number(e.target.value) || preset.defaultMinutes }))}
                  className="w-24"
                />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">minutes</span>
              </div>
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