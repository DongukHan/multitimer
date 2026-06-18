import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimerStore } from '@/store/timerStore';
import TimerCard from '@/components/TimerCard';
import AddTimerModal from '@/components/AddTimerModal';
import AdBanner from '@/components/AdBanner';
import { requestNotificationPermission } from '@/utils/notifications';

export default function TimerScreen() {
  const { timers, hydrated, hydrate } = useTimerStore();
  const [modalVisible, setModalVisible] = useState(false);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    hydrate();
    requestNotificationPermission();
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.heading, isDark && styles.textDark]}>타이머</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {timers.map((t) => <TimerCard key={t.id} timer={t} />)}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AdBanner />
      <AddTimerModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  containerDark: { backgroundColor: '#000' },
  heading: { fontSize: 34, fontWeight: '700', padding: 16, color: '#000' },
  textDark: { color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  fab: { position: 'absolute', bottom: 80, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
});
