import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { IntervalSession } from '@/store/intervalStore';
import { formatTime } from '@/utils/time';
import { scheduleTimerNotification, cancelNotification } from '@/utils/notifications';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

type Props = { session: IntervalSession; onStop: () => void };

export default function IntervalRunView({ session, onStop }: Props) {
  // Refs track the source of truth for countdown state (mutated safely inside interval callback)
  const stepIdxRef = useRef(0);
  const repeatRef = useRef(1);

  // Display state drives UI re-renders
  const [stepIdx, setStepIdx] = useState(0);
  const [repeat, setRepeat] = useState(1);
  const [remaining, setRemaining] = useState(session.steps[0]?.durationSeconds ?? 0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDark = useColorScheme() === 'dark';

  const currentStep = session.steps[stepIdx];
  const nextStep = session.steps[stepIdx + 1];

  useEffect(() => {
    activateKeepAwakeAsync();
    return () => {
      deactivateKeepAwake();
      cancelNotification(`timer_${session.id}`);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;

        // Step complete — advance outside the updater using refs
        const nextIdx = stepIdxRef.current + 1;
        if (nextIdx < session.steps.length) {
          stepIdxRef.current = nextIdx;
          setStepIdx(nextIdx);
          return session.steps[nextIdx].durationSeconds;
        } else if (repeatRef.current < session.repeatCount) {
          repeatRef.current += 1;
          setRepeat(repeatRef.current);
          stepIdxRef.current = 0;
          setStepIdx(0);
          return session.steps[0].durationSeconds;
        } else {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          scheduleTimerNotification(session.id, `${session.label} 완료!`, 1);
          return 0;
        }
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.sessionLabel, isDark && styles.textDark]}>{session.label}</Text>
      <Text style={[styles.meta, isDark && styles.textDark]}>반복 {repeat}/{session.repeatCount} · 구간 {stepIdx + 1}/{session.steps.length}</Text>
      <Text style={[styles.stepLabel, isDark && styles.textDark]}>{currentStep?.label}</Text>
      <Text style={[styles.time, isDark && styles.textDark]}>{formatTime(remaining)}</Text>
      {nextStep && <Text style={styles.next}>다음: {nextStep.label}</Text>}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.stopBtn} onPress={() => { cancelNotification(`timer_${session.id}`); onStop(); }}>
          <Text style={styles.stopBtnText}>중지</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsRunning((r) => !r)}>
          <Text style={styles.pauseBtnText}>{isRunning ? '일시정지' : '계속'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f2f2f7' },
  containerDark: { backgroundColor: '#000' },
  sessionLabel: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 8 },
  textDark: { color: '#fff' },
  meta: { fontSize: 14, color: '#666', marginBottom: 32 },
  stepLabel: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 16 },
  time: { fontSize: 80, fontWeight: '200', color: '#000', letterSpacing: 2, marginBottom: 16 },
  next: { fontSize: 14, color: '#999', marginBottom: 48 },
  controls: { flexDirection: 'row', gap: 16 },
  stopBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30' },
  stopBtnText: { color: '#FF3B30', fontWeight: '600', fontSize: 16 },
  pauseBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF' },
  pauseBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
