import { create } from 'zustand';
import { loadItem, saveItem } from '@/utils/storage';

export type TimerItem = {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  endTime: number | null; // 백그라운드 복원용 (epoch ms)
};

export type TimerPreset = {
  id: string;
  label: string;
  durationSeconds: number;
};

type TimerStore = {
  timers: TimerItem[];
  presets: TimerPreset[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addTimer: (label: string, durationSeconds: number) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  removeTimer: (id: string) => void;
  tickTimer: (id: string) => void;
  savePreset: (label: string, durationSeconds: number) => void;
  deletePreset: (id: string) => void;
};

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  timers: [],
  presets: [],
  hydrated: false,

  hydrate: async () => {
    const presets = await loadItem<TimerPreset[]>('timer_presets', []);
    set({ presets, hydrated: true });
  },

  addTimer: (label, durationSeconds) =>
    set((s) => ({
      timers: [...s.timers, {
        id: genId(), label, totalSeconds: durationSeconds,
        remainingSeconds: durationSeconds, isRunning: false, endTime: null,
      }],
    })),

  startTimer: (id) =>
    set((s) => ({
      timers: s.timers.map((t) =>
        t.id === id
          ? { ...t, isRunning: true, endTime: Date.now() + t.remainingSeconds * 1000 }
          : t
      ),
    })),

  pauseTimer: (id) =>
    set((s) => ({
      timers: s.timers.map((t) =>
        t.id === id ? { ...t, isRunning: false, endTime: null } : t
      ),
    })),

  resetTimer: (id) =>
    set((s) => ({
      timers: s.timers.map((t) =>
        t.id === id
          ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false, endTime: null }
          : t
      ),
    })),

  removeTimer: (id) =>
    set((s) => ({ timers: s.timers.filter((t) => t.id !== id) })),

  tickTimer: (id) =>
    set((s) => ({
      timers: s.timers.map((t) => {
        if (t.id !== id || !t.isRunning) return t;
        const remaining = t.endTime
          ? Math.max(0, Math.round((t.endTime - Date.now()) / 1000))
          : Math.max(0, t.remainingSeconds - 1);
        return { ...t, remainingSeconds: remaining, isRunning: remaining > 0 };
      }),
    })),

  savePreset: (label, durationSeconds) => {
    const preset: TimerPreset = { id: genId(), label, durationSeconds };
    set((s) => {
      const updated = [...s.presets, preset];
      saveItem('timer_presets', updated);
      return { presets: updated };
    });
  },

  deletePreset: (id) =>
    set((s) => {
      const updated = s.presets.filter((p) => p.id !== id);
      saveItem('timer_presets', updated);
      return { presets: updated };
    }),
}));
