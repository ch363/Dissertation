# Fluentia Learning System - Comprehensive Deep Dive Report

**Generated:** 2025-01-01  
**Scope:** Complete analysis of all learning functionality, algorithms, flows, and integrations  
**Status:** Production-ready system with sophisticated adaptive learning capabilities

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Complete Learning Flows](#complete-learning-flows)
4. [Core Learning Algorithms](#core-learning-algorithms)
5. [Content Delivery System](#content-delivery-system)
6. [Progress Tracking & Analytics](#progress-tracking--analytics)
7. [Mobile Application Implementation](#mobile-application-implementation)
8. [Data Models & Database Schema](#data-models--database-schema)
9. [API Endpoints & Integration](#api-endpoints--integration)
10. [Key Features & Capabilities](#key-features--capabilities)
11. [Technical Implementation Details](#technical-implementation-details)

---

## Executive Summary

Fluentia is a sophisticated language learning platform that implements multiple advanced learning algorithms and adaptive systems:

### Core Technologies
- **FSRS (Free Spaced Repetition Scheduler)**: Optimal review scheduling with user-specific parameter optimization
- **BKT (Bayesian Knowledge Tracing)**: Skill mastery probability tracking
- **Adaptive Content Delivery**: Teach-then-test patterns with interleaving and modality selection
- **Multi-Modal Learning**: 6 delivery methods (Fill Blank, Flashcard, Multiple Choice, Speech-to-Text, Text-to-Speech, Text Translation)
- **XP & Gamification**: Experience points with speed bonuses and achievement tracking
- **Skill-Based Prioritization**: Content selection based on low mastery skills

### Key Metrics
- **6 Delivery Methods**: Comprehensive learning modalities
- **17 FSRS Parameters**: Optimized spaced repetition scheduling
- **4 BKT Parameters**: Bayesian skill mastery tracking
- **3 Session Modes**: Learn, Review, Mixed
- **CEFR Levels**: A1-C2 knowledge level progression

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│  (React Native + Expo)                                       │
│  - SessionRunnerScreen                                       │
│  - SessionRunner Component                                   │
│  - Card Renderers (6 types)                                 │
│  - Audio/Speech Recognition                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/REST + JWT Auth
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Backend API (NestJS)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Engine Module (Learning Brain)                      │   │
│  │  - ContentDeliveryService                            │   │
│  │  - SessionPlanService                                │   │
│  │  - SrsService (FSRS)                                 │   │
│  │  - MasteryService (BKT)                              │   │
│  │  - XpService                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Progress Module                                      │   │
│  │  - ProgressService                                   │   │
│  │  - Question validation & recording                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Learn Module                                        │   │
│  │  - LearnService                                     │   │
│  │  - Session plan orchestration                       │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Prisma ORM
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              PostgreSQL Database                             │
│  - Content: Module → Lesson → Teaching → Question          │
│  - Progress: UserLesson, UserTeachingCompleted,            │
│              UserQuestionPerformance                        │
│  - Learning: UserSkillMastery, XpEvent,                    │
│              UserKnowledgeLevelProgress                     │
└─────────────────────────────────────────────────────────────┘
```

### Module Organization

**Backend Structure:**
```
backend/src/
├── engine/                    # Learning algorithms & orchestration
│   ├── content-delivery/     # Content selection & session planning
│   ├── srs/                  # FSRS spaced repetition
│   ├── mastery/              # BKT skill mastery
│   └── scoring/              # XP calculation
├── progress/                 # Progress tracking service
├── learn/                    # Learning orchestration API
├── content/                  # Content lookup & management
└── prisma/                   # Database access
```

**Mobile Structure:**
```
mobile/src/
├── features/session/          # Session execution
│   ├── screens/              # SessionRunnerScreen
│   ├── components/           # SessionRunner, CardRenderers
│   └── hooks/                 # useSessionAudio
├── services/
│   ├── api/                  # Backend API clients
│   ├── speech-recognition/   # Audio recording & validation
│   ├── tts/                  # Text-to-speech
│   └── sounds/               # Audio feedback
└── types/                    # TypeScript definitions
```

---

## Complete Learning Flows

### Flow 1: Session Initiation & Plan Generation

**Entry Points:**
1. **Lesson Start Screen** → User selects lesson → Navigates to SessionRunnerScreen
2. **Course Run Screen** → Maps course to first lesson → Delegates to SessionRunnerScreen
3. **Review Mode** → Direct review session → SessionRunnerScreen

**Backend Flow: `SessionPlanService.createPlan()`**

```
1. Time Budget Calculation
   ├─→ Get user's average times per item type
   ├─→ Calculate target item count (default: 15 items)
   └─→ Adaptive estimation based on historical performance

2. Progress Filtering
   ├─→ Query UserTeachingCompleted → seenTeachingIds
   └─→ Filter out already-completed teachings (global, not lesson-specific)

3. Mastery-Based Prioritization
   ├─→ Query MasteryService.getLowMasterySkills(userId, 0.5)
   └─→ Get skills with mastery < 0.5 for prioritization

4. Candidate Gathering
   ├─→ getReviewCandidates() → Due reviews (nextReviewDue <= now)
   ├─→ getNewCandidates() → Unattempted questions (prioritized by skills)
   └─→ getTeachingCandidates() → Teachings for new questions (filtered by seenTeachingIds)

5. Mode-Based Selection
   ├─→ Review Mode: Only review candidates
   ├─→ Learn Mode: Prioritize new, fill with reviews if needed
   └─→ Mixed Mode: 70% reviews, 30% new

6. Teach-Then-Test Application
   ├─→ planTeachThenTest() → Pair teachings with their questions
   ├─→ Group teach-test pairs together
   └─→ Preserve pairs during interleaving

7. Interleaving & Modality Selection
   ├─→ composeWithInterleaving() → Prevent same-type fatigue
   ├─→ selectModality() → Choose delivery method based on user preferences
   └─→ mixByDeliveryMethod() → Ensure variety

8. Step Building
   ├─→ Create SessionStep[] with ordered items
   ├─→ Add metadata (estimated time, item counts)
   └─→ Return SessionPlanDto
```

**Frontend Flow: `SessionRunnerScreen`**

```
1. Session ID Generation
   └─→ makeSessionId('learn' | 'review')

2. Session Plan Fetching
   ├─→ Check cache (5-minute TTL)
   ├─→ GET /learn/session-plan?mode=learn&lessonId=xxx
   └─→ Transform backend plan (steps) → frontend plan (cards)

3. Plan Transformation
   ├─→ transformSessionPlan() → Convert steps to cards
   ├─→ Map delivery methods to card kinds
   └─→ Create Card[] array with proper types

4. Session Initialization
   ├─→ Preload audio sounds (success/error)
   ├─→ Warm up TTS engine
   └─→ Initialize SessionRunner component
```

### Flow 2: Question Answering & Validation

**Frontend: `SessionRunner.handleCheckAnswer()`**

```
1. Extract Question ID
   └─→ Parse cardId: "question-${questionId}"

2. Determine Delivery Method
   └─→ Map CardKind → DELIVERY_METHOD

3. Special Case: Pronunciation (TEXT_TO_SPEECH)
   ├─→ Get audio recording URI
   ├─→ Convert to base64 via SpeechRecognition.getAudioFile()
   ├─→ POST /progress/questions/:id/validate-pronunciation
   ├─→ Backend calls Google Cloud Speech API
   └─→ Returns: { isCorrect, score, transcription, wordAnalysis }

4. Regular Validation
   ├─→ POST /progress/questions/:id/validate
   ├─→ Backend validates based on delivery method:
   │   ├─→ FILL_BLANK: Check blankIndices against acceptedAnswers
   │   ├─→ MULTIPLE_CHOICE: Check correctIndices
   │   ├─→ TEXT_TRANSLATION: Fuzzy match against acceptedAnswers
   │   └─→ SPEECH_TO_TEXT: Text matching
   └─→ Returns: { isCorrect, score, feedback? }

5. Immediate Feedback
   ├─→ Play sound (success/error)
   ├─→ Haptic feedback (light/medium)
   └─→ Display result on card

6. Record Attempt
   ├─→ Check recordedAttempts Set (prevent duplicates)
   ├─→ POST /progress/questions/:id/attempt
   └─→ Update delivery method score
```

**Backend: `ProgressService.recordQuestionAttempt()`**

```
1. Question Validation & Loading
   ├─→ Verify question exists
   └─→ Load with relations:
       ├─→ Teaching (with lesson, skillTags)
       └─→ Question skillTags

2. Correctness Determination
   └─→ isCorrect = attemptDto.score >= 80

3. FSRS State Calculation
   ├─→ SrsService.calculateQuestionState()
   ├─→ Get previous state from latest UserQuestionPerformance
   ├─→ Convert score to FSRS grade (0-5)
   ├─→ Calculate new state:
   │   ├─→ stability: Memory strength
   │   ├─→ difficulty: Material complexity
   │   ├─→ repetitions: Success count
   │   ├─→ nextReviewDue: Next review date
   │   └─→ intervalDays: Days until next review
   └─→ Use optimized FSRS parameters (user-specific or defaults)

4. Performance Record Creation
   ├─→ Create append-only UserQuestionPerformance record
   ├─→ Store: score, time, attempts, SRS state
   └─→ Immutable: Never updated, always inserted

5. BKT Mastery Update
   ├─→ Extract skill tags using extractSkillTags(question)
   ├─→ For each skill tag:
   │   ├─→ MasteryService.updateMastery(userId, skillTag, isCorrect)
   │   ├─→ Update mastery probability using BKT formulas
   │   └─→ Check if mastery < 0.5 (log for monitoring)
   └─→ Skills extracted from:
       ├─→ Teaching.skillTags (database relation)
       ├─→ Question.skillTags (database relation)
       └─→ Heuristic extraction (teaching.tip, lesson.title)

6. XP Award
   ├─→ XpService.award(userId, event)
   ├─→ Calculate XP:
   │   ├─→ Base: 5 XP for attempting
   │   ├─→ Correct: +10 XP
   │   └─→ Speed bonus: +5 (< 5s), +3 (< 10s), +1 (< 20s)
   ├─→ Record XpEvent (append-only log)
   └─→ Update User.knowledgePoints (incremental)

7. Knowledge Level Progress
   └─→ Record UserKnowledgeLevelProgress if XP > 0

8. Return Response
   └─→ { ...performance, awardedXp }
```

### Flow 3: Teaching Completion

**Frontend: `SessionRunner.handleNext()` (for Teach cards)**

```
1. Detect Teach Card
   └─→ currentCard.kind === CardKind.Teach

2. Extract Teaching ID
   └─→ Parse cardId: "teach-${teachingId}"

3. Complete Teaching
   ├─→ POST /progress/teachings/:id/complete
   └─→ Backend marks teaching as completed (idempotent)

4. Create Attempt Log
   └─→ { cardId, attemptNumber: 1, answer: 'viewed', isCorrect: true }
```

**Backend: `ProgressService.completeTeaching()`**

```
1. Transaction Start
   └─→ Prisma transaction for atomicity

2. Get Teaching
   ├─→ Verify teaching exists
   └─→ Get lessonId for UserLesson update

3. Create UserTeachingCompleted
   ├─→ Try create (will fail if exists due to composite PK)
   └─→ Track wasNewlyCompleted flag

4. Update UserLesson
   ├─→ If newly completed:
   │   └─→ Increment UserLesson.completedTeachings
   └─→ Idempotent: Safe to call multiple times

5. Return Result
   └─→ { userLesson, wasNewlyCompleted }
```

### Flow 4: Session Completion

**Frontend: `SessionRunner.handleNext()` (last card)**

```
1. Detect Last Card
   └─→ isLast = index >= total - 1

2. Calculate Session Stats
   ├─→ Total XP: Sum of calculateXpForAttempt() for all attempts
   └─→ Teachings Mastered: Count of Teach cards

3. Navigate to Completion Screen
   ├─→ router.replace(sessionCompletion)
   └─→ Pass params: { kind, lessonId, totalXp, teachingsMastered }
```

---

## Core Learning Algorithms

### Algorithm 1: FSRS (Free Spaced Repetition Scheduler)

**Location:** `backend/src/engine/srs/algo.fsrs.ts`  
**Service:** `SrsService.calculateQuestionState()`

**Purpose:** Optimal scheduling of reviews based on memory retention curves

**Key Concepts:**
- **Stability (S)**: Memory strength, duration until retention drops to 90%
- **Difficulty (D)**: Inherent complexity of the material
- **Retrievability (R)**: Current probability of recall
- **Grade (0-5)**: Quality of recall (converted from score 0-100)

**Algorithm Flow:**

**First Review:**
```
1. Initialize stability:
   S₀(G) = w₀ · (w₁ · (G - 1) + 1)

2. Initialize difficulty:
   D₀(G) = w₂ · (w₃ · (G - 4) + 1)

3. Set repetitions:
   repetitions = 1 if grade >= 3, else 0
```

**Subsequent Reviews:**
```
1. Calculate elapsed time:
   elapsedDays = (now - lastReview) / (24 * 60 * 60)

2. Calculate retrievability:
   R = e^(-elapsedDays / S)

3. Update difficulty:
   D' = w₅ · D₀(3) + (1 - w₅) · (D + w₄ · (G - 3))

4. Update stability:
   If grade >= 3 (success):
     S' = S · (1 + e^w₆ · (D')^w₇ · S^w₈ · (e^((1-R)·w₉) - 1))
   Else (failure):
     S' = w₁₀ · (D')^w₁₁ · S^w₁₂

5. Calculate next interval:
   intervalDays = S · ln(0.9) / ln(R_target)
   (R_target = 0.9 for 90% retention target)

6. Calculate next due date:
   nextDue = now + intervalDays
```

**Grade Conversion (Score → Grade):**
```
Score 100 → Grade 5: Perfect
Score 90-99 → Grade 4: Correct with hesitation
Score 80-89 → Grade 3: Correct with difficulty
Score 60-79 → Grade 2: Incorrect, correct remembered
Score 40-59 → Grade 1: Incorrect, familiar
Score < 40 → Grade 0: Complete blackout
```

**Parameter Optimization:**
- **Location:** `backend/src/engine/srs/fsrs-optimizer.ts`
- Uses historical review data to optimize 17 FSRS parameters per user
- Falls back to `DEFAULT_FSRS_PARAMETERS` if insufficient data
- Optimizes for retention rate and review efficiency

**Storage:**
- `UserQuestionPerformance.stability`: Float
- `UserQuestionPerformance.difficulty`: Float
- `UserQuestionPerformance.repetitions`: Int
- `UserQuestionPerformance.nextReviewDue`: DateTime
- `UserQuestionPerformance.intervalDays`: Int

**Status:** ✅ Fully implemented with user-specific optimization

---

### Algorithm 2: BKT (Bayesian Knowledge Tracing)

**Location:** `backend/src/engine/mastery/mastery.service.ts`

**Purpose:** Track probability that user knows each skill

**Key Parameters:**
- **Prior (P(L₀))**: Initial probability of knowing skill (default: 0.3)
- **Learn (P(T))**: Probability of learning after practice (default: 0.2)
- **Guess (P(G))**: Probability of correct answer when not known (default: 0.2)
- **Slip (P(S))**: Probability of incorrect answer when known (default: 0.1)

**Update Formulas:**

**If Correct Answer:**
```
1. P(L|correct) = (P(L) · (1 - P(S))) / (P(L) · (1 - P(S)) + (1 - P(L)) · P(G))

2. P(L|next) = P(L|correct) + (1 - P(L|correct)) · P(T)
```

**If Incorrect Answer:**
```
1. P(L|incorrect) = (P(L) · P(S)) / (P(L) · P(S) + (1 - P(L)) · (1 - P(G)))

2. P(L|next) = P(L|incorrect)
```

**Integration:**
- Called in `ProgressService.recordQuestionAttempt()` after performance record creation
- Extracts skill tags from question/teaching using `extractSkillTags()`
- Updates mastery for each skill tag independently
- Logs when mastery drops below 0.5 for monitoring

**Prioritization:**
- `SessionPlanService` queries low mastery skills (< 0.5) via `getLowMasterySkills()`
- Passes to `getNewCandidates()` as `prioritizedSkills`
- `rankCandidates()` adds +500 priority boost for matching skills
- Ensures 'New' teachings for weak skills are prioritized in session plans

**Storage:**
- `UserSkillMastery` table:
  - `masteryProbability`: Current probability (0.0-1.0)
  - `prior`, `learn`, `guess`, `slip`: BKT parameters
  - Unique constraint: `(userId, skillTag)`

**Status:** ✅ Fully implemented and integrated

---

### Algorithm 3: Skill Tag Extraction

**Location:** `backend/src/engine/mastery/skill-extraction.util.ts`

**Methods:**

1. **Database Relations (Primary):**
   - Extract from `teaching.skillTags` relation if loaded
   - Extract from `question.skillTags` relation if loaded

2. **Heuristic Extraction (Fallback):**
   - From `teaching.tip`: Keywords (greetings, numbers, verbs, articles, etc.)
   - From `lesson.title`: First 2-3 meaningful words

**Usage:**
- `ProgressService`: Extracts skills when recording attempts
- `SessionPlanService`: Extracts skills for candidate metadata

**Status:** ✅ Implemented with fallback logic

---

### Algorithm 4: XP Calculation

**Location:** `backend/src/engine/scoring/xp.service.ts`

**Formula:**
```
Base XP = 5 (for attempting)
+ 10 (if correct)
+ Speed Bonus:
  + 5 if time < 5s
  + 3 if time < 10s
  + 1 if time < 20s
```

**Storage:**
- `XpEvent`: Append-only log of all XP awards
  - Fields: `userId`, `amount`, `reason`, `occurredAt`
- `User.knowledgePoints`: Incremental total (updated atomically)

**Status:** ✅ Fully implemented

---

### Algorithm 5: Content Delivery Prioritization

**Location:** `backend/src/engine/content-delivery/selection.policy.ts`

**Priority Score Calculation:**

**For Due Reviews:**
```
priorityScore = 1000 + dueScore + (errorScore * 10)
```
- `dueScore`: Hours overdue (higher = more overdue)
- `errorScore`: Count of recent errors (last 5 attempts with score < 80)

**For New Items:**
```
basePriority = (errorScore * 5) + (timeSinceLastSeen / 1000)
if (hasPrioritizedSkill):
  priorityScore = basePriority + 500
else:
  priorityScore = basePriority
```
- `prioritizedSkill`: Skill tag with mastery < 0.5
- Boost ensures weak skills are prioritized

**Status:** ✅ Implemented with mastery-based boost

---

## Content Delivery System

### Session Plan Generation

**Service:** `SessionPlanService.createPlan()`

**Key Features:**
1. **Time-Based Pacing**: Adaptive item count from time budget
2. **Progress Filtering**: Excludes already-completed teachings
3. **Mastery Prioritization**: Boosts content for low-mastery skills
4. **Teach-Then-Test**: Pairs teachings with their questions
5. **Interleaving**: Prevents same-type fatigue (max 2 in a row)
6. **Modality Selection**: Chooses delivery method based on user preferences

**Session Modes:**

**Learn Mode:**
- Prioritizes new content
- Applies teach-then-test for new questions
- Fills with reviews if not enough new content
- Preserves teach-test pairs during interleaving

**Review Mode:**
- Only due reviews (nextReviewDue <= now)
- Applies interleaving for variety
- No teachings (only practice)

**Mixed Mode:**
- 70% reviews, 30% new
- Applies teach-then-test for new content
- Interleaves reviews with teach-test pairs

**Step Types:**
1. **Teach Step**: Display teaching content
2. **Practice Step**: Question with selected delivery method
3. **Recap Step**: Summary at end of session

---

## Progress Tracking & Analytics

### Progress Models

**UserLesson:**
- Tracks lesson engagement
- `completedTeachings`: Count of completed teachings
- Created/updated when lesson is started

**UserTeachingCompleted:**
- Immutable markers for completed teachings
- Composite PK: `(userId, teachingId)`
- Used to filter out seen content

**UserQuestionPerformance:**
- Append-only log of all question attempts
- Stores:
  - Score, time, attempts, percentage accuracy
  - FSRS state: stability, difficulty, repetitions, nextReviewDue, intervalDays
  - Timestamps: createdAt, lastRevisedAt

**UserSkillMastery:**
- BKT mastery probability per skill
- Stores BKT parameters: prior, learn, guess, slip
- Updated after each question attempt

**XpEvent:**
- Append-only log of XP awards
- Enables historical analysis and daily summaries

**UserKnowledgeLevelProgress:**
- Append-only log of XP gains
- Tracks progression over time

**UserDeliveryMethodScore:**
- Adaptive preference scores per delivery method
- Updated based on performance (delta: +0.1 correct, -0.05 incorrect)
- Used for modality selection in session plans

---

## Mobile Application Implementation

### Session Execution

**Component:** `SessionRunner.tsx`

**State Management:**
- `index`: Current card position
- `attempts`: Array of `AttemptLog` records
- `recordedAttempts`: Set of question IDs (prevents duplicate API calls)
- `cardStartTime`: Timestamp for time tracking
- Card-specific state: `selectedOptionId`, `userAnswer`, `flashcardRating`, etc.

**Card Types:**

1. **Teach Cards** (`CardKind.Teach`)
   - Display teaching content (phrase, translation, audio, tip, emoji)
   - No validation required
   - Auto-advance on completion
   - Calls `completeTeaching()` when shown

2. **Practice Cards:**
   - **Multiple Choice**: Option selection → validation
   - **Fill Blank**: Answer selection → immediate validation
   - **Translation (Type)**: Text input → validation
   - **Translation (Flashcard)**: Rating-based (0, 2.5, 5) → no validation
   - **Listening**: Text input → validation
   - **Speaking**: Audio recording → pronunciation validation

**Answer Validation Flow:**

```
User Input
  ↓
handleCheckAnswer()
  ↓
Extract questionId, deliveryMethod
  ↓
Special Case: Pronunciation?
  ├─→ Yes: Convert audio to base64 → validatePronunciation()
  └─→ No: validateAnswer()
  ↓
Backend Validation
  ↓
Display Result + Play Sound/Haptic
  ↓
Record Attempt (once per card)
  ├─→ recordQuestionAttempt()
  └─→ updateDeliveryMethodScore()
```

**Audio & Speech Recognition:**

**Location:** `mobile/src/services/speech-recognition/index.ts`

**Features:**
- Audio format conversion (m4a, flac, wav)
- Base64 encoding for backend API

**Pronunciation Validation:**
- Records audio → converts to base64
- POST `/progress/questions/:id/validate-pronunciation`
- Backend calls Google Cloud Speech API
- Returns: `{ isCorrect, score, transcription, overallScore, wordAnalysis }`

**Text-to-Speech:**

**Location:** `mobile/src/services/tts/index.ts`

**Features:**
- Uses device TTS engine
- Preloads on session start (warmup)
- Configurable language and rate
- Plays teaching audio for pronunciation practice

**Audio Feedback:**

**Location:** `mobile/src/services/sounds/index.ts`

**Features:**
- Success/error sounds preloaded on session start
- Volume set to 0.3 to prevent harsh sounds
- Plays on answer validation
- Non-blocking (catches errors gracefully)

---

## Data Models & Database Schema

### Content Hierarchy

```
Module (1) ──< (many) Lesson
Lesson (1) ──< (many) Teaching
Teaching (1) ──< (many) Question
Question (many) ──< (many) SkillTag
Teaching (many) ──< (many) SkillTag
```

**Module:**
- Top-level learning units
- Fields: `id`, `title`, `description`, `imageUrl`

**Lesson:**
- Individual lessons within modules
- Fields: `id`, `title`, `description`, `imageUrl`, `numberOfItems`, `moduleId`

**Teaching:**
- Learning content items
- Fields: `id`, `knowledgeLevel` (A1-C2), `userLanguageString`, `learningLanguageString`, `tip`, `emoji`, `lessonId`
- Relations: `skillTags[]`, `questions[]`

**Question:**
- Practice questions linked to teachings
- Fields: `id`, `type` (DELIVERY_METHOD), `teachingId`
- One-to-one relations:
  - `QuestionFillBlank`: `blankIndices`, `acceptedAnswers`
  - `QuestionMultipleChoice`: `options`, `correctIndices`
  - `QuestionSpeechToText`: `acceptedAnswers`
  - `QuestionTextTranslation`: `acceptedAnswers`
  - `QuestionFlashcard`: (no additional fields)
  - `QuestionTextToSpeech`: (no additional fields)

### Progress Models

**User:**
- User account with progress tracking
- Fields: `id` (matches Supabase auth.users.id), `name`, `avatarUrl`, `knowledgePoints`, `knowledgeLevel`, `preferredDeliveryMethod`

**UserLesson:**
- Tracks lesson engagement
- Composite PK: `(userId, lessonId)`
- Fields: `completedTeachings`, `createdAt`, `updatedAt`

**UserTeachingCompleted:**
- Immutable markers for completed teachings
- Composite PK: `(userId, teachingId)`
- Fields: `createdAt`

**UserQuestionPerformance:**
- Append-only log of question attempts
- Fields:
  - `id`, `userId`, `questionId`
  - `score`, `timeToComplete`, `percentageAccuracy`, `attempts`
  - `lastRevisedAt`, `nextReviewDue`, `intervalDays`
  - `easeFactor` (backward compatibility)
  - `stability`, `difficulty`, `repetitions` (FSRS state)
  - `createdAt`

**UserSkillMastery:**
- BKT mastery probability per skill
- Composite PK: `(userId, skillTag)`
- Fields: `masteryProbability`, `prior`, `learn`, `guess`, `slip`, `updatedAt`

**XpEvent:**
- Append-only log of XP awards
- Fields: `id`, `userId`, `amount`, `reason`, `occurredAt`

**UserKnowledgeLevelProgress:**
- Append-only log of XP gains
- Fields: `id`, `userId`, `value`, `occurredAt`

**UserDeliveryMethodScore:**
- Adaptive preference scores per delivery method
- Composite PK: `(userId, deliveryMethod)`
- Fields: `score`, `updatedAt`

---

## API Endpoints & Integration

### Learning Orchestration

**GET `/learn/session-plan`**
- Parameters: `mode` (learn|review|mixed), `lessonId?`, `timeBudgetSec?`
- Returns: `SessionPlanDto` with ordered steps
- Flow: `LearnService.getSessionPlan()` → `ContentDeliveryService.getSessionPlan()` → `SessionPlanService.createPlan()`

**GET `/learn/next`** (Deprecated)
- Parameters: `lessonId`
- Returns: Next item in lesson (reviews → new → done)
- Maintained for backward compatibility

**GET `/learn/suggestions`**
- Parameters: `currentLessonId?`, `moduleId?`, `limit?`
- Returns: Suggested lessons and modules based on progress and knowledge level

### Progress Tracking

**POST `/progress/lessons/:lessonId/start`**
- Creates/updates `UserLesson` (idempotent)
- Returns: `UserLesson` with lesson details

**GET `/progress/lessons`**
- Returns: User's started lessons with progress

**POST `/progress/teachings/:teachingId/complete`**
- Marks teaching as completed (idempotent)
- Increments `UserLesson.completedTeachings`
- Returns: `{ userLesson, wasNewlyCompleted }`

**POST `/progress/questions/:questionId/validate`**
- Validates answer based on delivery method
- Returns: `{ isCorrect, score, feedback? }`
- Does NOT record attempt (separate endpoint)

**POST `/progress/questions/:questionId/validate-pronunciation`**
- Validates pronunciation via Google Cloud Speech API
- Body: `{ audioBase64, audioFormat }`
- Returns: `{ isCorrect, score, transcription, overallScore, wordAnalysis }`

**POST `/progress/questions/:questionId/attempt`**
- Records question attempt (append-only)
- Triggers:
  - FSRS state calculation
  - BKT mastery update
  - XP award
  - Knowledge level progress recording
- Returns: `{ ...performance, awardedXp }`

**GET `/progress/reviews/due`**
- Returns: All due reviews (nextReviewDue <= now)

**GET `/progress/reviews/due/latest`**
- Returns: Deduped due reviews (latest per question)

**POST `/progress/delivery-method/:method/score`**
- Updates delivery method preference score
- Body: `{ delta }` (e.g., +0.1 for correct, -0.05 for incorrect)

**POST `/progress/knowledge-level-progress`**
- Records XP progression (append-only log)
- Body: `{ value }` (XP amount)

---

## Key Features & Capabilities

### 1. Adaptive Learning

- **Mastery-Based Prioritization**: Content selection based on skill mastery
- **User-Specific FSRS Parameters**: Optimized spaced repetition per user
- **Delivery Method Preferences**: Adaptive modality selection
- **Time-Based Pacing**: Adaptive item count from time budget

### 2. Multi-Modal Learning

- **6 Delivery Methods**: Comprehensive learning modalities
- **Teach-Then-Test**: Structured learning pattern
- **Interleaving**: Prevents same-type fatigue
- **Modality Selection**: Based on user preferences and performance

### 3. Progress Tracking

- **Append-Only Logs**: Immutable history for analytics
- **Real-Time Updates**: Immediate progress recording
- **Comprehensive Metrics**: Score, time, attempts, mastery, XP

### 4. Gamification

- **XP System**: Experience points with speed bonuses
- **Knowledge Level Progression**: CEFR levels (A1-C2)
- **Achievement Tracking**: Historical XP events

### 5. Audio & Speech

- **Text-to-Speech**: Pronunciation practice
- **Speech Recognition**: Audio recording and validation
- **Pronunciation Scoring**: Word-level analysis via Google Cloud Speech API
- **Audio Feedback**: Success/error sounds with haptic feedback

### 6. Session Management

- **Session Plans**: Pre-generated learning sequences
- **Caching**: 5-minute TTL for session plans
- **Progress Persistence**: All attempts recorded immediately
- **State Synchronization**: Frontend and backend stay in sync

---

## Technical Implementation Details

### Backend Architecture Patterns

**Service Layer Pattern:**
- Business logic in services (not controllers)
- Services called by domain services (LearnService, ProgressService)
- Clear separation of concerns

**Dependency Injection:**
- NestJS DI for loose coupling
- Services injected via constructors

**Transaction Management:**
- Prisma transactions for atomicity
- Used in `completeTeaching()` for UserTeachingCompleted + UserLesson update

**Append-Only Logs:**
- `UserQuestionPerformance`: Never updated, always inserted
- `XpEvent`: Immutable history
- `UserKnowledgeLevelProgress`: Append-only progression log

**Idempotency:**
- Progress operations are idempotent (safe to retry)
- `startLesson()`: Upsert pattern
- `completeTeaching()`: Composite PK prevents duplicates

### Frontend Architecture Patterns

**Feature-First Architecture:**
- Self-contained features with screens, components, hooks
- Clear feature boundaries

**State Management:**
- React Context API for global state (Auth, Theme, Onboarding)
- Local state with React hooks (`useState`, `useEffect`)

**Audio Preloading:**
- Sounds preloaded on session start
- TTS warmed up before first use
- Eliminates latency on first interaction

**Error Handling:**
- Graceful degradation (audio, haptics fail silently)
- Non-blocking API calls (continue on error)
- User-friendly error messages

### Performance Optimizations

**Session Plan Caching:**
- 5-minute TTL cache for session plans
- Reduces backend load for repeated sessions

**Lazy Loading:**
- Haptics module loaded only when needed
- Audio modules loaded on demand

**Efficient Queries:**
- Strategic indexes on foreign keys
- Distinct queries for deduplication
- Limit clauses to prevent performance issues

**Connection Pooling:**
- Prisma with PostgreSQL connection pool
- Efficient database access

---

## Summary

Fluentia implements a sophisticated adaptive learning system with:

✅ **Advanced Algorithms**: FSRS, BKT, adaptive content delivery  
✅ **Multi-Modal Learning**: 6 delivery methods with teach-then-test  
✅ **Comprehensive Tracking**: Progress, mastery, XP, knowledge levels  
✅ **Real-Time Adaptation**: User-specific parameters and preferences  
✅ **Production-Ready**: Error handling, caching, performance optimizations  

The system is well-architected with clear separation of concerns, type safety, and scalable patterns. All learning flows are fully implemented and integrated, providing a complete end-to-end learning experience.

---

**Report Generated:** 2025-01-01  
**Codebase Version:** Current production state  
**Status:** Complete and production-ready
