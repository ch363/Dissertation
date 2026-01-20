/**
 * Mastery Service
 *
 * Implements Bayesian Knowledge Tracing (BKT) to track the probability
 * that a user knows each skill.
 *
 * BKT Parameters:
 * - Prior (P(L0)): Initial probability of knowing the skill
 * - Learn (P(T)): Probability of learning the skill after a practice opportunity
 * - Guess (P(G)): Probability of answering correctly when skill is not known
 * - Slip (P(S)): Probability of answering incorrectly when skill is known
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BktParameters {
  prior: number; // P(L0)
  learn: number; // P(T)
  guess: number; // P(G)
  slip: number; // P(S)
}

export interface SkillMastery {
  skillTag: string;
  masteryProbability: number;
  prior: number;
  learn: number;
  guess: number;
  slip: number;
}

@Injectable()
export class MasteryService {
  private readonly DEFAULT_PARAMETERS: BktParameters = {
    prior: 0.3, // 30% initial knowledge probability
    learn: 0.2, // 20% chance of learning per practice
    guess: 0.2, // 20% chance of guessing correctly
    slip: 0.1, // 10% chance of making a mistake when known
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Update mastery probability for a skill using BKT algorithm.
   *
   * BKT Update Formula:
   * If correct:
   *   P(L|correct) = (P(L) * (1 - P(S))) / (P(L) * (1 - P(S)) + (1 - P(L)) * P(G))
   *   P(L|next) = P(L|correct) + (1 - P(L|correct)) * P(T)
   *
   * If incorrect:
   *   P(L|incorrect) = (P(L) * P(S)) / (P(L) * P(S) + (1 - P(L)) * (1 - P(G)))
   *   P(L|next) = P(L|incorrect)
   *
   * @param userId User ID
   * @param skillTag Skill tag identifier
   * @param isCorrect Whether the user answered correctly
   * @returns Updated mastery probability
   */
  async updateMastery(
    userId: string,
    skillTag: string,
    isCorrect: boolean,
  ): Promise<number> {
    // Get or initialize mastery record
    let mastery = await this.getMasteryRecord(userId, skillTag);

    if (!mastery) {
      mastery = await this.initializeMastery(userId, skillTag);
    }

    const { masteryProbability, prior, learn, guess, slip } = mastery;

    let newMasteryProbability: number;

    if (isCorrect) {
      // P(L|correct) = (P(L) * (1 - P(S))) / (P(L) * (1 - P(S)) + (1 - P(L)) * P(G))
      const numerator = masteryProbability * (1 - slip);
      const denominator = numerator + (1 - masteryProbability) * guess;
      const pLGivenCorrect = numerator / denominator;

      // P(L|next) = P(L|correct) + (1 - P(L|correct)) * P(T)
      newMasteryProbability = pLGivenCorrect + (1 - pLGivenCorrect) * learn;
    } else {
      // P(L|incorrect) = (P(L) * P(S)) / (P(L) * P(S) + (1 - P(L)) * (1 - P(G)))
      const numerator = masteryProbability * slip;
      const denominator = numerator + (1 - masteryProbability) * (1 - guess);
      const pLGivenIncorrect = numerator / denominator;

      // P(L|next) = P(L|incorrect)
      newMasteryProbability = pLGivenIncorrect;
    }

    // Clamp to [0, 1]
    newMasteryProbability = Math.max(0, Math.min(1, newMasteryProbability));

    // Update database
    await this.prisma.userSkillMastery.update({
      where: {
        userId_skillTag: {
          userId,
          skillTag,
        },
      },
      data: {
        masteryProbability: newMasteryProbability,
      },
    });

    return newMasteryProbability;
  }

  /**
   * Get current mastery probability for a skill.
   * Returns the Prior if no record exists.
   *
   * @param userId User ID
   * @param skillTag Skill tag identifier
   * @returns Mastery probability (0.0 to 1.0)
   */
  async getMastery(userId: string, skillTag: string): Promise<number> {
    const mastery = await this.getMasteryRecord(userId, skillTag);
    return mastery?.masteryProbability ?? this.DEFAULT_PARAMETERS.prior;
  }

  /**
   * Get full mastery record including BKT parameters.
   *
   * @param userId User ID
   * @param skillTag Skill tag identifier
   * @returns Mastery record or null if not found
   */
  async getMasteryRecord(
    userId: string,
    skillTag: string,
  ): Promise<SkillMastery | null> {
    const record = await this.prisma.userSkillMastery.findUnique({
      where: {
        userId_skillTag: {
          userId,
          skillTag,
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      skillTag: record.skillTag,
      masteryProbability: record.masteryProbability,
      prior: record.prior,
      learn: record.learn,
      guess: record.guess,
      slip: record.slip,
    };
  }

  /**
   * Get all skills with mastery below the threshold.
   *
   * @param userId User ID
   * @param threshold Mastery threshold (default: 0.5)
   * @returns Array of skill tags with low mastery
   */
  async getLowMasterySkills(
    userId: string,
    threshold: number = 0.5,
  ): Promise<string[]> {
    const records = await this.prisma.userSkillMastery.findMany({
      where: {
        userId,
        masteryProbability: {
          lt: threshold,
        },
      },
      select: {
        skillTag: true,
      },
    });

    return records.map((r) => r.skillTag);
  }

  /**
   * Initialize mastery record with default BKT parameters.
   *
   * @param userId User ID
   * @param skillTag Skill tag identifier
   * @param parameters Optional custom BKT parameters
   * @returns Created mastery record
   */
  async initializeMastery(
    userId: string,
    skillTag: string,
    parameters?: Partial<BktParameters>,
  ): Promise<SkillMastery> {
    const params = {
      ...this.DEFAULT_PARAMETERS,
      ...parameters,
    };

    const record = await this.prisma.userSkillMastery.upsert({
      where: {
        userId_skillTag: {
          userId,
          skillTag,
        },
      },
      create: {
        userId,
        skillTag,
        masteryProbability: params.prior,
        prior: params.prior,
        learn: params.learn,
        guess: params.guess,
        slip: params.slip,
      },
      update: {},
    });

    return {
      skillTag: record.skillTag,
      masteryProbability: record.masteryProbability,
      prior: record.prior,
      learn: record.learn,
      guess: record.guess,
      slip: record.slip,
    };
  }

  /**
   * Get mastery for multiple skills at once.
   *
   * @param userId User ID
   * @param skillTags Array of skill tag identifiers
   * @returns Map of skillTag -> mastery probability
   */
  async getMasteries(
    userId: string,
    skillTags: string[],
  ): Promise<Map<string, number>> {
    const records = await this.prisma.userSkillMastery.findMany({
      where: {
        userId,
        skillTag: {
          in: skillTags,
        },
      },
    });

    const map = new Map<string, number>();
    const defaultPrior = this.DEFAULT_PARAMETERS.prior;

    // Initialize all requested skills
    for (const skillTag of skillTags) {
      const record = records.find((r) => r.skillTag === skillTag);
      map.set(skillTag, record?.masteryProbability ?? defaultPrior);
    }

    return map;
  }
}
