import { Injectable } from '@nestjs/common';
import { OnboardingPreferencesService } from '../../onboarding/onboarding-preferences.service';
import { UserSkillMasteryRepository } from '../repositories';

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

/**
 * MasteryService
 *
 * Manages user skill mastery using Bayesian Knowledge Tracing (BKT).
 * Follows Dependency Inversion Principle - depends on repository interfaces.
 */
@Injectable()
export class MasteryService {
  private readonly DEFAULT_PARAMETERS: BktParameters = {
    prior: 0.3,
    learn: 0.2,
    guess: 0.2,
    slip: 0.1,
  };

  constructor(
    private userSkillMasteryRepo: UserSkillMasteryRepository,
    private onboardingPreferences: OnboardingPreferencesService,
  ) {}

  async updateMastery(
    userId: string,
    skillTag: string,
    isCorrect: boolean,
  ): Promise<number> {
    let mastery = await this.getMasteryRecord(userId, skillTag);

    if (!mastery) {
      mastery = await this.initializeMastery(userId, skillTag);
    }

    const { masteryProbability, prior, learn, guess, slip } = mastery;

    let newMasteryProbability: number;

    if (isCorrect) {
      const numerator = masteryProbability * (1 - slip);
      const denominator = numerator + (1 - masteryProbability) * guess;
      const pLGivenCorrect = numerator / denominator;

      newMasteryProbability = pLGivenCorrect + (1 - pLGivenCorrect) * learn;
    } else {
      const numerator = masteryProbability * slip;
      const denominator = numerator + (1 - masteryProbability) * (1 - guess);
      const pLGivenIncorrect = numerator / denominator;

      newMasteryProbability = pLGivenIncorrect;
    }

    newMasteryProbability = Math.max(0, Math.min(1, newMasteryProbability));

    await this.userSkillMasteryRepo.updateMasteryProbability(
      userId,
      skillTag,
      newMasteryProbability,
    );

    return newMasteryProbability;
  }

  async getMastery(userId: string, skillTag: string): Promise<number> {
    const mastery = await this.getMasteryRecord(userId, skillTag);
    return mastery?.masteryProbability ?? this.DEFAULT_PARAMETERS.prior;
  }

  async getMasteryRecord(
    userId: string,
    skillTag: string,
  ): Promise<SkillMastery | null> {
    const record = await this.userSkillMasteryRepo.findByUserAndSkillTag(
      userId,
      skillTag,
    );

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

  async getLowMasterySkills(
    userId: string,
    threshold: number = 0.5,
  ): Promise<string[]> {
    return this.userSkillMasteryRepo.findLowMasterySkills(userId, threshold);
  }

  async initializeMastery(
    userId: string,
    skillTag: string,
    parameters?: Partial<BktParameters>,
  ): Promise<SkillMastery> {
    let baseParams = this.DEFAULT_PARAMETERS;
    if (!parameters) {
      const onboardingParams =
        await this.onboardingPreferences.getInitialBktParameters(userId);
      if (onboardingParams) {
        baseParams = onboardingParams;
      }
    }

    const params = {
      ...baseParams,
      ...parameters,
    };

    const record = await this.userSkillMasteryRepo.upsertMastery(
      userId,
      skillTag,
      {
        masteryProbability: params.prior,
        prior: params.prior,
        learn: params.learn,
        guess: params.guess,
        slip: params.slip,
      },
    );

    return {
      skillTag: record.skillTag,
      masteryProbability: record.masteryProbability,
      prior: record.prior,
      learn: record.learn,
      guess: record.guess,
      slip: record.slip,
    };
  }

  async getMasteries(
    userId: string,
    skillTags: string[],
  ): Promise<Map<string, number>> {
    const records = await this.userSkillMasteryRepo.findManyByUserAndSkillTags(
      userId,
      skillTags,
    );

    const map = new Map<string, number>();
    const defaultPrior = this.DEFAULT_PARAMETERS.prior;

    for (const skillTag of skillTags) {
      const record = records.find((r) => r.skillTag === skillTag);
      map.set(skillTag, record?.masteryProbability ?? defaultPrior);
    }

    return map;
  }
}
