import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStopwatchStore } from '@/store/stopwatchStore';
import { formatMs } from '@/utils/time';
import AdBanner from '@/components/AdBanner';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

export default function StopwatchScreen() {
  const { elapsed, laps, isRunning, start, stop, lap, reset, tick } = useStopwatchStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    if (isRunning) {
      activateKeepAwakeAsync();
      intervalRef.current = setInterval(tick, 30);
    } else {
      deactivateKeepAwake();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const fastestLap = laps.length > 1 ? Math.min(...laps) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps) : null;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.heading, isDark && styles.textDark]}>스톱워치</Text>
      <Text style={[styles.time, isDark && styles.textDark]}>{formatMs(elapsed)}</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={isRunning ? lap : reset}>
          <Text style={styles.btnSecText}>{isRunning ? '랩' : '리셋'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, isRunning ? styles.btnStop : styles.btnStart]} onPress={isRunning ? stop : start}>
          <Text style={styles.btnPrimText}>{isRunning ? '정지' : '시작'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={laps}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => {
          const lapNum = laps.length - index;
          const isFastest = item === fastestLap;
          const isSlowest = item === slowestLap;
          return (
            <View style={[styles.lapRow, isDark && styles.lapRowDark]}>
              <Text style={[styles.lapNum, isDark && styles.textDark]}>랩 {lapNum}</Text>
              <Text style={[styles.lapTime, isFastest && styles.fastest, isSlowest && styles.slowest, isDark && styles.textDark]}>
                {formatMs(item)}
              </Text>
            </View>
          );
        }}
        style={styles.lapList}
      />
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  containerDark: { backgroundColor: '#000' },
  heading: { fontSize: 34, fontWeight: '700', padding: 16, color: '#000' },
  textDark: { color: '#fff' },
  time: { fontSize: 72, fontWeight: '200', textAlign: 'center', letterSpacing: 2, marginVertical: 24, color: '#000' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 32, marginBottom: 32 },
  btn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  btnSecondary: { backgroundColor: '#e0e0e0' },
  btnStart: { backgroundColor: '#34C759' },
  btnStop: { backgroundColor: '#FF3B30' },
  btnSecText: { fontSize: 16, fontWeight: '600', color: '#000' },
  btnPrimText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  lapList: { flex: 1, paddingHorizontal: 16 },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  lapRowDark: { borderBottomColor: '#444' },
  lapNum: { fontSize: 16, color: '#000' },
  lapTime: { fontSize: 16, color: '#000' },
  fastest: { color: '#34C759' },
  slowest: { color: '#FF3B30' },
});
