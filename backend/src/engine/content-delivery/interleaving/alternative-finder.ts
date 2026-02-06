import { DeliveryCandidate } from '../types';
import { ConstraintValidator } from './constraint-validator';

/**
 * AlternativeFinderOptions
 */
export interface AlternativeFinderOptions {
  avoidType?: string;
  preferSkillTag?: string;
  requireSkillTag?: string;
  avoidSkillTags?: string[];
}

/**
 * AlternativeFinder
 *
 * Finds alternative candidates from a pool based on various criteria.
 * Follows Single Responsibility Principle - focused on finding alternatives only.
 */
export class AlternativeFinder {
  constructor(private constraintValidator: ConstraintValidator) {}

  /**
   * Find an alternative candidate from the pool.
   * Applies multiple filter strategies in priority order.
   */
  find(
    pool: DeliveryCandidate[],
    used: Set<string>,
    recentTypes: string[],
    options: AlternativeFinderOptions = {},
  ): DeliveryCandidate | null {
    const { avoidType, requireSkillTag, avoidSkillTags } = options;

    // Strategy 1: Require specific skill tag
    if (requireSkillTag) {
      const candidate = this.findWithRequiredSkillTag(
        pool,
        used,
        recentTypes,
        requireSkillTag,
      );
      if (candidate) return candidate;
    }

    // Strategy 2: Avoid specific skill tags
    if (avoidSkillTags && avoidSkillTags.length > 0) {
      const candidate = this.findAvoidingSkillTags(
        pool,
        used,
        recentTypes,
        avoidType,
        avoidSkillTags,
      );
      if (candidate) return candidate;
    }

    // Strategy 3: Avoid specific exercise type
    if (avoidType) {
      const candidate = this.findAvoidingType(pool, used, recentTypes, avoidType);
      if (candidate) return candidate;
    }

    // Strategy 4: Any valid candidate
    const candidate = this.findAnyValid(pool, used, recentTypes);
    if (candidate) return candidate;

    // Strategy 5: Fallback - any unused candidate (ignoring constraints)
    return this.findAnyUnused(pool, used);
  }

  private findWithRequiredSkillTag(
    pool: DeliveryCandidate[],
    used: Set<string>,
    recentTypes: string[],
    requiredSkillTag: string,
  ): DeliveryCandidate | null {
    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      if (this.constraintValidator.violatesConstraints(candidate, recentTypes))
        continue;
      if (candidate.skillTags?.includes(requiredSkillTag)) {
        return candidate;
      }
    }
    return null;
  }

  private findAvoidingSkillTags(
    pool: DeliveryCandidate[],
    used: Set<string>,
    recentTypes: string[],
    avoidType: string | undefined,
    avoidSkillTags: string[],
  ): DeliveryCandidate | null {
    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      if (this.constraintValidator.violatesConstraints(candidate, recentTypes))
        continue;
      if (avoidType && candidate.exerciseType === avoidType) continue;

      const hasDifferentSkillTag = !candidate.skillTags?.some((tag) =>
        avoidSkillTags.includes(tag),
      );
      if (hasDifferentSkillTag) {
        return candidate;
      }
    }
    return null;
  }

  private findAvoidingType(
    pool: DeliveryCandidate[],
    used: Set<string>,
    recentTypes: string[],
    avoidType: string,
  ): DeliveryCandidate | null {
    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      if (this.constraintValidator.violatesConstraints(candidate, recentTypes))
        continue;
      if (candidate.exerciseType !== avoidType) {
        return candidate;
      }
    }
    return null;
  }

  private findAnyValid(
    pool: DeliveryCandidate[],
    used: Set<string>,
    recentTypes: string[],
  ): DeliveryCandidate | null {
    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      if (!this.constraintValidator.violatesConstraints(candidate, recentTypes)) {
        return candidate;
      }
    }
    return null;
  }

  private findAnyUnused(
    pool: DeliveryCandidate[],
    used: Set<string>,
  ): DeliveryCandidate | null {
    for (const candidate of pool) {
      if (!used.has(candidate.id)) {
        return candidate;
      }
    }
    return null;
  }
}
