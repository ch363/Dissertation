# Delivery Method Selection System Analysis

This document provides a comprehensive analysis of how the system chooses delivery methods for questions during learning sessions.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [Selection Flow](#selection-flow)
4. [The selectModality Function](#the-selectmodality-function)
5. [Score Management](#score-management)
6. [Potential Issues](#potential-issues)
7. [Flow Diagrams](#flow-diagrams)

---

## Overview

The delivery method selection system determines which format a question is presented in during a learning session. Each question can support multiple delivery methods, and the system selects one based on user performance history.

### Available Delivery Methods

```
DELIVERY_METHOD enum:
├── FILL_BLANK        - Fill-in-the-blank exercises
├── FLASHCARD         - Flashcard-style recall
├── MULTIPLE_CHOICE   - Multiple choice questions
├── SPEECH_TO_TEXT    - User speaks, system transcribes
├── TEXT_TO_SPEECH    - System speaks, user listens/responds
└── TEXT_TRANSLATION  - Translation exercises
```

---

## Data Model

### Question Variants

Each question can have multiple delivery method variants stored in the `QuestionVariant` table:

```
Question (1) ──────────> (*) QuestionVariant
                              ├── questionId
                              ├── deliveryMethod (enum)
                              └── data (JSON) - method-specific content
```

**Constraint:** One variant per delivery method per question (`@@unique([questionId, deliveryMethod])`)

### User Delivery Method Scores

User performance per delivery method is tracked in `UserDeliveryMethodScore`:

```
User (1) ──────────> (*) UserDeliveryMethodScore
                          ├── userId
                          ├── deliveryMethod (enum)
                          └── score (Float, 0.0 - 1.0)
```

---

## Selection Flow

### Phase 1: Candidate Collection

**File:** `candidate.service.ts`

The `CandidateService` fetches questions and extracts available delivery methods:

```typescript
// From getReviewCandidates() and getNewCandidates()
const availableMethods: DELIVERY_METHOD[] =
  question.variants?.map((v) => v.deliveryMethod) ?? [];
```

Each `DeliveryCandidate` carries:
- `deliveryMethods: DELIVERY_METHOD[]` - ALL available methods for this question
- `exerciseType: string` - Category determined from methods ("speaking", "translation", "grammar", "vocabulary")

### Phase 2: Ranking & Interleaving

**File:** `content-delivery.policy.ts`

1. `rankCandidates()` - Prioritizes by due score, errors, time since seen
2. `composeWithInterleaving()` - Ensures variety in exercise types

### Phase 3: Delivery Method Selection

**File:** `session-plan.service.ts`, lines 243-259

For each question candidate, `selectModality()` is called:

```typescript
const selectedMethod = selectModality(
  candidate,
  candidate.deliveryMethods,  // Available methods from variants
  userPreferences,            // Map<DELIVERY_METHOD, number>
  {
    recentMethods,            // Last 5 methods used
    avoidRepetition: true,    // Flag passed but NOT USED
  },
);
```

### Phase 4: Building the Session Step

The selected method is used to build a `PracticeStepItem` with method-specific data.

---

## The selectModality Function

**File:** `content-delivery.policy.ts`, lines 381-428

This is the core function that chooses which delivery method to use:

```typescript
export function selectModality(
  item: DeliveryCandidate,
  availableMethods: DELIVERY_METHOD[],
  userPreferences: Map<DELIVERY_METHOD, number>,
  context?: {
    recentMethods?: DELIVERY_METHOD[];
    avoidRepetition?: boolean;
  },
): DELIVERY_METHOD | undefined {
  // Edge cases
  if (availableMethods.length === 0) return undefined;
  if (availableMethods.length === 1) return availableMethods[0];

  // Get scores for each available method
  const methodScores = availableMethods.map((method) => {
    const performanceScore = userPreferences.get(method) || 0.5;
    return { method, score: performanceScore };
  });

  // Find best method (not used in selection, just calculated)
  const bestMethod = methodScores.reduce((best, current) =>
    current.score > best.score ? current : best,
  );

  // Calculate weights: score^4 (amplifies differences)
  const weights = methodScores.map(({ method, score }) => ({
    method,
    weight: Math.pow(Math.max(0.1, score), 4),
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  
  // 85% weighted selection, 15% random exploration
  const useWeightedSelection = Math.random() < 0.85;

  if (useWeightedSelection) {
    // Weighted random selection
    let random = Math.random() * totalWeight;
    for (const { method, weight } of weights) {
      random -= weight;
      if (random <= 0) return method;
    }
    return bestMethod.method;
  } else {
    // Random exploration
    const randomIndex = Math.floor(Math.random() * availableMethods.length);
    return availableMethods[randomIndex];
  }
}
```

### Key Observations

1. **Context is IGNORED:** The `recentMethods` and `avoidRepetition` parameters are passed but never used in the function body.

2. **Weight Calculation:** `weight = score^4`
   - Score 0.5 → Weight 0.0625
   - Score 0.7 → Weight 0.2401
   - Score 0.9 → Weight 0.6561
   
   Higher scores get exponentially more weight.

3. **Selection Probabilities:**
   - 85% chance: Weighted random (favors higher scores)
   - 15% chance: Uniform random (exploration)

4. **No Repetition Avoidance:** Despite tracking `recentMethods`, the function doesn't use this to avoid consecutive same-method selections.

---

## Score Management

### Initial Scores (Onboarding)

**File:** `onboarding-preferences.service.ts`

Initial scores are set based on learning style preferences from onboarding:

```typescript
// Default: 0.5 for all methods

// Learning style adjustments:
visual:      FLASHCARD, MULTIPLE_CHOICE       → 0.65
auditory:    TEXT_TO_SPEECH, SPEECH_TO_TEXT   → 0.65
kinesthetic: FILL_BLANK, TEXT_TRANSLATION     → 0.65
reading:     TEXT_TRANSLATION, FILL_BLANK     → 0.65
writing:     FILL_BLANK, TEXT_TRANSLATION     → 0.65

// Non-preferred methods get: 0.45

// Experience adjustments:
beginner: all methods -0.1
advanced: all methods +0.1
```

### Score Updates (During Practice)

**File:** `mobile/src/features/session/components/session-runner/SessionRunner.tsx`

Scores are updated by the mobile client after each answer:

```typescript
const delta = isCorrect ? 0.1 : -0.05;
await updateDeliveryMethodScore(deliveryMethod, { delta });
```

**Update behavior:**
- Correct answer: +0.1 to score
- Incorrect answer: -0.05 to score
- Score is clamped between 0.0 and 1.0

### Score Retrieval

**File:** `session-plan.service.ts`, lines 702-721

```typescript
private async getDeliveryMethodScores(userId: string) {
  const storedScores = await this.prisma.userDeliveryMethodScore.findMany({
    where: { userId },
  });

  // If user has stored scores, use those
  if (storedScores.length > 0) {
    return Map(storedScores);
  }

  // Otherwise, calculate from onboarding preferences
  return await this.onboardingPreferences.getInitialDeliveryMethodScores(userId);
}
```

---

## Potential Issues

### 1. Context Parameters Are Unused

**Problem:** `recentMethods` and `avoidRepetition` are passed to `selectModality()` but never used.

**File:** `content-delivery.policy.ts`, line 385-388

```typescript
context?: {
  recentMethods?: DELIVERY_METHOD[];  // ❌ NEVER USED
  avoidRepetition?: boolean;          // ❌ NEVER USED
},
```

**Impact:** The system cannot avoid showing the same delivery method multiple times in a row, even though it tracks this information.

### 2. Higher Performance = Higher Selection Probability

**Problem:** Methods where the user performs well get selected MORE often, not less.

**Current behavior:**
- User does well on MULTIPLE_CHOICE → score increases
- Higher score → exponentially higher selection probability
- User keeps getting MULTIPLE_CHOICE

**Expected behavior (potentially):** If the goal is to challenge users or ensure variety, high-performing methods should perhaps be selected LESS often to push users toward weaker areas.

### 3. Exercise Type Determined Before Method Selection

**Problem:** The `exerciseType` is determined based on ALL available methods, not the selected method.

**File:** `candidate.service.ts`, line 294-328

```typescript
private determineExerciseType(deliveryMethods: DELIVERY_METHOD[], ...) {
  // Checks if ANY method is speaking/translation/etc.
  if (deliveryMethods.includes(DELIVERY_METHOD.SPEECH_TO_TEXT) ||
      deliveryMethods.includes(DELIVERY_METHOD.TEXT_TO_SPEECH)) {
    return 'speaking';
  }
  // ...
}
```

If a question has both `MULTIPLE_CHOICE` and `SPEECH_TO_TEXT` variants, the exercise type will be "speaking" even if `MULTIPLE_CHOICE` is selected.

### 4. Interleaving Operates on Available Methods, Not Selected

**File:** `content-delivery.policy.ts`, lines 316-318

```typescript
if (selected.deliveryMethods) {
  selected.deliveryMethods.forEach((m) => usedModalities.add(m));
}
```

The interleaving tracks all available methods rather than the actually selected method.

### 5. Small Score Deltas, Large Weight Differences

**Problem:** The score update deltas (±0.1, ±0.05) seem small, but the weight formula (`score^4`) creates large probability differences.

**Example:**
| Score | Weight | Relative Probability |
|-------|--------|---------------------|
| 0.45  | 0.041  | 6.7%                |
| 0.50  | 0.063  | 10.3%               |
| 0.55  | 0.092  | 15.0%               |
| 0.60  | 0.130  | 21.3%               |
| 0.65  | 0.179  | 29.3%               |
| 0.70  | 0.240  | 39.3%               |

A difference of 0.1 in score can lead to a ~2x difference in selection probability.

### 6. No Persistence of Per-Question Method History

The system tracks overall user performance per method but doesn't track which method was last used for a specific question. This means a question could get the same delivery method repeatedly across sessions.

---

## Flow Diagrams

### Complete Selection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SESSION PLAN CREATION                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. CandidateService.getReviewCandidates()                           │
│    CandidateService.getNewCandidates()                              │
│    ────────────────────────────────────────                         │
│    For each question:                                               │
│    • Load question with variants                                    │
│    • Extract deliveryMethods[] from variants                        │
│    • Determine exerciseType from ALL available methods              │
│    • Build DeliveryCandidate with deliveryMethods array             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. rankCandidates()                                                 │
│    ────────────────────────────────────────                         │
│    Prioritize by:                                                   │
│    • Due score (overdue items = high priority)                      │
│    • Error score (recent mistakes)                                  │
│    • Time since last seen                                           │
│    • Prioritized skill tags                                         │
│    • Challenge weight preference                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Mode-Based Selection                                             │
│    ────────────────────────────────────────                         │
│    review mode: 100% reviews                                        │
│    learn mode:  new items, fill with reviews if needed              │
│    mixed mode:  ~70% reviews, ~30% new                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. composeWithInterleaving()                                        │
│    ────────────────────────────────────────                         │
│    • Limit consecutive same exercise type (maxSameTypeInRow = 2)    │
│    • Ensure modality coverage (speaking/listening if available)     │
│    • Scaffolding after errors (insert easier items)                 │
│    • Avoid repeating same skill tags                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. getDeliveryMethodScores(userId)                                  │
│    ────────────────────────────────────────                         │
│    Load user's performance scores per delivery method               │
│    Returns Map<DELIVERY_METHOD, number>                             │
│    Falls back to onboarding preferences if no scores exist          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. FOR EACH QUESTION CANDIDATE:                                     │
│    ────────────────────────────────────────                         │
│                                                                     │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ selectModality(candidate, availableMethods, userPrefs, ctx) │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                          │                                          │
│                          ▼                                          │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ If only 1 method available → return that method             │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                          │                                          │
│                          ▼                                          │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Calculate weights for each method:                          │  │
│    │   weight = score^4                                          │  │
│    │   (Higher scores get exponentially more weight)             │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                          │                                          │
│                          ▼                                          │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Random choice (85% / 15%):                                  │  │
│    │   85%: Weighted random selection                            │  │
│    │   15%: Uniform random (exploration)                         │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                          │                                          │
│                          ▼                                          │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Return selected DELIVERY_METHOD                             │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. buildPracticeStepItem(question, selectedMethod, ...)             │
│    ────────────────────────────────────────                         │
│    Load method-specific data from QuestionVariant                   │
│    Build PracticeStepItem with all required fields                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. Add step to session plan with selected deliveryMethod            │
└─────────────────────────────────────────────────────────────────────┘
```

### Score Update Flow (Mobile Client)

```
┌───────────────────────────────────────┐
│ User answers question                 │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ Determine delta:                      │
│   Correct:   delta = +0.10            │
│   Incorrect: delta = -0.05            │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ POST /progress/delivery-method/       │
│      {method}/score                   │
│ Body: { delta: number }               │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ updateDeliveryMethodScore()           │
│ ─────────────────────────             │
│ newScore = currentScore + delta       │
│ newScore = clamp(newScore, 0, 1)      │
│ Upsert to UserDeliveryMethodScore     │
└───────────────────────────────────────┘
```

---

## Summary

The delivery method selection system:

1. **Stores** multiple delivery method variants per question in `QuestionVariant`
2. **Tracks** user performance per delivery method in `UserDeliveryMethodScore`
3. **Selects** methods using weighted random selection based on performance scores
4. **Updates** scores incrementally after each answer (+0.1/-0.05)

**Key behavior:** Methods where users perform well are selected MORE often (not less), with 15% exploration to occasionally try other methods.

**Main gaps:**
- `recentMethods`/`avoidRepetition` context is passed but unused
- No variety enforcement within a session
- Exercise type doesn't reflect the actually selected method
- Performance bias may reduce exposure to challenging methods
