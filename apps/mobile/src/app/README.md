## Refactor plan (vertical slices under `src/`)

Goal: reorganize `apps/mobile` into the target vertical-slice layout while keeping Expo Router routes in `app/` as thin entrypoints.

Target roots:
- `api/` – Supabase client + data access (queries, mutations, DTO mappers)
- `common/` – shared UI, hooks, helpers, formatters, constants
- `features/` – domain slices (auth, onboarding, home, course, learn, profile, settings, nav)
- `services/` – cross-cutting infra (env, theme, navigation helpers, logging, notifications/TTS)
- `stores/` – Zustand stores (none today; placeholder for future)
- `types/` – shared DTOs, enums, navigation/route types

Keep Expo Router intact:
- Leave `app/**` structure; convert each route to import from `src/features/**/screens/*`.
- `app/_layout.tsx` continues to wrap `AppProviders`; tab layout lives in `app/(nav-bar)`.

Current → target mapping (mechanical moves)
- `src/lib/supabase.ts` → `src/api/supabase/client.ts`
- `src/lib/config.ts` → `src/services/env/supabaseConfig.ts`
- `src/lib/auth.ts` → `src/api/auth/index.ts`
- `src/lib/auth-flow.ts` → `src/features/auth/flows/resolvePostAuthDestination.ts`
- `src/lib/contentRepo.ts` → `src/api/content/index.ts`
- `src/lib/lessonAttempts.ts` → `src/api/lessons/attempts.ts`
- `src/lib/profile.ts` + `src/lib/avatar.ts` → `src/api/profile/*`
- `src/lib/progress.ts` → `src/api/progress/index.ts` (cache+remote sync)
- `src/lib/prefs.ts` → `src/services/preferences/index.ts` (AsyncStorage-backed settings)
- `src/lib/speech.ts` → `src/services/tts/index.ts` (safe speech wrapper)
- `src/lib/logger.ts` → `src/services/logging/logger.ts`
- `src/lib/onboardingRepo.ts` → `src/api/onboarding/index.ts`
- `src/lib/onboarding/{schema,mapper}.ts` → `src/features/onboarding/types/*` (schema) and `src/features/onboarding/utils/mapper.ts`
- `src/lib/schemas/*` → `src/types/{content,onboarding,profile}.ts`
- `src/components/ui/*` → `src/common/components/ui/*`
- `src/components/navigation/TabBarButton.tsx` → `src/common/components/navigation/TabBarButton.tsx`
- `src/components/home/**` → `src/features/home/components/**`
- `src/components/profile/**` → `src/features/profile/components/**`
- `src/TabIcons.tsx` (unused?) → review; keep under `src/common/components/navigation/TabIcons.tsx` or remove if dead
- `src/modules/auth` → `src/features/auth/api/index.ts` (facade over Supabase auth)
- `src/modules/content` → `src/features/learn/api/content.ts` (or `course`, depending on usage)
- `src/modules/logging` → `src/services/logging/index.ts` (re-export logger)
- `src/modules/onboarding` → `src/features/onboarding/api/index.ts`
- `src/modules/profile` → `src/features/profile/api/index.ts`
- `src/modules/progress` → `src/features/progress/api/index.ts` (or co-locate with profile)
- `src/modules/settings` → split: theme exports from `src/services/theme` and prefs from `src/services/preferences`
- `src/onboarding/OnboardingContext.tsx` → `src/features/onboarding/providers/OnboardingProvider.tsx`
- `src/onboarding/signals.ts` → `src/features/onboarding/utils/signals.ts` (if still used)
- `src/providers/AppProviders.tsx` → `src/services/app/AppProviders.tsx`
- `src/providers/AuthProvider.tsx` → `src/services/auth/AuthProvider.tsx`
- `src/providers/RouteGuard.tsx` → `src/services/navigation/RouteGuard.tsx`
- `src/providers/SupabaseConfigGate.tsx` → `src/services/api/SupabaseConfigGate.tsx`
- `src/providers/ThemeProvider.tsx` → `src/services/theme/ThemeProvider.tsx`
- `src/theme.ts` → `src/services/theme/tokens.ts`
- `src/viewmodels/learningModes.ts` → `src/features/learn/hooks/useLearningModes.ts`
- `src/viewmodels/progress.ts` → `src/features/progress/hooks/useProgressSummary.ts`
- `__tests__/*.test.ts[x]` → colocate under matching `src/features/**/__tests__/` (or `src/services/**/__tests__/`) keeping Jest config intact

Route-to-screen mapping (keep routes thin)
- `app/index.tsx` → render `features/auth/screens/LandingScreen`
- `app/auth/*` → `features/auth/screens/*`
- `app/onboarding/*` → `features/onboarding/screens/*`
- `app/(nav-bar)/home` → `features/home/screens/HomeScreen`
- `app/(nav-bar)/learn` → `features/learn/screens/LearnScreen`
- `app/(nav-bar)/profile` + nested `app/(nav-bar)/profile/*` → `features/profile/screens/*` (+ progress/achievements)
- `app/(nav-bar)/settings` + nested `app/(nav-bar)/settings/*` → `features/settings/screens/*`
- `app/course/*` → `features/course/screens/*`

Path alias plan
- Update `tsconfig.json` paths to include `@/api/*`, `@/common/*`, `@/features/*`, `@/services/*`, `@/stores/*`, `@/types/*` (keep `@/*` for catch-all).
- Mirror aliases in Jest `moduleNameMapper`; adjust Metro/Babel if needed (Babel currently empty plugins).

Notes/risks
- No Zustand stores today; `src/stores` remains empty placeholder.
- Preserve Expo Router folder names; only change imports inside route files.
- Re-export barrels: add `index.ts` under `src/common/components`, each feature root, `src/services`, and `src/stores` (even if empty) to simplify imports and avoid deep relative paths.
- Watch for circular deps when moving `auth-flow` and `RouteGuard`; keep `resolvePostAuthDestination` in feature auth flow but free of UI imports.

