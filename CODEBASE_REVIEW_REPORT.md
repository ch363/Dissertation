## Fluentia Codebase Review Report (Pros, Cons, Risks, Recommendations)

**Repository**: `Dissertation/`  
**Scope reviewed**: `backend/` (NestJS + Prisma + Postgres), `mobile/` (Expo + React Native)  
**Date**: 2026-01-19

---

## 1) Executive summary

You have a clear two-tier architecture:

- **Backend (`backend/`)**: NestJS API with Prisma/Postgres. It includes strong platform engineering (validation, exception filters, throttling, Swagger gating) and a notably sophisticated **learning engine** (session planning, spaced repetition using FSRS, Bayesian Knowledge Tracing mastery, XP eventing).
- **Mobile (`mobile/`)**: Expo/React Native app with strict TypeScript, Jest tests, and a feature-oriented structure. It authenticates with Supabase and forwards the Supabase JWT to the backend via a centralized API client.

At a high level, the architecture is sound and above-average for a dissertation project. The main weaknesses are:

- **Correctness bugs** that can materially distort learning/progress results (XP double-counting) and crash specific flows (pronunciation state bug).
- **Documentation/config drift** (readmes reference `apps/mobile` while repo is `mobile/`; architectural descriptions don’t fully match current schema/implementation).
- **Maintainability risk** from concentration of complex logic in a few mobile components (notably `SessionRunner.tsx`).

---

## 2) Repo-level structure and architectural intent

### Strengths

- **Clear separation of concerns**: mobile UI is isolated from backend learning logic.
- **Type safety end-to-end**: TypeScript is used across backend and mobile.
- **Testing exists on both sides**:
  - Backend unit tests: e.g. `backend/src/engine/content-delivery/session-plan.service.spec.ts`
  - Backend E2E tests: `backend/test/*.e2e-spec.ts`
  - Mobile Jest tests: `mobile/src/__tests__/*`
- **Documented architecture**: `ARCHITECTURE.md` provides a coherent conceptual overview (useful for dissertation narrative).

### Weaknesses

- **Docs drift**:
  - `README.md`, `ARCHITECTURE.md`, and `backend/README.md` overlap but describe some things differently.
  - `backend/README.md` contains Nest starter content mixed with project specifics, which makes it harder to use as canonical documentation.
- **Monorepo path drift (high impact on DX)**:
  - `mobile/README.md` and the mobile pre-push hook in `mobile/package.json` reference `apps/mobile`, but this repo uses `mobile/`.
  - This can break local workflows and confuse collaborators/markers (“CI or hooks are broken”).

---

## 3) Backend review (`backend/`)

### 3.1 Platform and operational qualities

#### Pros

- **Global request validation**: `backend/src/main.ts` configures `ValidationPipe` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true` (but with implicit conversion disabled)
  - production-safe errors via `disableErrorMessages` in prod
- **Centralized error handling**:
  - `backend/src/common/filters/http-exception.filter.ts`
  - `backend/src/common/filters/prisma-exception.filter.ts`
  - `backend/src/common/filters/all-exceptions.filter.ts`
- **Rate limiting**:
  - Global `EnhancedThrottlerGuard` via `APP_GUARD` in `backend/src/app.module.ts`
  - Tracker uses both **IP** and **user ID** when available (`backend/src/common/guards/enhanced-throttler.guard.ts`)
- **Swagger documentation** is present and gated in production:
  - `backend/src/common/swagger/swagger.config.ts`
  - Swagger is disabled unless `ENABLE_SWAGGER=true` when `NODE_ENV=production`
- **Prisma connection pooling** via `@prisma/adapter-pg`:
  - `backend/src/prisma/prisma.service.ts`
  - SSL behavior is environment-aware (production vs development)
- **Environment validation** using Joi:
  - `backend/src/config/env.validation.ts`

#### Cons / risks

- **Duplicate request logging**:
  - `RequestLoggerMiddleware` logs request+response (`backend/src/common/middleware/request-logger.middleware.ts`)
  - `LoggingInterceptor` logs requests and response status/duration (`backend/src/common/interceptors/logging.interceptor.ts`)
  - This can produce noisy logs and makes correlation harder unless carefully structured.
- **Hand-rolled security headers**:
  - `backend/src/main.ts` sets a basic CSP with `'unsafe-inline'`. For an API server, CSP is usually not meaningful; if retained, the config should be deliberate and audited.

### 3.2 Authentication & user scoping

#### Pros

- **Guard-based auth**: `SupabaseAuthGuard` (`backend/src/auth/supabase-auth.guard.ts`) provides:
  - clear error messages for missing header, wrong format, invalid signature
  - good developer ergonomics while debugging
- **User scoping principle** is consistent with best practice:
  - user identity should come from JWT `sub` rather than client-provided IDs

#### Cons / risks

- **JWT secret fallback risk**:
  - `backend/src/auth/supabase-jwt.service.ts` falls back from `SUPABASE_JWT_SECRET` to `SUPABASE_SERVICE_ROLE_KEY` for token verification.
  - A service role key is not the JWT signing secret; this fallback can create confusing auth failures and is a security footgun.

### 3.3 Data model (Prisma schema)

#### Pros

- **Strong relational model for content hierarchy**:
  - `Module -> Lesson -> Teaching -> Question` with cascades (`backend/prisma/schema.prisma`)
- **Good progress tracking primitives**:
  - Append-only attempts (`UserQuestionPerformance`)
  - Immutable completion markers (`UserTeachingCompleted`)
  - Delivery method preference scores (`UserDeliveryMethodScore`)
  - Skill mastery probabilities (`UserSkillMastery`)
  - XP events (`XpEvent`)

#### Cons / risks

- **Schema/implementation/docs inconsistency**:
  - Some documentation mentions “question delivery methods” as if a many-to-many exists, but the schema strongly suggests **one question has one `type`** (`Question.type`) and per-type tables (e.g., `QuestionTextTranslation`, `QuestionSpeechToText`).
  - Tests and docs should align with the actual modeling to preserve correctness and maintainability.

### 3.4 Learning engine quality (session planning, SRS, mastery, XP)

#### Pros (major)

- **Session planning**:
  - `backend/src/engine/content-delivery/session-plan.service.ts` implements:
    - time budgeting
    - teach-then-test sequencing
    - interleaving (with pair integrity)
    - modality selection with “avoid repetition” heuristics
- **SRS**:
  - `backend/src/engine/srs/srs.service.ts` uses FSRS and stores state in append-only rows.
  - Includes parameter optimization via historical data and safeguards (clamping, validation).
- **Mastery**:
  - `backend/src/engine/mastery/mastery.service.ts` implements Bayesian Knowledge Tracing.
  - Supports low-mastery skill extraction to influence planning (ties into content delivery).
- **XP eventing**:
  - `backend/src/engine/scoring/xp.service.ts` stores events and updates totals.
  - The presence of an `XpEvent` log is excellent for future analytics.

#### Cons / risks (high impact)

- **Critical correctness bug: XP double counting**
  - `ProgressService.recordQuestionAttempt()`:
    - awards XP via `XpService.award()` which increments `User.knowledgePoints`
    - then records “knowledge level progress” via `recordKnowledgeLevelProgress()` which increments `User.knowledgePoints` again
  - Effect: XP totals inflate; progression becomes unreliable; dashboards and evaluation results can be invalid.

---

## 4) Mobile review (`mobile/`)

### 4.1 Tooling, quality gates, and DX

#### Pros

- **Strict TypeScript**: `mobile/tsconfig.json` uses `strict: true`.
- **Linting rules catch real issues**:
  - `react-hooks/exhaustive-deps: error` in `mobile/.eslintrc.json`
  - unused vars enforced via `@typescript-eslint/no-unused-vars`
- **Testing infrastructure is real**:
  - Jest config (`mobile/jest.config.js`) with module path mapping
  - `mobile/jest.setup.js` mocks AsyncStorage, Supabase, icons, and platform noise

#### Cons / risks

- **Pre-push hook path mismatch**:
  - `mobile/package.json` uses a hook that `cd`s into `apps/mobile`, which does not exist in this repo layout.

### 4.2 API client and auth integration

#### Pros

- **Central API client**: `mobile/src/services/api/client.ts`
  - automatically attaches Supabase access token as `Authorization: Bearer <token>`
  - understands backend response wrapping (`{ success: true, data: ... }`) from the backend transform interceptor
- **Supabase client is well-initialized**: `mobile/src/services/supabase/client.ts`
  - uses AsyncStorage on native
  - enables auto-refresh only while app is active

#### Cons / risks

- **Base URL config can be fragile**:
  - `mobile/src/services/api/config.ts` falls back to `http://localhost:3000`.
  - This is reasonable for dev but should be carefully handled for production builds and emulator/device networking.

### 4.3 Navigation and session runtime

#### Pros

- **Route guard is robust**:
  - `mobile/src/services/navigation/RouteGuard.tsx` handles Expo Router “navigate before mounting” edge cases.
- **Session plan caching**:
  - `mobile/src/services/api/session-plan-cache.ts` adds a best-effort TTL cache to reduce latency.

#### Cons / risks (high impact)

- **Complexity concentration in `SessionRunner.tsx`**
  - `mobile/src/features/session/components/SessionRunner.tsx` mixes:
    - UI state
    - learning flow orchestration
    - validation + attempt recording side effects
    - XP aggregation
    - haptics and error handling
  - This raises the probability of subtle bugs and makes testing harder.

- **Likely crash bug in pronunciation branch**
  - In pronunciation flow within `SessionRunner.handleCheckAnswer(...)`, `audioFormat` is inferred from `audioRecordingUri` state immediately after calling `setAudioRecordingUri(audioUri)`.
  - Because React state updates are async, `audioRecordingUri` can still be `null`, causing `.endsWith(...)` to throw.

- **Attempt recording logic can skew learning signals**
  - `recordedAttempts` blocks multiple recordings for a card, but UI permits multiple tries.
  - Some card types validate immediately on selection (e.g. FillBlank), which can cause “first attempt wins” behavior even if the user corrects themselves.
  - This may distort SRS scheduling and mastery updates in the backend.

---

## 5) Consistency and drift analysis (docs ↔ schema ↔ runtime)

### What’s consistent

- High-level architecture: mobile authenticates via Supabase and talks to a backend API that enforces user scoping.
- Content hierarchy and progress primitives exist and are implementable.

### What’s drifting

- **Mobile README vs actual repo layout** (`apps/mobile` vs `mobile`).
- **Backend docs vs schema vs implementation** around question modeling and delivery methods.
- Some tests mock shapes that appear to reflect older iterations of the system (risk: tests pass while not testing real behavior).

**Why this matters**: in a dissertation context, drift makes it harder to justify design choices and may undermine evaluation claims (“the system does X”) if implementation differs.

---

## 6) Security and privacy posture

### Strengths

- JWT-based auth with explicit guard, and clear missing/invalid token handling.
- Input validation defaults that reject unexpected fields.
- Throttling is implemented with a security-aware design.

### Gaps / risks

- JWT verification fallback as noted above (service role key misuse).
- Logging potentially includes learning content and user answers (PII-ish depending on use). Sanitation exists, but “learning answers” aren’t treated as sensitive by default.

---

## 7) Performance and scalability considerations

### Backend

- Connection pooling is a good baseline.
- Session plan and SRS logic can be compute-heavy:
  - `SrsService` pulls a fair amount of historical attempt data (including “all user attempts” with a limit of 1000).
  - For a dissertation workload this is fine; for scale, you’d likely add indexes, caching, and potentially offline parameter optimization.

### Mobile

- Runtime performance is likely OK, but `SessionRunner` does a lot of work per interaction and triggers multiple network calls (validate + record + update score + complete teaching).
- Best-effort caching exists for session plans.

---

## 8) Prioritized recommendations

### P0 (must-fix: correctness/crashes)

- **Fix XP double counting**
  - Decide the single source of truth for XP totals (`User.knowledgePoints`).
  - Either:
    - keep `xp_events` as ledger and derive totals (or update totals once), and keep `user_knowledge_level_progress` as analytics-only without incrementing totals, or
    - keep `user_knowledge_level_progress` as the ledger and remove incremental updates elsewhere.
- **Fix pronunciation crash in `SessionRunner`**
  - Compute audio format from the `audioUri` argument passed to the handler, not from possibly-stale React state.
- **Fix Supabase JWT verification secret selection**
  - Remove service-role fallback as “JWT secret”.
  - Prefer JWT secret or implement JWKS verification (best practice).

### P1 (high value: maintainability)

- **Refactor `SessionRunner.tsx`**
  - Extract an orchestration layer (pure functions/state machine) from side effects.
  - Add tests for:
    - “first wrong then correct” flows
    - retry behavior
    - ensuring backend receives the intended attempt(s)
- **Remove duplicated logging**
  - Pick middleware or interceptor.
  - Keep correlation IDs consistent (middleware already sets one).

### P2 (documentation integrity / dissertation readiness)

- **Align docs with reality**
  - Fix `mobile/README.md` and `mobile/package.json` hook paths to match this repo.
  - Update `backend/README.md` to remove starter boilerplate and make project details canonical.
  - Ensure descriptions of question modeling match `schema.prisma`.

---

## 9) Suggested “next actions” plan (short and pragmatic)

- **Step 1 (1–2 hours)**: Fix repo/workflow drift
  - Update mobile pre-push hook path and README paths.
- **Step 2 (2–4 hours)**: Fix correctness bugs
  - XP double counting in backend.
  - Pronunciation crash in mobile.
- **Step 3 (half day)**: Stabilize learning signals
  - Make attempt recording consistent across card types (especially multi-attempt flows).
- **Step 4 (as needed)**: Refactor + add targeted tests
  - Reduce `SessionRunner` complexity.

---

## 10) Appendix: Key files reviewed

### Backend

- **Entry + platform**
  - `backend/src/main.ts`
  - `backend/src/app.module.ts`
  - `backend/src/config/env.validation.ts`
  - `backend/src/config/configuration.ts`
  - `backend/src/common/filters/*`
  - `backend/src/common/interceptors/*`
  - `backend/src/common/guards/enhanced-throttler.guard.ts`
  - `backend/src/common/middleware/request-logger.middleware.ts`
  - `backend/src/common/swagger/swagger.config.ts`
- **Auth**
  - `backend/src/auth/supabase-auth.guard.ts`
  - `backend/src/auth/supabase-jwt.service.ts`
- **Learning + progress**
  - `backend/src/learn/learn.service.ts`
  - `backend/src/progress/progress.service.ts`
  - `backend/src/engine/content-delivery/session-plan.service.ts`
  - `backend/src/engine/srs/srs.service.ts`
  - `backend/src/engine/mastery/mastery.service.ts`
  - `backend/src/engine/scoring/xp.service.ts`
- **Schema**
  - `backend/prisma/schema.prisma`

### Mobile

- **App shell**
  - `mobile/src/app/_layout.tsx`
  - `mobile/src/services/navigation/RouteGuard.tsx`
- **Auth + API**
  - `mobile/src/services/auth/AuthProvider.tsx`
  - `mobile/src/services/supabase/client.ts`
  - `mobile/src/services/api/client.ts`
  - `mobile/src/services/api/progress.ts`
  - `mobile/src/services/api/learn.ts`
  - `mobile/src/services/api/session-plan-cache.ts`
- **Session runtime**
  - `mobile/src/features/session/components/SessionRunner.tsx`
  - `mobile/src/features/session/components/cards/ListeningCard.tsx`
- **Tests**
  - `mobile/src/__tests__/*`
  - `mobile/jest.setup.js`

