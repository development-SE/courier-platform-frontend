# RN Stage 15: Dashboard Map + Bottom Sheet Adapters

## Что сделано
- Добавлен optional dependency helper:
  - `src/platform/native/optionalDependencies.js`
  - безопасная загрузка RN-пакетов через `tryRequireModule`.

- Добавлен адаптер карты для RN Dashboard:
  - `src/navigation/native/components/NativeCourierMap.jsx`
  - поведение:
    - если установлен `react-native-maps` -> рендерится `MapView` + `Marker`;
    - если пакет не установлен -> fallback-карта с координатами и подсказкой.

- Добавлен адаптер bottom sheet:
  - `src/navigation/native/components/NativeBottomSheet.jsx`
  - поведение:
    - если установлен `@gorhom/bottom-sheet` -> рендерится нативный bottom sheet;
    - если пакет не установлен -> fallback контейнер карточки.

- Обновлен RN Dashboard:
  - `src/navigation/native/screens/NativeDashboardScreen.jsx`
  - карта вынесена в `NativeCourierMap`;
  - блок смены/активного заказа вынесен в `NativeBottomSheet`.

## Результат этапа
- RN dashboard готов к подключению реальных библиотек карты и bottom sheet без переписывания бизнес-логики экрана.
- До установки пакетов экран остается рабочим за счет fallback UI.
