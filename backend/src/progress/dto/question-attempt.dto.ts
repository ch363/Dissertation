import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInt } from '../../common/utils/sanitize.util';
import { DELIVERY_METHOD } from '@prisma/client';

/**
 * DTO for recording a question attempt
 *
 * Security: Input validation and sanitization
 * - Score: Required, integer between 0-100
 * - TimeToComplete: Optional, non-negative integer (milliseconds)
 * - PercentageAccuracy: Optional, integer between 0-100
 * - Attempts: Optional, non-negative integer
 */
export class QuestionAttemptDto {
  @IsEnum(DELIVERY_METHOD, {
    message: 'Delivery method must be a valid delivery method',
  })
  deliveryMethod: DELIVERY_METHOD;

  @IsInt()
  @Min(0, { message: 'Score must be non-negative' })
  @Max(100, { message: 'Score must not exceed 100' })
  @Transform(({ value }) => sanitizeInt(value, 0, 100) ?? value)
  score: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Time to complete must be non-negative' })
  @Max(3600000, {
    message: 'Time to complete must not exceed 1 hour (3600000ms)',
  })
  @Transform(({ value }) =>
    value !== undefined ? sanitizeInt(value, 0, 3600000) : undefined,
  )
  timeToComplete?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Percentage accuracy must be non-negative' })
  @Max(100, { message: 'Percentage accuracy must not exceed 100' })
  @Transform(({ value }) =>
    value !== undefined ? sanitizeInt(value, 0, 100) : undefined,
  )
  percentageAccuracy?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Attempts must be at least 1' })
  @Max(1000, { message: 'Attempts must not exceed 1000' })
  @Transform(({ value }) =>
    value !== undefined ? sanitizeInt(value, 1, 1000) : undefined,
  )
  attempts?: number;
}
