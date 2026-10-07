import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { usePomodoroSessions, useCreatePomodoro, useCompletePomodoro, usePausePomodoro, useResumePomodoro, useCancelPomodoro, usePomodoroStats, useActivePomodoro } from '@productivity-suite/core';
import { POMODORO_PRESETS, usePomodoroTimer } from '@productivity-suite/core';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';

const timerPresets = [
  { key: 'focus', label: 'Focus', icon: 'school', color: '#0ea5e9', defaultMinutes: 25 },
  { key: 'short_break', label: 'Short Break', icon: 'cafe', color: '#22c55e', defaultMinutes: 5 },
  { key: 'long_break', label: 'Long Break', icon: 'time', color: '#f59e0b', defaultMinutes: 15 },
] as const;

export default function PomodoroScreen() {
  const router = useRouter();
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

  if (isLoading && !activeSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Pomodoro Timer</Text>
            <Text style={styles.subtitle}>Stay focused with the Pomodoro technique</Text>
          </View>
          <Button variant="outline" size="sm" onPress={() => setShowSettings(true)}>
            <Ionicons name="settings" size={20} color="#0ea5e9" />
          </Button>
        </View>

        {/* Timer Presets */}
        <View style={styles.presetsContainer}>
          {timerPresets.map(preset => (
            <TouchableOpacity
              key={preset.key}
              style={[
                styles.presetButton,
                activePreset === preset.key && styles.presetButtonActive,
                { borderColor: preset.color },
              ]}
              onPress={() => handlePresetChange(preset.key)}
              disabled={!!activeSession && (activeSession.status === 'running' || activeSession.status === 'paused')}
              activeOpacity={0.7}
            >
              <Ionicons name={preset.icon} size={20} color={activePreset === preset.key ? '#ffffff' : preset.color} />
              <Text style={[styles.presetLabel, activePreset === preset.key && styles.presetLabelActive]}>{preset.label}</Text>
              <View style={[styles.presetBadge, activePreset === preset.key && styles.presetBadgeActive]}>
                <Text style={[styles.presetBadgeText, activePreset === preset.key && styles.presetBadgeTextActive]}>
                  {customMinutes[preset.key] || POMODORO_PRESETS[preset.key]}m
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Timer */}
        <View style={styles.timerCard}>
          <View style={styles.timerCircleContainer}>
            <View style={styles.timerCircle}>
              <View style={styles.timerProgress}>
                <View
                  style={[
                    styles.timerProgressBar,
                    {
                      transform: [{ rotate: `${-90 + (progress / 100) * 360}deg` }],
                      borderColor: currentPreset.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.timerCenter}>
                <Text style={styles.timerText}>{timer.formattedTime}</Text>
                <Text style={styles.timerLabel}>{activePreset.replace('_', ' ')}</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: '#f3f4f6' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: currentPreset.color, width: `${progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}% complete</Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {activeSession && (activeSession.status === 'running' || activeSession.status === 'paused') ? (
              <View style={styles.controlsRow}>
                <Button
                  variant={activeSession.status === 'running' ? 'outline' : 'primary'}
                  size="lg"
                  style={styles.mainControlButton}
                  onPress={activeSession.status === 'running' ? handlePause : handleStart}
                >
                  <Ionicons name={activeSession.status === 'running' ? 'pause' : 'play'} size={24} color={activeSession.status === 'running' ? '#0ea5e9' : '#ffffff'} />
                  <Text style={{ marginLeft: 8 }}>{activeSession.status === 'running' ? 'Pause' : 'Resume'}</Text>
                </Button>
                <Button variant="outline" size="lg" style={styles.secondaryButton} onPress={handleReset}>
                  <Ionicons name="refresh" size={24} color="#64748b" />
                </Button>
                <Button variant="ghost" size="lg" style={styles.secondaryButton} onPress={handleSkip}>
                  <Ionicons name="play-skip-forward-outline" size={24} color="#64748b" />
                </Button>
              </View>
            ) : (
              <View style={styles.controlsRow}>
                <Button variant="primary" size="lg" style={styles.mainControlButton} onPress={handleStart}>
                  <Ionicons name="play" size={24} color="#ffffff" />
                  <Text style={{ marginLeft: 8 }}>Start</Text>
                </Button>
                <Button variant="outline" size="lg" style={styles.secondaryButton} onPress={handleReset}>
                  <Ionicons name="refresh" size={24} color="#64748b" />
                </Button>
              </View>
            )}
          </View>

          {/* Session Info */}
          {activeSession && (
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionInfoText}>
                Session started at {format(new Date(activeSession.started_at), 'h:mm a')}
                {activeSession.task_id && ' • Linked to task'}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_focus_minutes || 0}m</Text>
            <Text style={styles.statLabel}>Total Focus Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats?.streak_days || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#0ea5e9' }]}>{stats?.total_sessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats?.average_session_length || 0}m</Text>
            <Text style={styles.statLabel}>Avg Session</Text>
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.sessionsCard}>
          <View style={styles.sessionsHeader}>
            <View>
              <Text style={styles.sessionsTitle}>Recent Sessions</Text>
              <Text style={styles.sessionsSubtitle}>Your last 10 Pomodoro sessions</Text>
            </View>
          </View>
          <View style={styles.sessionsContent}>
            {isLoading ? (
              <View style={styles.sessionsLoading}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={styles.sessionsSkeleton} />
                ))}
              </View>
            ) : sessions && sessions.length > 0 ? (
              <View style={styles.sessionsList}>
                {sessions.map(session => (
                  <TouchableOpacity key={session.id} style={styles.sessionItem} activeOpacity={0.7}>
                    <View
                      style={[
                        styles.sessionIcon,
                        {
                          backgroundColor:
                            session.type === 'focus'
                              ? 'rgba(14, 165, 233, 0.2)'
                              : session.type === 'short_break'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={session.type === 'focus' ? 'school' : session.type === 'short_break' ? 'cafe' : 'time'}
                        size={24}
                        color={
                          session.type === 'focus'
                            ? '#0ea5e9'
                            : session.type === 'short_break'
                            ? '#22c55e'
                            : '#f59e0b'
                        }
                      />
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionType}>{session.type.replace('_', ' ')}</Text>
                      <Text style={styles.sessionMeta}>
                        {format(new Date(session.started_at), 'MMM d, h:mm a')} • {session.completed_minutes} min
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.sessionStatusBadge,
                        {
                          backgroundColor:
                            session.status === 'completed'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : session.status === 'cancelled'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(100, 116, 139, 0.2)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionStatusText,
                          {
                            color:
                              session.status === 'completed'
                                ? '#22c55e'
                                : session.status === 'cancelled'
                                ? '#ef4444'
                                : '#64748b',
                          },
                        ]}
                      >
                        {session.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptySessions}>
                <Ionicons name="timer-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptySessionsText}>No sessions yet</Text>
                <Button variant="primary" style={styles.emptySessionsButton} onPress={handleStart}>
                  <Text>Start your first session</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      {showSettings && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timer Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {timerPresets.map(preset => (
                <View key={preset.key} style={styles.settingsItem}>
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name={preset.icon}
                      size={24}
                      color={preset.color}
                    />
                    <Text style={styles.settingsItemLabel}>{preset.label}</Text>
                  </View>
                  <View style={styles.settingsItemInput}>
                    <Text style={styles.settingsInput}>{customMinutes[preset.key] || POMODORO_PRESETS[preset.key]} min</Text>
                  </View>
                </View>
              ))}
              <View style={styles.modalActions}>
                <Button variant="outline" style={styles.modalActionButton} onPress={() => setShowSettings(false)}>
                  <Text>Cancel</Text>
                </Button>
                <Button style={styles.modalActionButton} onPress={() => setShowSettings(false)}>
                  <Text>Save</Text>
                </Button>
              </View>
            </ScrollView>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  presetsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  presetButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  presetLabelActive: {
    color: '#ffffff',
  },
  presetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  presetBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  presetBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  presetBadgeTextActive: {
    color: '#ffffff',
  },
  timerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  timerCircleContainer: {
    width: 280,
    height: 280,
    marginBottom: 16,
  },
  timerCircle: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  timerProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  timerProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 8,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRadius: 140,
  },
  timerCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1a1a2e',
    lineHeight: 64,
  },
  timerLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  controlsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mainControlButton: {
    flex: 1,
    minWidth: 140,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    padding: 0,
  },
  sessionInfo: {
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    width: '100%',
  },
  sessionInfoText: {
    fontSize: 13,
    color: '#0ea5e9',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  sessionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  sessionsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  sessionsSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  sessionsContent: {
    padding: 16,
  },
  sessionsLoading: {
    gap: 8,
  },
  sessionsSkeleton: {
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  sessionsList: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDetails: {
    flex: 1,
    minWidth: 0,
  },
  sessionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    textTransform: 'capitalize',
  },
  sessionMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sessionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptySessions: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptySessionsText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  emptySessionsButton: {
    marginTop: 8,
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
    maxHeight: '70%',
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  settingsItemInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
    width: 60,
    textAlign: 'right',
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