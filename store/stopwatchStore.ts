import { create } from 'zustand';

type StopwatchStore = {
  elapsed: number;
  laps: number[];
  isRunning: boolean;
  startedAt: number | null;
  baseElapsed: number;
  start: () => void;
  stop: () => void;
  lap: () => void;
  reset: () => void;
  tick: () => void;
};

export const useStopwatchStore = create<StopwatchStore>((set, get) => ({
  elapsed: 0,
  laps: [],
  isRunning: false,
  startedAt: null,
  baseElapsed: 0,

  start: () => set({ isRunning: true, startedAt: Date.now() }),

  stop: () =>
    set((s) => ({
      isRunning: false,
      baseElapsed: s.elapsed,
      startedAt: null,
    })),

  lap: () =>
    set((s) => ({ laps: [s.elapsed, ...s.laps] })),

  reset: () =>
    set({ elapsed: 0, laps: [], isRunning: false, startedAt: null, baseElapsed: 0 }),

  tick: () =>
    set((s) => ({
      elapsed: s.startedAt ? s.baseElapsed + (Date.now() - s.startedAt) : s.elapsed,
    })),
}));
