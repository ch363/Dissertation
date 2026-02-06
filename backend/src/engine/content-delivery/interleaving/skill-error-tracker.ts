import { DeliveryCandidate } from '../types';

/**
 * SkillErrorTracker
 *
 * Tracks skill tag errors for scaffolding decisions.
 * Follows Single Responsibility Principle - focused on error tracking only.
 */
export class SkillErrorTracker {
  private errorMap = new Map<string, number>();

  /**
   * Build error map from candidates.
   * Tracks maximum error score per skill tag.
   */
  buildFromCandidates(candidates: DeliveryCandidate[]): void {
    this.errorMap.clear();

    for (const candidate of candidates) {
      if (
        candidate.skillTags &&
        candidate.skillTags.length > 0 &&
        candidate.errorScore > 0
      ) {
        for (const skillTag of candidate.skillTags) {
          const currentErrorCount = this.errorMap.get(skillTag) || 0;
          this.errorMap.set(
            skillTag,
            Math.max(currentErrorCount, candidate.errorScore),
          );
        }
      }
    }
  }

  /**
   * Get skill tags that need scaffolding (error count >= threshold).
   */
  getSkillsNeedingScaffolding(threshold: number = 3): string[] {
    const skills: string[] = [];
    for (const [skillTag, errorCount] of this.errorMap.entries()) {
      if (errorCount >= threshold) {
        skills.push(skillTag);
      }
    }
    return skills;
  }

  /**
   * Reset error count for a skill tag (after scaffolding applied).
   */
  resetSkillError(skillTag: string): void {
    this.errorMap.set(skillTag, 0);
  }

  /**
   * Get current error count for a skill tag.
   */
  getErrorCount(skillTag: string): number {
    return this.errorMap.get(skillTag) || 0;
  }
}
