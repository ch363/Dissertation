import { IsString, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { sanitizeUrl } from '../../common/utils/sanitize.util';

/**
 * DTO for uploading user avatar
 *
 * Security: Input validation and sanitization
 * - AvatarUrl: Required, validated URL format (HTTP/HTTPS only), sanitized
 */
export class UploadAvatarDto {
  @ApiProperty({
    description: 'Avatar image URL (must be HTTPS)',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @MaxLength(2048, { message: 'Avatar URL must not exceed 2048 characters' })
  @Matches(/^https?:\/\/.+/, {
    message: 'Avatar URL must be a valid HTTP/HTTPS URL',
  })
  @Transform(({ value }) => sanitizeUrl(value))
  avatarUrl: string;
}
