# Content Delivery

This module decides **what** to show the user and **how** (delivery method). It does not handle HTTP directly; it is used by `LearnService` and session-plan APIs.

## Repetition (what’s due)

- **SRS** (`SrsService`, FSRS) writes `nextReviewDue` on `UserQuestionPerformance` when the user completes an attempt.
- **CandidateService** reads `nextReviewDue <= now` to build **review candidates** (due items).
- New items are questions the user has never attempted.

## Selection pipeline

One policy module ([`content-delivery.policy.ts`](content-delivery.policy.ts)) holds all pure logic:

1. **Rank** – `rankCandidates`: due-ness, errors, time since last seen, prioritized skills, challenge weight.
2. **Mode mix** – SessionPlanService applies mode (review / learn / mixed) and slices to target count.
3. **Teach-then-test** – `planTeachThenTest`: for new content, teachings before their questions.
4. **Interleave** – `composeWithInterleaving`: variety by skill tag and exercise type, scaffolding after errors.
5. **Modality** – `selectModality`: per step, pick delivery method by user performance (weighted) with some exploration.

Orchestration is in **SessionPlanService** (`createPlan`): it calls CandidateService, then the policy functions above, then builds steps (teach / practice / recap) and attaches delivery method and time estimates.

## Difficulty

- **DifficultyCalculator** is the single source of truth:
  - CEFR knowledge level → base difficulty (0–1).
  - `adjustDifficultyForMastery(base, mastery)` for review items.
  - `classifyDifficulty(difficulty, mastery)` → easy / medium / hard (used by interleaving).
- **CandidateService** uses DifficultyCalculator when building review and new candidates; it does not duplicate difficulty logic.

## Main files

| File | Role |
|------|------|
| `content-delivery.policy.ts` | Ranking, interleaving, modality selection, time/count, teach-then-test (pure functions). |
| `candidate.service.ts` | Fetches review and new candidates; uses DifficultyCalculator for difficulty. |
| `difficulty-calculator.service.ts` | Base difficulty, mastery adjustment, easy/medium/hard classification. |
| `session-plan.service.ts` | Orchestrates candidates + policy → full session plan (steps, modality, time). |
| `content-delivery.service.ts` | Session plan API (cache + `createPlan`), dashboard plan. |
