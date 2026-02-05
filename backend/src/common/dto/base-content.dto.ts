import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { sanitizeString, sanitizeUrl } from '../utils/sanitize.util';
import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_URL_LENGTH,
} from '../constants';

/**
 * Base DTO class for content entities with title, description, and imageUrl
 * Provides consistent validation and sanitization for Module, Lesson, etc.
 *
 * Extend this class and override properties as needed:
 * - For create DTOs: title is required
 * - For update DTOs: all fields are optional
 */
export class BaseContentDto {
  @ApiProperty({
    description: 'Title of the content',
    maxLength: MAX_TITLE_LENGTH,
    example: 'Introduction to Italian',
  })
  @IsString()
  @MaxLength(MAX_TITLE_LENGTH, {
    message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
  })
  @Transform(({ value }) => sanitizeString(value, MAX_TITLE_LENGTH))
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the content',
    maxLength: MAX_DESCRIPTION_LENGTH,
    example: 'Learn the basics of Italian language',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH, {
    message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  })
  @Transform(({ value }) =>
    value ? sanitizeString(value, MAX_DESCRIPTION_LENGTH) : undefined,
  )
  description?: string;

  @ApiPropertyOptional({
    description: 'URL to an image for the content',
    maxLength: MAX_URL_LENGTH,
    example: 'https://example.com/image.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_URL_LENGTH, {
    message: `Image URL must not exceed ${MAX_URL_LENGTH} characters`,
  })
  @Matches(/^https?:\/\/.+/, {
    message: 'Image URL must be a valid HTTP/HTTPS URL',
  })
  @Transform(({ value }) => (value ? sanitizeUrl(value) : undefined))
  imageUrl?: string;
}

/**
 * Base DTO for update operations where all fields are optional
 */
export class BaseContentUpdateDto {
  @ApiPropertyOptional({
    description: 'Title of the content',
    maxLength: MAX_TITLE_LENGTH,
    example: 'Introduction to Italian',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TITLE_LENGTH, {
    message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
  })
  @Transform(({ value }) =>
    value ? sanitizeString(value, MAX_TITLE_LENGTH) : undefined,
  )
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the content',
    maxLength: MAX_DESCRIPTION_LENGTH,
    example: 'Learn the basics of Italian language',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH, {
    message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  })
  @Transform(({ value }) =>
    value ? sanitizeString(value, MAX_DESCRIPTION_LENGTH) : undefined,
  )
  description?: string;

  @ApiPropertyOptional({
    description: 'URL to an image for the content',
    maxLength: MAX_URL_LENGTH,
    example: 'https://example.com/image.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_URL_LENGTH, {
    message: `Image URL must not exceed ${MAX_URL_LENGTH} characters`,
  })
  @Matches(/^https?:\/\/.+/, {
    message: 'Image URL must be a valid HTTP/HTTPS URL',
  })
  @Transform(({ value }) => (value ? sanitizeUrl(value) : undefined))
  imageUrl?: string;
}
