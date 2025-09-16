# Mobile app architecture (overview)

This app follows a feature-first layering:

- `app/` — UI routes (Expo Router). Minimal logic; imports use module facades.
- `src/modules/*` — Facades that group related APIs per feature (auth, content, profile, settings). Safe import surface for UI.
- `src/lib/*` — Concrete implementations (Supabase client, repos, platform wrappers). This layer can change without breaking UI imports.
- `src/providers/*` — Cross-cutting React providers (ThemeProvider, AuthProvider).

## Why facades?
They decouple UI from implementation details. You can reorganize `src/lib/*` freely and keep UI imports stable (e.g., `@/modules/auth`).

## Data flow
UI (app/*) → modules/* → lib/* → Supabase/Native modules.

## Auth
- `@/modules/auth`: signUpWithEmail, signInWithEmail, getCurrentUser.
- `AuthProvider` keeps session state and seeds profiles.

## Content
- `@/modules/content`: fetchSentences, fetchSentenceWithTranslation, fetchClozeTemplates.
- Backed by normalized Supabase tables declared in `supabase/schema.sql`.

## Settings
- `@/modules/settings`: ThemeProvider exports + prefs (ttsEnabled, ttsRate) + Speech wrapper.

## Testing tips
- Keep UI pure; mock module facades in tests.
- Repos should avoid React; keep them promise-based with simple inputs/outputs.
