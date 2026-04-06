# RN Stage 16: Expo Bootstrap (TypeScript + Navigation + Store + Query)

## Что сделано
- Создан отдельный RN проект:
  - `apps/courier-native`
- Поднят Expo + TypeScript scaffold:
  - `App.tsx`, `index.ts`, `app.json`, `tsconfig.json`, `babel.config.js`
- Добавлены базовые провайдеры:
  - `SafeAreaProvider`
  - `QueryClientProvider` (React Query)
  - `GestureHandlerRootView`
- Поднята навигация на `SCREEN_IDS`:
  - `NavigationContainer`
  - root stack (auth/main/order detail)
  - bottom tabs (dashboard/orders/slots/money/messages/profile)
- Добавлен auth store на Zustand:
  - hydration на старте
  - guarded navigation
  - sign in / sign out
  - persistence через `SecureStore` с fallback в `AsyncStorage`
- Добавлены первые рабочие RN экраны:
  - `OrdersScreen` + `OrderDetailScreen`
  - `MessagesScreen`
  - данные подаются через React Query.

## Команды
- Из корня репозитория:
  - `npm run native:start`
  - `npm run native:android`
  - `npm run native:ios`
  - `npm run native:typecheck`

## Важно
- Для запуска нового Expo приложения нужен отдельный `npm install` в `apps/courier-native`.
- Текущий Vite baseline не изменен по архитектуре и продолжает собираться отдельно.
