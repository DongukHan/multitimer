import { create } from 'zustand';
import { loadItem, saveItem } from '@/utils/storage';

export type IntervalStep = { id: string; label: string; durationSeconds: number };
export type IntervalSession = { id: string; label: string; steps: IntervalStep[]; repeatCount: number };

type IntervalStore = {
  sessions: IntervalSession[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addSession: (session: Omit<IntervalSession, 'id' | 'steps'> & { steps: Array<Omit<IntervalStep, 'id'>> }) => void;
  deleteSession: (id: string) => void;
};

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export const useIntervalStore = create<IntervalStore>((set) => ({
  sessions: [],
  hydrated: false,

  hydrate: async () => {
    const sessions = await loadItem<IntervalSession[]>('interval_sessions', []);
    set({ sessions, hydrated: true });
  },

  addSession: (session) =>
    set((s) => {
      const newSession = { ...session, id: genId(), steps: session.steps.map(step => ({ ...step, id: genId() })) };
      const updated = [...s.sessions, newSession];
      saveItem('interval_sessions', updated);
      return { sessions: updated };
    }),

  deleteSession: (id) =>
    set((s) => {
      const updated = s.sessions.filter((sess) => sess.id !== id);
      saveItem('interval_sessions', updated);
      return { sessions: updated };
    }),
}));
