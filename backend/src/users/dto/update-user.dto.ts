import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DELIVERY_METHOD, KNOWLEDGE_LEVEL } from '@prisma/client';
import {
  sanitizeString,
  sanitizeUrl,
  sanitizeEnum,
} from '../../common/utils/sanitize.util';

/**
 * DTO for updating user information
 *
 * Security: Input validation and sanitization
 * - Name: Optional, max 200 chars, sanitized
 * - AvatarUrl: Optional, validated URL format, sanitized
 * - PreferredDeliveryMethod: Optional, validated enum
 * - KnowledgeLevel: Optional, validated enum
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Name must not exceed 200 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 200) : undefined))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048, { message: 'Avatar URL must not exceed 2048 characters' })
  @Matches(/^https?:\/\/.+/, {
    message: 'Avatar URL must be a valid HTTP/HTTPS URL',
  })
  @Transform(({ value }) => (value ? sanitizeUrl(value) : undefined))
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(DELIVERY_METHOD, {
    message: 'Preferred delivery method must be a valid delivery method',
  })
  @Transform(({ value }) =>
    value ? sanitizeEnum(value, Object.values(DELIVERY_METHOD)) : undefined,
  )
  preferredDeliveryMethod?: DELIVERY_METHOD;

  @IsOptional()
  @IsEnum(KNOWLEDGE_LEVEL, {
    message: 'Knowledge level must be a valid CEFR level (A1-C2)',
  })
  @Transform(({ value }) =>
    value ? sanitizeEnum(value, Object.values(KNOWLEDGE_LEVEL)) : undefined,
  )
  knowledgeLevel?: KNOWLEDGE_LEVEL;
}
