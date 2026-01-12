import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class QuestionAttemptDto {
  @IsInt()
  score: number;

  @IsOptional()
  @IsInt()
  timeToComplete?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percentageAccuracy?: number;

  @IsOptional()
  @IsInt()
  attempts?: number;
}
