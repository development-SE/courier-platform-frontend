# Courier Native (Expo + TypeScript)

RN shell for courier app migration.

## Setup
1. `cd apps/courier-native`
2. `npm install`
3. `npm run start`

## Run from repo root
- `npm run native:start`
- `npm run native:android`
- `npm run native:ios`
- `npm run native:typecheck`

## Implemented in bootstrap stage
- Expo + TypeScript app scaffold.
- React Navigation (`NavigationContainer`, native stack, bottom tabs) on `SCREEN_IDS`.
- Safe Area provider.
- Zustand auth store with guarded navigation.
- Auth persistence via `SecureStore` with `AsyncStorage` fallback.
- React Query setup.
- First working RN screens: `Orders`, `OrderDetail`, `Messages`.

## Current architecture updates
- Expo app is wired to `@swiftdeliver/core` (file dependency to `../../packages/core`).
- Local mock API files were removed from `apps/courier-native/src/features/*/api.ts`.
- Shared in-memory courier repository now lives in `packages/core`.
- Started RN design tokens migration with UI primitives:
  - `AppText`
  - `AppCard`
  - `AppButton`

## Dashboard native integration
- `DashboardScreen` now uses:
  - `react-native-maps`
  - `@gorhom/bottom-sheet`
- Dashboard data comes from core snapshots via:
  - `src/data/coreClient.ts`
  - `fetchDashboardSnapshotFromCore()`
