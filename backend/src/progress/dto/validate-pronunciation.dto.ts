import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  sanitizeBase64,
  sanitizeString,
  sanitizeEnum,
} from '../../common/utils/sanitize.util';

/**
 * DTO for validating pronunciation from audio recording
 *
 * Security: Input validation and sanitization
 * - AudioBase64: Required, validated base64 format, max 10MB (~13.3M chars in base64)
 * - AudioFormat: Required, validated enum (wav, flac, m4a, mp3, ogg)
 */
const ALLOWED_AUDIO_FORMATS = ['wav', 'flac', 'm4a', 'mp3', 'ogg'] as const;

export class ValidatePronunciationDto {
  @ApiProperty({
    description: 'Audio file as base64 string',
    type: 'string',
    format: 'base64',
  })
  @IsNotEmpty({ message: 'Audio base64 data is required' })
  @IsString()
  @MaxLength(13333333, { message: 'Audio file must not exceed 10MB' })
  @Transform(({ value }) => sanitizeBase64(value, 13333333))
  audioBase64: string;

  @ApiProperty({
    description: 'Audio format (e.g., "wav", "flac", "m4a")',
    example: 'wav',
  })
  @IsNotEmpty({ message: 'Audio format is required' })
  @IsString()
  @MaxLength(10, { message: 'Audio format must not exceed 10 characters' })
  @Matches(/^[a-z0-9]+$/i, {
    message: 'Audio format must contain only alphanumeric characters',
  })
  @Transform(
    ({ value }) =>
      sanitizeEnum(value?.toLowerCase(), ALLOWED_AUDIO_FORMATS) ??
      sanitizeString(value?.toLowerCase(), 10),
  )
  audioFormat: string;
}
