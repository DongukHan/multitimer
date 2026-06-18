import { create } from 'zustand';
import { loadItem, saveItem } from '@/utils/storage';

export type Alarm = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  daysOfWeek: number[]; // 0=일 ~ 6=토
  isEnabled: boolean;
  notifId?: string; // expo-notifications identifier
};

type AlarmStore = {
  alarms: Alarm[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addAlarm: (alarm: Omit<Alarm, 'id'>) => Alarm;
  updateAlarm: (alarm: Alarm) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => Alarm | undefined;
};

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  alarms: [],
  hydrated: false,

  hydrate: async () => {
    const alarms = await loadItem<Alarm[]>('alarms', []);
    set({ alarms, hydrated: true });
  },

  addAlarm: (alarm) => {
    const newAlarm = { ...alarm, id: genId() };
    set((s) => {
      const updated = [...s.alarms, newAlarm];
      saveItem('alarms', updated);
      return { alarms: updated };
    });
    return newAlarm;
  },

  updateAlarm: (alarm) =>
    set((s) => {
      const updated = s.alarms.map((a) => (a.id === alarm.id ? alarm : a));
      saveItem('alarms', updated);
      return { alarms: updated };
    }),

  deleteAlarm: (id) =>
    set((s) => {
      const updated = s.alarms.filter((a) => a.id !== id);
      saveItem('alarms', updated);
      return { alarms: updated };
    }),

  toggleAlarm: (id) => {
    const alarm = get().alarms.find((a) => a.id === id);
    if (!alarm) return undefined;
    const updated = { ...alarm, isEnabled: !alarm.isEnabled };
    set((s) => {
      const list = s.alarms.map((a) => (a.id === id ? updated : a));
      saveItem('alarms', list);
      return { alarms: list };
    });
    return updated;
  },
}));
