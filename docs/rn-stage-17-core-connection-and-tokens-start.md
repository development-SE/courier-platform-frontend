# RN Stage 17: Core Connection + Tokens Migration Start

## 1) Expo shell connected to `packages/core`
- Added shared fixtures in core:
  - `packages/core/src/fixtures/courierData.js`
- Added shared in-memory repository factory:
  - `packages/core/src/use-cases/courier-data/inMemoryRepository.js`
- Exported new modules from core entry:
  - `packages/core/src/index.js`
- Added Expo app dependency:
  - `apps/courier-native/package.json`
  - `@swiftdeliver/core: file:../../packages/core`
- Added Expo-side core client:
  - `apps/courier-native/src/data/coreClient.ts`
  - Uses `createCourierDataUseCases + createInMemoryCourierDataRepository + buildMessagesView`.

## 2) Removed local mock APIs in Expo app
- Deleted:
  - `apps/courier-native/src/features/orders/api.ts`
  - `apps/courier-native/src/features/messages/api.ts`
  - related local feature type files
- `Orders`, `OrderDetail`, `Messages` now use core client data.

## 3) Design tokens migration started (RN)
- Extended theme tokens:
  - `apps/courier-native/src/theme/appTheme.ts`
  - colors, spacing, radius, typography
- Added primitives:
  - `apps/courier-native/src/ui/primitives/AppText.tsx`
  - `apps/courier-native/src/ui/primitives/AppCard.tsx`
  - `apps/courier-native/src/ui/primitives/AppButton.tsx`
  - `apps/courier-native/src/ui/primitives/index.ts`
- Migrated key screens to primitives:
  - `SignIn`, `SignUp`, `Profile`, `Dashboard`, `Orders`, `OrderDetail`, `Messages`
  - `Screen` layout now uses tokenized typography via `AppText`.

## 4) Validation
- `npm run native:typecheck` passed.
- `npm run build` (existing web baseline) passed.
