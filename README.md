# Fluentia — Language Learning Platform

A full-stack language learning application: a **React Native (Expo)** mobile app and a **NestJS** backend API. The platform delivers adaptive learning with spaced repetition, progress tracking, and multiple practice modalities (e.g. multiple choice, translation, fill-in-the-blank, listening, pronunciation).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Mobile Setup](#mobile-setup)
  - [App Store deployable (EAS)](#app-store-deployable-eas)
- [Key Features](#key-features)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Development](#development)
- [Documentation](#documentation)
- [License & Support](#license--support)

---

## Project Overview

Fluentia is a dissertation project that combines a mobile-first learning experience with a REST API for content, progress, and orchestration. The system supports CEFR levels (A1–C2), multiple delivery methods (flashcards, multiple choice, translation, fill-in-the-blank, listening, pronunciation), and tracks user progress through modules, lessons, teachings, and questions. Authentication is handled by **Supabase Auth**; the NestJS backend verifies JWTs and provisions users on first use.

---

## Repository Structure

```
Dissertation/
├── backend/          # NestJS API (Prisma, PostgreSQL)
├── mobile/           # React Native + Expo app (Expo Router)
├── ARCHITECTURE.md   # System and module architecture
├── DESIGN_SPEC.md    # Design and UX specification
├── USER_JOURNEYS.md  # User flows and journeys
└── README.md         # This file
```

---

## Tech Stack

| Layer   | Technologies |
|--------|--------------|
| **Backend** | NestJS 11, TypeScript 5, Prisma 7, PostgreSQL, Supabase (JWT verification), Azure Speech (pronunciation) |
| **Mobile**  | React Native, Expo 51, Expo Router, TypeScript, Supabase Auth & client, React Context |

The mobile app uses **Supabase** for sign-in/sign-up and session management; all learning data, progress, and orchestration go through the **NestJS API** (configured via `EXPO_PUBLIC_API_URL`).

---

## Prerequisites

- **Node.js** v18 or later
- **PostgreSQL** (local or hosted)
- **npm** (or yarn)
- **Mobile development**
  - iOS: Xcode and iOS Simulator, or physical device with Expo Go
  - Android: Android Studio and emulator, or physical device with Expo Go

---

## Getting Started

### Backend Setup

1. **Install dependencies**

   ```bash
   cd backend && npm install
   ```

2. **Environment variables**

   Create a `.env` file in `backend/` (see `backend/.env.example`):

   - **Database:** `DATABASE_URL` — PostgreSQL connection string  
   - **Supabase:** `SUPABASE_URL`, `SUPABASE_JWT_SECRET` (required); `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (optional)  
   - **Server:** `PORT` (default `3000`)  
   - **Azure Speech** (optional, for pronunciation): `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `AZURE_SPEECH_DEFAULT_LOCALE`

3. **Database**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run seed   # optional: seed demo content
   ```

4. **Run the API**

   ```bash
   npm run start:dev
   ```

   API base URL: `http://localhost:3000`. All authenticated routes expect `Authorization: Bearer <supabase-jwt>`.

   More detail: [backend/README.md](./backend/README.md).

### Mobile Setup

1. **Install dependencies**

   ```bash
   cd mobile && npm install
   ```

2. **Environment variables**

   Create a `.env` file in `mobile/` (see `mobile/.env.example`):

   - `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL  
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key  
   - `EXPO_PUBLIC_API_URL` — NestJS API base URL (e.g. `http://localhost:3000`)  
   - `EXPO_PUBLIC_SUPABASE_REDIRECT_URL` — optional; e.g. `fluentia://auth/sign-in` for email links

3. **Run the app**

   ```bash
   npm run start
   ```

   Then: `npm run ios` or `npm run android`, or scan the QR code with Expo Go.

   More detail: [mobile/README.md](./mobile/README.md).

### App Store deployable (EAS)

To get the mobile app ready for App Store (and TestFlight) via [Expo Application Services (EAS)](https://docs.expo.dev/build/introduction/):

1. **Log in and link the project** (from `mobile/`):

   ```bash
   cd mobile
   npx eas-cli login
   npx eas-cli init
   ```

   Alternatively, create a new project at [expo.dev](https://expo.dev) and link it (e.g. `npx eas-cli init` and choose “Link to existing project”).

2. **Set the EAS project ID**  
   After init, EAS will give you a project ID. Put it in `mobile/app.json`:

   - Replace the placeholder in `expo.extra.eas.projectId` (currently `00000000-0000-0000-0000-000000000000`) with your real EAS project ID.

3. **Build profiles**  
   `mobile/eas.json` is already set up with:

   - **production** — App Store build (`distribution: "store"`). Use for release and TestFlight.
   - **preview** — Internal distribution for testing without the store (`distribution: "internal"`).

   Build commands (from `mobile/`):

   ```bash
   npx eas-cli build --platform ios --profile production   # App Store / TestFlight
   npx eas-cli build --platform ios --profile preview     # Internal test build
   ```

   After a successful build, use [EAS Submit](https://docs.expo.dev/submit/introduction/) to send the build to App Store Connect (e.g. `npx eas-cli submit --platform ios --profile production`).

---

## Key Features

- **Content hierarchy:** Modules → Lessons → Teachings → Questions; CEFR levels (A1–C2).
- **Delivery methods:** Multiple choice, translation, fill-in-the-blank, flashcards, listening, pronunciation (Azure Speech).
- **Auth & identity:** Supabase Auth; user provisioning via `GET /me`; profile, avatar, preferences.
- **Progress:** Lesson/teaching completion, question attempts (append-only), spaced repetition (FSRS), delivery-method preferences, XP and knowledge-level progression.
- **Orchestration:** Learning path, review summary, suggestions, session plans (learn/review/mixed, time budget).
- **Mobile:** Onboarding, home dashboard, lesson browsing, practice sessions, profile and settings.

---

## Database Schema

Managed by Prisma in `backend/prisma/schema.prisma`. Main areas:

- **Content:** `Module`, `Lesson`, `Teaching`, `Question`, `QuestionDeliveryMethod`
- **Users & progress:** `User` (id = Supabase auth id), `UserLesson`, `UserTeachingCompleted`, `UserQuestionPerformance`, `UserDeliveryMethodScore`, `UserKnowledgeLevelProgress`, onboarding/preferences

See [backend/prisma/schema.prisma](./backend/prisma/schema.prisma) for the full schema.

---

## API Overview

Base URL: `http://localhost:3000` (or `EXPO_PUBLIC_API_URL`). Authenticated endpoints require:

```http
Authorization: Bearer <supabase-jwt>
```

### Health (unauthenticated)

- `GET /health` — Liveness  
- `GET /health/db` — Database connectivity  

### Identity & profile (authenticated)

- `GET /me` — Provision user from JWT, return profile  
- `PATCH /me` — Update user/preferences  
- `GET /me/profile`, `POST /me/profile/ensure`, `PATCH /me` — Profile lifecycle  
- `GET /me/dashboard`, `GET /me/stats`, `GET /me/lessons`, `GET /me/recent`, `GET /me/mastery`  
- `POST /me/avatar`, `POST /me/reset`, `DELETE /me`  

### Onboarding (authenticated)

- `POST /onboarding` — Save onboarding answers  
- `GET /onboarding` — Get onboarding data  
- `GET /onboarding/has` — Check if onboarding is complete  

### Content (public read; authenticated write)

- **Modules:** `GET /modules`, `GET /modules/featured`, `GET /modules/:id`, `GET /modules/:id/lessons`, `POST/PATCH/DELETE /modules/*`  
- **Lessons:** `GET /lessons`, `GET /lessons/recommended`, `GET /lessons/:id`, `GET /lessons/:id/teachings`, `POST/PATCH/DELETE /lessons/*`  
- **Teachings:** `GET /teachings`, `GET /teachings/:id`, `GET /teachings/:id/questions`, `POST/PATCH/DELETE /teachings/*`  
- **Questions:** `GET /questions`, `GET /questions/:id`, `PUT /questions/:id/delivery-methods`, `POST/DELETE /questions/*`  

### Progress (authenticated)

- Lessons: `POST /progress/lessons/:lessonId/start`, `GET /progress/lessons`, `POST /progress/lessons/:lessonId/reset`  
- Teachings: `POST /progress/teachings/:teachingId/complete`  
- Questions: `POST /progress/questions/:questionId/attempt`, `POST /progress/questions/:questionId/validate`, `POST /progress/questions/:questionId/pronunciation`  
- Reviews: `GET /progress/reviews/due`, `GET /progress/reviews/due/latest`  
- Preferences & XP: `POST /progress/delivery-method/:method/score`, `POST /progress/knowledge-level-progress`  
- Other: `GET /progress/summary`, `POST /progress/modules/:moduleIdOrSlug/complete`, `GET /progress/attempts`, `POST /progress/questions/:questionId/reset`  

### Learning orchestration (authenticated)

- `GET /learn/learning-path` — Learning path cards  
- `GET /learn/review-summary` — Review summary  
- `GET /learn/suggestions?currentLessonId=&moduleId=&limit=` — Lesson/module suggestions  
- `GET /learn/session-plan?mode=&timeBudgetSec=&lessonId=&moduleId=&theme=` — Session plan (learn/review/mixed)  

### Search (public)

- `GET /search?q=...` — Search content (query params as defined in backend)  

### Speech (authenticated)

- Pronunciation assessment (e.g. `POST /speech/pronunciation-score` or as referenced in progress module) — Azure Speech–backed pronunciation scoring  

For full request/response shapes and error handling, see [backend/README.md](./backend/README.md) and the backend Swagger/OpenAPI surface if enabled.

---

## Development

### Scripts

| Repo    | Lint        | Type check | Test        | CI (gate)   |
|---------|-------------|------------|-------------|-------------|
| Backend | `npm run lint` | —          | `npm test`, `npm run test:e2e`, `npm run test:cov` | Run lint + tests before PR |
| Mobile  | `npm run lint` | `npm run type-check` | `npm test` | `npm run ci` (lint + type-check + test) |

Pre-push: mobile uses `simple-git-hooks` to run `npm run ci` when pushing from the repo root (if configured).

### Contributing

1. Branch from `main`: `git checkout -b feat/your-feature`  
2. Implement changes; run `npm run ci` (or backend equivalent) locally.  
3. Commit and push; open a Pull Request.  
4. Ensure CI passes; include screenshots for UI changes where relevant.

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview, backend/mobile structure, data flow, deployment notes |
| [DESIGN_SPEC.md](./DESIGN_SPEC.md) | Design and UX specification |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | User flows and journeys |
| [backend/README.md](./backend/README.md) | API auth, learn/session semantics, env vars, seeding, content model |
| [mobile/README.md](./mobile/README.md) | Mobile setup, env, testing, CI |

Additional reports (e.g. application report, content delivery) are in the repository root where applicable.

---

## License & Support

This project is part of a dissertation and is **not licensed for public use**.  

For setup or implementation questions, refer to the docs above and the READMEs in `backend/` and `mobile/`.
