# RN Stage 14: Dashboard Native Shell

## Что сделано
- Добавлен рабочий RN экран дашборда:
  - `src/navigation/native/screens/NativeDashboardScreen.jsx`
  - `src/navigation/native/screens/useNativeDashboardViewModel.js`
- В `NativeAppShell` таб `DASHBOARD` переключен с placeholder на `NativeDashboardScreen`.

## Что покрывает RN Dashboard на этом этапе
- Статус курьера:
  - `offline -> online -> busy` на базе состояния и активного заказа.
- Кнопка выхода/входа на линию с промежуточным состоянием `Подключаемся...`.
- Блок карты (пока placeholder) с текущими координатами курьера из `courierDataService`.
- Bottom-sheet-подобный блок смены:
  - если нет активного заказа: быстрые действия (`Слоты`, `Поддержка`, `Диагностика`);
  - если заказ активен: stage-подсказка, ETA, primary action, переход в детали заказа и отмена.
- Входящий заказ:
  - показ модального листа после выхода на линию,
  - действия `Принять` / `Пропустить`,
  - интеграция с `OrdersContext` через `acceptIncomingOrder`.

## Технические заметки
- Логика экрана не зависит от web-router: используется `useNativeAppNavigator`.
- Таймеры активации/показа входящего заказа очищаются в cleanup эффекта.
- Следующий шаг по Dashboard: подключить реальную карту (`react-native-maps` или RN MapLibre) и настоящий bottom-sheet (`@gorhom/bottom-sheet`) в Expo-ветке.
