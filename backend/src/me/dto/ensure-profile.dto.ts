import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { sanitizeString } from '../../common/utils/sanitize.util';

/**
 * DTO for ensuring user profile exists with optional name
 * 
 * Security: Input validation and sanitization
 * - Name: Optional, max 200 chars, sanitized
 */
export class EnsureProfileDto {
  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Name must not exceed 200 characters' })
  @Transform(({ value }) => value ? sanitizeString(value, 200) : undefined)
  name?: string;
}
