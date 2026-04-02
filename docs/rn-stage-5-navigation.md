# RN Stage 5: Navigation Contract + Shared ViewModels

## Что сделано
- Web и RN теперь могут использовать одинаковый навигационный интерфейс:
  - `src/navigation/appNavigator.js`
  - `createWebAppNavigator(navigate)`
  - `createNativeAppNavigator(navigation)`
- Web-хуки экрана используют абстракцию, а не прямой `react-router`:
  - `src/pages/Dashboard/useDashboardViewModel.js`
  - `src/pages/Orders/useOrdersViewModel.js`
- Добавлен базовый список экранов для сборки `react-navigation`:
  - `src/navigation/native/screenConfig.js`

## Как использовать в RN
1. В RN-экране создайте `const appNavigator = createNativeAppNavigator(navigation)`.
2. Передавайте `appNavigator` в RN view-model слой или вызывайте его методы из обработчиков UI.
3. Используйте `SCREEN_IDS` как единственные имена экранов в stack/tab навигации.

## Что делать следующим этапом
1. Поднять RN shell (`NavigationContainer`, stack + tabs) на `SCREEN_IDS`.
2. Подключить shared model для `Orders` и `Messages` к RN-экранам.
3. Заменить Web map-блок Dashboard на RN map-адаптер (`react-native-maps`) при сохранении текущего state flow.
