
Цель: убрать бесконечные загрузки и deadlock в первую очередь, затем снизить задержки на всех страницах.

1) CRITICAL RECOVERY (сначала стабилизация)

A. Auth bootstrap + deadlock (src/contexts/AuthContext.tsx)
- ROOT CAUSE: `ProtectedRoute` ждёт `profile`, а `profile` может не прийти (ошибка/зависший запрос), из-за чего вечный `PageSkeleton`.
- THE FIX:
  - Добавить `withTimeout()`/`fetchWithTimeout()` (через `Promise.race`) для `getSession` и `fetchProfile`.
  - Разделить состояния: `authLoading` и `profileLoading`.
  - Гарантировать `setLoading(false)` в `finally`.
  - `onAuthStateChange` сделать неблокирующим (без `await fetchProfile` в критическом потоке).
  - Хранить `role` отдельно в контексте (из `user_roles` + fallback из кэша), чтобы роутинг не зависел от полного профиля.
- STABILITY MODS: fallback на `profile=null`, таймауты, защита от unmounted state update.
- PERFORMANCE GAIN: устраняется вечный лоадер; первый рендер после авторизации ускорится примерно на 0.3–1.0с.

B. Route gating (src/components/ProtectedRoute.tsx, src/pages/Index.tsx, src/components/AppSidebar.tsx)
- ROOT CAUSE: текущая логика блокирует маршрут на `!profile`.
- THE FIX:
  - Перевести проверку доступа на `role` из AuthContext (не на `profile`).
  - `profile` оставить только для UI-данных (имя/аватар), не для критичного доступа.
  - В `Index` убрать зависимость редиректа от `profile`.
- STABILITY MODS: даже при падении запроса профиля пользователь попадает в свой раздел, а не в бесконечный скелетон.
- PERFORMANCE GAIN: исчезают зависания переходов между `/`, `/auth`, dashboard.

C. Error boundary (новый `src/components/AppErrorBoundary.tsx`, подключение в `src/App.tsx`)
- ROOT CAUSE: runtime-ошибка может уронить всё дерево и дать “белый экран”.
- THE FIX: глобальный ErrorBoundary вокруг роутов с fallback (перезагрузка/возврат на `/auth`).
- STABILITY MODS: локализация краша вместо полного отказа приложения.
- PERFORMANCE GAIN: не ускоряет напрямую, но убирает полный UX-обрыв.

2) DEEP CODE AUDIT (после снятия deadlock)

D. Таймауты и безопасные запросы (новый `src/lib/async-safe.ts`, применение в AuthPage и тяжёлых queryFn)
- ROOT CAUSE: часть fetch/query без таймаута и без унифицированного fallback.
- THE FIX:
  - Обёртки: `withTimeout`, `safeQuery` (возврат `[]/null` + лог).
  - Применить в `AuthPage` (`telegram-poll`, `telegram-auth`) и ключевых queryFn (admin/deals/feed/search).
- STABILITY MODS: ни один загрузочный сценарий не остаётся без выхода.
- PERFORMANCE GAIN: меньше зависших ожиданий, лучше отзывчивость на плохой сети.

E. Убрать ref-warning шум (src/pages/LandingPage.tsx)
- ROOT CAUSE: `CountUpValue` и `ScrollReveal` получают ref извне (dev tooling), но не `forwardRef`, что даёт постоянные warnings и лишнюю нагрузку.
- THE FIX: обернуть оба компонента в `React.forwardRef` или убрать прокидывание ref через внешние обёртки.
- STABILITY MODS: чистый рендер без warning-спама.
- PERFORMANCE GAIN: меньше лишних dev-перерисовок/логов; стабильнее мобильный рендер.

F. Тяжёлые выборки данных (admin/blogger/search/deals файлы)
- ROOT CAUSE: много `.select('*')`, отсутствие лимитов/пагинации.
- THE FIX:
  - Заменить `*` на конкретные поля.
  - Добавить лимит + пагинацию в админ-списках и аналитике.
  - Для больших списков включить `keepPreviousData` и постепенную подгрузку.
- STABILITY MODS: меньше шансов “подвесить” UI большими payload.
- PERFORMANCE GAIN: снижение сетевой нагрузки примерно на 30–60% на тяжёлых страницах.

G. Realtime invalidation storm (src/hooks/use-deals-realtime.ts)
- ROOT CAUSE: широкая массовая инвалидция query keys при каждом событии.
- THE FIX:
  - Инвалидировать только релевантные ключи по роли/странице.
  - Добавить debounce/throttle батч-инвалидации.
- STABILITY MODS: меньше каскадных refetch и “замираний”.
- PERFORMANCE GAIN: заметно быстрее навигация при активных обновлениях (до 40–70% меньше лишних refetch).

3) PERFORMANCE OVERHEAD (только после стабильности)

H. Lazy + UI cost trimming (src/App.tsx и списковые компоненты)
- ROOT CAUSE: часть тяжёлых участков ещё рендерится слишком рано.
- THE FIX:
  - Лениво грузить AuthPage.
  - В карточках/лентах добавить `loading="lazy"` у изображений.
  - Для длинных списков (admin/blogger search) внедрить виртуализацию.
- STABILITY MODS: ниже риск mobile/tablet render failure.
- PERFORMANCE GAIN: ускорение FCP/LCP и скролла на слабых устройствах.

Технические детали
- БД/миграции: не требуются для этого emergency-фикса.
- Безопасность ролей: доступ в UI переводим на роль из `user_roles` в контексте; профиль не должен быть блокирующим фактором.
- Гарантия выхода из loading: все критичные async-пути имеют timeout + fallback + `finally`.

План проверки (после внедрения)
1. Логин/редирект для blogger/seller/admin: нет бесконечного скелетона.
2. Искусственно “уронить” профильный запрос (timeout/error): интерфейс всё равно открывается.
3. Мобильные вьюпорты 390/768/834: UI виден, без белого экрана.
4. Переходы между dashboard-страницами: нет подвисаний при realtime-событиях.
5. Консоль: исчезли warning’и про refs в LandingPage.
