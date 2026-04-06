# RN Stage 9: Session Guards + Repository Contracts

## Что добавлено в `packages/core`
- Repository contract:
  - `packages/core/src/contracts/courierDataRepository.js`
- Session guard use-case:
  - `packages/core/src/use-cases/auth/sessionGuard.js`
- Courier data snapshots use-cases:
  - `packages/core/src/use-cases/courier-data/snapshots.js`

## Что подключено в приложении
- `courierDataService` теперь использует core use-cases + repository contract:
  - `src/services/courierDataService.js`
- `RequireAuth` теперь использует core session guard:
  - `src/components/auth/RequireAuth.jsx`

## Дополнительно
- `mock/auth` оставлен как source-only для данных (credentials + key), без бизнес-логики.

## Результат
- Бизнес-логика чтения courier snapshots и route-guard вынесена в core.
- Переход на RN adapters становится прямолинейным: достаточно подменять repository/storage adapters.
