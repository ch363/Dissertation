import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeString, sanitizeUrl } from '../../common/utils/sanitize.util';

/**
 * DTO for creating a new module
 *
 * Security: Input validation and sanitization
 * - Title: Required, max 200 chars, sanitized
 * - Description: Optional, max 5000 chars, sanitized
 * - ImageUrl: Optional, validated URL format, sanitized
 */
export class CreateModuleDto {
  @IsString()
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => sanitizeString(value, 200))
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  @Transform(({ value }) => (value ? sanitizeString(value, 5000) : undefined))
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048, { message: 'Image URL must not exceed 2048 characters' })
  @Matches(/^https?:\/\/.+/, {
    message: 'Image URL must be a valid HTTP/HTTPS URL',
  })
  @Transform(({ value }) => (value ? sanitizeUrl(value) : undefined))
  imageUrl?: string;
}
