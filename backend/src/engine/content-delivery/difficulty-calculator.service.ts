import { Injectable } from '@nestjs/common';

export type DifficultyClass = 'easy' | 'medium' | 'hard';

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

  calculateBaseDifficulty(knowledgeLevel: string): number {
    return this.KNOWLEDGE_LEVEL_DIFFICULTY[knowledgeLevel] ?? 0.5;
  }

  adjustDifficultyForMastery(
    baseDifficulty: number,
    estimatedMastery: number,
    adjustmentCap: number = 0.3,
  ): number {
    return baseDifficulty * (1 - estimatedMastery * adjustmentCap);
  }

  classifyDifficulty(difficulty: number, mastery: number): DifficultyClass {
    return classifyDifficulty(difficulty, mastery);
  }
}
