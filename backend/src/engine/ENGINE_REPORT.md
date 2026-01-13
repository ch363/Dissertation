# Engine Module Report

**Generated:** 2024  
**Location:** `backend/src/engine/`  
**Purpose:** Adaptive Learning Engine - Service layer for content delivery, spaced repetition, and scoring

---

## 📊 Overview

The Engine module is the "brain" of the adaptive learning system. It provides intelligent content selection, spaced repetition scheduling (SRS), and experience point (XP) tracking. This is a **service layer** (not middleware) that is called by domain services (`LearnService`, `ProgressService`) to handle adaptive learning logic.

### Key Principles
- **Service Layer Architecture**: Called by domain services, not directly handling HTTP requests
- **Pure Algorithm Functions**: Core algorithms (SM-2, selection policies) have no NestJS/Prisma dependencies
- **Single Source of Truth**: SRS state stored in `UserQuestionPerformance` (no duplicate tables)
- **Type Safety**: Strict TypeScript, no `any` types

---

## 📁 Structure

```
src/engine/
├── engine.module.ts          (23 lines) - Main NestJS module
├── index.ts                  (10 lines) - Barrel exports
├── types.ts                  (11 lines) - Shared types
├── content-delivery/
│   ├── content-delivery.service.ts  (357 lines) - Main content selection service
│   ├── selection.policy.ts          (109 lines) - Pure selection algorithms
│   └── types.ts                     (49 lines) - Content delivery types
├── srs/
│   ├── srs.service.ts        (83 lines) - SRS state calculation service
│   ├── algo.sm2.ts           (145 lines) - Pure SM-2 algorithm implementation
│   ├── algo.sm2.spec.ts      (132 lines) - SM-2 unit tests (16 tests, all passing)
│   └── types.ts              (16 lines) - SRS types
└── scoring/
    └── xp.service.ts         (151 lines) - XP award and tracking service
```

**Total:** 11 files, ~1,086 lines of code

---

## 🧩 Components

### 1. Content Delivery Service (`content-delivery/`)

**Purpose:** Selects what content to show next to the user

**Key Methods:**
- `getNextItem(userId, opts?)` - Returns next item to deliver (question/teaching/lesson)
- `getDashboardPlan(userId)` - Returns dashboard statistics (due reviews, new items, estimated time)

**Selection Algorithm:**
1. **Prioritize due reviews** (items with `nextReviewDue <= now`)
2. **If no due reviews**, select "new" items not yet seen
3. **"mixed" mode** = 70% review / 30% new (if both available)

**Selection Policy Functions** (pure, no dependencies):
- `rankCandidates()` - Ranks candidates by priority score
- `mixReviewAndNew()` - Mixes review and new items by ratio
- `pickOne()` - Selects single best candidate
- `selectDeliveryMethod()` - Chooses delivery method based on user preferences

**Scoring Factors:**
- **Due-ness**: Higher score = more overdue
- **Recent errors**: More errors = higher priority
- **Time since last seen**: Longer = higher priority for reviews

**Data Sources:**
- Questions: `UserQuestionPerformance` (latest row per question)
- No separate SRS table needed (state stored in performance rows)

---

### 2. SRS Service (`srs/`)

**Purpose:** Manages spaced repetition scheduling using SM-2 algorithm

**Key Methods:**
- `calculateQuestionState(userId, questionId, result)` - Calculates new SRS state after attempt

**SM-2 Algorithm** (`algo.sm2.ts`):
- Pure implementation (no NestJS/Prisma dependencies)
- **Ease Factor (EF)**: Starts at 2.5, adjusts based on performance
- **Interval**: Days until next review
- **Repetitions**: Number of successful consecutive reviews

**Quality Score Mapping:**
- Score 0-100 → Quality 0-5
- Correct/incorrect → Quality 0-5 (with time-based refinement)

**State Storage:**
- Stored in `UserQuestionPerformance` row:
  - `intervalDays` - Current interval
  - `easeFactor` - Current ease factor
  - `repetitions` - Current repetition count
  - `nextReviewDue` - Calculated next due date

**Testing:**
- ✅ 16 unit tests in `algo.sm2.spec.ts`
- ✅ All tests passing
- ✅ Covers: initial state, quality mapping, SM-2 calculations, edge cases

---

### 3. XP Service (`scoring/`)

**Purpose:** Manages XP awards and tracking

**Key Methods:**
- `award(userId, event)` - Awards XP for an event, returns amount awarded
- `getXpSummary(userId, rangeDays?)` - Returns daily XP totals for date range

**XP Calculation:**
- Base: 5 XP for attempting
- Correct answer: +10 XP
- Speed bonus: +1-5 XP (faster = more XP)
  - < 5 seconds: +5 XP
  - < 10 seconds: +3 XP
  - < 20 seconds: +1 XP

**Storage:**
- `XpEvent` table: Event-based storage (append-only)
- `User.knowledgePoints`: Total XP (denormalized for quick access)

**Event Types:**
- `attempt` - Question attempt

---

## 🔌 Integration Points

### Used By:

1. **LearnService** (`src/learn/learn.service.ts`)
   - Calls `ContentDeliveryService.getNextItem()` in `getNext()` method
   - Replaces old manual selection logic

2. **ProgressService** (`src/progress/progress.service.ts`)
   - Calls `SrsService.calculateQuestionState()` in `recordQuestionAttempt()`
   - Calls `XpService.award()` after recording attempt
   - Stores SRS state directly in `UserQuestionPerformance` row

### Module Registration:

- **EngineModule** imported in:
  - `AppModule` (root)
  - `LearnModule`
  - `ProgressModule`

---

## 📈 Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 11 |
| **Total Lines** | ~1,086 |
| **Services** | 3 (ContentDelivery, SRS, XP) |
| **Pure Functions** | 7 (selection policies, SM-2) |
| **Type Definitions** | 8 interfaces/types |
| **Unit Tests** | 1 test file, 16 tests (all passing) |
| **Test Coverage** | SM-2 algorithm fully tested |

### File Size Breakdown:

| File | Lines | Purpose |
|------|-------|---------|
| `content-delivery.service.ts` | 357 | Main content selection logic |
| `xp.service.ts` | 151 | XP tracking and awards |
| `algo.sm2.ts` | 145 | SM-2 algorithm implementation |
| `algo.sm2.spec.ts` | 132 | SM-2 unit tests |
| `selection.policy.ts` | 109 | Pure selection algorithms |
| `srs.service.ts` | 83 | SRS state calculation |
| `content-delivery/types.ts` | 49 | Content delivery DTOs |
| `engine.module.ts` | 23 | NestJS module definition |
| `srs/types.ts` | 16 | SRS types |
| `types.ts` | 11 | Shared types |
| `index.ts` | 10 | Barrel exports |

---

## 🏗️ Architecture

### Layer Separation:

```
┌─────────────────────────────────────┐
│   Controllers (HTTP Layer)          │
│   - LearnController                 │
│   - ProgressController               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Domain Services                    │
│   - LearnService                     │
│   - ProgressService                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Engine Module (Service Layer)      │
│   - ContentDeliveryService           │
│   - SrsService                       │
│   - XpService                        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Pure Algorithms                    │
│   - SM-2 (algo.sm2.ts)              │
│   - Selection Policies               │
└─────────────────────────────────────┘
```

### Data Flow:

1. **Content Selection:**
   ```
   User → LearnController → LearnService → ContentDeliveryService
   → Selection Policies → Database → NextDeliveryItemDto
   ```

2. **Attempt Recording:**
   ```
   User → ProgressController → ProgressService
   → SrsService.calculateQuestionState() → SM-2 Algorithm
   → XpService.award() → Database (UserQuestionPerformance + XpEvent)
   ```

---

## ✅ Testing

### Current Test Coverage:

- ✅ **SM-2 Algorithm** (`algo.sm2.spec.ts`)
  - 16 tests covering:
    - Initial state
    - Score to quality mapping
    - Correct/incorrect to quality mapping
    - SM-2 calculations (perfect, good, acceptable, poor responses)
    - Interval progression
    - Ease factor adjustments
    - Edge cases

### Test Results:
```
Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Time:        ~0.3s
```

### Missing Tests:
- ⚠️ ContentDeliveryService (no unit tests)
- ⚠️ XpService (no unit tests)
- ⚠️ Selection policies (no unit tests)
- ✅ E2E tests exist for `/learn/next` endpoint (verifies 401 without auth)

---

## 🔍 Code Quality

### Strengths:
- ✅ **Type Safety**: No `any` types, strict TypeScript
- ✅ **Separation of Concerns**: Pure algorithms separated from services
- ✅ **Documentation**: All services have clear JSDoc comments
- ✅ **Single Responsibility**: Each service has a focused purpose
- ✅ **No Duplication**: SRS state stored once in `UserQuestionPerformance`

### Areas for Improvement:
- ⚠️ **Test Coverage**: Only SM-2 algorithm has unit tests
- ⚠️ **Error Handling**: Could add more specific error types
- ⚠️ **Performance**: Some queries could be optimized (e.g., batch operations)

---

## 📝 Key Design Decisions

1. **No Separate SRS Table**: SRS state stored in `UserQuestionPerformance` to avoid duplication
2. **Pure Algorithm Functions**: SM-2 and selection policies have no dependencies for testability
3. **Event-Based XP**: XP stored as events for historical analysis, not just totals
4. **Service Layer**: Engine is called by domain services, not directly by controllers
5. **70/30 Mix**: Default mixed mode uses 70% reviews, 30% new content

---

## 🚀 Future Enhancements

### Potential Additions:
1. **Streak Service**: Track daily learning streaks (partially implemented in requirements)
2. **Adaptive Difficulty**: Adjust question difficulty based on performance
3. **Learning Paths**: Suggest personalized learning sequences
4. **Performance Analytics**: More detailed progress tracking and insights
5. **A/B Testing**: Test different selection algorithms

### Testing Improvements:
1. Add unit tests for `ContentDeliveryService`
2. Add unit tests for `XpService`
3. Add unit tests for selection policies
4. Add integration tests for full engine workflow

---

## 📚 Dependencies

### Internal:
- `PrismaService` - Database access
- `@nestjs/common` - NestJS decorators

### External:
- `@prisma/client` - Type definitions

### No Dependencies (Pure Functions):
- `algo.sm2.ts` - Pure SM-2 implementation
- `selection.policy.ts` - Pure selection algorithms

---

## 🎯 Summary

The Engine module is a well-structured, type-safe service layer that provides:
- ✅ Intelligent content selection (reviews vs new)
- ✅ Spaced repetition scheduling (SM-2 algorithm)
- ✅ XP tracking and awards
- ✅ Clean separation of concerns
- ✅ Testable pure algorithm functions

**Status:** ✅ Production-ready (with room for additional test coverage)

**Total Implementation:** ~1,086 lines across 11 files
**Test Coverage:** SM-2 algorithm fully tested (16/16 tests passing)
**Integration:** Fully integrated with Learn and Progress modules
