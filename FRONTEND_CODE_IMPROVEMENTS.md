# Frontend (Mobile) Code Improvements

A review of the React Native / Expo mobile app with concrete improvement suggestions and some applied fixes.

---

## 1. State & Data Loading

### HomeScreen: Use existing `useHomeData` hook

**Current:** `HomeScreen.tsx` duplicates ~170 lines of data-loading logic inline (many `useState` calls, `loadData`, `useFocusEffect`, and a second `useEffect` for lesson/why-this).

**Improvement:** The feature already has `useHomeData.ts` with a similar shape. Align that hook with the current `selectHomeNextAction` API (dashboard, recentActivity, suggestions) and return types (e.g. `nextAction.kind`, `inProgressLesson`, `whyThisText`, etc.), then have `HomeScreen` consume it. Benefits:

- Single source of truth for home data
- Easier testing and refactors
- Smaller screen component focused on layout and handlers

**Note:** `useHomeData` currently uses an older API (`action.type`, `suggestedLesson`). Update it to match `selectHomeNextAction` and the dashboard/stats/recent-activity shape used by `HomeScreen`.

---

## 2. TypeScript: Replace `any` with proper types

**Current:** There are 60+ uses of `any` (e.g. `error: any`, `err: any`, `as any`, `Component: any`).

**Improvements:**

- **Catch clauses:** Use `error: unknown` and narrow with `instanceof Error` (or a small helper) before using `error.message`. Applied in: `client.ts`, `useAsyncData.ts`.
- **API client:** `post`/`patch`/`put` body can be typed as `unknown` or a generic; avoid `body?: any`.
- **Expo Router:** For `router.replace(returnTo)` and similar, use `Href` from `expo-router` instead of `as any` so route params stay type-safe.
- **Tab bar:** `TabLayoutScreen.tsx` uses `CustomTabBar({ state, descriptors, navigation }: any)`. Use types from `@/types/navigation.types` or from `@react-navigation` (e.g. `BottomTabBarProps`) so state/descriptors/navigation are typed.
- **Callbacks:** In `useAsyncData`, prefer `onSuccess?: (data: T) => void` instead of `(data: any)`.

---

## 3. Profile Progress: Real data and loading/error states

**Current:** `ProfileProgressScreen.tsx` shows hardcoded values (Level 5, 320 XP, 120 streak, 320/1000 XP, “Flashcards” suggestion).

**Improvement:** Use `useProfileData()` (or a dedicated progress API) to drive:

- Level and XP from `progress` / `dashboard`
- Streak from dashboard
- Progress bar from `progressToNext` / `xpInLevel` / `XP_PER_LEVEL`
- Optional “suggested next” from real suggestions or recent activity

Add loading (skeleton or spinner) and a simple error state so the screen reflects real user state.

---

## 4. Error handling and user feedback

- **useAsyncData:** The hook sets `error` state but many screens don’t render it. Consider:
  - A small `ErrorBanner` or inline message when `error` is set
  - Optional `onError` to show a toast or alert from the caller
- **LearnScreen / HomeScreen:** If the initial load fails, show a retry button or message instead of only logging.
- **SessionRunner / cards:** Replace `catch (error: any)` with `unknown` and log `error instanceof Error ? error.message : String(error)` (or use a shared error logger).

---

## 5. Performance and list rendering

- **ScrollView vs FlatList:** Long lists (e.g. lessons, modules, course content) use `ScrollView` in several places. For lists that can grow (e.g. “All Modules”), prefer `FlatList` (or SectionList) so only visible items are mounted and scroll performance stays good.
- **LearningPathCarousel:** Uses horizontal `ScrollView`; for many items, consider `FlatList` with `horizontal` for better memory use.
- **Memo:** Components like `HomeTodayAtAGlance` are already wrapped in `React.memo`; keep using memo for pure presentational components that receive stable props.

---

## 6. Consistency and maintainability

- **Theme:** Prefer `theme.colors.*` and `baseTheme.spacing`/`baseTheme.radius` over hardcoded hex/spacing in new code (e.g. LearnScreen “Catalog” badge: `catalogBadgeBg` / `catalogBadgeText` could come from theme tokens).
- **LoadingScreen:** Uses hardcoded `'Poppins_600SemiBold'` / `'Poppins_400Regular'`; use `baseTheme.typography.semiBold` / `baseTheme.typography.regular` for consistency.
- **Safe area:** Screens already use `SafeAreaView` and `useSafeAreaInsets`; keep one consistent pattern (e.g. edges and padding) across tabs.
- **Styles:** Reuse shared constants (e.g. `homeStyles`) where possible; avoid duplicating the same spacing/radius in multiple files.

---

## 7. Accessibility

- **Button / Pressable:** Most CTAs have `accessibilityRole="button"` and labels; ensure every tappable card has `accessibilityLabel` (and optional `accessibilityHint`).
- **ProfileProgressScreen:** The “Suggested next” card has a good label; ensure focus order and grouping make sense with VoiceOver.
- **Loading states:** Prefer `accessibilityState={{ busy: true }}` on loading buttons and announce loading to screen readers where it improves UX.

---

## 8. Navigation typing

- **router.replace(returnTo as any):** Typed as `Href` (or the correct expo-router route type) so invalid routes are caught at compile time.
- **router.replace(routeBuilders.lessonStart(nextLesson.id) as any):** Same; route builders already return const paths, so removing `as any` and using correct `Href` typing should suffice.
- **PracticeToolsGrid:** `router.push(tool.route as any)` — define a union of allowed routes and type `tool.route` accordingly.

---

## 9. Applied fixes (in this pass)

- **API client (`client.ts`):** Catch clause typed as `unknown` and narrowed before use; `post`/`patch`/`put` body typed as `unknown`; method generics default to `unknown` instead of `any`.
- **useAsyncData:** Catch clause typed as `unknown` and narrowed; `onSuccess` typed as `(data: T) => void`; `UseAsyncDataOptions` made generic.
- **SessionSummaryScreen:** `router.replace` uses `Parameters<typeof router.replace>[0]` instead of `as any` for type-safe route args.
- **TabLayoutScreen:** Left as `any` — expo-router passes react-navigation types (`TabNavigationState` etc.) that don’t match `CustomTabBarProps`; use `@react-navigation/bottom-tabs` types when adding strict typing.
- **ProfileProgressScreen:** Wired to real data via `useProfileData`; shows Level, XP, Streak, progress bar, and suggested next from activity; loading screen and pull-to-refresh added.

---

## 10. Suggested next steps (priority)

1. Refactor **HomeScreen** to use **useHomeData** after aligning the hook with current APIs.
2. Add **error UI** (banner or toast) where **useAsyncData** is used and errors are currently only logged.
3. Replace remaining **`any`** in catch clauses and navigation with **unknown** / **Href** / navigation types.
4. Introduce **FlatList** (or SectionList) for long vertical/horizontal lists.
5. Centralise **theme** usage (tokens for badges, LoadingScreen typography) and document in a short “theme usage” note in the repo.
