## Architecture overview

This repo uses a simple layering model for the mobile app (Expo Router + TypeScript):

- app/ — UI screens, layouts, and navigation. Only imports feature facades from src/modules/*.
- src/modules/* — Facades: the stable, public API surface for UI. Explicit named exports with small JSDoc.
- src/lib/* — Internal implementation details (data access, platform APIs, storage). Considered private.
- src/providers/* — Cross-cutting React providers (Auth, Theme) that modules may re-export.
- src/viewmodels/* — UI-facing hooks that load/shape data for screens (e.g., progress summary, learning modes).
- src/components/ui/* — Reusable design-system primitives (buttons, cards) used across screens.

Aliases and enforcement:
- @/* → src/*
- @/internal/* → src/lib/* (signals “internal only”) — blocked for app/ by ESLint
- UI import boundary: app/* cannot import @/lib/* or @/internal/* (except dev utilities under app/(dev)/**). Use @/modules/* instead.

Routing conventions:
- Top-level feature screens live under app/<feature>/... (e.g., app/home, app/learn, app/profile, app/settings).
- The tab bar lives in app/(tabs)/_layout.tsx and re-exports the feature screens via app/(tabs)/{home,learn,profile,settings}.tsx.
- Profile has its own nested stack at app/profile/_layout.tsx (routes: index, progress, edit, achievements).
- Root landing (app/index.tsx) and post-auth routing send users to /(tabs)/home after onboarding.
- A global error boundary is provided at app/_error.tsx.
- Screens should consume theme via ThemeProvider/useAppTheme and avoid hardcoded colors.

Testing and CI:
- Jest with jest-expo; see existing facade smoke tests in __tests__/.
- CI runs lint, type-check, and tests on PRs/pushes (see .github/workflows/ci.yml).
- Developer scripts: lint, lint:fix, format, format:check, type-check, test.
- E2E: Maestro smoke (`tests/e2e/maestro/signup-onboarding.yaml`) covers sign-up → onboarding → first lesson.

---

## How to add a feature

1) Plan the facade API
- Define the minimal functions/types the UI will need. Keep names explicit and stable.
- Add JSDoc for each export to set expectations and inputs/outputs.

2) Create the module facade
- Create src/modules/<feature>/index.ts and export explicit named members.
- If you need providers or hooks, prefer to keep them internal and surface simple functions, or re-export provider hooks from src/providers/* via the module when appropriate (like Theme).

3) Implement internal logic
- Place data access, Supabase calls, AsyncStorage, and platform wrappers in src/lib/<feature>.ts (or a folder).
- The facade should import from ../../lib/... and re-export only what the UI needs.

4) Add UI routes
- Create screens under app/(feature)/... using Expo Router. Import only from @/modules/<feature> (not @/lib or @/internal).
- Use Theme via @/modules/settings (ThemeProvider/useAppTheme) for consistent styling.

5) Write tests
- Add a basic smoke test in __tests__/modules-<feature>.test.ts that exercises the facade (happy path + 1 edge).
- Mock Supabase/AsyncStorage if needed; see jest.setup.js and existing tests for patterns.

6) Wire it up and validate
- Run: npm run lint && npm run type-check && npm test — fix any violations.
- Use npm run lint:fix and npm run format to auto-fix common issues.

7) Optional dev screen
- If a one-off developer utility is helpful, add it under app/(dev)/**. The ESLint boundary is relaxed there so you may import @/lib/* directly.

---

## When to touch lib vs modules vs app

Touch src/lib/* when:
- You’re implementing data/storage/platform code (Supabase queries, speech, prefs, etc.).
- You’re changing internal logic or performance that shouldn’t leak to UI.
- You’re adding a new repository/service.
- Progress source of truth: Supabase table `user_progress` with local cache merge; keep fetch/merge logic in lib.

Touch src/modules/* when:
- You’re defining or evolving the public API used by UI.
- You want to aggregate multiple lib calls into a simple UI function.
- You need to re-export provider hooks as a stable interface (e.g., Theme, Auth helpers).

Touch app/* when:
- You’re creating or modifying screens, layouts, or navigation.
- You’re composing facades to render UI and handle interactions.
- You need a developer-only utility under app/(dev)/**.
- Prefer consuming data via viewmodels/hooks instead of inline IIFEs; handle loading/error states with retries.

Notes:
- The ESLint rule blocks app/* from importing @/lib/* and @/internal/* to keep the boundary clean.
- Use @/modules/* in UI; if something is missing from a facade, add/export it there rather than importing from lib.
- Central error handling: use the global error screen and log unexpected issues via @/modules/logging → src/lib/logger.
- Reusable UI: prefer components in src/components/ui/* or feature-specific components under src/components/<feature>/* to reduce style duplication and ensure theme compatibility.

---

## Tips and references

- Theming: @/modules/settings exposes ThemeProvider/useAppTheme and persisted TTS settings.
- Logging: @/modules/logging exposes logError; implementation is in src/lib/logger and can be swapped for Sentry later.
- Speech: Safe wrappers live in src/lib/speech; UI should reach them via a facade (see settings module’s exports).
- Content/Profile: Data repos live in src/lib/*, surfaced via modules (e.g., @/modules/content, @/modules/profile).

