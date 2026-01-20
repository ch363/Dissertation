import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { KNOWLEDGE_LEVEL } from '@prisma/client';
import {
  sanitizeString,
  sanitizeEnum,
  sanitizeInt,
} from '../../common/utils/sanitize.util';

/**
 * DTO for search queries
 *
 * Security: Input validation and sanitization
 * - Query: Optional, max 500 chars, sanitized
 * - Level: Optional, validated enum
 * - Topic: Optional, max 200 chars, sanitized
 * - Type: Optional, validated enum
 * - Limit: Optional, integer between 1-100
 * - Offset: Optional, non-negative integer
 */
const ALLOWED_SEARCH_TYPES = [
  'module',
  'lesson',
  'teaching',
  'question',
] as const;

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Search query must not exceed 500 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 500) : undefined))
  q?: string; // Search query text

  @IsOptional()
  @IsEnum(KNOWLEDGE_LEVEL, {
    message: 'Knowledge level must be a valid CEFR level (A1-C2)',
  })
  @Transform(({ value }) =>
    value ? sanitizeEnum(value, Object.values(KNOWLEDGE_LEVEL)) : undefined,
  )
  level?: KNOWLEDGE_LEVEL; // Filter by knowledge level

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Topic must not exceed 200 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 200) : undefined))
  topic?: string; // Filter by topic (could be a tag or category)

  @IsOptional()
  @IsString()
  @IsEnum(ALLOWED_SEARCH_TYPES, {
    message: 'Type must be one of: module, lesson, teaching, question',
  })
  @Transform(({ value }) =>
    value
      ? sanitizeEnum(value?.toLowerCase(), ALLOWED_SEARCH_TYPES)
      : undefined,
  )
  type?: 'module' | 'lesson' | 'teaching' | 'question'; // Content type filter

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  @Transform(({ value }) =>
    value !== undefined ? sanitizeInt(value, 1, 100) : undefined,
  )
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Offset must be non-negative' })
  @Max(10000, { message: 'Offset must not exceed 10000' })
  @Transform(({ value }) =>
    value !== undefined ? sanitizeInt(value, 0, 10000) : undefined,
  )
  offset?: number;
}
