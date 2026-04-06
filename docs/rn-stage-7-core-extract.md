# RN Stage 7: Core Layer Extraction (Step 1)

## Что вынесено в `packages/core`
- Domain models:
  - `packages/core/src/domain/orders/model.js`
  - `packages/core/src/domain/messages/model.js`
  - `packages/core/src/domain/profile/model.js`
  - `packages/core/src/domain/balance/model.js`
  - `packages/core/src/domain/slots/model.js`
- Use-cases:
  - `packages/core/src/use-cases/orders/listOrders.js`
- Core entry:
  - `packages/core/src/index.js`

## Что изменено в приложении
- `src/domain/*` теперь выступают как compatibility re-export слой на `@core`.
- `useOrdersListModel` перешел на core use-case:
  - `filterOrdersByMode`
  - `countActiveOrders`
  - `ORDER_FILTERS`
- В Vite добавлен alias:
  - `@core -> packages/core/src`

## Результат
- Веб сборка проходит без регрессий.
- Бизнес-логика и доменные модели уже отделены от UI/DOM слоя и готовы к следующему шагу (`packages/core` с adapters/types и подключением из RN).
