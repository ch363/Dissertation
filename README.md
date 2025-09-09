# Dissertation Mobile (React Native + Expo)

This repo is mobile-only. It contains an Expo React Native app you can run on iOS (via Xcode or a simulator) and Android.

## Structure

- `apps/mobile` – Expo app using `expo-router`
	- `app/` – routes and screens (Welcome, Onboarding, Tabs: Learn/Progress/Profile)
	- `src/theme.ts` – design system (Inter font, colors, spacing, radius, typography)

## iOS quick start

1) Install dependencies

```bash
cd apps/mobile
npm install
```

2) Run on iOS Simulator with Xcode

```bash
npm run ios
```

This will prebuild the native iOS project (Pods, Xcode project) and open it in the simulator. Ensure you have Xcode Command Line Tools installed.

Alternatively, start the dev server and use Expo Go on device:

```bash
npm run start
```

## Scripts

- `npm run start` – Start Metro bundler
- `npm run ios` – Build and run iOS app via Xcode/simulator
- `npm run android` – Build and run Android (if desired)
- `npm run lint` – ESLint via `eslint-config-universe`
- `npm run type-check` – TypeScript check (no emit)

## Notes

- Fonts: Inter is loaded via `@expo-google-fonts/inter` in `app/_layout.tsx`.
- When ready, add icons/splash assets and re-enable them in `apps/mobile/app.json`.

run
# From /workspaces/Dissertation
npm ci
npm run dev

build
npm run build
npm start