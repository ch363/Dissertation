import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export type LearningPathCardStatus = 'active' | 'locked';

/**
 * DTO for the Learning Hub "Learning Path" carousel cards.
 * Matches `mobile/src/features/learn/mock.ts`'s `LearningPathCard` shape.
 */
export class LearningPathCardDto {
  @ApiProperty({ description: 'Module ID', example: '8b3c1e5b-6cf5-4a6a-8fe0-1c5b23a0f9f1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Module title', example: 'Basics' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'CEFR level label (placeholder)', example: 'A1' })
  @IsString()
  level: string;

  @ApiProperty({ description: 'Language flag (placeholder)', example: '🇮🇹' })
  @IsString()
  flag: string;

  @ApiProperty({ description: 'Short subtitle / description', example: 'Greetings & Essentials' })
  @IsString()
  subtitle: string;

  @ApiPropertyOptional({ description: 'Completed lesson count', example: 2, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  completed?: number;

  @ApiPropertyOptional({ description: 'Total lessons in module', example: 8, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  total?: number;

  @ApiProperty({ description: 'Card status (locked is reserved for future locking rules)', example: 'active' })
  @IsIn(['active', 'locked'])
  status: LearningPathCardStatus;

  @ApiPropertyOptional({ description: 'CTA label (placeholder)', example: 'Continue' })
  @IsOptional()
  @IsString()
  cta?: string;
}

