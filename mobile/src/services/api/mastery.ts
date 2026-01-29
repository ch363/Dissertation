import { apiClient } from './client';

export interface SkillMastery {
  skillType: string;
  skillTag: string;
  masteryProbability: number;
  averageMastery: number;
  masteredCount: number;
  totalCount: number;
  lastUpdated: string;
}

/**
 * Get all skill mastery levels for the current user
 */
export async function getAllMastery(): Promise<SkillMastery[]> {
  return apiClient.get<SkillMastery[]>('/me/mastery');
}
