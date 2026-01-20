import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DELIVERY_METHOD } from '@prisma/client';
import {
  sanitizeString,
  sanitizeEnum,
  sanitizeInt,
} from '../../common/utils/sanitize.util';

/**
 * DTO for validating a user's answer
 *
 * Security: Input validation and sanitization
 * - Answer: Required, max 5000 chars (for text answers), sanitized
 * - DeliveryMethod: Required, validated enum
 * - TimeToComplete: Optional, non-negative integer (milliseconds)
 */
export class ValidateAnswerDto {
  @ApiProperty({
    description:
      "User's answer (text for translation/fill-blank/listening, option ID for multiple choice)",
    example: 'Grazie',
  })
  @IsString()
  @MaxLength(5000, { message: 'Answer must not exceed 5000 characters' })
  @Transform(({ value }) => sanitizeString(value, 5000))
  answer: string;

  @ApiProperty({
    description: 'Delivery method to determine validation logic',
    enum: DELIVERY_METHOD,
    example: DELIVERY_METHOD.TEXT_TRANSLATION,
  })
  @IsEnum(DELIVERY_METHOD, {
    message: 'Delivery method must be a valid delivery method',
  })
  @Transform(({ value }) => sanitizeEnum(value, Object.values(DELIVERY_METHOD)))
  deliveryMethod: DELIVERY_METHOD;

  @ApiPropertyOptional({
    description:
      'Time taken to complete in milliseconds (for future scoring refinement)',
    example: 5000,
  })
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
}
