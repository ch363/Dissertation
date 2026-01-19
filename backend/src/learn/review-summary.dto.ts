import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

/**
 * DTO for the Learning Hub "Review" section.
 * Matches `mobile/src/features/learn/mock.ts`'s `ReviewSummary` shape.
 */
export class ReviewSummaryDto {
  @ApiProperty({ description: 'Number of items due for review', example: 5, minimum: 0 })
  @IsInt()
  @Min(0)
  dueCount: number;

  @ApiProperty({ description: 'Progress 0-1 (placeholder heuristic)', example: 0.32, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  progress: number;

  @ApiProperty({ description: 'Subtitle text for the review card', example: '5 items need review today' })
  @IsString()
  subtitle: string;
}

