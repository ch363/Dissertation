## App folder overview

- `app/` holds Expo Router routes; keep them thin and point to feature screens.
- `app/api/*` hosts API handlers/data access (Supabase). The `@/api/*` alias resolves here.
- Layout files (`_layout.tsx`) stay alongside their segments (e.g., `(nav-bar)`).

## Route wrappers

- `app/index.tsx` → `features/auth/screens/LandingScreen`
- `(auth)/*` → `features/auth/screens/*`
- `(onboarding)/*` → `features/onboarding/screens/*`
- `(nav-bar)/home` → `features/home/screens/HomeScreen`
- `(nav-bar)/learn` → `features/learn/screens/LearnScreen`
- `(nav-bar)/profile/*` → `features/profile/screens/*`
- `(nav-bar)/settings/*` → `features/settings/screens/*`
- `course/*` → `features/course/screens/*`

## Path aliases (see `tsconfig.json`)

- `@/*` catch-all to `src/*`
- `@/api/*` → `src/app/api/*`
- `@/features/*`, `@/services/*`, `@/components/*`, `@/types/*`, `@/hooks/*`

