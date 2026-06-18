# Task 1 Report: Expo Project Init & Dependency Installation

**Status:** DONE_WITH_CONCERNS

## Summary

Expo SDK 52 project initialized at `C:\Users\dwhan\projects\multitimer` with all required dependencies, configuration files, and utility functions. The dev server starts cleanly. Committed and pushed.

## Steps Completed

1. **Expo project created** via `npx create-expo-app@latest . --template blank-typescript` (note: create-expo-app@4.0.0 installed latest SDK 56 by default, then manually pinned to SDK 52)
2. **Expo downgraded to SDK 52** — `expo@^52.0.49`, `react@^18.3.1`, `react-native@^0.76.9`, `typescript@^5.9.3` installed with `--legacy-peer-deps`
3. **All additional dependencies installed** (SDK 52 compatible versions via `npx expo install`):
   - `expo-notifications ~0.29.14`
   - `expo-av ~15.0.2`
   - `expo-keep-awake ~14.0.3`
   - `@react-native-async-storage/async-storage 1.23.1`
   - `zustand ^5.0.14`
   - `react-native-google-mobile-ads ^16.3.4`
   - `expo-router ~4.0.22`
   - `react-native-safe-area-context 4.12.0`
   - `react-native-screens ~4.4.0`
   - `expo-linking ~7.0.5`
   - `expo-constants ~17.0.8`
   - `expo-status-bar ~2.0.1`
   - `expo-asset` (added automatically when needed)
4. **app.json** — written with bundleId `com.multitimer`, AdMob test IDs, permissions, expo-router, expo-notifications, and react-native-google-mobile-ads plugins
5. **tsconfig.json** — strict mode with `@/*` path alias (Expo auto-appended `include` field)
6. **utils/time.ts** — created with `formatTime` and `formatMs` utilities

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `formatTime(90)` → `"01:30"` | PASS |
| `formatTime(3661)` → `"01:01:01"` | PASS |
| `formatMs(61500)` → `"01:01.50"` | PASS |
| `app.json` bundleId `com.multitimer` | PASS |
| `npx expo start` starts without errors | PASS — Metro Bundler started, "Waiting on http://localhost:8081" |
| git commit completed | PASS — 8cb85ad |

## Commits

- `8cb85ad` — chore: expo project init with all dependencies

## Concerns

1. **SDK version mismatch with AGENTS.md**: AGENTS.md in the repo says "Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/" (SDK 56), but the brief explicitly specifies SDK 52. The brief was followed verbatim. Future tasks should clarify which SDK to target, or update AGENTS.md.

2. **`--legacy-peer-deps` required**: Pinning to SDK 52 versions required `--legacy-peer-deps` because the template had newer peer deps. This is non-ideal but functional.

3. **`expo-asset` added automatically**: `npx expo install expo-asset` was needed because the metro bundler required it; it was also added as a plugin in app.json. This is standard for SDK 52 but was not in the original step list.

4. **tsconfig.json auto-modified by Expo**: Expo added an `include` field automatically — this is normal behavior and does not break anything.

5. **31 npm audit vulnerabilities**: All moderate/high severity. These are transitive dependencies and normal for React Native projects. No action needed for development.

## File Paths

- `C:\Users\dwhan\projects\multitimer\package.json`
- `C:\Users\dwhan\projects\multitimer\app.json`
- `C:\Users\dwhan\projects\multitimer\tsconfig.json`
- `C:\Users\dwhan\projects\multitimer\utils\time.ts`
