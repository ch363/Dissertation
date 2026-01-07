# Feature-first screens (Pattern C)

Each feature owns its UI and keeps screens close to its logic. Route files under `apps/mobile/src/app` are thin wrappers that re-export feature screens (and any route options).

## Layout

- Feature folder: `apps/mobile/src/features/<feature>/`
- Screens live in `screens/`, with components/hooks alongside as needed.
- Route wrappers stay in `apps/mobile/src/app` (e.g., `(nav-bar)/home.tsx` → `features/home/screens`).
- Layout files (`_layout.tsx`) remain with the route segment, not inside `screens/`.

## Examples

- Tabs  
  - `(nav-bar)/home.tsx` → `features/home/screens/HomeScreen.tsx`
  - `(nav-bar)/profile/*` → `features/profile/screens/*Screen.tsx`
  - `(nav-bar)/settings/*` → `features/settings/screens/*Screen.tsx`
- Auth  
  - `(auth)/sign-in.tsx` → `features/auth/screens/SignInScreen.tsx`
- Onboarding  
  - `(onboarding)/welcome.tsx` → `features/onboarding/screens/OnboardingWelcomeScreen.tsx`
- Course  
  - `course/[slug]/run.tsx` → `features/course/screens/CourseRunScreen.tsx` (re-exports `options`)

## Adding a new screen

1. Create the screen in `features/<feature>/screens/`.
2. Add or update the route wrapper under `apps/mobile/src/app/...` to `export { default } from '<feature screen path>'` (and re-export `options` if defined).
3. Keep shared UI in `components/` or `hooks/` inside the feature, or in `apps/mobile/src/app/components` if it is app-wide.

