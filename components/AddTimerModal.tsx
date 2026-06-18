import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useTimerStore, TimerPreset } from '@/store/timerStore';

type Props = { visible: boolean; onClose: () => void };

export default function AddTimerModal({ visible, onClose }: Props) {
  const { addTimer, savePreset, deletePreset, presets } = useTimerStore();
  const [label, setLabel] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');
  const isDark = useColorScheme() === 'dark';

  const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);

  const handleAdd = () => {
    if (totalSeconds <= 0) return;
    addTimer(label || '타이머', totalSeconds);
    onClose();
  };

  const handlePreset = (preset: TimerPreset) => {
    addTimer(preset.label, preset.durationSeconds);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textDark]}>타이머 추가</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="이름 (선택)" placeholderTextColor="#999" value={label} onChangeText={setLabel} />
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <TextInput style={[styles.input, isDark && styles.inputDark]} keyboardType="numeric" value={hours} onChangeText={setHours} />
            <Text style={[styles.timeLabel, isDark && styles.textDark]}>시</Text>
          </View>
          <View style={styles.timeField}>
            <TextInput style={[styles.input, isDark && styles.inputDark]} keyboardType="numeric" value={minutes} onChangeText={setMinutes} />
            <Text style={[styles.timeLabel, isDark && styles.textDark]}>분</Text>
          </View>
          <View style={styles.timeField}>
            <TextInput style={[styles.input, isDark && styles.inputDark]} keyboardType="numeric" value={seconds} onChangeText={setSeconds} />
            <Text style={[styles.timeLabel, isDark && styles.textDark]}>초</Text>
          </View>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => { if (totalSeconds > 0) savePreset(label || '타이머', totalSeconds); }}>
            <Text style={styles.saveBtnText}>프리셋 저장</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>시작</Text>
          </TouchableOpacity>
        </View>
        {presets.length > 0 && (
          <>
            <Text style={[styles.presetTitle, isDark && styles.textDark]}>프리셋</Text>
            <ScrollView>
              {presets.map((p) => (
                <View key={p.id} style={styles.presetRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => handlePreset(p)}>
                    <Text style={[styles.presetName, isDark && styles.textDark]}>{p.label}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deletePreset(p.id)}>
                    <Text style={{ color: '#FF3B30', padding: 8 }}>삭제</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#1c1c1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#000' },
  textDark: { color: '#fff' },
  close: { fontSize: 24, color: '#999' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, color: '#000', backgroundColor: '#f9f9f9' },
  inputDark: { borderColor: '#444', color: '#fff', backgroundColor: '#2c2c2e' },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  timeLabel: { textAlign: 'center', color: '#666', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF', alignItems: 'center' },
  saveBtnText: { color: '#007AFF', fontWeight: '600' },
  addBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600' },
  presetTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginTop: 24, marginBottom: 8 },
  presetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  presetName: { fontSize: 16, color: '#000' },
});
