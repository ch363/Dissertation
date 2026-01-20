import { IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInt } from '../../common/utils/sanitize.util';

/**
 * DTO for recording knowledge level progress (XP)
 *
 * Security: Input validation and sanitization
 * - Value: Required, non-negative integer (XP points)
 */
export class KnowledgeLevelProgressDto {
  @IsInt()
  @Min(0, { message: 'XP value must be non-negative' })
  @Max(1000000, { message: 'XP value must not exceed 1,000,000' })
  @Transform(({ value }) => sanitizeInt(value, 0, 1000000) ?? value)
  value: number;
}
