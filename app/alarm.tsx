import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Switch, StyleSheet, useColorScheme, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarmStore, Alarm } from '@/store/alarmStore';
import { scheduleAlarmNotification, cancelNotification } from '@/utils/notifications';
import AdBanner from '@/components/AdBanner';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function AlarmScreen() {
  const { alarms, hydrated, hydrate, addAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useAlarmStore();
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Alarm | null>(null);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    hydrate();
  }, []);

  const handleToggle = async (id: string) => {
    const updated = toggleAlarm(id);
    if (!updated) return;
    if (updated.isEnabled) {
      const notifId = await scheduleAlarmNotification(id, updated.label, updated.hour, updated.minute, updated.daysOfWeek.length > 0);
      updateAlarm({ ...updated, notifId });
    } else {
      if (updated.notifId) await cancelNotification(updated.notifId);
    }
  };

  const handleDelete = async (alarm: Alarm) => {
    Alert.alert('삭제', '알람을 삭제할까요?', [
      { text: '취소' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (alarm.notifId) await cancelNotification(alarm.notifId);
          deleteAlarm(alarm.id);
        },
      },
    ]);
  };

  const handleSave = async (data: Omit<Alarm, 'id'>) => {
    if (editTarget) {
      if (editTarget.notifId) await cancelNotification(editTarget.notifId);
      const notifId = data.isEnabled
        ? await scheduleAlarmNotification(editTarget.id, data.label, data.hour, data.minute, data.daysOfWeek.length > 0)
        : undefined;
      updateAlarm({ ...data, id: editTarget.id, notifId });
    } else {
      const alarm = addAlarm(data);
      if (alarm.isEnabled) {
        const notifId = await scheduleAlarmNotification(alarm.id, alarm.label, alarm.hour, alarm.minute, alarm.daysOfWeek.length > 0);
        updateAlarm({ ...alarm, notifId });
      }
    }
    setShowEdit(false);
    setEditTarget(null);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.heading, isDark && styles.textDark]}>알람</Text>
      <FlatList
        data={alarms}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => { setEditTarget(item); setShowEdit(true); }}>
              <Text style={[styles.timeText, isDark && styles.textDark]}>
                {item.hour.toString().padStart(2, '0')}:{item.minute.toString().padStart(2, '0')}
              </Text>
              {item.label ? <Text style={[styles.labelText, isDark && styles.textDark]}>{item.label}</Text> : null}
              <Text style={styles.daysText}>
                {item.daysOfWeek.length === 0 ? '한 번만' : item.daysOfWeek.map((d) => DAY_LABELS[d]).join(' ')}
              </Text>
            </TouchableOpacity>
            <Switch value={item.isEnabled} onValueChange={() => handleToggle(item.id)} />
            <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 8 }}>
              <Text style={{ color: '#FF3B30', fontSize: 16 }}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => { setEditTarget(null); setShowEdit(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AdBanner />
      <AlarmEditModal visible={showEdit} alarm={editTarget} onSave={handleSave} onClose={() => { setShowEdit(false); setEditTarget(null); }} isDark={isDark} />
    </SafeAreaView>
  );
}

function AlarmEditModal({ visible, alarm, onSave, onClose, isDark }: {
  visible: boolean; alarm: Alarm | null;
  onSave: (data: Omit<Alarm, 'id'>) => void;
  onClose: () => void; isDark: boolean;
}) {
  const [hour, setHour] = useState(alarm?.hour.toString() ?? '7');
  const [minute, setMinute] = useState(alarm?.minute.toString() ?? '0');
  const [label, setLabel] = useState(alarm?.label ?? '');
  const [days, setDays] = useState<number[]>(alarm?.daysOfWeek ?? []);

  useEffect(() => {
    setHour(alarm?.hour.toString() ?? '7');
    setMinute(alarm?.minute.toString() ?? '0');
    setLabel(alarm?.label ?? '');
    setDays(alarm?.daysOfWeek ?? []);
  }, [alarm]);

  const toggleDay = (d: number) => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

  const handleSave = () => {
    const h = Math.min(23, Math.max(0, parseInt(hour) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minute) || 0));
    onSave({ label, hour: h, minute: m, daysOfWeek: days, isEnabled: true });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modal, isDark && { backgroundColor: '#1c1c1e' }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, isDark && styles.textDark]}>{alarm ? '알람 편집' : '알람 추가'}</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: '#999', fontSize: 24 }}>✕</Text></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[{ marginBottom: 4, color: '#666' }]}>시</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark, { textAlign: 'center', fontSize: 32 }]} keyboardType="numeric" value={hour} onChangeText={setHour} maxLength={2} />
          </View>
          <Text style={{ fontSize: 40, alignSelf: 'flex-end', marginBottom: 12, color: isDark ? '#fff' : '#000' }}>:</Text>
          <View style={{ flex: 1 }}>
            <Text style={[{ marginBottom: 4, color: '#666' }]}>분</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark, { textAlign: 'center', fontSize: 32 }]} keyboardType="numeric" value={minute} onChangeText={setMinute} maxLength={2} />
          </View>
        </View>
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="레이블 (선택)" placeholderTextColor="#999" value={label} onChangeText={setLabel} />
        <Text style={[{ fontWeight: '600', marginBottom: 12 }, isDark && styles.textDark]}>반복 요일</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {DAY_LABELS.map((d, i) => (
            <TouchableOpacity key={i} style={[styles.dayBtn, days.includes(i) && styles.dayBtnActive]} onPress={() => toggleDay(i)}>
              <Text style={[styles.dayBtnText, days.includes(i) && styles.dayBtnTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
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
  timeText: { fontSize: 40, fontWeight: '200', color: '#000' },
  labelText: { fontSize: 14, color: '#000', marginTop: 2 },
  daysText: { fontSize: 13, color: '#999', marginTop: 2 },
  fab: { position: 'absolute', bottom: 80, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
  modal: { flex: 1, padding: 24, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, color: '#000', backgroundColor: '#f9f9f9' },
  inputDark: { borderColor: '#444', color: '#fff', backgroundColor: '#2c2c2e' },
  dayBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  dayBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  dayBtnText: { fontSize: 13, color: '#666' },
  dayBtnTextActive: { color: '#fff' },
  saveMainBtn: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveMainBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
