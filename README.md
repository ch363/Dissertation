# Fluentia Mobile (React Native + Expo)

This repo is mobile-only. It contains an Expo React Native app you can run on iOS (via Xcode or a simulator) and Android.

## Structure

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


## Notes

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

3. Push your branch and open a PR. The GitHub Action `mobile-ci` will run on PRs that touch `apps/mobile` and must pass before merging.

4. Use the PR template to include screenshots for UI changes.



### Backend (Supabase) Setup

1. Create a Supabase project at supabase.com and get your Project URL and anon key.
2. In `apps/mobile/.env` (create from `.env.example`), set:

```
EXPO_PUBLIC_SUPABASE_URL=... 
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

3. In the Supabase SQL editor, run:

```sql
-- Profiles table keyed by auth.users
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	name text,
	created_at timestamp with time zone default now()
);

-- Onboarding answers stored as JSONB per user
create table if not exists public.onboarding_answers (
	user_id uuid primary key references auth.users(id) on delete cascade,
	answers jsonb not null,
	updated_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.onboarding_answers enable row level security;

create policy "Users can manage their profile" on public.profiles
	for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can upsert their answers" on public.onboarding_answers
	for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

4. Install deps in the mobile app:

```
cd apps/mobile
npx expo install @react-native-async-storage/async-storage
npm i @supabase/supabase-js
```

5. Run the app; sign up creates a Supabase user and profile; finishing onboarding saves answers.
run
# From /workspaces/Fluentia
npm ci
npm run dev

build
npm run build
npm start