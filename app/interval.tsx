import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, StyleSheet, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIntervalStore, IntervalSession, IntervalStep } from '@/store/intervalStore';
import IntervalRunView from '@/components/IntervalRunView';
import AdBanner from '@/components/AdBanner';

export default function IntervalScreen() {
  const { sessions, hydrated, hydrate, addSession, deleteSession } = useIntervalStore();
  const [running, setRunning] = useState<IntervalSession | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => { hydrate(); }, []);

  if (running) {
    return <IntervalRunView session={running} onStop={() => setRunning(null)} />;
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.heading, isDark && styles.textDark]}>인터벌</Text>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, isDark && styles.textDark]}>{item.label}</Text>
              <Text style={styles.cardMeta}>{item.steps.length}구간 · {item.repeatCount}회 반복</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('삭제', '삭제할까요?', [{ text: '취소' }, { text: '삭제', onPress: () => deleteSession(item.id), style: 'destructive' }])}>
              <Text style={{ color: '#FF3B30', padding: 8 }}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startBtn} onPress={() => setRunning(item)}>
              <Text style={styles.startBtnText}>시작</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AdBanner />
      <AddSessionModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={addSession} isDark={isDark} />
    </SafeAreaView>
  );
}

function AddSessionModal({ visible, onClose, onSave, isDark }: { visible: boolean; onClose: () => void; onSave: (s: Omit<IntervalSession, 'id'>) => void; isDark: boolean }) {
  const [label, setLabel] = useState('');
  const [repeatCount, setRepeatCount] = useState('1');
  const [steps, setSteps] = useState<Omit<IntervalStep, 'id'>[]>([]);
  const [stepLabel, setStepLabel] = useState('');
  const [stepSecs, setStepSecs] = useState('');

  const handleSave = () => {
    if (!label || steps.length === 0) return;
    onSave({ label, steps: steps as IntervalStep[], repeatCount: parseInt(repeatCount) || 1 });
    setLabel(''); setRepeatCount('1'); setSteps([]); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modal, isDark && styles.modalDark]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, isDark && styles.textDark]}>인터벌 세션</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: '#999', fontSize: 24 }}>✕</Text></TouchableOpacity>
        </View>
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="세션 이름" placeholderTextColor="#999" value={label} onChangeText={setLabel} />
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="반복 횟수" placeholderTextColor="#999" keyboardType="numeric" value={repeatCount} onChangeText={setRepeatCount} />
        <Text style={[{ fontWeight: '600', marginBottom: 8 }, isDark && styles.textDark]}>구간</Text>
        {steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={isDark && styles.textDark}>{s.label} — {s.durationSeconds}초</Text>
            <TouchableOpacity onPress={() => setSteps(steps.filter((_, j) => j !== i))}><Text style={{ color: '#FF3B30' }}>삭제</Text></TouchableOpacity>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1 }]} placeholder="구간명" placeholderTextColor="#999" value={stepLabel} onChangeText={setStepLabel} />
          <TextInput style={[styles.input, isDark && styles.inputDark, { width: 70 }]} placeholder="초" placeholderTextColor="#999" keyboardType="numeric" value={stepSecs} onChangeText={setStepSecs} />
          <TouchableOpacity style={styles.addStepBtn} onPress={() => { if (stepLabel && stepSecs) { setSteps([...steps, { label: stepLabel, durationSeconds: parseInt(stepSecs) }]); setStepLabel(''); setStepSecs(''); } }}>
            <Text style={{ color: '#007AFF', fontSize: 24 }}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveMainBtn} onPress={handleSave}>
          <Text style={styles.saveMainBtnText}>저장</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  containerDark: { backgroundColor: '#000' },
  heading: { fontSize: 34, fontWeight: '700', padding: 16, color: '#000' },
  textDark: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardDark: { backgroundColor: '#1c1c1e' },
  cardLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  cardMeta: { fontSize: 13, color: '#999', marginTop: 2 },
  startBtn: { backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8 },
  startBtnText: { color: '#fff', fontWeight: '600' },
  fab: { position: 'absolute', bottom: 80, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
  modal: { flex: 1, padding: 24, backgroundColor: '#fff' },
  modalDark: { backgroundColor: '#1c1c1e' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, color: '#000', backgroundColor: '#f9f9f9' },
  inputDark: { borderColor: '#444', color: '#fff', backgroundColor: '#2c2c2e' },
  addStepBtn: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  saveMainBtn: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveMainBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
