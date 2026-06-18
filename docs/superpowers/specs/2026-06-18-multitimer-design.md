# MultiTimer — Design Spec (React Native/Expo)

**Date:** 2026-06-18 (revised from Kotlin to React Native)
**Platform:** Android + iOS (Expo Managed Workflow)
**Monetization:** AdMob (배너 광고)
**Target:** 아이폰 기본 시계 앱보다 나은 타이머/알람 앱

---

## 목표

- Android + iOS 동시 출시
- 광고(AdMob) 기반 무료 앱 수익화
- 차별점: 다중 타이머 동시 실행, 프리셋 저장, 인터벌 타이머

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Expo SDK 52 (Managed) | 설정 최소화, 빠른 시작 |
| 언어 | TypeScript | 타입 안전성 |
| 네비게이션 | Expo Router (파일 기반) | Expo 기본 내장 |
| 상태관리 | Zustand | 간단하고 React Native에 최적 |
| 저장소 | AsyncStorage | 프리셋·인터벌·알람 영속화 |
| 알림/알람 | expo-notifications | 백그라운드 알람 + 타이머 완료 알림 |
| 사운드 | expo-av | 알람 소리 |
| 광고 | react-native-google-mobile-ads | AdMob 배너 |
| 화면 유지 | expo-keep-awake | 타이머 실행 중 화면 꺼짐 방지 |
| 빌드/배포 | EAS Build | Play Store / App Store 제출 |

---

## 타이머 백그라운드 전략

앱이 백그라운드로 가면 JS 실행이 제한됨. 해결책:
- **포그라운드:** `setInterval`로 1초마다 UI 업데이트
- **백그라운드:** 타이머 종료 시각을 계산해 `expo-notifications`로 로컬 알림 예약
- **복귀 시:** 현재 시각과 저장된 종료 시각 비교해 남은 시간 재계산

---

## 화면 구성 (탭 4개)

### 1. 타이머 탭 (`/`)
- 타이머 카드 리스트 (여러 개 동시 실행)
- 각 카드: 이름, 진행 바, 남은 시간, 시작/정지/리셋
- FAB(+)으로 추가, 프리셋 저장/불러오기

### 2. 스톱워치 탭 (`/stopwatch`)
- 큰 숫자 표시 (mm:ss.ms)
- 시작/정지, 랩, 리셋
- 랩 기록 리스트

### 3. 인터벌 탭 (`/interval`)
- 세션 목록 (이름 + 구간 수 + 반복 횟수)
- 세션 실행 시: 현재 구간 이름·남은 시간·다음 구간 미리보기
- 구간 완료마다 알림음

### 4. 알람 탭 (`/alarm`)
- 알람 목록 (켜기/끄기)
- 시간, 요일 반복, 레이블 설정
- `expo-notifications`로 정확한 시간에 트리거

---

## 데이터 모델

```typescript
// 타이머 프리셋
type TimerPreset = { id: string; label: string; durationSeconds: number }

// 인터벌 세션
type IntervalStep = { id: string; label: string; durationSeconds: number }
type IntervalSession = { id: string; label: string; steps: IntervalStep[]; repeatCount: number }

// 알람
type Alarm = {
  id: string; label: string; hour: number; minute: number;
  daysOfWeek: number[]; // 0=일 ~ 6=토, 빈 배열=한 번만
  isEnabled: boolean;
}
```

---

## 광고 배치

- 각 탭 하단 AdMob 배너 고정 (320×50)
- 테스트 ID 사용 후 실 ID로 교체

---

## 비기능 요구사항

- Android / iOS 동시 지원
- 다크 모드 지원
- 앱 재시작 후 알람 상태 복원 (AsyncStorage에서 로드 후 재예약)
- EAS Build로 AAB(Android) / IPA(iOS) 생성
