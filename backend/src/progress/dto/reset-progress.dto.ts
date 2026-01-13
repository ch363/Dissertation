import { IsOptional, IsBoolean } from 'class-validator';

export class ResetProgressDto {
  @IsOptional()
  @IsBoolean()
  includeXp?: boolean; // Whether to reset XP/knowledge points

  @IsOptional()
  @IsBoolean()
  includeDeliveryMethodScores?: boolean; // Whether to reset delivery method preferences
}
