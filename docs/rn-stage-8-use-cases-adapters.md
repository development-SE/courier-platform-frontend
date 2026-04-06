# RN Stage 8: Use-Cases + Adapter Interfaces (Core)

## Что добавлено в `packages/core`
- Adapter contracts:
  - `packages/core/src/contracts/storageAdapter.js`
  - `packages/core/src/contracts/credentialsAdapter.js`
- Auth use-case:
  - `packages/core/src/use-cases/auth/localCredentialsAuth.js`
- Messages use-case:
  - `packages/core/src/use-cases/messages/buildMessagesView.js`
- Orders persisted state use-case:
  - `packages/core/src/use-cases/orders/persistedState.js`

## Что подключено в приложении
- `authService` теперь строится через core use-case и adapter contract:
  - `src/services/authService.js`
- `useMessagesViewModel` использует core use-case:
  - `src/pages/Messages/useMessagesViewModel.js`
- `OrdersContext` использует core persisted-state use-case:
  - `src/state/OrdersContext.jsx`
- `src/mock/auth.js` оставлен как data-only источник (`AUTH_STORAGE_KEY`, `AUTH_CREDENTIALS`).

## Результат
- Core-слой расширен use-case логикой без зависимости от DOM/React.
- Веб сборка проходит.
