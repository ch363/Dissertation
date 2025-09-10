# Fluentia Mobile (React Native + Expo)

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
