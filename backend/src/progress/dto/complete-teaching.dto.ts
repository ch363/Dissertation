import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInt } from '../../common/utils/sanitize.util';

/**
 * Optional body for completing a teaching (e.g. time spent on the teaching slide).
 * Used for study time calculation.
 */
export class CompleteTeachingDto {
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Time spent must be non-negative' })
  @Max(3600000, { message: 'Time spent must not exceed 1 hour (3600000ms)' })
  @Transform(({ value }) =>
    value !== undefined ? sanitizeInt(value, 0, 3600000) : undefined,
  )
  timeSpentMs?: number;
}
