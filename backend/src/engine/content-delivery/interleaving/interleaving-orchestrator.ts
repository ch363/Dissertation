import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryCandidate } from '../types';
import { CandidateClassifier, ClassifiedCandidates } from './candidate-classifier';
import { SkillErrorTracker } from './skill-error-tracker';
import { ConstraintValidator } from './constraint-validator';
import { AlternativeFinder } from './alternative-finder';

/**
 * Interleaving options for the orchestrator.
 */
export interface InterleavingOrchestratorOptions {
  maxSameTypeInRow?: number;
  requireModalityCoverage?: boolean;
  enableScaffolding?: boolean;
  consecutiveErrors?: number;
}

/**
 * Selection state maintained during orchestration.
 */
interface SelectionState {
  composed: DeliveryCandidate[];
  used: Set<string>;
  recentTypes: string[];
  recentSkillTags: string[];
  usedModalities: Set<DELIVERY_METHOD>;
  errorStreak: number;
  needsModalityCoverage: boolean;
}

/**
 * InterleavingOrchestrator
 *
 * Orchestrates candidate selection with interleaving logic.
 * Coordinates between classifier, error tracker, validator, and finder.
 */
export class InterleavingOrchestrator {
  private classifier: CandidateClassifier;
  private errorTracker: SkillErrorTracker;
  private constraintValidator: ConstraintValidator;
  private alternativeFinder: AlternativeFinder;

  constructor() {
    this.classifier = new CandidateClassifier();
    this.errorTracker = new SkillErrorTracker();
    this.constraintValidator = new ConstraintValidator();
    this.alternativeFinder = new AlternativeFinder(this.constraintValidator);
  }

  /**
   * Compose candidates with interleaving logic.
   */
  compose(
    candidates: DeliveryCandidate[],
    options: InterleavingOrchestratorOptions = {},
  ): DeliveryCandidate[] {
    const {
      maxSameTypeInRow = 2,
      requireModalityCoverage = true,
      enableScaffolding = true,
      consecutiveErrors = 0,
    } = options;

    if (candidates.length === 0) {
      return [];
    }

    // Configure validator
    this.constraintValidator.setMaxSameTypeInRow(maxSameTypeInRow);

    // Build error map and classify candidates
    this.errorTracker.buildFromCandidates(candidates);
    const classified = this.classifier.classify(candidates);

    // Initialize state
    const state: SelectionState = {
      composed: [],
      used: new Set<string>(),
      recentTypes: [],
      recentSkillTags: [],
      usedModalities: new Set<DELIVERY_METHOD>(),
      errorStreak: consecutiveErrors,
      needsModalityCoverage: requireModalityCoverage,
    };

    let remaining = [...candidates];

    // Main selection loop
    while (remaining.length > 0 || state.needsModalityCoverage) {
      const selected = this.selectNext(
        remaining,
        classified,
        state,
        enableScaffolding,
      );

      if (!selected) {
        break;
      }

      // Update state with selected candidate
      this.updateStateWithSelection(selected, state, maxSameTypeInRow);

      // Remove selected from remaining
      remaining = remaining.filter((c) => c.id !== selected.id);

      // Check modality coverage
      if (state.needsModalityCoverage) {
        state.needsModalityCoverage = !this.checkModalityCoverage(selected);
      }
    }

    return state.composed;
  }

  private selectNext(
    remaining: DeliveryCandidate[],
    classified: ClassifiedCandidates,
    state: SelectionState,
    enableScaffolding: boolean,
  ): DeliveryCandidate | null {
    // Strategy 1: Scaffolding for high-error skills
    if (enableScaffolding) {
      const selected = this.selectForScaffolding(classified, state);
      if (selected) return selected;
    }

    // Strategy 2: Error streak recovery
    if (enableScaffolding && state.errorStreak >= 2) {
      const selected = this.alternativeFinder.find(
        classified.easy,
        state.used,
        state.recentTypes,
      );
      if (selected) {
        state.errorStreak = 0;
        return selected;
      }
    }

    // Strategy 3: Modality coverage
    if (state.needsModalityCoverage) {
      const selected = this.selectForModalityCoverage(remaining, state);
      if (selected) {
        state.needsModalityCoverage = false;
        return selected;
      }
    }

    // Strategy 4: Variety selection
    return this.selectForVariety(remaining, state);
  }

  private selectForScaffolding(
    classified: ClassifiedCandidates,
    state: SelectionState,
  ): DeliveryCandidate | null {
    const skillsNeedingScaffolding =
      this.errorTracker.getSkillsNeedingScaffolding(3);

    if (skillsNeedingScaffolding.length === 0) {
      return null;
    }

    const targetSkillTag = skillsNeedingScaffolding[0];
    const selected = this.alternativeFinder.find(
      classified.reviewItemsHighMastery,
      state.used,
      state.recentTypes,
      { requireSkillTag: targetSkillTag },
    );

    if (selected) {
      this.errorTracker.resetSkillError(targetSkillTag);
    }

    return selected;
  }

  private selectForModalityCoverage(
    remaining: DeliveryCandidate[],
    state: SelectionState,
  ): DeliveryCandidate | null {
    const listeningSpeaking: DELIVERY_METHOD[] = [
      DELIVERY_METHOD.SPEECH_TO_TEXT,
      DELIVERY_METHOD.TEXT_TO_SPEECH,
    ];

    for (const candidate of remaining) {
      if (state.used.has(candidate.id)) continue;
      const hasListeningSpeaking = candidate.deliveryMethods?.some((m) =>
        listeningSpeaking.includes(m),
      );
      if (hasListeningSpeaking) {
        return candidate;
      }
    }

    return null;
  }

  private selectForVariety(
    remaining: DeliveryCandidate[],
    state: SelectionState,
  ): DeliveryCandidate | null {
    const recentUniqueSkillTags = Array.from(new Set(state.recentSkillTags));
    const lastExerciseType = state.recentTypes[state.recentTypes.length - 1];

    // Try to avoid recent skill tags
    if (recentUniqueSkillTags.length > 0) {
      const selected = this.alternativeFinder.find(
        remaining,
        state.used,
        state.recentTypes,
        { avoidType: lastExerciseType, avoidSkillTags: recentUniqueSkillTags },
      );
      if (selected) return selected;
    }

    // Try to avoid last exercise type
    if (lastExerciseType) {
      const selected = this.alternativeFinder.find(
        remaining,
        state.used,
        state.recentTypes,
        { avoidType: lastExerciseType },
      );
      if (selected) return selected;
    }

    // Fallback: any valid candidate
    return this.alternativeFinder.find(
      remaining,
      state.used,
      state.recentTypes,
    );
  }

  private updateStateWithSelection(
    selected: DeliveryCandidate,
    state: SelectionState,
    maxSameTypeInRow: number,
  ): void {
    state.composed.push(selected);
    state.used.add(selected.id);

    // Update recent skill tags (keep last 5 unique)
    if (selected.skillTags && selected.skillTags.length > 0) {
      for (const skillTag of selected.skillTags) {
        state.recentSkillTags.push(skillTag);
      }
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      for (let i = state.recentSkillTags.length - 1; i >= 0; i--) {
        const tag = state.recentSkillTags[i];
        if (!seen.has(tag)) {
          seen.add(tag);
          deduplicated.unshift(tag);
        }
      }
      state.recentSkillTags.length = 0;
      state.recentSkillTags.push(...deduplicated.slice(-5));
    }

    // Update recent exercise types
    const exerciseType = selected.exerciseType || 'unknown';
    state.recentTypes.push(exerciseType);
    if (state.recentTypes.length > maxSameTypeInRow) {
      state.recentTypes.shift();
    }

    // Track used modalities
    if (selected.deliveryMethods) {
      selected.deliveryMethods.forEach((m) => state.usedModalities.add(m));
    }
  }

  private checkModalityCoverage(selected: DeliveryCandidate): boolean {
    const listeningSpeaking: DELIVERY_METHOD[] = [
      DELIVERY_METHOD.SPEECH_TO_TEXT,
      DELIVERY_METHOD.TEXT_TO_SPEECH,
    ];
    return (
      selected.deliveryMethods?.some((m) => listeningSpeaking.includes(m)) ??
      false
    );
  }
}
