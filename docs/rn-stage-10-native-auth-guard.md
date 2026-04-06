# RN Stage 10: Native Auth Flow + Guarded Navigation

## Что сделано
- `NativeAppShell` переведен с демо-входа на реальный auth flow:
  - экран входа использует `signInWithCredentials(login, password)`
  - состояние авторизации берется из `isAuthorized()`
  - выход выполняется через `signOut()`
- Stack теперь условный:
  - неавторизованным доступны только `SIGN_IN` / `SIGN_UP`
  - авторизованным доступны `MainTabs` + `ORDER_DETAIL`
- В табе `PROFILE` добавлен рабочий `Выйти`, который возвращает в auth stack.

## Файлы
- `src/navigation/native/NativeAppShell.jsx`

## Результат
- Появился рабочий guarded native shell без прямого доступа к main tabs до авторизации.
- Подготовлена база для следующего шага: замена storage на RN SecureStore/AsyncStorage adapter без изменений use-case слоя.
