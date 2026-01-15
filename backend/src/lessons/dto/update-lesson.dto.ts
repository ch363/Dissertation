import { IsString, IsOptional, IsInt, MaxLength, Matches, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeString, sanitizeUrl, sanitizeInt } from '../../common/utils/sanitize.util';

/**
 * DTO for updating a lesson
 * 
 * Security: Input validation and sanitization
 * - All fields optional for partial updates
 * - Same validation rules as CreateLessonDto
 */
export class UpdateLessonDto {
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

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Number of items must be non-negative' })
  @Max(10000, { message: 'Number of items must not exceed 10000' })
  @Transform(({ value }) => value !== undefined ? sanitizeInt(value, 0, 10000) : undefined)
  numberOfItems?: number;
}
