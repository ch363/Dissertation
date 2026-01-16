import { apiClient } from './client';

export interface SkillMastery {
  skillTag: string;
  masteryProbability: number;
  lastUpdated: string;
}

/**
 * Get all skill mastery levels for the current user
 */
export async function getAllMastery(): Promise<SkillMastery[]> {
  return apiClient.get<SkillMastery[]>('/me/mastery');
}
