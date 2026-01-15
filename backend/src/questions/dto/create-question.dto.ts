import { IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeUuid } from '../../common/utils/sanitize.util';
import { DELIVERY_METHOD } from '@prisma/client';

/**
 * DTO for creating a new question
 * 
 * Security: Input validation and sanitization
 * - TeachingId: Required, validated UUID format, sanitized
 * - Type: Required, validated delivery method enum
 */
export class CreateQuestionDto {
  @IsUUID(4, { message: 'Teaching ID must be a valid UUID v4' })
  @Transform(({ value }) => sanitizeUuid(value))
  teachingId: string;

  @IsEnum(DELIVERY_METHOD, { message: 'Type must be a valid delivery method' })
  type: DELIVERY_METHOD;
}
