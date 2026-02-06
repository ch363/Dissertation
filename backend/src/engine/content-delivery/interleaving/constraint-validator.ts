import { DeliveryCandidate } from '../types';

/**
 * ConstraintValidator
 *
 * Validates interleaving constraints for candidate selection.
 * Follows Single Responsibility Principle - focused on constraint validation only.
 */
export class ConstraintValidator {
  constructor(private maxSameTypeInRow: number = 2) {}

  /**
   * Check if selecting a candidate would violate constraints.
   */
  violatesConstraints(
    candidate: DeliveryCandidate,
    recentTypes: string[],
  ): boolean {
    const exerciseType = candidate.exerciseType || 'unknown';
    const recentSameType = recentTypes.filter((t) => t === exerciseType).length;
    return recentSameType >= this.maxSameTypeInRow;
  }

  /**
   * Update the max same type in row constraint.
   */
  setMaxSameTypeInRow(max: number): void {
    this.maxSameTypeInRow = max;
  }
}
