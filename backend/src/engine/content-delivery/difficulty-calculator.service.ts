/**
 * Difficulty Calculator Service
 *
 * Single source of truth for content difficulty calculation and classification.
 * Maps CEFR knowledge levels to base difficulty and adjusts for user mastery.
 */

import { Injectable } from '@nestjs/common';

export type DifficultyClass = 'easy' | 'medium' | 'hard';

/** Standalone classification for use in pure functions (e.g. content-delivery.policy). */
export function classifyDifficulty(
  difficulty: number,
  mastery: number,
): DifficultyClass {
  if (difficulty < 0.3 || mastery > 0.7) return 'easy';
  if (difficulty > 0.7 || mastery < 0.3) return 'hard';
  return 'medium';
}

@Injectable()
export class DifficultyCalculator {
  private readonly KNOWLEDGE_LEVEL_DIFFICULTY: Record<string, number> = {
    A1: 0.1,
    A2: 0.3,
    B1: 0.5,
    B2: 0.7,
    C1: 0.85,
    C2: 1.0,
  };

  /**
   * Map CEFR knowledge level to base difficulty (0 = easy, 1 = hard).
   */
  calculateBaseDifficulty(knowledgeLevel: string): number {
    return this.KNOWLEDGE_LEVEL_DIFFICULTY[knowledgeLevel] ?? 0.5;
  }

  /**
   * Adjust base difficulty based on user's estimated mastery.
   * Lower mastery = higher effective difficulty.
   */
  adjustDifficultyForMastery(
    baseDifficulty: number,
    estimatedMastery: number,
    adjustmentCap: number = 0.3,
  ): number {
    return baseDifficulty * (1 - estimatedMastery * adjustmentCap);
  }

  /**
   * Classify difficulty into easy / medium / hard for interleaving and selection.
   */
  classifyDifficulty(difficulty: number, mastery: number): DifficultyClass {
    return classifyDifficulty(difficulty, mastery);
  }
}
