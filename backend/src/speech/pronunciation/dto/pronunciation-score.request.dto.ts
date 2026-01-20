import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  sanitizeBase64,
  sanitizeString,
} from '../../../common/utils/sanitize.util';

const DEFAULT_MAX_AUDIO_BASE64_LENGTH = 13333333; // ~10MB in base64
const DEFAULT_MAX_REFERENCE_TEXT_LENGTH = 500;
const DEFAULT_MAX_LOCALE_LENGTH = 20;

// Conservative BCP-47-ish validation (e.g. it-IT, en-US, pt-BR)
const LOCALE_REGEX = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})+$/;

export class PronunciationScoreRequestDto {
  @ApiProperty({
    description:
      'Audio file as base64 string (prefer WAV PCM). Data-URL prefix is allowed.',
    type: 'string',
    format: 'base64',
  })
  @IsNotEmpty({ message: 'Audio base64 data is required' })
  @IsString()
  @MaxLength(DEFAULT_MAX_AUDIO_BASE64_LENGTH, {
    message: 'Audio file must not exceed 10MB',
  })
  @Transform(({ value }) =>
    sanitizeBase64(value, DEFAULT_MAX_AUDIO_BASE64_LENGTH),
  )
  audioBase64: string;

  @ApiProperty({
    description: 'Expected reference text (what the user was supposed to say)',
    example: 'Come stai?',
  })
  @IsNotEmpty({ message: 'Reference text is required' })
  @IsString()
  @MaxLength(DEFAULT_MAX_REFERENCE_TEXT_LENGTH, {
    message: `Reference text must not exceed ${DEFAULT_MAX_REFERENCE_TEXT_LENGTH} characters`,
  })
  @Transform(({ value }) =>
    sanitizeString(value, DEFAULT_MAX_REFERENCE_TEXT_LENGTH),
  )
  referenceText: string;

  @ApiProperty({
    description: 'Locale/recognition language (BCP-47, e.g. it-IT)',
    example: 'it-IT',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(DEFAULT_MAX_LOCALE_LENGTH, {
    message: `Locale must not exceed ${DEFAULT_MAX_LOCALE_LENGTH} characters`,
  })
  @Matches(LOCALE_REGEX, {
    message: 'Locale must be a valid BCP-47 language tag (e.g. it-IT)',
  })
  @Transform(({ value }) => sanitizeString(value, DEFAULT_MAX_LOCALE_LENGTH))
  locale?: string;
}
