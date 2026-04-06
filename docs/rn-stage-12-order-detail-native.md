# RN Stage 12: Native Order Detail (Working Screen)

## Что сделано
- Placeholder `ORDER_DETAIL` заменен на рабочий RN экран:
  - `src/navigation/native/screens/NativeOrderDetailScreen.jsx`
- Экран использует текущий `OrdersContext`:
  - поиск заказа по `route.params.orderId`
  - переходы статусов: `pickup -> delivery -> done`
  - подтверждение действия перед сменой статуса
  - отмена заказа (`cancelled`) с возвратом назад

## Интеграция
- Подключен в `NativeAppShell` как реальный `Stack.Screen` для `SCREEN_IDS.ORDER_DETAIL`:
  - `src/navigation/native/NativeAppShell.jsx`

## Результат
- `Orders` и `OrderDetail` в RN теперь связаны сквозным рабочим flow через единый store.
