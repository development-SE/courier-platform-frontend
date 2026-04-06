# RN Stage 6: Native Shell + First Working Screens

## Что сделано
- Добавлен RN entry-point:
  - `App.native.jsx`
- Поднят реальный shell на `NavigationContainer + NativeStack + BottomTabs`:
  - `src/navigation/native/NativeAppShell.jsx`
- Shell использует `SCREEN_IDS` как имена экранов и поддерживает переход в `ORDER_DETAIL`.
- Подключены первые рабочие RN-экраны:
  - `OrdersScreen` (`src/navigation/native/screens/NativeOrdersScreen.jsx`)
  - `MessagesScreen` (`src/navigation/native/screens/NativeMessagesScreen.jsx`)
- Добавлены placeholder-экраны для остальных табов/экранов:
  - `src/navigation/native/screens/NativePlaceholderScreen.jsx`
- Добавлен native navigator hook:
  - `src/navigation/native/useNativeAppNavigator.js`
- Выделен shared hook списка заказов для web + RN:
  - `src/features/orders/useOrdersListModel.js`

## Что нужно для запуска RN
Установить RN зависимости в проекте/подпроекте, где будет Metro:
- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `react-native-safe-area-context`
- `react-native-screens`

## Следующий этап
1. Вынести `OrderDetail` в рабочий RN экран (не placeholder).
2. Подключить реальный auth-flow (SignIn/SignUp + guarded navigation).
3. Перенести `Dashboard` на RN (`react-native-maps`) с текущей логикой stage/state.
