## Fluentia: Learning Flow & Dynamic Content Delivery Report

This report documents Fluentia’s end-to-end learning flow and the methods/algorithms that enable **dynamic content delivery**. It is grounded in the current codebase structure and implementation details, with file-path traceability to the backend (NestJS + Prisma/Postgres) and mobile client (React Native/Expo).

### Scope

- **System learning flow**: content authoring/import → session orchestration → practice → progress logging → next-session adaptation.
- **Dynamic delivery mechanisms**: spaced repetition scheduling, skill mastery tracking, candidate ranking, interleaving, modality selection, dynamic question payload generation (e.g., MCQ distractors), and pronunciation assessment.
- **Implementation guidance**: specific frontend and database changes to “fully realize” the backend algorithms in product UX and data integrity/scale.

---

## 1) System overview

### 1.1 Architecture (high level)

- **Mobile**: Expo/React Native client requests learning sessions and posts progress/attempts.
- **Backend**: NestJS API orchestrates learning sessions, validates answers, records progress, schedules reviews, tracks skill mastery.
- **Database**: PostgreSQL via Prisma stores content hierarchy and user progress as mostly append-only logs.

Primary architecture reference: `ARCHITECTURE.md`.

### 1.2 Core entities (conceptual)

- **Content hierarchy**: `Module → Lesson → Teaching → Question`
- **Progress and personalization**:
  - `UserLesson` (lesson engagement, completed teaching count)
  - `UserTeachingCompleted` (immutable teaching completion marker)
  - `UserQuestionPerformance` (append-only attempt log + spaced repetition state)
  - `UserDeliveryMethodScore` (preference scores per delivery modality)
  - `UserSkillMastery` (skill mastery probability via BKT)
  - `XpEvent` and `UserKnowledgeLevelProgress` (XP event log + progress log)

Schema reference: `backend/prisma/schema.prisma`.

---

## 2) End-to-end learning flow

### 2.1 Content lifecycle (authoring → import → DB)

**Goal**: allow content to be iterated/re-imported without breaking referential integrity.

- Content is imported using a backend importer:
  - `backend/src/content/importer/content-importer.service.ts`
- IDs are deterministic based on “slug → UUID-like ID”:
  - `backend/src/content/importer/slug-to-id.ts`
  - Uses SHA-1 hash and formats it as UUID segments. This yields stable IDs across imports.

**Implication**: learning sessions and progress can reliably reference content IDs across content refreshes, as long as slugs remain stable.

### 2.2 Session lifecycle (mobile → backend → session plan)

**Mobile**:

- Requests plans via:
  - `mobile/src/services/api/learn.ts` → `GET /learn/session-plan`
- Transforms plan steps into UI cards:
  - `mobile/src/services/api/session-plan-transformer.ts`
- Renders and runs cards:
  - `mobile/src/features/session/screens/SessionRunnerScreen.tsx`
  - `mobile/src/features/session/components/SessionRunner.tsx`

**Backend**:

- `GET /learn/session-plan`:
  - `backend/src/learn/learn.controller.ts`
  - `backend/src/learn/learn.service.ts` → `ContentDeliveryService.getSessionPlan()`
- Caching:
  - `backend/src/engine/content-delivery/session-plan-cache.service.ts` (in-memory, TTL ~ 5 minutes by default)

**Session plan structure**:

- Steps are of type: `teach`, `practice`, `recap`
- Types reference: `backend/src/engine/content-delivery/session-types.ts`

### 2.3 Practice lifecycle (attempts → validation → progress writes → next plan)

For each practice step, the mobile client:

1. **Validates**:
   - `POST /progress/questions/:questionId/validate`
   - Or for pronunciation:
     - `POST /progress/questions/:questionId/pronunciation`
2. **Records attempt** (append-only):
   - `POST /progress/questions/:questionId/attempt`
3. **Updates delivery-method preference score**:
   - `POST /progress/delivery-method/:method/score`

Backend implementation:

- Progress endpoints:
  - `backend/src/progress/progress.controller.ts`
- Core progress logic:
  - `backend/src/progress/progress.service.ts`

**Critical adaptation loop**:

- Attempt recording triggers:
  - FSRS scheduling update (next review due)
  - Skill mastery update (BKT)
  - XP award and progress logging
  - Session plan cache invalidation (server-side)

---

## 3) Dynamic content delivery: methods and algorithms

This section lists each dynamic mechanism, its role, inputs/outputs, and where it lives in code.

---

## 3.1 Spaced repetition scheduling (FSRS)

### Role

Determines **when a question should be reviewed** by computing `nextReviewDue` and related SRS state parameters based on a user’s performance history.

### Where it is implemented

- Entry point:
  - `ProgressService.recordQuestionAttempt()` in `backend/src/progress/progress.service.ts`
- SRS service:
  - `backend/src/engine/srs/srs.service.ts`
- FSRS algorithm:
  - `backend/src/engine/srs/algo.fsrs.ts`
- Grade mapping utilities (score/correctness → FSRS grade):
  - `backend/src/engine/srs/grade.ts`

### Data model

State is stored **per attempt** in `UserQuestionPerformance` (append-only):

- `nextReviewDue`, `intervalDays`, `stability`, `difficulty`, `repetitions`

Schema: `backend/prisma/schema.prisma` (`UserQuestionPerformance`).

### How the algorithm works (implementation summary)

1. Convert attempt features to a **grade (0–5)**:
   - If a numeric score exists (0–100), map to 0–5 via `scoreToGrade()`.
   - Else map correct + time to 0–5.
2. Update FSRS state (`stability`, `difficulty`, `repetitions`) using FSRS update rules.
3. Compute next interval for target retention \(R\approx 0.9\):
   - `intervalDays = -stability * ln(targetRetention)`
4. Set `nextReviewDue = now + intervalDays`.
5. Clamp and validate values to avoid invalid DB writes.

**Dynamic effect**: identical content schedules differently per user due to performance-dependent state.

---

## 3.2 FSRS per-user parameter optimization (gradient descent)

### Role

Improves FSRS scheduling personalization by optimizing the FSRS parameters \(w_0..w_{16}\) based on a user’s historical review behavior.

### Where it is implemented

- Optimizer:
  - `backend/src/engine/srs/fsrs-optimizer.ts`
- Called from:
  - `backend/src/engine/srs/srs.service.ts` (`getOptimizedParametersForUser()`)

### How it works (implementation summary)

- Uses user’s historical `UserQuestionPerformance` entries (up to ~1000) to form `ReviewRecord`s.
- Computes prediction error by comparing predicted vs actual intervals.
- Performs bounded finite-difference gradient descent for a limited iteration count.

**Dynamic effect**: scheduling behavior can diverge substantially between users as their optimized parameters drift from defaults.

---

## 3.3 Skill mastery tracking (Bayesian Knowledge Tracing, BKT)

### Role

Tracks \(P(\text{user knows skill})\) for each skill tag, enabling the system to **prioritize new content** targeting weak skills.

### Where it is implemented

- Mastery service:
  - `backend/src/engine/mastery/mastery.service.ts`
- Called from attempt recording:
  - `backend/src/progress/progress.service.ts` (`recordQuestionAttempt`)

### Data model

`UserSkillMastery` keyed by `(userId, skillTag)` stores:

- `masteryProbability` (0..1)
- BKT parameters: `prior`, `learn`, `guess`, `slip`

Schema: `backend/prisma/schema.prisma` (`UserSkillMastery`).

### How it works (implementation summary)

- On each attempt, determine `isCorrect` and update mastery probability using standard BKT formulas.
- Mastery record is created lazily with defaults if missing.
- The system can query low mastery skills (< 0.5 default):
  - `MasteryService.getLowMasterySkills()`

**Dynamic effect**: new content is preferentially chosen to remediate weak skills.

---

## 3.4 Session plan orchestration (reviews vs new, teach-then-test, pacing)

### Role

Produces an ordered plan of learning steps that balances review obligations, new learning, teaching scaffolding, pacing, and variety.

### Where it is implemented

- Plan creation:
  - `backend/src/engine/content-delivery/session-plan.service.ts`
- Caching:
  - `backend/src/engine/content-delivery/session-plan-cache.service.ts`
- Policy functions:
  - `backend/src/engine/content-delivery/session-planning.policy.ts`
  - `backend/src/engine/content-delivery/selection.policy.ts`

### Inputs

From `SessionContext` (`backend/src/engine/content-delivery/session-types.ts`):

- `mode`: `learn` | `review` | `mixed`
- `lessonId?` (optional filter)
- `timeBudgetSec?` (adaptive item count)

From DB/state:

- due reviews from `UserQuestionPerformance` (deduped to latest per question)
- “new items” are questions with no prior attempts
- completed teachings from `UserTeachingCompleted`
- low mastery skills from `UserSkillMastery`
- delivery method preference scores from `UserDeliveryMethodScore`
- time history from `UserQuestionPerformance.timeToComplete`

### Outputs

A `SessionPlanDto` containing ordered `steps` (`teach` / `practice` / `recap`) plus metadata.

### Key orchestration behaviors

#### a) Mode semantics

- **review**: only due reviews (with interleaving/scaffolding rules)
- **learn**: prioritize new items; if insufficient, fill with reviews
- **mixed**: combines review + new (target ~70% review / 30% new)

#### b) Time-budget pacing

- Estimates average time per item from user history.
- Uses a 20% buffer and clamps to a maximum of 50 items.

#### c) Teach-then-test sequencing

- For new content, ensures a `teach` step precedes associated practice when teaching hasn’t been completed before.
- “Seen” teachings are tracked via `UserTeachingCompleted`.

---

## 3.5 Candidate ranking (priority scoring)

### Role

Determines which review/new candidates should be included when there are more candidates than the session can accommodate.

### Where it is implemented

- `rankCandidates()` and scoring logic:
  - `backend/src/engine/content-delivery/selection.policy.ts`

### Priority logic (as implemented)

- If `candidate.dueScore > 0` (due review):
  - `priority ≈ 1000 + dueScore + errorScore*10`
- Else (new/non-due):
  - `priority ≈ errorScore*5 + timeSinceLastSeen/1000`
  - plus **bonus** if the candidate matches any low mastery skill tags:
    - `+500`

**Dynamic effect**: overdue + error-prone content dominates; new content can be pulled forward if it targets weak skills.

---

## 3.6 Interleaving and scaffolding (variety + “help when struggling”)

### Role

Reorders candidates into a session sequence that improves retention through **interleaving** (variety) and **scaffolding** (reducing frustration after errors).

### Where it is implemented

- `composeWithInterleaving()`:
  - `backend/src/engine/content-delivery/selection.policy.ts`

### Required metadata

Interleaving quality depends on candidates having:

- `skillTags`: topics/skills an item covers
- `exerciseType`: e.g. vocabulary/grammar/speaking/translation
- `difficulty` and `estimatedMastery` (used to choose “easy wins”)

These are assembled in plan generation (e.g., via teaching/question skill tags and heuristics).

### Notable rules (as implemented)

- **Primary variety axis**: alternate by `skillTags` when possible.
- **Secondary variety axis**: limit consecutive same `exerciseType` (default max = 2).
- **Scaffolding injection**:
  - if a skill tag has high `errorScore` (>= 3), try to inject a due review with high mastery (> 0.7) for that skill.
  - if there are 2 consecutive errors (fallback logic), inject an “easy win” candidate.
- **Modality coverage**:
  - attempt to ensure at least one speaking/listening item if enabled and available.

**Dynamic effect**: the user sees a sequence engineered for variety and morale, not just the highest ranked items.

---

## 3.7 Delivery modality selection (personalized)

### Role

Selects which delivery method to use (e.g., MCQ vs translation vs speaking) based on:

- learned user preferences (`UserDeliveryMethodScore`)
- avoidance of repetition (penalize recently repeated modalities)

### Where it is implemented

- Selection logic:
  - `selectModality()` in `backend/src/engine/content-delivery/session-planning.policy.ts`
- Preference storage:
  - `UserDeliveryMethodScore` in schema
- Preference updates:
  - `ProgressService.updateDeliveryMethodScore()` (`backend/src/progress/progress.service.ts`)
  - Mobile updates it after validation with simple deltas (`SessionRunner.tsx`).

### Important current constraint

In the current schema, each `Question` has a single `type` (`DELIVERY_METHOD`), so most candidates expose:

- `deliveryMethods: [question.type]`

This means the planner cannot truly choose among multiple modalities **for the same conceptual item** unless you introduce multi-modal question variants (see recommendations).

---

## 3.8 Dynamic question payload generation (MCQ distractors, fill-blank options)

### Role

Generates richer practice items even when authored content is minimal, especially for MCQ and fill-in-the-blank.

### Where it is implemented

- Data lookup and dynamic generation:
  - `backend/src/content/content-lookup.service.ts`
- Contextual distractor generation:
  - `backend/src/content/options-generator.service.ts`

### Behaviors

- **MCQ**:
  - uses stored `QuestionMultipleChoice.options` if present and consistent with the expected language direction.
  - otherwise generates distractors from:
    - other teachings in the same lesson (contextual)
    - a curated list of common distractors
  - translation direction for MCQ can be deterministic per question ID (hash-based).
- **Fill-blank**:
  - constructs blanked text and generates tap-to-fill options via the same distractor machinery + fallbacks.

**Dynamic effect**: practice items can adapt to lesson context and remain viable without fully curated distractor sets.

---

## 3.9 Pronunciation assessment (speech-based scoring)

### Role

Validates pronunciation from audio and returns both an overall score and word-level feedback. This score then flows into FSRS scheduling and XP.

### Where it is implemented

- API endpoint:
  - `ProgressController` → `/progress/questions/:questionId/pronunciation`
- Logic:
  - `ProgressService.validatePronunciation()` (`backend/src/progress/progress.service.ts`)
- Uses Google Cloud Speech-to-Text pronunciation assessment.

**Dynamic effect**: speaking performance becomes first-class input to progress and scheduling.

---

## 3.10 XP and reinforcement loop

### Role

Awards XP as reinforcement and supports dashboards/streaks.

### Where it is implemented

- XP engine:
  - `backend/src/engine/scoring/xp.service.ts`
- Streak + progress summary:
  - `backend/src/progress/progress.service.ts` (`calculateStreak`, `getProgressSummary`)

**Dynamic effect**: XP is event-based and can support future personalization (e.g., difficulty adjustments, gamification pacing).

---

## 4) API surface relevant to learning

### Learn endpoints

- `GET /learn/session-plan` (primary)
- `GET /learn/next` (deprecated; adapter around session plan)
- `GET /learn/suggestions` (lesson/module suggestions based on knowledge level and engagement)

Controllers:
- `backend/src/learn/learn.controller.ts`

### Progress endpoints

- `POST /progress/lessons/:lessonId/start`
- `POST /progress/teachings/:teachingId/complete`
- `POST /progress/questions/:questionId/validate`
- `POST /progress/questions/:questionId/attempt`
- `POST /progress/questions/:questionId/pronunciation`
- `GET /progress/reviews/due` and `/latest`
- `POST /progress/delivery-method/:method/score`
- `GET /progress/summary`

Controllers:
- `backend/src/progress/progress.controller.ts`

---

## 5) Frontend changes to fully realize backend adaptivity

These are practical implementation changes to ensure the UI reflects and benefits from backend algorithms.

### 5.1 Fix “stale plan” risk (mobile cache invalidation)

Issue:
- The backend invalidates its **server** plan cache after attempts/teaching completion.
- The mobile app also caches session plans per lesson (`mobile/src/services/api/session-plan-cache.ts`) for 5 minutes.
- This can cause the user to see a plan that **does not reflect** their latest attempt scheduling/mastery state.

Recommendation:
- Clear cached session plan for the relevant lesson whenever:
  - an attempt is recorded successfully, or
  - a teaching is completed.
- Alternatively: include a `planGeneratedAt` or `planVersion` from backend and refuse cached plans older than the latest progress update.

### 5.2 Add UX controls for session context

The backend already supports:

- `mode`: learn/review/mixed
- `timeBudgetSec`: pacing
- optional `lessonId` filter

Recommendation:
- Add UI toggles (e.g., “5 min review”, “10 min mixed”) and pass through to `GET /learn/session-plan`.

### 5.3 “Why am I seeing this?” explanations (trust + research validity)

The backend makes non-trivial choices (ranking, scaffolding, modality coverage). Exposing rationale improves:

- user trust
- research instrumentation (you can log whether a rationale was shown)

Recommendation:
- Extend `SessionStep` with an optional `rationale` field:
  - examples: “Due review”, “Targets low mastery skill: X”, “Scaffolding: easy win after errors”
- Display this subtly in the card UI or session header.

### 5.4 Surface mastery + review schedule

To validate and tune adaptivity:

- Create a “Skills” screen:
  - show top N lowest-mastery skills with probability values.
- Create a “Reviews” screen:
  - show count and list of due items, grouped by lesson/module.

This will require backend endpoints to expose aggregated mastery and due-review stats (some already exist; may need new endpoints for mastery detail).

### 5.5 Improve attempt telemetry

Currently, attempts record:
- `score`, `timeToComplete`, `percentageAccuracy`, `attempts`

Recommendation:
- Add optional telemetry fields to attempt recording for future algorithm upgrades:
  - `hintUsed`, `replayCount`, `inputEdits`, `skipped`, `confidenceRating`, etc.

---

## 6) Database changes to fully realize backend algorithms

### 6.1 Enable true multi-modality per concept

Current constraint:
- `Question.type` is a single `DELIVERY_METHOD`.
- Many planner functions assume an item can have multiple `deliveryMethods`, but data usually contains a single method.

Recommendation (choose one model):

1) **Question + variants** (recommended):
   - `Question` represents a conceptual practice item.
   - `QuestionVariant` rows represent delivery-method-specific forms:
     - `(questionId, deliveryMethod, variantData...)`
   - Candidates can expose multiple delivery methods for the same `questionId`.

2) **QuestionDeliveryMethod join**:
   - Restore/introduce `QuestionDeliveryMethod` join table that allows multiple delivery methods per question.

Outcome:
- `selectModality()` becomes meaningful, and user preference scores can drive modality choice **per item**, not just across different questions.

### 6.2 Persist optimized FSRS parameters per user

Issue:
- Parameter optimization uses many historical attempts and may be expensive if run frequently.

Recommendation:
- Add `UserFsrsParameters` table:
  - store \(w_0..w_{16}\), `lastOptimizedAt`, and maybe the optimizer loss/error.
- Optimize:
  - on a schedule (daily/weekly), or
  - after N new attempts.

### 6.3 Strengthen skill tag coverage via importer

BKT and interleaving benefit only when skill tags are consistently attached to:
- teachings and/or questions

Recommendation:
- Ensure the content import pipeline assigns `SkillTag` relations during import, based on authored metadata.
- Add validation checks to prevent content being imported without skill tags if adaptivity is expected.

### 6.4 Stabilize dynamically generated options (optional, research-friendly)

If repeatability matters (e.g., dissertation experiments), consider:
- storing generated MCQ options/correct indices in `QuestionMultipleChoice`
- making option generation deterministic (seeded by questionId)

### 6.5 Performance/indexing considerations (if scaling)

Hot queries:
- due review retrieval: `(userId, nextReviewDue)` and dedupe-by-question
- recent attempts: `(userId, createdAt DESC)`
- mastery queries: `(userId, masteryProbability)`

Recommendation:
- confirm supporting indexes exist (some do; add the rest as needed).

---

## 7) Known implementation gaps and alignment issues (important)

### 7.1 Two caches, one invalidation path

- Backend invalidates server cache on progress changes.
- Mobile cache currently does not appear to be invalidated on progress changes.

This can blunt the visible adaptivity of the backend.

### 7.2 Skill tags are essential for mastery-driven adaptivity

- BKT updates only happen for extracted skill tags.
- `extractSkillTags` requires Prisma relations to be loaded; there is no NLP fallback.
- If content lacks skill tags, the “prioritize weak skills” mechanism becomes inert.

### 7.3 Modality selection is limited by schema

Without multi-modality per item, `selectModality` can’t choose meaningfully for most candidates.

---

## 8) Implementation traceability index

### Backend

- **Learning endpoints**: `backend/src/learn/*`
- **Progress endpoints + logic**: `backend/src/progress/*`
- **Session plan orchestration**:
  - `backend/src/engine/content-delivery/session-plan.service.ts`
  - `backend/src/engine/content-delivery/selection.policy.ts`
  - `backend/src/engine/content-delivery/session-planning.policy.ts`
  - `backend/src/engine/content-delivery/session-types.ts`
  - `backend/src/engine/content-delivery/session-plan-cache.service.ts`
- **Spaced repetition (FSRS)**:
  - `backend/src/engine/srs/srs.service.ts`
  - `backend/src/engine/srs/algo.fsrs.ts`
  - `backend/src/engine/srs/fsrs-optimizer.ts`
  - `backend/src/engine/srs/grade.ts`
- **Skill mastery (BKT)**:
  - `backend/src/engine/mastery/mastery.service.ts`
  - `backend/src/engine/mastery/skill-extraction.util.ts`
- **Dynamic question payload construction**:
  - `backend/src/content/content-lookup.service.ts`
  - `backend/src/content/options-generator.service.ts`
- **Content import**:
  - `backend/src/content/importer/content-importer.service.ts`
  - `backend/src/content/importer/slug-to-id.ts`

### Mobile

- **Fetch session plan**: `mobile/src/services/api/learn.ts`
- **Transform plan to cards**: `mobile/src/services/api/session-plan-transformer.ts`
- **Session runner screen**: `mobile/src/features/session/screens/SessionRunnerScreen.tsx`
- **Answer validation + attempt recording**: `mobile/src/features/session/components/SessionRunner.tsx`
- **Client-side session plan caching**: `mobile/src/services/api/session-plan-cache.ts`

---

## 9) Suggested “dissertation chapter” layout (optional)

If you are using this report to form a dissertation chapter, a clean mapping is:

1. System architecture & data flow
2. Content model and ingestion (deterministic IDs)
3. Learning session orchestration (modes, teach-then-test, pacing)
4. Spaced repetition scheduling (FSRS + optimization)
5. Skill mastery tracking (BKT) and its influence on content selection
6. Interleaving and scaffolding policy rules
7. Modality selection and preference learning
8. Speech-based assessment pipeline
9. Frontend and data-layer requirements for end-to-end adaptivity
10. Evaluation metrics and experimental design (if applicable)

