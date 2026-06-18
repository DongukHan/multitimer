# MultiTimer Implementation Plan (React Native/Expo)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expo(React Native) 기반 타이머/스톱워치/인터벌/알람 앱을 Android + iOS 동시 출시 가능 수준으로 구현한다.

**Architecture:** Expo Router 파일 기반 탭 네비게이션, Zustand로 상태관리, AsyncStorage로 영속화, expo-notifications로 백그라운드 알람 처리.

**Tech Stack:** Expo SDK 52, TypeScript, Expo Router, Zustand, AsyncStorage, expo-notifications, expo-av, react-native-google-mobile-ads

## Global Constraints

- Expo SDK 52, TypeScript strict mode
- 패키지 관리자: npm
- 프로젝트 루트: `C:\Users\dwhan\projects\multitimer`
- 패키지명(bundleId): `com.multitimer`
- AdMob 테스트 배너 ID (Android): `ca-app-pub-3940256099942544/6300978111`
- AdMob 테스트 배너 ID (iOS): `ca-app-pub-3940256099942544/2934735716`
- 모든 UI는 React Native Paper 또는 기본 RN 컴포넌트 + StyleSheet 사용
- 다크 모드: `useColorScheme()` 훅으로 처리
- 커밋은 각 Task 완료 시 `feat:` prefix

---

## File Structure

```
multitimer/
  app/
    _layout.tsx          # Root layout (탭 네비게이션)
    index.tsx            # 타이머 탭
    stopwatch.tsx        # 스톱워치 탭
    interval.tsx         # 인터벌 탭
    alarm.tsx            # 알람 탭
  components/
    AdBanner.tsx         # AdMob 배너
    TimerCard.tsx        # 타이머 카드
    AddTimerModal.tsx    # 타이머 추가 모달
    IntervalRunView.tsx  # 인터벌 실행 화면
  store/
    timerStore.ts        # 타이머 + 프리셋 (Zustand)
    stopwatchStore.ts    # 스톱워치 (Zustand)
    intervalStore.ts     # 인터벌 세션 (Zustand)
    alarmStore.ts        # 알람 (Zustand)
  utils/
    notifications.ts     # expo-notifications 헬퍼
    storage.ts           # AsyncStorage 헬퍼
    time.ts              # 시간 포맷 유틸
  app.json
  package.json
  tsconfig.json
  docs/ (기존 스펙/플랜 문서)
```

---

### Task 1: Expo 프로젝트 초기화 및 의존성 설치

**Files:**
- Create: `package.json` (Expo가 생성)
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `utils/time.ts`

**Interfaces:**
- Produces: 실행 가능한 빈 Expo 앱, 모든 의존성 설치 완료
- Produces: `formatTime(ms: number): string` — `utils/time.ts`

- [ ] **Step 1: 기존 파일 백업 후 Expo 프로젝트 생성**

  `C:\Users\dwhan\projects\multitimer` 경로에 이미 docs/ 폴더가 있으므로, 임시 폴더에 생성 후 병합:

  ```bash
  cd C:\Users\dwhan\projects
  npx create-expo-app multitimer-tmp --template blank-typescript
  # 생성 완료 후:
  cd multitimer-tmp
  # 생성된 파일들을 multitimer/ 로 복사 (docs/ 제외)
  xcopy /E /Y . ..\multitimer\ /EXCLUDE:exclude.txt
  ```

  더 간단한 방법 — multitimer 폴더에서 직접:
  ```bash
  cd C:\Users\dwhan\projects\multitimer
  npx create-expo-app@latest . --template blank-typescript
  ```
  (폴더가 비어있지 않다고 경고하면 Y로 계속)

- [ ] **Step 2: 추가 의존성 설치**

  ```bash
  cd C:\Users\dwhan\projects\multitimer
  npx expo install expo-notifications expo-av expo-keep-awake @react-native-async-storage/async-storage
  npm install zustand
  npm install react-native-google-mobile-ads
  npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
  ```

- [ ] **Step 3: app.json 설정**

  `app.json`:

  ```json
  {
    "expo": {
      "name": "MultiTimer",
      "slug": "multitimer",
      "version": "1.0.0",
      "orientation": "portrait",
      "scheme": "multitimer",
      "userInterfaceStyle": "automatic",
      "ios": {
        "bundleIdentifier": "com.multitimer",
        "supportsTablet": false
      },
      "android": {
        "package": "com.multitimer",
        "adaptiveIcon": {
          "backgroundColor": "#ffffff"
        },
        "permissions": [
          "SCHEDULE_EXACT_ALARM",
          "USE_EXACT_ALARM",
          "RECEIVE_BOOT_COMPLETED",
          "VIBRATE",
          "POST_NOTIFICATIONS"
        ]
      },
      "plugins": [
        "expo-router",
        [
          "expo-notifications",
          {
            "icon": "./assets/images/icon.png",
            "color": "#ffffff",
            "sounds": []
          }
        ],
        [
          "react-native-google-mobile-ads",
          {
            "androidAppId": "ca-app-pub-3940256099942544~3347511713",
            "iosAppId": "ca-app-pub-3940256099942544~1458002511"
          }
        ]
      ],
      "experiments": {
        "typedRoutes": true
      }
    }
  }
  ```

- [ ] **Step 4: tsconfig.json 설정**

  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
  ```

- [ ] **Step 5: utils/time.ts 작성**

  ```typescript
  export function formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  }

  export function formatMs(ms: number): string {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const cent = Math.floor((ms % 1000) / 10);
    return `${pad(min)}:${pad(sec)}.${pad(cent)}`;
  }

  function pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
  ```

- [ ] **Step 6: 실행 확인**

  ```bash
  npx expo start
  ```

  Expo Go 앱(폰에 설치) 또는 에뮬레이터에서 기본 화면 확인
  예상: "Open up App.tsx to start working on your app!" 화면 표시

- [ ] **Step 7: 커밋**

  ```bash
  cd C:\Users\dwhan\projects\multitimer
  git add .
  git commit -m "chore: expo project init with all dependencies"
  git push
  ```

---

### Task 2: Expo Router 탭 네비게이션 + AdMob 배너

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx` (플레이스홀더)
- Create: `app/stopwatch.tsx` (플레이스홀더)
- Create: `app/interval.tsx` (플레이스홀더)
- Create: `app/alarm.tsx` (플레이스홀더)
- Create: `components/AdBanner.tsx`

**Interfaces:**
- Produces: `<AdBanner />` 컴포넌트 — 각 탭 하단에 삽입
- Produces: 4탭 Bottom Navigation (타이머·스톱워치·인터벌·알람)

- [ ] **Step 1: app/_layout.tsx — 탭 네비게이션 작성**

  ```tsx
  import { Tabs } from 'expo-router';
  import { Ionicons } from '@expo/vector-icons';

  type IconName = React.ComponentProps<typeof Ionicons>['name'];

  export default function TabLayout() {
    return (
      <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '타이머',
            tabBarIcon: ({ color }) => <Ionicons name="timer-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="stopwatch"
          options={{
            title: '스톱워치',
            tabBarIcon: ({ color }) => <Ionicons name="stopwatch-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="interval"
          options={{
            title: '인터벌',
            tabBarIcon: ({ color }) => <Ionicons name="fitness-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="alarm"
          options={{
            title: '알람',
            tabBarIcon: ({ color }) => <Ionicons name="alarm-outline" size={24} color={color} />,
          }}
        />
      </Tabs>
    );
  }
  ```

- [ ] **Step 2: components/AdBanner.tsx 작성**

  ```tsx
  import { Platform, View } from 'react-native';
  import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

  const ANDROID_ID = TestIds.BANNER; // 출시 전 실 ID로 교체
  const IOS_ID = TestIds.BANNER;

  export default function AdBanner() {
    const adUnitId = Platform.OS === 'ios' ? IOS_ID : ANDROID_ID;
    return (
      <View style={{ alignItems: 'center' }}>
        <BannerAd unitId={adUnitId} size={BannerAdSize.BANNER} />
      </View>
    );
  }
  ```

- [ ] **Step 3: 탭 플레이스홀더 화면 4개 작성**

  `app/index.tsx`:
  ```tsx
  import { View, Text } from 'react-native';
  import AdBanner from '@/components/AdBanner';
  export default function TimerScreen() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>타이머</Text>
        <AdBanner />
      </View>
    );
  }
  ```

  `app/stopwatch.tsx`:
  ```tsx
  import { View, Text } from 'react-native';
  import AdBanner from '@/components/AdBanner';
  export default function StopwatchScreen() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>스톱워치</Text>
        <AdBanner />
      </View>
    );
  }
  ```

  `app/interval.tsx`:
  ```tsx
  import { View, Text } from 'react-native';
  import AdBanner from '@/components/AdBanner';
  export default function IntervalScreen() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>인터벌</Text>
        <AdBanner />
      </View>
    );
  }
  ```

  `app/alarm.tsx`:
  ```tsx
  import { View, Text } from 'react-native';
  import AdBanner from '@/components/AdBanner';
  export default function AlarmScreen() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>알람</Text>
        <AdBanner />
      </View>
    );
  }
  ```

- [ ] **Step 4: 에뮬레이터/실기기 확인**

  `npx expo start` → 4탭 네비게이션 + 하단 배너 자리 확인

- [ ] **Step 5: 커밋**

  ```bash
  git add app/ components/
  git commit -m "feat: tab navigation and AdMob banner component"
  git push
  ```

---

### Task 3: Zustand 스토어 + AsyncStorage 영속화

**Files:**
- Create: `utils/storage.ts`
- Create: `store/timerStore.ts`
- Create: `store/stopwatchStore.ts`
- Create: `store/intervalStore.ts`
- Create: `store/alarmStore.ts`

**Interfaces:**
- Produces:
  - `useTimerStore()` — `timers`, `presets`, `addTimer()`, `startTimer()`, `pauseTimer()`, `resetTimer()`, `removeTimer()`, `savePreset()`, `deletePreset()`
  - `useStopwatchStore()` — `elapsed`, `laps`, `isRunning`, `start()`, `stop()`, `lap()`, `reset()`
  - `useIntervalStore()` — `sessions`, `addSession()`, `deleteSession()`
  - `useAlarmStore()` — `alarms`, `addAlarm()`, `updateAlarm()`, `deleteAlarm()`, `toggleAlarm()`

- [ ] **Step 1: utils/storage.ts 작성**

  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage';

  export async function loadItem<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  export async function saveItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  ```

- [ ] **Step 2: store/timerStore.ts 작성**

  ```typescript
  import { create } from 'zustand';
  import { loadItem, saveItem } from '@/utils/storage';
  import uuid from 'react-native-uuid'; // 또는 Math.random() 기반 ID

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
  ```

- [ ] **Step 3: store/stopwatchStore.ts 작성**

  ```typescript
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
  ```

- [ ] **Step 4: store/intervalStore.ts 작성**

  ```typescript
  import { create } from 'zustand';
  import { loadItem, saveItem } from '@/utils/storage';

  export type IntervalStep = { id: string; label: string; durationSeconds: number };
  export type IntervalSession = { id: string; label: string; steps: IntervalStep[]; repeatCount: number };

  type IntervalStore = {
    sessions: IntervalSession[];
    hydrated: boolean;
    hydrate: () => Promise<void>;
    addSession: (session: Omit<IntervalSession, 'id'>) => void;
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
        const updated = s.sessions.filter((s) => s.id !== id);
        saveItem('interval_sessions', updated);
        return { sessions: updated };
      }),
  }));
  ```

- [ ] **Step 5: store/alarmStore.ts 작성**

  ```typescript
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
  ```

- [ ] **Step 6: 커밋**

  ```bash
  git add store/ utils/
  git commit -m "feat: Zustand stores with AsyncStorage persistence"
  git push
  ```

---

### Task 4: 타이머 탭 (다중 타이머 + 프리셋)

**Files:**
- Modify: `app/index.tsx`
- Create: `components/TimerCard.tsx`
- Create: `components/AddTimerModal.tsx`
- Create: `utils/notifications.ts` (타이머 완료 알림)

**Interfaces:**
- Consumes: `useTimerStore()`
- Produces: 다중 타이머 카드 UI, 프리셋 저장/불러오기, 백그라운드 알림

- [ ] **Step 1: utils/notifications.ts 작성**

  ```typescript
  import * as Notifications from 'expo-notifications';
  import { Platform } from 'react-native';

  export async function requestNotificationPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  export async function scheduleTimerNotification(
    id: string,
    label: string,
    secondsFromNow: number
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      identifier: `timer_${id}`,
      content: { title: '타이머 완료', body: `${label} 완료!`, sound: true },
      trigger: { seconds: secondsFromNow, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
    });
  }

  export async function cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  export async function scheduleAlarmNotification(
    id: string,
    label: string,
    hour: number,
    minute: number,
    repeats: boolean
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      identifier: `alarm_${id}`,
      content: { title: '알람', body: label || '알람이 울립니다', sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        second: 0,
        repeats,
      },
    });
  }
  ```

- [ ] **Step 2: components/TimerCard.tsx 작성**

  ```tsx
  import React, { useEffect, useRef } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
  import { useTimerStore, TimerItem } from '@/store/timerStore';
  import { formatTime } from '@/utils/time';
  import { scheduleTimerNotification, cancelNotification } from '@/utils/notifications';

  type Props = { timer: TimerItem };

  export default function TimerCard({ timer }: Props) {
    const { startTimer, pauseTimer, resetTimer, removeTimer, tickTimer } = useTimerStore();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    useEffect(() => {
      if (timer.isRunning) {
        intervalRef.current = setInterval(() => tickTimer(timer.id), 1000);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [timer.isRunning]);

    useEffect(() => {
      if (timer.remainingSeconds === 0 && !timer.isRunning) {
        cancelNotification(`timer_${timer.id}`);
      }
    }, [timer.remainingSeconds]);

    const handleStart = async () => {
      startTimer(timer.id);
      await scheduleTimerNotification(timer.id, timer.label, timer.remainingSeconds);
    };

    const handlePause = async () => {
      pauseTimer(timer.id);
      await cancelNotification(`timer_${timer.id}`);
    };

    const handleReset = async () => {
      resetTimer(timer.id);
      await cancelNotification(`timer_${timer.id}`);
    };

    const progress = timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 0;
    const isFinished = timer.remainingSeconds === 0;

    return (
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.header}>
          <Text style={[styles.label, isDark && styles.textDark]}>{timer.label}</Text>
          <TouchableOpacity onPress={() => removeTimer(timer.id)}>
            <Text style={styles.remove}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.time, isDark && styles.textDark, isFinished && styles.finished]}>
          {formatTime(timer.remainingSeconds)}
        </Text>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={handleReset}>
            <Text style={styles.btnText}>↺</Text>
          </TouchableOpacity>
          {timer.isRunning ? (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handlePause}>
              <Text style={styles.btnText}>⏸</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleStart}>
              <Text style={styles.btnText}>{isFinished ? '↺' : '▶'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
    cardDark: { backgroundColor: '#1c1c1e' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 16, fontWeight: '600', color: '#000' },
    textDark: { color: '#fff' },
    remove: { fontSize: 18, color: '#999', padding: 4 },
    progressBg: { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, marginBottom: 12 },
    progressFill: { height: 4, backgroundColor: '#007AFF', borderRadius: 2 },
    time: { fontSize: 48, fontWeight: '200', textAlign: 'center', color: '#000', letterSpacing: 2, marginBottom: 12 },
    finished: { color: '#FF3B30' },
    controls: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    btn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    btnPrimary: { backgroundColor: '#007AFF' },
    btnText: { fontSize: 20 },
  });
  ```

- [ ] **Step 3: components/AddTimerModal.tsx 작성**

  ```tsx
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
  ```

- [ ] **Step 4: app/index.tsx 완성**

  ```tsx
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
  ```

- [ ] **Step 5: 실기기/에뮬레이터에서 확인**

  - FAB 탭 → 타이머 추가 → 시작/정지/리셋
  - 프리셋 저장 → 앱 재시작 후 프리셋 유지 확인
  - 백그라운드로 이동 → 타이머 완료 알림 수신

- [ ] **Step 6: 커밋**

  ```bash
  git add app/index.tsx components/ utils/notifications.ts
  git commit -m "feat: timer tab with multiple timers, presets, and notifications"
  git push
  ```

---

### Task 5: 스톱워치 탭

**Files:**
- Modify: `app/stopwatch.tsx`

**Interfaces:**
- Consumes: `useStopwatchStore()`

- [ ] **Step 1: app/stopwatch.tsx 완성**

  ```tsx
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
  ```

- [ ] **Step 2: 실기기에서 확인**

  시작 → 랩 여러 번 → 가장 빠른/느린 랩 색상 확인

- [ ] **Step 3: 커밋**

  ```bash
  git add app/stopwatch.tsx
  git commit -m "feat: stopwatch tab with lap tracking"
  git push
  ```

---

### Task 6: 인터벌 탭

**Files:**
- Modify: `app/interval.tsx`
- Create: `components/IntervalRunView.tsx`

**Interfaces:**
- Consumes: `useIntervalStore()`, `scheduleTimerNotification()`

- [ ] **Step 1: components/IntervalRunView.tsx 작성**

  ```tsx
  import React, { useEffect, useRef, useState } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
  import { IntervalSession } from '@/store/intervalStore';
  import { formatTime } from '@/utils/time';
  import { scheduleTimerNotification, cancelNotification } from '@/utils/notifications';
  import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

  type Props = { session: IntervalSession; onStop: () => void };

  export default function IntervalRunView({ session, onStop }: Props) {
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
      return () => deactivateKeepAwake();
    }, []);

    useEffect(() => {
      if (isRunning) {
        intervalRef.current = setInterval(() => {
          setRemaining((r) => {
            if (r <= 1) {
              // 다음 스텝으로
              const nextIdx = stepIdx + 1;
              if (nextIdx < session.steps.length) {
                setStepIdx(nextIdx);
                return session.steps[nextIdx].durationSeconds;
              } else if (repeat < session.repeatCount) {
                setRepeat((prev) => prev + 1);
                setStepIdx(0);
                return session.steps[0].durationSeconds;
              } else {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setIsRunning(false);
                scheduleTimerNotification(session.id, `${session.label} 완료!`, 0);
                return 0;
              }
            }
            return r - 1;
          });
        }, 1000);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, stepIdx, repeat]);

    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Text style={[styles.sessionLabel, isDark && styles.textDark]}>{session.label}</Text>
        <Text style={[styles.meta, isDark && styles.textDark]}>반복 {repeat}/{session.repeatCount} · 구간 {stepIdx + 1}/{session.steps.length}</Text>
        <Text style={[styles.stepLabel, isDark && styles.textDark]}>{currentStep?.label}</Text>
        <Text style={[styles.time, isDark && styles.textDark]}>{formatTime(remaining)}</Text>
        {nextStep && <Text style={styles.next}>다음: {nextStep.label}</Text>}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.stopBtn} onPress={onStop}>
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
  ```

- [ ] **Step 2: app/interval.tsx 완성**

  ```tsx
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
  ```

- [ ] **Step 3: 확인 및 커밋**

  ```bash
  git add app/interval.tsx components/IntervalRunView.tsx
  git commit -m "feat: interval timer tab with session management"
  git push
  ```

---

### Task 7: 알람 탭

**Files:**
- Modify: `app/alarm.tsx`

**Interfaces:**
- Consumes: `useAlarmStore()`, `scheduleAlarmNotification()`, `cancelNotification()`

- [ ] **Step 1: app/alarm.tsx 완성**

  ```tsx
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
  ```

- [ ] **Step 2: 확인 및 커밋**

  ```bash
  git add app/alarm.tsx
  git commit -m "feat: alarm tab with scheduled notifications"
  git push
  ```

---

### Task 8: EAS Build & Play Store 출시 준비

**Files:**
- Create: `eas.json`

- [ ] **Step 1: EAS CLI 설치**

  ```bash
  npm install -g eas-cli
  eas login
  ```

- [ ] **Step 2: eas.json 생성**

  ```bash
  eas build:configure
  ```

  생성된 `eas.json` 확인 후 아래와 같이 수정:

  ```json
  {
    "cli": { "version": ">= 10.0.0" },
    "build": {
      "development": {
        "developmentClient": true,
        "distribution": "internal"
      },
      "preview": {
        "distribution": "internal",
        "android": { "buildType": "apk" }
      },
      "production": {
        "android": { "buildType": "aab" },
        "ios": { "distribution": "store" }
      }
    },
    "submit": {
      "production": {}
    }
  }
  ```

- [ ] **Step 3: 실 AdMob ID 교체**

  1. AdMob 콘솔에서 앱 ID, 배너 유닛 ID 발급
  2. `app.json`의 `androidAppId`, `iosAppId` 교체
  3. `components/AdBanner.tsx`의 `ANDROID_ID`, `IOS_ID` 교체

- [ ] **Step 4: Android AAB 빌드**

  ```bash
  eas build --platform android --profile production
  ```

- [ ] **Step 5: Play Store 제출**

  Google Play Console → 앱 만들기 → AAB 업로드 → 내부 테스트 트랙

- [ ] **Step 6: 최종 커밋**

  ```bash
  git add eas.json app.json
  git commit -m "chore: EAS build config and production AdMob IDs"
  git push
  ```

---

## 구현 순서 요약

| Task | 내용 | 선행 |
|------|------|------|
| 1 | Expo 프로젝트 초기화 + 의존성 | - |
| 2 | 탭 네비게이션 + AdMob 배너 | 1 |
| 3 | Zustand 스토어 + AsyncStorage | 1 |
| 4 | 타이머 탭 | 2, 3 |
| 5 | 스톱워치 탭 | 2, 3 |
| 6 | 인터벌 탭 | 2, 3 |
| 7 | 알람 탭 | 2, 3 |
| 8 | EAS Build + 출시 | 4, 5, 6, 7 |
