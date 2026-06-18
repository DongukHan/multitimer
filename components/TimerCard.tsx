import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useTimerStore, TimerItem } from '@/store/timerStore';
import { formatTime } from '@/utils/time';
import { scheduleTimerNotification, cancelNotification } from '@/utils/notifications';

type Props = { timer: TimerItem };

export default function TimerCard({ timer }: Props) {
  const { startTimer, pauseTimer, resetTimer, removeTimer, tickTimer } = useTimerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => tickTimer(timer.id), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.isRunning]);

  useEffect(() => {
    if (timer.remainingSeconds === 0 && !timer.isRunning) {
      cancelNotification(`timer_${timer.id}`);
    }
  }, [timer.remainingSeconds]);

  const handleStart = async () => {
    startTimer(timer.id);
    await scheduleTimerNotification(timer.id, timer.label, timer.remainingSeconds);
  };

  const handlePause = async () => {
    pauseTimer(timer.id);
    await cancelNotification(`timer_${timer.id}`);
  };

  const handleReset = async () => {
    resetTimer(timer.id);
    await cancelNotification(`timer_${timer.id}`);
  };

  const progress = timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 0;
  const isFinished = timer.remainingSeconds === 0;

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.header}>
        <Text style={[styles.label, isDark && styles.textDark]}>{timer.label}</Text>
        <TouchableOpacity onPress={() => removeTimer(timer.id)}>
          <Text style={styles.remove}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={[styles.time, isDark && styles.textDark, isFinished && styles.finished]}>
        {formatTime(timer.remainingSeconds)}
      </Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={handleReset}>
          <Text style={styles.btnText}>↺</Text>
        </TouchableOpacity>
        {timer.isRunning ? (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handlePause}>
            <Text style={styles.btnText}>⏸</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleStart}>
            <Text style={styles.btnText}>{isFinished ? '↺' : '▶'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  cardDark: { backgroundColor: '#1c1c1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600', color: '#000' },
  textDark: { color: '#fff' },
  remove: { fontSize: 18, color: '#999', padding: 4 },
  progressBg: { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, marginBottom: 12 },
  progressFill: { height: 4, backgroundColor: '#007AFF', borderRadius: 2 },
  time: { fontSize: 48, fontWeight: '200', textAlign: 'center', color: '#000', letterSpacing: 2, marginBottom: 12 },
  finished: { color: '#FF3B30' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  btn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnText: { fontSize: 20 },
});
