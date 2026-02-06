import { DeliveryCandidate } from '../types';
import { classifyDifficulty } from '../difficulty-calculator.service';

/**
 * Classification result containing candidates grouped by difficulty band.
 */
export interface ClassifiedCandidates {
  reviewItemsHighMastery: DeliveryCandidate[];
  easy: DeliveryCandidate[];
  medium: DeliveryCandidate[];
  hard: DeliveryCandidate[];
}

/**
 * CandidateClassifier
 *
 * Groups candidates by difficulty/mastery bands.
 * Follows Single Responsibility Principle - focused on classification only.
 */
export class CandidateClassifier {
  /**
   * Classify candidates into difficulty bands based on difficulty and mastery.
   */
  classify(candidates: DeliveryCandidate[]): ClassifiedCandidates {
    const result: ClassifiedCandidates = {
      reviewItemsHighMastery: [],
      easy: [],
      medium: [],
      hard: [],
    };

    for (const candidate of candidates) {
      // High mastery reviews for scaffolding
      if (candidate.dueScore > 0 && (candidate.estimatedMastery ?? 0) > 0.7) {
        result.reviewItemsHighMastery.push(candidate);
      }

      // Classify by difficulty band
      const difficulty = candidate.difficulty ?? 0.5;
      const mastery = candidate.estimatedMastery ?? 0.5;
      const band = classifyDifficulty(difficulty, mastery);

      if (band === 'easy') {
        result.easy.push(candidate);
      } else if (band === 'hard') {
        result.hard.push(candidate);
      } else {
        result.medium.push(candidate);
      }
    }

    return result;
  }
}
