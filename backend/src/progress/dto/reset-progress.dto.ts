import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for resetting user progress
 *
 * Security: Input validation
 * - All fields are optional booleans with strict type checking
 * - Prevents injection via type coercion
 */
export class ResetProgressDto {
  @ApiPropertyOptional({
    description: 'Whether to reset XP/knowledge points',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeXp must be a boolean' })
  @Transform(({ value }) => {
    // Security: Only accept true boolean values, reject strings like "true"
    if (value === true || value === false) return value;
    return undefined;
  })
  includeXp?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to reset delivery method preferences',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeDeliveryMethodScores must be a boolean' })
  @Transform(({ value }) => {
    // Security: Only accept true boolean values, reject strings like "true"
    if (value === true || value === false) return value;
    return undefined;
  })
  includeDeliveryMethodScores?: boolean;
}
