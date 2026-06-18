# Task 1 Brief: Expo 프로젝트 초기화 및 의존성 설치

## Goal
`C:\Users\dwhan\projects\multitimer` 에 Expo(React Native) 프로젝트를 초기화하고 모든 의존성을 설치한다.

## Global Constraints
- Expo SDK 52, TypeScript strict mode
- 패키지 관리자: npm
- 프로젝트 루트: `C:\Users\dwhan\projects\multitimer`
- 패키지명(bundleId): `com.multitimer`
- AdMob 테스트 배너 ID (Android): `ca-app-pub-3940256099942544/6300978111`
- AdMob 테스트 배너 ID (iOS): `ca-app-pub-3940256099942544/2934735716`

## Context
- 이 디렉토리에는 이미 `docs/` 폴더와 git 히스토리가 있음 (초기 커밋 f65ba19)
- 기존 파일: `docs/superpowers/specs/`, `docs/superpowers/plans/`, `docs/superpowers/briefs/`
- Expo 프로젝트 파일은 이 디렉토리 루트에 생성해야 함

## Files to Create
- `package.json` (Expo가 생성)
- `app.json` — 아래 내용으로 덮어쓰기
- `tsconfig.json` — 아래 내용으로 작성
- `utils/time.ts` — 시간 포맷 유틸

## Steps

### Step 1: Expo 프로젝트 생성
```bash
cd C:\Users\dwhan\projects\multitimer
npx create-expo-app@latest . --template blank-typescript
```
폴더가 비어있지 않다는 경고가 나오면 `y`로 계속 진행.

### Step 2: 추가 의존성 설치
```bash
npx expo install expo-notifications expo-av expo-keep-awake @react-native-async-storage/async-storage
npm install zustand
npm install react-native-google-mobile-ads
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

### Step 3: app.json 내용으로 교체
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

### Step 4: tsconfig.json 작성
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

### Step 5: utils/time.ts 작성
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

### Step 6: 실행 확인
```bash
npx expo start
```
Expo dev server가 정상적으로 시작되면 성공. QR코드나 에뮬레이터에서 실행 확인.

### Step 7: 커밋
```bash
git add .
git commit -m "chore: expo project init with all dependencies"
git push
```

## Acceptance Criteria
- `npx expo start` 실행 시 오류 없이 dev server 시작
- `utils/time.ts` 의 `formatTime(90)` → `"01:30"`, `formatTime(3661)` → `"01:01:01"`
- `formatMs(61500)` → `"01:01.50"`
- app.json에 bundleId `com.multitimer` 설정 확인
- git commit 완료
