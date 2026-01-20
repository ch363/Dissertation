import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { KNOWLEDGE_LEVEL } from '@prisma/client';
import { sanitizeString, sanitizeEnum } from '../../common/utils/sanitize.util';

/**
 * DTO for updating a teaching
 *
 * Security: Input validation and sanitization
 * - All fields optional for partial updates
 * - Same validation rules as CreateTeachingDto
 */
export class UpdateTeachingDto {
  @IsOptional()
  @IsEnum(KNOWLEDGE_LEVEL, {
    message: 'Knowledge level must be a valid CEFR level (A1-C2)',
  })
  @Transform(({ value }) =>
    value ? sanitizeEnum(value, Object.values(KNOWLEDGE_LEVEL)) : undefined,
  )
  knowledgeLevel?: KNOWLEDGE_LEVEL;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Emoji must not exceed 10 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 10) : undefined))
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'User language string must not exceed 1000 characters',
  })
  @Transform(({ value }) => (value ? sanitizeString(value, 1000) : undefined))
  userLanguageString?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Learning language string must not exceed 1000 characters',
  })
  @Transform(({ value }) => (value ? sanitizeString(value, 1000) : undefined))
  learningLanguageString?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Tip must not exceed 2000 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 2000) : undefined))
  tip?: string;
}
