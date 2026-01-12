# Fluentia Mobile (React Native + Expo)
[![Lint](https://img.shields.io/github/actions/workflow/status/ch363/Dissertation/ci.yml?branch=main&label=lint)](https://github.com/ch363/Dissertation/actions/workflows/ci.yml)
[![Type Check](https://img.shields.io/github/actions/workflow/status/ch363/Dissertation/ci.yml?branch=main&label=type%20check)](https://github.com/ch363/Dissertation/actions/workflows/ci.yml)

This repo is mobile-first. It contains an Expo React Native app you can run on iOS (simulator/device) and Android.

## Mobile Structure

- `apps/mobile/app/` – routes and screens (Welcome, Onboarding, Tabs)
- `apps/mobile/src/theme.ts` – design system (fonts, colors, spacing, radius, typography)

## iOS quick start

1) Install dependencies

```bash
cd apps/mobile
npm install
```

2) Run on iOS Simulator

```bash
npm run ios
```

Or start dev server and use Expo Go:

```bash
npm run start
```

## Contributing / PR Process

All changes should land via Pull Requests to `main`.

1. Create a feature branch:

```
git checkout -b feat/scope
```

2. Develop in `apps/mobile`, keep changes focused. Validate locally:

```
cd apps/mobile
npm run ci # runs lint + type-check
```

Pre-push hook: running `npm install` in `apps/mobile` installs a pre-push hook (via simple-git-hooks) that executes `npm run ci` to mirror the CI gate.

3. Push and open a PR. The GitHub Action `mobile-ci` will run on PRs that touch `apps/mobile` and must pass before merging.

4. Include screenshots for UI changes.

### Backend (Supabase) Setup

1. Create a Supabase project and get Project URL + anon key.
2. In `apps/mobile/.env` (create from `.env.example`), set:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

3. In the Supabase SQL editor, run the schema policies for profiles and onboarding (see docs or ask to regenerate).
4. Disable email confirmations for password auth (Supabase Dashboard → Auth → Email → Confirm email OFF) so sign-up returns an active session without magic links.
5. If you enable password reset, allow `fluentia://auth/update-password` in the Supabase redirect allow list. The app sends reset emails to that deep link and handles updating the password inside the app.

### Progress table

- Create `user_progress` with RLS (see `apps/mobile/supabase/schema.sql`):
  - Columns: `user_id` (PK → auth.users, cascade), `completed` text[], `version` int, `updated_at` timestamptz default now().
  - Trigger `trg_user_progress_updated_at` keeps `updated_at` fresh.

### Testing

- Unit/component: `npm test` (Jest with Expo mocks). Key coverage: auth-flow, onboarding mapper/provider, progress repo, Home screen.
- E2E (Maestro): `tests/e2e/maestro/signup-onboarding.yaml` for sign-up → onboarding → first lesson smoke.

---

## Project Docs (Monorepo)

This repository also includes structured documentation helpful for the dissertation process:

```
docs/                   # Documentation and specifications
	features/             # Feature specifications and requirements
	bugs/                 # Bug reports and resolutions
	development/          # Development guidelines and processes
	research/             # Research notes and findings
src/                    # Source code (if extended beyond mobile)
tests/                  # Test suites
tools/                  # Development tools and scripts
config/                 # Project configuration files
```

See:

- [Feature Specification Process](docs/features/README.md)
- [Bug Tracking and Resolution](docs/bugs/README.md)
- [Development Guidelines](docs/development/README.md)
- [Research Documentation](docs/research/README.md)
