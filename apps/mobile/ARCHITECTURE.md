# Mobile app architecture (overview)

This app is feature-first and keeps Expo Router routes thin:

- `app/` — Expo Router entrypoints. UI routes re-export feature screens; `app/api/*` hosts API handlers/data access (Supabase) and is exposed via the `@/api/*` alias.
- `src/features/*` — Vertical slices (auth, onboarding, home, profile, progress, learn, settings, course). Each slice owns its screens/components/hooks and any feature-level facades.
- `src/services/*` — Cross-cutting providers and infra (theme, navigation guard, logging, env, preferences/TTS, Supabase config gate).
- `src/components/*` — Shared UI primitives (navigation, home cards, etc.).
- `src/hooks/*`, `src/types/*` — Shared hooks/types.

## Why facades?
They decouple UI from implementation details. Routes and screens import feature facades (`@/features/.../api`) or services instead of deep data layers.

## Data flow
UI (app/*) → features/* (hooks/components/facades) → app/api/* → Supabase/Native modules.

## Auth
- `@/features/auth/api`: signUpWithEmail, signInWithEmail, getCurrentUser, etc. (wrapping `@/api/auth`).
- `AuthProvider` keeps session state and seeds profiles.

## Content
- `@/api/content`: fetchSentences, fetchSentenceWithTranslation, fetchClozeTemplates (backed by Supabase tables in `supabase/schema.sql`).

## Settings
- `@/services/theme` + `@/services/preferences` + `@/services/tts` for theme/prefs/speech.

## Testing tips
- Keep UI pure; mock feature facades/services in tests.
- Repos should avoid React; keep them promise-based with simple inputs/outputs.
