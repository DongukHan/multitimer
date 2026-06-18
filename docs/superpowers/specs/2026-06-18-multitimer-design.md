# MultiTimer — Design Spec

**Date:** 2026-06-18  
**Platform:** Android  
**Monetization:** AdMob (배너 광고)  
**Target:** 아이폰 기본 시계 앱보다 나은 타이머/알람 앱

---

## 목표

- Android 입문 첫 앱으로, 구조를 익히면서 실제 수익화까지 연결
- 여러 개의 단순 유틸리티 앱을 만드는 시리즈의 첫 번째
- 차별점: 다중 타이머 동시 실행, 프리셋, 인터벌 타이머

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | Kotlin | Java 경험자에게 자연스러운 전환 |
| UI | Jetpack Compose | 최신 Android 표준, XML보다 직관적 |
| 백그라운드 | Foreground Service | 앱 종료 후에도 타이머 유지 |
| 알람 | AlarmManager (exact) | 정확한 시간 트리거 |
| DB | Room | 프리셋·인터벌 설정 영속화 |
| 광고 | AdMob 배너 | 하단 고정, 무료 앱 수익화 |
| 빌드 | Gradle (Kotlin DSL) | 표준 |

---

## 화면 구성 (탭 4개)

### 1. 타이머 탭
- 타이머 카드 리스트 (스크롤 가능)
- 각 카드: 레이블, 시간 피커, 시작/정지/리셋 버튼, 진행 원형 인디케이터
- FAB(+)으로 타이머 추가
- 프리셋 저장/불러오기
- 타이머 완료 시 Notification + 진동/소리

### 2. 스톱워치 탭
- 큰 숫자 (mm:ss.ms)
- 시작/정지, 랩, 리셋 버튼
- 랩 기록 리스트 (현재 랩 / 최고 랩 하이라이트)

### 3. 인터벌 타이머 탭
- 구간(Step) 리스트: 이름 + 시간
- 구간 추가/삭제/순서 변경 (드래그)
- 전체 반복 횟수 설정
- 실행 화면: 현재 구간 이름·남은 시간·다음 구간 미리보기
- 완료 시 Notification

### 4. 알람 탭
- 알람 목록 (켜기/끄기 토글)
- 알람 편집: 시간, 요일 반복, 레이블, 벨소리 선택
- AlarmManager exact alarm 사용
- 알람 화면(full-screen intent): 끄기/다시알림(snooze)

---

## 데이터 모델

```
TimerPreset(id, label, durationSeconds)
IntervalSession(id, label, steps: List<IntervalStep>, repeatCount)
IntervalStep(id, sessionId, label, durationSeconds, order)
Alarm(id, label, hour, minute, daysOfWeek: Set<Int>, isEnabled, ringtoneUri)
```

---

## 광고 배치

- 각 탭 하단에 AdMob 배너 고정
- 타이머 실행 중 방해 최소화 (인터스티셜 없음, 배너만)

---

## 비기능 요구사항

- 앱 종료·재시작 후에도 실행 중 타이머 상태 복원
- Android 8.0(API 26) 이상 지원
- 다크 모드 지원 (Material You 색상)
- 최소 권한: FOREGROUND_SERVICE, SCHEDULE_EXACT_ALARM, POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED

---

## 출시 후 계획

1. MultiTimer 완성 → Play Store 출시
2. 소음 측정기, 단위 변환기 등 후속 앱 제작
3. 수익 확인 후 인터스티셜 광고 추가 여부 판단
