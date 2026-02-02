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

export async function getAllMastery(): Promise<SkillMastery[]> {
  return apiClient.get<SkillMastery[]>('/me/mastery');
}
