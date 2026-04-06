# RN Stage 13: Messages + Profile + Localization Cleanup

## Что сделано
- Добавлен рабочий RN `Profile` экран:
  - `src/navigation/native/screens/NativeProfileScreen.jsx`
  - `src/navigation/native/screens/useNativeProfileViewModel.js`
- Добавлен RN экран деталей профиля для `PROFILE_*` экранов:
  - `src/navigation/native/screens/NativeProfileDetailScreen.jsx`
  - Использует `route.name`, поддерживает:
    - статус на линии (toggle),
    - уведомления (3 toggle),
    - язык интерфейса (выбор из 3 языков),
    - для остальных пунктов показывает подготовленный description.
- Добавлена конфигурация профиля:
  - `src/navigation/native/profileScreenMeta.js`
- Обновлен `NativeAppShell`:
  - `PROFILE_STACK_SCREENS` подключены в root stack,
  - таб `PROFILE` теперь использует реальный `NativeProfileScreen`,
  - исправлены строки auth/tabs/loading на корректную кодировку.

## Локализация и строки (mojibake fix)
- Исправлены битые строки в RN-экранах:
  - `src/navigation/native/NativeAppShell.jsx`
  - `src/navigation/native/screens/NativeOrdersScreen.jsx`
  - `src/navigation/native/screens/NativeMessagesScreen.jsx`
  - `src/navigation/native/screens/NativeOrderDetailScreen.jsx`
  - `src/navigation/native/screens/NativePlaceholderScreen.jsx`
- Исправлена символика валюты в RN orders list: `₸`.
- Обновлена нормализация источника сообщений в core:
  - `packages/core/src/domain/messages/model.js`
  - поддерживаются и корректные, и legacy-строки источников.

## Результат этапа
- RN-shell теперь покрывает:
  - auth guard + native persistence,
  - orders list + order detail,
  - messages,
  - profile + profile details/settings,
  - очищенные локализованные строки без битой кодировки в RN-потоке.
