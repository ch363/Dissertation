# Dynamic Content Delivery Mechanisms: Technical Report

## Executive Summary

This document provides an in-depth analysis of the dynamic content delivery system, detailing how the platform adaptively selects, styles, and schedules learning content for users. The system employs a sophisticated multi-layered approach combining spaced repetition algorithms (FSRS), Bayesian Knowledge Tracing (BKT), adaptive difficulty adjustment, and intelligent content interleaving to optimize learning outcomes.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Content Selection Mechanisms](#content-selection-mechanisms)
3. [Question Difficulty and Level Determination](#question-difficulty-and-level-determination)
4. [Review Period Calculation](#review-period-calculation)
5. [Content Style and Delivery Method Selection](#content-style-and-delivery-method-selection)
6. [Adaptive Learning Algorithms](#adaptive-learning-algorithms)
7. [Interleaving and Sequencing Strategies](#interleaving-and-sequencing-strategies)
8. [User Personalization Factors](#user-personalization-factors)

---

## System Architecture Overview

The content delivery system is built on a modular architecture with three primary layers:

### 1. Content Delivery Service Layer
- **Purpose**: High-level orchestration of content selection
- **Key Service**: `ContentDeliveryService`
- **Responsibilities**:
  - Session plan generation
  - Candidate gathering (reviews vs. new content)
  - Mode-based filtering (review, learn, mixed)

### 2. Session Planning Layer
- **Purpose**: Generate structured learning sessions
- **Key Service**: `SessionPlanService`
- **Responsibilities**:
  - Teach-then-test sequencing
  - Interleaving application
  - Time-based pacing
  - Modality selection

### 3. Algorithm Layer
- **FSRS Service**: Spaced repetition scheduling
- **Mastery Service**: Skill mastery tracking (BKT)
- **Selection Policies**: Pure algorithmic functions for ranking and interleaving

---

## Content Selection Mechanisms

### Priority-Based Selection Algorithm

The system uses a multi-factor priority scoring system to determine which content to deliver next:

#### 1. Review vs. New Content Decision

**Primary Rule**: Due reviews always take precedence over new content.

```typescript
// Priority scoring logic
if (candidate.dueScore > 0) {
  return 1000 + candidate.dueScore + candidate.errorScore * 10;
}
```

**Due Score Calculation**:
- Measures how overdue an item is: `overdueMs / (1000 * 60 * 60)` (hours overdue)
- Items with `nextReviewDue <= now` are considered due
- Higher due scores = higher priority

#### 2. Mode-Based Content Mixing

The system supports three delivery modes:

**Review Mode** (`mode: 'review'`):
- Only delivers items where `nextReviewDue <= now`
- Prioritizes most overdue items first
- Uses error score as secondary ranking factor

**Learn Mode** (`mode: 'learn'`):
- Prioritizes new, unseen content
- If insufficient new items, fills remaining slots with reviews
- Applies teach-then-test sequencing for new content

**Mixed Mode** (`mode: 'mixed'`):
- Default ratio: **70% reviews, 30% new content**
- Balances reinforcement with new learning
- Applies interleaving to ensure variety

#### 3. Candidate Ranking Factors

Each content candidate receives a priority score based on:

1. **Due Score** (Primary for reviews):
   - Hours overdue: `(now - nextReviewDue) / (1000 * 60 * 60)`
   - Due items get base priority of 1000+

2. **Error Score**:
   - Count of recent errors (score < 80) in last 5 attempts
   - Multiplied by 10 for due items, by 5 for new items
   - Higher error count = higher priority

3. **Time Since Last Seen**:
   - Milliseconds since last interaction
   - Used as tie-breaker for new items

4. **Skill Mastery Priority**:
   - Items targeting low-mastery skills (< 0.5) get +500 priority boost
   - Ensures focus on areas needing improvement

---

## Question Difficulty and Level Determination

### Multi-Factor Difficulty Calculation

The system calculates difficulty using a combination of static and dynamic factors:

#### 1. Base Difficulty from Knowledge Level

Content is tagged with CEFR knowledge levels (A1-C2), which map to base difficulty:

```typescript
const knowledgeLevelDifficulty: Record<string, number> = {
  A1: 0.1,  // Beginner - Easy
  A2: 0.3,  // Elementary - Easy-Medium
  B1: 0.5,  // Intermediate - Medium
  B2: 0.7,  // Upper-Intermediate - Medium-Hard
  C1: 0.85, // Advanced - Hard
  C2: 1.0,  // Proficient - Very Hard
};
```

#### 2. User Mastery Adjustment

The base difficulty is adjusted based on the user's estimated mastery:

```typescript
// Estimated mastery from recent performance (0-1 scale)
const estimatedMastery = avgScore / 100;

// Adjust difficulty: lower mastery = higher effective difficulty
const difficulty = baseDifficulty * (1 - estimatedMastery * 0.3);
// Cap adjustment at 30% to prevent extreme values
```

**Example**:
- Base difficulty (B1): 0.5
- User mastery: 0.3 (30% average score)
- Adjusted difficulty: `0.5 * (1 - 0.3 * 0.3) = 0.5 * 0.91 = 0.455`

#### 3. Difficulty Classification

Items are classified into three categories:

- **Easy**: `difficulty < 0.3` OR `mastery > 0.7`
- **Medium**: `0.3 <= difficulty <= 0.7` AND `0.3 <= mastery <= 0.7`
- **Hard**: `difficulty > 0.7` OR `mastery < 0.3`

#### 4. Onboarding-Based Difficulty Weighting

User onboarding preferences influence difficulty selection:

```typescript
const DIFFICULTY_WEIGHTS: Record<string, number> = {
  easy: 0.25,      // Prefer easier content
  balanced: 0.5,   // Balanced approach
  hard: 0.85,      // Prefer challenging content
};
```

This `challengeWeight` is used to bias selection toward the user's preferred difficulty level.

---

## Review Period Calculation

### FSRS (Free Spaced Repetition Scheduler) Algorithm

The system uses FSRS-4.5, a state-of-the-art spaced repetition algorithm, to calculate optimal review intervals.

#### 1. Core FSRS Concepts

**Stability (S)**:
- Memory strength: duration until retention drops to 90%
- Measured in days
- Increases with successful reviews
- Decreases with failures

**Difficulty (D)**:
- Inherent complexity of the material (0.1 to 10.0)
- Adjusts based on user performance
- Higher difficulty = slower stability growth

**Retrievability (R)**:
- Current probability of recall: `R = exp(-elapsedDays / stability)`
- Decreases exponentially over time
- Target retention: 90% (R = 0.9)

#### 2. Review Interval Calculation

**Formula**:
```
intervalDays = -S · ln(R)
where R = 0.9 (target retention)
```

**Minimum Interval**: 5 minutes (prevents pathological loops)

**Example**:
- Stability: 5 days
- Target retention: 0.9
- Interval: `-5 * ln(0.9) ≈ 0.527 days ≈ 12.6 hours`

#### 3. State Updates After Review

**On Success (Grade ≥ 3)**:

Stability update:
```
S' = S · (1 + e^w₆ · (D')^w₇ · S^w₈ · (e^((1-R)·w₉) - 1))
```

Difficulty update:
```
D' = w₅ · D₀(3) + (1 - w₅) · (D + w₄ · (G - 3))
```

- Repetitions increment
- Stability increases (more for higher retrievability)
- Difficulty adjusts toward mean (mean reversion)

**On Failure (Grade < 3)**:

Stability update:
```
S' = w₁₀ · (D')^w₁₁ · S^w₁₂ · (e^((1-R)·w₁₃) - 1)
```

- Repetitions reset to 0
- Stability decreases significantly
- Difficulty increases

#### 4. Grade Conversion

User performance is converted to FSRS grades (0-5):

```typescript
// Score-based conversion (0-100 scale)
score >= 95: Grade 5 (Perfect)
score >= 85: Grade 4 (Good)
score >= 75: Grade 3 (Pass)
score >= 65: Grade 2 (Fail)
score >= 50: Grade 1 (Poor)
score < 50:  Grade 0 (Very Poor)
```

#### 5. Parameter Optimization

The system optimizes FSRS parameters per user:

- **Default Parameters**: 17 parameters (w0-w16) with optimized defaults
- **User-Specific Optimization**: Uses gradient descent on historical data
- **Minimum Data Requirement**: 20+ review records for optimization
- **Optimization Method**: Minimizes prediction error between actual and predicted intervals

#### 6. Review Scheduling Flow

1. **Initial Review**:
   - First attempt: Initialize stability and difficulty based on grade
   - `S₀ = w₀ · (w₁ · (G - 1) + 1)`
   - `D₀ = w₂ · (w₃ · (G - 4) + 1)`

2. **Subsequent Reviews**:
   - Calculate elapsed time since last review
   - Compute retrievability
   - Update stability and difficulty based on performance
   - Calculate next interval
   - Schedule `nextReviewDue = now + intervalDays`

3. **Due Detection**:
   - Items with `nextReviewDue <= now` are considered due
   - System prioritizes most overdue items

---

## Content Style and Delivery Method Selection

### Delivery Methods

The system supports six delivery methods (modalities):

1. **FLASHCARD**: Visual recognition (20s avg)
2. **MULTIPLE_CHOICE**: Select from options (30s avg)
3. **FILL_BLANK**: Complete the sentence (45s avg)
4. **TEXT_TRANSLATION**: Translate text (60s avg)
5. **SPEECH_TO_TEXT**: Speak the phrase (90s avg)
6. **TEXT_TO_SPEECH**: Listen and understand (90s avg)

### Adaptive Modality Selection

#### 1. User Preference Scoring

Each user has preference scores (0-1) for each delivery method stored in `UserDeliveryMethodScore`:

```typescript
// Default preference: 0.5 (neutral)
let score = userPreferences.get(method) || 0.5;
```

#### 2. Performance-Based Selection

The system favors delivery methods that the user performs best on, using their performance scores from `UserDeliveryMethodScore`. Methods with higher scores are selected more frequently, encouraging continued use of methods where the user excels.

```typescript
// Get user's performance score (0-1 scale)
const performanceScore = userPreferences.get(method) || 0.5;

// Use exponential weighting to strongly favor higher scores
const weight = Math.pow(Math.max(0.1, performanceScore), 4);
```

**Selection Strategy**:
- **85% Weighted Selection**: Uses exponential weighting (score^4) to strongly favor best-performing methods
- **15% Exploration**: Randomly selects from available methods to give other methods a chance
- **No Decay**: Methods that perform well are used MORE, not less, encouraging continued success

**Example**:
- Method with score 0.9: Very high probability of selection (~85% of weighted selections)
- Method with score 0.7: Moderate probability
- Method with score 0.5: Lower probability, but still occasionally selected for exploration
- Method with score 0.3: Low probability, but still gets ~15% exploration chance

#### 3. Selection Algorithm

1. Get performance scores for all available methods from `UserDeliveryMethodScore`
2. Calculate exponential weights (score^4) for each method
3. Use weighted random selection (85% of time) favoring higher scores
4. Use random selection (15% of time) for exploration of other methods

#### 4. Modality Coverage Requirements

For review sessions, the system ensures at least one listening/speaking exercise:

- **Listening/Speaking Methods**: `SPEECH_TO_TEXT`, `TEXT_TO_SPEECH`
- **Coverage Rule**: If enabled, at least one item must use these methods
- **Priority**: Higher priority for items with listening/speaking when coverage needed

### Exercise Type Classification

Content is classified into exercise types based on delivery method and content:

```typescript
// Type determination logic
if (SPEECH_TO_TEXT || TEXT_TO_SPEECH) → 'speaking'
if (TEXT_TRANSLATION) → 'translation'
if (FILL_BLANK) → 'grammar'
if (MULTIPLE_CHOICE || FLASHCARD) → 'vocabulary'
// Fallback: infer from teaching.tip content
```

---

## Adaptive Learning Algorithms

### 1. Bayesian Knowledge Tracing (BKT)

The system uses BKT to track skill mastery probabilities.

#### BKT Parameters

- **Prior (P(L₀))**: 0.3 - Initial probability of knowing the skill
- **Learn (P(T))**: 0.2 - Probability of learning after practice
- **Guess (P(G))**: 0.2 - Probability of correct answer when not known
- **Slip (P(S))**: 0.1 - Probability of incorrect answer when known

#### Update Formulas

**On Correct Answer**:
```
P(L|correct) = (P(L) · (1 - P(S))) / (P(L) · (1 - P(S)) + (1 - P(L)) · P(G))
P(L|next) = P(L|correct) + (1 - P(L|correct)) · P(T)
```

**On Incorrect Answer**:
```
P(L|incorrect) = (P(L) · P(S)) / (P(L) · P(S) + (1 - P(L)) · (1 - P(G)))
P(L|next) = P(L|incorrect)
```

#### Mastery-Based Prioritization

- Skills with mastery < 0.5 are considered "low mastery"
- New content targeting low-mastery skills gets +500 priority boost
- Ensures focus on areas needing improvement

### 2. FSRS Parameter Optimization

The system optimizes FSRS parameters per user using gradient descent:

**Process**:
1. Collect historical review records (minimum 20)
2. Initialize with default parameters
3. Calculate prediction error (MSE between predicted and actual intervals)
4. Compute gradients using finite differences
5. Update parameters via gradient descent
6. Repeat until convergence or max iterations

**Bounds**: Each parameter has min/max bounds to prevent unrealistic values

**Result**: User-specific parameters that better predict their memory retention patterns

---

## Interleaving and Sequencing Strategies

### Interleaving Rules

The system applies sophisticated interleaving to ensure variety and optimal learning:

#### Rule 1: Error Scaffolding

**Trigger**: SkillTag has 3+ errors (errorScore >= 3)

**Action**: Inject a Review item with:
- High mastery (estimatedMastery > 0.7)
- Same SkillTag as the error-prone skill
- Provides "easy win" to rebuild confidence

**Rationale**: Prevents frustration and maintains engagement

#### Rule 2: SkillTag Alternation (Primary Variety Metric)

**Purpose**: Ensure variety across topics/skills

**Implementation**:
- Track last 5 unique SkillTags used
- Prefer items with different SkillTags
- Primary mechanism for content variety

#### Rule 3: Exercise Type Alternation (Secondary Variety Metric)

**Purpose**: Prevent monotony from same exercise types

**Implementation**:
- Maximum 2 consecutive items of same type
- Types: speaking, translation, grammar, vocabulary, practice
- Secondary to SkillTag alternation

#### Rule 4: Legacy Scaffolding

**Trigger**: 2+ consecutive errors

**Action**: Inject an "easy win" item (difficulty < 0.3 OR mastery > 0.7)

**Fallback**: Used when SkillTag-based scaffolding unavailable

#### Rule 5: Modality Coverage

**Requirement**: At least one listening/speaking exercise per session (if enabled)

**Methods**: `SPEECH_TO_TEXT`, `TEXT_TO_SPEECH`

### Teach-Then-Test Sequencing

For new content, the system applies teach-then-test:

**Process**:
1. Identify new questions (not yet attempted)
2. Find associated teachings (if not already seen)
3. Sequence: Teaching → Question (paired together)
4. Preserve pairs during interleaving

**Benefits**:
- Introduces concept before testing
- Improves initial learning
- Reduces cognitive load

### Session Composition

**Learn Mode**:
- Prioritizes teach-then-test pairs
- Fills remaining slots with reviews if needed
- Light interleaving on reviews only

**Review Mode**:
- Full interleaving with all rules enabled
- Error scaffolding active
- Modality coverage required

**Mixed Mode**:
- 70% reviews, 30% new
- Teach-then-test for new items
- Interleaving across all items

---

## User Personalization Factors

### 1. Onboarding Preferences

User onboarding answers influence content delivery:

**Difficulty Preference**:
- `easy`: 0.25 weight (prefer easier content)
- `balanced`: 0.5 weight (default)
- `hard`: 0.85 weight (prefer challenging content)

**Session Style**:
- `short`: 8 minutes
- `focused`: 22 minutes
- `deep`: 45 minutes

**Feedback Depth**:
- `gentle`: 0.3 (minimal feedback)
- `direct`: 0.6 (moderate feedback)
- `detailed`: 0.9 (comprehensive feedback)

**Gamification**:
- `none`: 0 (no gamification)
- `light`: 0.45 (moderate gamification)
- `full`: 0.9 (full gamification)

### 2. Historical Performance

**Time Averages**:
- Tracks average time per delivery method
- Used for session time estimation
- Adapts to user's pace

**Error Patterns**:
- Recent errors increase priority
- Error streaks trigger scaffolding
- Per-skill error tracking

**Mastery Levels**:
- BKT-based skill mastery probabilities
- Low-mastery skills prioritized
- Influences difficulty adjustment

### 3. Delivery Method Preferences

**Adaptive Scoring**:
- UserDeliveryMethodScore table stores preferences
- Updated based on performance and engagement
- Influences modality selection

**Repetition Avoidance**:
- Tracks recent methods used
- Exponential decay penalty for repetition
- Ensures variety

### 4. FSRS Personalization

**Parameter Optimization**:
- User-specific FSRS parameters
- Optimized from historical data
- Better prediction of memory retention

**State Tracking**:
- Per-question stability and difficulty
- Tracks repetitions and intervals
- Personalized review scheduling

---

## Technical Implementation Details

### Data Structures

**DeliveryCandidate**:
```typescript
{
  kind: 'question' | 'teaching',
  id: string,
  questionId?: string,
  teachingId?: string,
  lessonId?: string,
  dueScore: number,           // Higher = more due
  errorScore: number,          // Recent errors count
  timeSinceLastSeen: number,   // Milliseconds
  deliveryMethods?: DELIVERY_METHOD[],
  skillTags?: string[],        // Skills covered
  exerciseType?: string,       // Type classification
  difficulty?: number,         // 0.0 to 1.0
  estimatedMastery?: number     // 0.0 to 1.0
}
```

**FSRS State**:
```typescript
{
  stability: number,      // Days until 90% retention
  difficulty: number,     // 0.1 to 10.0
  lastReview: Date,
  repetitions: number,
  nextReviewDue: Date,
  intervalDays: number
}
```

### Performance Optimizations

1. **Caching**: Session plans cached to avoid regeneration
2. **Deduplication**: Latest attempt per question used
3. **Batch Queries**: Efficient database queries with proper indexing
4. **Lazy Loading**: Content loaded only when needed

### Error Handling

- Graceful degradation when data unavailable
- Fallback to defaults for missing preferences
- Validation of all calculated values
- Bounds checking for all parameters

---

## Conclusion

The dynamic content delivery system employs a sophisticated, multi-layered approach to optimize learning:

1. **Intelligent Selection**: Priority-based ranking with multiple factors
2. **Adaptive Difficulty**: Adjusts based on knowledge level and user mastery
3. **Optimal Scheduling**: FSRS algorithm with user-specific optimization
4. **Variety Assurance**: Interleaving prevents monotony and ensures coverage
5. **Personalization**: Onboarding preferences and historical performance shape delivery

The system continuously adapts to user performance, ensuring optimal learning outcomes through scientifically-backed algorithms and intelligent content sequencing.

---

## Implementation Improvement Plan

This section outlines a comprehensive plan to improve code cohesion, reduce duplication, enhance maintainability, and optimize the content delivery system's architecture.

### Priority Levels
- **P0 (Critical)**: Immediate fixes for bugs, performance issues, or architectural problems
- **P1 (High)**: Significant improvements to code quality and maintainability
- **P2 (Medium)**: Enhancements that improve developer experience and system robustness
- **P3 (Low)**: Nice-to-have improvements and optimizations

---

### 1. Code Duplication and Consolidation (P1)

#### 1.1 Unify Candidate Gathering Logic

**Problem**: `ContentDeliveryService` and `SessionPlanService` both implement `getReviewCandidates()` and `getNewCandidates()` with similar but not identical logic.

**Current State**:
- `ContentDeliveryService.getReviewCandidates()` - Basic implementation
- `SessionPlanService.getReviewCandidates()` - Enhanced with skill tags, difficulty, mastery
- Duplicate query logic and candidate building

**Proposed Solution**:
```typescript
// Create unified CandidateService
@Injectable()
export class CandidateService {
  async getReviewCandidates(
    userId: string,
    options: CandidateOptions = {}
  ): Promise<DeliveryCandidate[]> {
    // Single source of truth for review candidates
    // Supports filtering by lessonId, moduleId
    // Includes all metadata: skillTags, difficulty, mastery, etc.
  }

  async getNewCandidates(
    userId: string,
    options: CandidateOptions = {}
  ): Promise<DeliveryCandidate[]> {
    // Single source of truth for new candidates
    // Supports prioritized skills
  }
}
```

**Benefits**:
- Eliminates ~400 lines of duplicate code
- Ensures consistent candidate metadata across all consumers
- Single place to optimize queries
- Easier to test and maintain

**Implementation Steps**:
1. Create `CandidateService` in `engine/content-delivery/`
2. Extract common logic from both services
3. Update `ContentDeliveryService` and `SessionPlanService` to use `CandidateService`
4. Add comprehensive tests
5. Remove duplicate methods

**Estimated Effort**: 2-3 days

---

#### 1.2 Consolidate Difficulty Calculation

**Problem**: Difficulty calculation logic is duplicated in multiple places with slight variations.

**Current State**:
- `SessionPlanService.getReviewCandidates()` - Has difficulty calculation
- `SessionPlanService.getNewCandidates()` - Has difficulty calculation
- Knowledge level mapping duplicated

**Proposed Solution**:
```typescript
// Create DifficultyCalculator service
@Injectable()
export class DifficultyCalculator {
  private readonly KNOWLEDGE_LEVEL_DIFFICULTY = {
    A1: 0.1, A2: 0.3, B1: 0.5, B2: 0.7, C1: 0.85, C2: 1.0
  };

  calculateBaseDifficulty(knowledgeLevel: string): number {
    return this.KNOWLEDGE_LEVEL_DIFFICULTY[knowledgeLevel] || 0.5;
  }

  adjustDifficultyForMastery(
    baseDifficulty: number,
    estimatedMastery: number,
    adjustmentCap: number = 0.3
  ): number {
    return baseDifficulty * (1 - estimatedMastery * adjustmentCap);
  }

  classifyDifficulty(
    difficulty: number,
    mastery: number
  ): 'easy' | 'medium' | 'hard' {
    if (difficulty < 0.3 || mastery > 0.7) return 'easy';
    if (difficulty > 0.7 || mastery < 0.3) return 'hard';
    return 'medium';
  }
}
```

**Benefits**:
- Single source of truth for difficulty logic
- Easier to tune difficulty parameters
- Consistent classification across system
- Testable in isolation

**Estimated Effort**: 1 day

---

### 2. Configuration Management (P1)

#### 2.1 Extract Magic Numbers to Configuration

**Problem**: Hard-coded constants scattered throughout codebase make tuning difficult.

**Current Issues**:
- Priority scores: `1000`, `500`, `10`, `5` in multiple places
- Mix ratios: `0.7`, `0.3` hard-coded
- Error thresholds: `3`, `2`, `80` (score threshold)
- Time estimates: `20`, `30`, `45`, `60`, `90` seconds
- Mastery thresholds: `0.5`, `0.7`, `0.3`

**Proposed Solution**:
```typescript
// Create ContentDeliveryConfig
export interface ContentDeliveryConfig {
  priority: {
    dueBaseScore: number;           // 1000
    skillMasteryBoost: number;      // 500
    errorScoreMultiplier: number;    // 10 (for due), 5 (for new)
  };
  mixing: {
    reviewRatio: number;             // 0.7
    newRatio: number;                // 0.3
  };
  thresholds: {
    errorCountForScaffolding: number;  // 3
    consecutiveErrorsForScaffolding: number; // 2
    passingScore: number;            // 80
    lowMasteryThreshold: number;     // 0.5
    highMasteryThreshold: number;    // 0.7
  };
  timeEstimates: {
    flashcard: number;               // 20
    multipleChoice: number;         // 30
    fillBlank: number;               // 45
    translation: number;              // 60
    speechToText: number;            // 90
    textToSpeech: number;             // 90
  };
  interleaving: {
    maxSameTypeInRow: number;        // 2
    recentSkillTagsToTrack: number;   // 5
  };
}

// Load from environment or database
@Injectable()
export class ContentDeliveryConfigService {
  getConfig(): ContentDeliveryConfig {
    // Load from env vars, database, or defaults
  }
}
```

**Benefits**:
- Centralized configuration
- Easy A/B testing of parameters
- Environment-specific tuning
- Documentation of all tunable parameters

**Implementation Steps**:
1. Create configuration interface
2. Extract all constants to config
3. Create config service with defaults
4. Support environment variable overrides
5. Add configuration validation
6. Document all parameters

**Estimated Effort**: 2 days

---

### 3. Architecture Improvements (P1)

#### 3.1 Create Candidate Builder Pattern

**Problem**: Candidate building logic is scattered and inconsistent.

**Current State**:
- `buildQuestionCandidate()` in `ContentDeliveryService`
- Inline candidate building in `SessionPlanService`
- Inconsistent metadata population

**Proposed Solution**:
```typescript
// Builder pattern for candidates
export class DeliveryCandidateBuilder {
  private candidate: Partial<DeliveryCandidate> = {};

  static create(): DeliveryCandidateBuilder {
    return new DeliveryCandidateBuilder();
  }

  withQuestion(question: Question): this {
    this.candidate.kind = 'question';
    this.candidate.id = question.id;
    this.candidate.questionId = question.id;
    this.candidate.teachingId = question.teachingId;
    this.candidate.lessonId = question.teaching.lessonId;
    return this;
  }

  withDeliveryMethods(methods: DELIVERY_METHOD[]): this {
    this.candidate.deliveryMethods = methods;
    return this;
  }

  withPerformanceMetrics(
    dueScore: number,
    errorScore: number,
    timeSinceLastSeen: number
  ): this {
    this.candidate.dueScore = dueScore;
    this.candidate.errorScore = errorScore;
    this.candidate.timeSinceLastSeen = timeSinceLastSeen;
    return this;
  }

  withSkillTags(tags: string[]): this {
    this.candidate.skillTags = tags;
    return this;
  }

  withDifficulty(difficulty: number, mastery: number): this {
    this.candidate.difficulty = difficulty;
    this.candidate.estimatedMastery = mastery;
    return this;
  }

  withExerciseType(type: string): this {
    this.candidate.exerciseType = type;
    return this;
  }

  build(): DeliveryCandidate {
    // Validate required fields
    // Return complete candidate
  }
}
```

**Benefits**:
- Consistent candidate creation
- Fluent, readable API
- Validation in one place
- Easier to extend with new metadata

**Estimated Effort**: 1-2 days

---

#### 3.2 Separate Query Logic from Business Logic

**Problem**: Database queries mixed with business logic makes testing difficult.

**Proposed Solution**:
```typescript
// Create repository layer
@Injectable()
export class QuestionPerformanceRepository {
  async findDueReviews(
    userId: string,
    filters: ReviewFilters
  ): Promise<UserQuestionPerformance[]> {
    // Pure query logic
  }

  async findNewQuestions(
    userId: string,
    filters: NewQuestionFilters
  ): Promise<Question[]> {
    // Pure query logic
  }

  async getRecentAttempts(
    userId: string,
    questionId: string,
    limit: number
  ): Promise<UserQuestionPerformance[]> {
    // Pure query logic
  }
}
```

**Benefits**:
- Easier to mock for testing
- Reusable query logic
- Can optimize queries independently
- Clear separation of concerns

**Estimated Effort**: 2 days

---

### 4. Performance Optimizations (P1)

#### 4.1 Batch Database Queries

**Problem**: N+1 query problems in candidate gathering.

**Current Issues**:
- Loop through questions, querying each individually
- Multiple round trips for skill tags, teaching data, etc.

**Proposed Solution**:
```typescript
// Batch load all required data upfront
async getReviewCandidates(userId: string) {
  // Single query with all includes
  const performances = await this.prisma.userQuestionPerformance.findMany({
    where: { userId, nextReviewDue: { lte: now } },
    include: {
      question: {
        include: {
          variants: true,
          skillTags: true,
          teaching: {
            include: {
              skillTags: true,
              lesson: true
            }
          }
        }
      }
    }
  });

  // Process in memory instead of querying per item
}
```

**Benefits**:
- Reduces database round trips from O(n) to O(1)
- Significant performance improvement for large candidate sets
- Lower database load

**Estimated Effort**: 1-2 days

---

#### 4.2 Implement Candidate Caching

**Problem**: Candidate gathering is expensive and called frequently.

**Proposed Solution**:
```typescript
@Injectable()
export class CandidateCacheService {
  private cache = new Map<string, CachedCandidates>();

  async getCachedCandidates(
    userId: string,
    cacheKey: string,
    ttl: number = 300 // 5 minutes
  ): Promise<DeliveryCandidate[] | null> {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl * 1000) {
      return cached.candidates;
    }
    return null;
  }

  invalidateUserCache(userId: string): void {
    // Invalidate all cache entries for user
    // Called after performance updates
  }
}
```

**Benefits**:
- Faster session plan generation
- Reduced database load
- Better user experience

**Implementation Notes**:
- Cache invalidation on performance updates
- TTL-based expiration
- Memory-efficient implementation

**Estimated Effort**: 1 day

---

#### 4.3 Optimize FSRS Parameter Optimization

**Problem**: Parameter optimization runs synchronously and can be slow.

**Proposed Solution**:
```typescript
// Run optimization asynchronously
@Injectable()
export class FsrsOptimizationService {
  async optimizeParametersAsync(
    userId: string
  ): Promise<void> {
    // Queue optimization job
    // Run in background worker
    // Update parameters when complete
  }

  // Cache optimized parameters
  async getOptimizedParameters(
    userId: string
  ): Promise<FsrsParameters> {
    // Check cache first
    // Fall back to defaults if not optimized yet
  }
}
```

**Benefits**:
- Non-blocking parameter optimization
- Better user experience
- Can optimize more frequently

**Estimated Effort**: 2 days

---

### 5. Type Safety and Validation (P2)

#### 5.1 Strong Typing for Delivery Candidates

**Problem**: Optional fields make it easy to miss required data.

**Proposed Solution**:
```typescript
// Discriminated unions for type safety
export type QuestionCandidate = DeliveryCandidate & {
  kind: 'question';
  questionId: string;
  deliveryMethods: DELIVERY_METHOD[];
  // Required fields for questions
};

export type TeachingCandidate = DeliveryCandidate & {
  kind: 'teaching';
  teachingId: string;
  // Required fields for teachings
};

// Type guards
export function isQuestionCandidate(
  candidate: DeliveryCandidate
): candidate is QuestionCandidate {
  return candidate.kind === 'question' && !!candidate.questionId;
}
```

**Benefits**:
- Compile-time type checking
- Prevents runtime errors
- Better IDE autocomplete
- Self-documenting code

**Estimated Effort**: 1-2 days

---

#### 5.2 Input Validation

**Problem**: Missing validation for session context and options.

**Proposed Solution**:
```typescript
// Use class-validator
export class SessionContextDto {
  @IsEnum(DeliveryMode)
  mode: DeliveryMode;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  timeBudgetSec?: number;
}

// Validate at service boundaries
async createPlan(
  userId: string,
  context: SessionContextDto
): Promise<SessionPlanDto> {
  await validateOrReject(context);
  // ...
}
```

**Benefits**:
- Early error detection
- Clear error messages
- API contract enforcement

**Estimated Effort**: 1 day

---

### 6. Testing Infrastructure (P1)

#### 6.1 Unit Test Coverage

**Current State**: Limited test coverage for core algorithms.

**Proposed Solution**:
```typescript
// Test pure functions extensively
describe('DifficultyCalculator', () => {
  it('calculates base difficulty from knowledge level', () => {
    expect(calc.calculateBaseDifficulty('A1')).toBe(0.1);
    expect(calc.calculateBaseDifficulty('C2')).toBe(1.0);
  });

  it('adjusts difficulty based on mastery', () => {
    const adjusted = calc.adjustDifficultyForMastery(0.5, 0.3);
    expect(adjusted).toBeCloseTo(0.455);
  });
});

// Test selection policies
describe('rankCandidates', () => {
  it('prioritizes due reviews over new items', () => {
    // Test cases
  });

  it('boosts priority for low-mastery skills', () => {
    // Test cases
  });
});

// Test interleaving
describe('composeWithInterleaving', () => {
  it('applies error scaffolding', () => {
    // Test cases
  });

  it('ensures skill tag alternation', () => {
    // Test cases
  });
});
```

**Target Coverage**: 80%+ for pure functions, 60%+ for services

**Estimated Effort**: 3-4 days

---

#### 6.2 Integration Tests

**Proposed Solution**:
```typescript
describe('SessionPlanService Integration', () => {
  it('generates complete session plan', async () => {
    // Test full flow with test database
  });

  it('respects time budget', async () => {
    // Verify estimated time matches budget
  });

  it('applies teach-then-test correctly', async () => {
    // Verify teaching before questions
  });
});
```

**Estimated Effort**: 2-3 days

---

### 7. Algorithm Improvements (P2)

#### 7.1 Adaptive Mix Ratios

**Problem**: Fixed 70/30 ratio may not be optimal for all users.

**Proposed Solution**:
```typescript
// Learn optimal ratio from user performance
calculateOptimalMixRatio(
  userPerformance: UserPerformanceMetrics
): { review: number; new: number } {
  // Adjust based on:
  // - Review accuracy
  // - New content retention
  // - User engagement
  // - Time since last session
}
```

**Benefits**:
- Personalized learning experience
- Better retention rates
- Improved engagement

**Estimated Effort**: 3-4 days (includes A/B testing)

---

#### 7.2 Dynamic Difficulty Adjustment

**Problem**: Difficulty adjustment cap (30%) is fixed.

**Proposed Solution**:
```typescript
// Adaptive adjustment based on user's performance variance
calculateAdaptiveAdjustment(
  baseDifficulty: number,
  mastery: number,
  performanceVariance: number
): number {
  // Higher variance = more conservative adjustment
  // Lower variance = more aggressive adjustment
}
```

**Estimated Effort**: 2 days

---

#### 7.3 Enhanced Error Scaffolding

**Problem**: Fixed thresholds (3 errors) may not work for all users.

**Proposed Solution**:
```typescript
// Adaptive scaffolding based on user's error patterns
shouldApplyScaffolding(
  skillTag: string,
  userErrorHistory: ErrorHistory
): boolean {
  // Consider:
  // - User's typical error rate
  // - Skill difficulty
  // - Time since last error
  // - Overall session performance
}
```

**Estimated Effort**: 2-3 days

---

### 8. Monitoring and Observability (P2)

#### 8.1 Add Metrics and Logging

**Proposed Solution**:
```typescript
@Injectable()
export class ContentDeliveryMetrics {
  recordCandidateSelection(
    userId: string,
    candidate: DeliveryCandidate,
    rationale: string
  ): void {
    // Log selection decisions
  }

  recordSessionPlanGeneration(
    userId: string,
    plan: SessionPlanDto,
    generationTime: number
  ): void {
    // Track performance
  }

  recordAlgorithmPerformance(
    algorithm: string,
    inputSize: number,
    executionTime: number
  ): void {
    // Track algorithm performance
  }
}
```

**Benefits**:
- Debug selection issues
- Identify performance bottlenecks
- A/B test algorithm changes
- Monitor system health

**Estimated Effort**: 2 days

---

#### 8.2 Add Decision Rationale Tracking

**Proposed Solution**:
```typescript
// Enhanced rationale with more context
interface SelectionRationale {
  primaryReason: string;
  factors: {
    dueScore?: number;
    errorScore?: number;
    masteryBoost?: number;
    skillTag?: string;
    difficulty?: number;
  };
  alternatives: {
    candidateId: string;
    score: number;
    reason: string;
  }[];
}
```

**Benefits**:
- Debug why items were selected
- Explain decisions to users
- Improve algorithm transparency

**Estimated Effort**: 1 day

---

### 9. Documentation Improvements (P2)

#### 9.1 Algorithm Documentation

**Proposed**:
- Document all formulas with references
- Explain parameter tuning guidelines
- Add decision trees for selection logic
- Create architecture diagrams

**Estimated Effort**: 2 days

---

#### 9.2 Code Comments

**Proposed**:
- Add JSDoc comments to all public methods
- Document complex algorithms inline
- Explain non-obvious design decisions
- Add examples for common use cases

**Estimated Effort**: 1-2 days

---

### 10. Refactoring Priorities

#### Phase 1 (Weeks 1-2): Foundation
1. ✅ Extract configuration (P1)
2. ✅ Create CandidateService (P1)
3. ✅ Create DifficultyCalculator (P1)
4. ✅ Add input validation (P2)

#### Phase 2 (Weeks 3-4): Performance
1. ✅ Batch database queries (P1)
2. ✅ Implement candidate caching (P1)
3. ✅ Optimize FSRS optimization (P1)

#### Phase 3 (Weeks 5-6): Quality
1. ✅ Improve type safety (P2)
2. ✅ Add comprehensive tests (P1)
3. ✅ Add monitoring (P2)

#### Phase 4 (Weeks 7-8): Enhancement
1. ✅ Algorithm improvements (P2)
2. ✅ Documentation (P2)
3. ✅ Performance tuning

---

### Success Metrics

**Code Quality**:
- Reduce code duplication by 40%+
- Increase test coverage to 80%+
- Reduce cyclomatic complexity

**Performance**:
- Reduce session plan generation time by 50%+
- Reduce database queries by 60%+
- Improve cache hit rate to 70%+

**Maintainability**:
- Reduce time to add new features by 30%+
- Improve code review time
- Reduce bug rate

---

## References

- FSRS Algorithm: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
- Bayesian Knowledge Tracing: Corbett & Anderson (1995)
- CEFR Knowledge Levels: Common European Framework of Reference for Languages

---

*Report Generated: January 27, 2026*
*System Version: Current Production Build*
