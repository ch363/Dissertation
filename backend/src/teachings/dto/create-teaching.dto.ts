import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { KNOWLEDGE_LEVEL } from '@prisma/client';
import {
  sanitizeString,
  sanitizeUuid,
  sanitizeEnum,
} from '../../common/utils/sanitize.util';

/**
 * DTO for creating a new teaching
 *
 * Security: Input validation and sanitization
 * - KnowledgeLevel: Required, validated enum
 * - Emoji: Optional, max 10 chars (single emoji)
 * - UserLanguageString: Required, max 1000 chars, sanitized
 * - LearningLanguageString: Required, max 1000 chars, sanitized
 * - Tip: Optional, max 2000 chars, sanitized
 * - LessonId: Required, validated UUID format, sanitized
 */
export class CreateTeachingDto {
  @IsEnum(KNOWLEDGE_LEVEL, {
    message: 'Knowledge level must be a valid CEFR level (A1-C2)',
  })
  @Transform(({ value }) => sanitizeEnum(value, Object.values(KNOWLEDGE_LEVEL)))
  knowledgeLevel: KNOWLEDGE_LEVEL;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Emoji must not exceed 10 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 10) : undefined))
  emoji?: string;

  @IsString()
  @MaxLength(1000, {
    message: 'User language string must not exceed 1000 characters',
  })
  @Transform(({ value }) => sanitizeString(value, 1000))
  userLanguageString: string;

  @IsString()
  @MaxLength(1000, {
    message: 'Learning language string must not exceed 1000 characters',
  })
  @Transform(({ value }) => sanitizeString(value, 1000))
  learningLanguageString: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Tip must not exceed 2000 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 2000) : undefined))
  tip?: string;

  @IsUUID(4, { message: 'Lesson ID must be a valid UUID v4' })
  @Transform(({ value }) => sanitizeUuid(value))
  lessonId: string;
}
