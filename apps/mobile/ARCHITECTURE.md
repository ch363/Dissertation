# Mobile app architecture (overview)

This app follows a feature-first layering:

- `app/` — Expo Router entrypoints; keep thin and delegate to feature screens/services.
- `src/features/*` — Vertical slices (auth, onboarding, home, profile, progress, learn, settings). Each slice owns screens/components/hooks/api facades.
- `src/api/*` — Supabase/data access, DTO parsing.
- `src/services/*` — Cross-cutting providers and infra (theme, navigation guard, logging, env, preferences/TTS, supabase client gate).
- `src/common/*` — Shared UI, hooks, helpers.

## Why facades?
They decouple UI from implementation details. Routes and screens import feature facades (`@/features/.../api`) or services instead of deep data layers.

## Data flow
UI (app/*) → features/* (api/hooks/components) → api/* → Supabase/Native modules.

## Auth
- `@/features/auth/api`: signUpWithEmail, signInWithEmail, getCurrentUser, etc.
- `AuthProvider` keeps session state and seeds profiles.

## Content
- `@/features/learn/api`: fetchSentences, fetchSentenceWithTranslation, fetchClozeTemplates (backed by Supabase tables in `supabase/schema.sql`).

## Settings
- `@/services/theme` + `@/services/preferences` + `@/services/tts` for theme/prefs/speech.

## Testing tips
- Keep UI pure; mock feature facades/services in tests.
- Repos should avoid React; keep them promise-based with simple inputs/outputs.
