# RN Stage 18: Expo Dashboard with Native Map + Bottom Sheet

## What was implemented
- Installed native dashboard dependencies in Expo app:
  - `react-native-maps`
  - `@gorhom/bottom-sheet`
- Extended core typings in Expo app:
  - `apps/courier-native/src/types/swiftdeliver-core.d.ts`
  - Added `CourierProfile`, `IncomingOrderPreview`, and typed `courierPosition`.
- Extended core client with dashboard snapshot:
  - `apps/courier-native/src/data/coreClient.ts`
  - `fetchDashboardSnapshotFromCore()` returns `courier`, `incomingOrder`, `courierPosition`, `orders`.
- Added dashboard state model:
  - `apps/courier-native/src/screens/dashboard/useDashboardModel.ts`
  - Handles:
    - online/offline/busy flow
    - activation delay
    - incoming order accept/skip
    - active order stage flow
- Replaced dashboard placeholder with native implementation:
  - `apps/courier-native/src/screens/dashboard/DashboardScreen.tsx`
  - Includes:
    - status card
    - live `MapView` + `Marker`
    - `BottomSheet` with active/idle content
    - incoming order overlay
    - quick actions and order detail navigation.

## Validation
- `npm run native:typecheck` passed.
- `npx expo-doctor` in `apps/courier-native` passed (`17/17`).
- Existing web baseline build (`npm run build`) passed.
