# RN Stage 11: Native Auth Storage Persistence

## Что сделано
- Добавлен native persistence модуль для auth-состояния:
  - `src/platform/native/authStoragePersistence.js`
- Поддерживаются optional backends (в порядке приоритета):
  1. `expo-secure-store`
  2. `@react-native-async-storage/async-storage`
- Если backend не установлен, используется текущий runtime fallback без падения приложения.

## Интеграция в shell
- `NativeAppShell` теперь:
  - гидрирует auth state из native storage на старте
  - показывает промежуточный экран "Восстанавливаем сессию..."
  - сохраняет auth state обратно в native storage при входе/выходе
- Файл:
  - `src/navigation/native/NativeAppShell.jsx`

## Итог
- Auth flow в RN не привязан к web `localStorage`.
- После установки SecureStore/AsyncStorage будет работать персистентная сессия между перезапусками.
