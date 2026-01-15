import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeString, sanitizeUrl } from '../../common/utils/sanitize.util';

/**
 * DTO for updating a module
 * 
 * Security: Input validation and sanitization
 * - All fields optional for partial updates
 * - Same validation rules as CreateModuleDto
 */
export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => value ? sanitizeString(value, 200) : undefined)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  @Transform(({ value }) => value ? sanitizeString(value, 5000) : undefined)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048, { message: 'Image URL must not exceed 2048 characters' })
  @Matches(/^https?:\/\/.+/, { message: 'Image URL must be a valid HTTP/HTTPS URL' })
  @Transform(({ value }) => value ? sanitizeUrl(value) : undefined)
  imageUrl?: string;
}
