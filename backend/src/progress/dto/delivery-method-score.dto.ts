import { IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInt } from '../../common/utils/sanitize.util';

/**
 * DTO for updating delivery method preference score
 * 
 * Security: Input validation and sanitization
 * - Delta: Required, number between -100 and 100 (score adjustment)
 */
export class DeliveryMethodScoreDto {
  @IsNumber()
  @Min(-100, { message: 'Delta must be at least -100' })
  @Max(100, { message: 'Delta must not exceed 100' })
  @Transform(({ value }) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? value : Math.max(-100, Math.min(100, num));
  })
  delta: number;
}
