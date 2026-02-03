import { ApiProperty } from '@nestjs/swagger';

export const PRONUNCIATION_ERROR_TYPES = [
  'None',
  'Omission',
  'Insertion',
  'Mispronunciation',
  'UnexpectedBreak',
  'MissingBreak',
] as const;
export type PronunciationErrorTypeDto = (typeof PRONUNCIATION_ERROR_TYPES)[number];

export class PhonemeScoreDto {
  @ApiProperty({ description: 'Phoneme symbol', example: 'k' })
  phoneme: string;
  @ApiProperty({ description: 'Accuracy 0-100', example: 85, minimum: 0, maximum: 100 })
  accuracy: number;
}

export class WordAnalysisDto {
  @ApiProperty({
    description: 'Word text',
    example: 'Come',
  })
  word: string;

  @ApiProperty({
    description: 'Pronunciation score for this word (0-100)',
    example: 95,
    minimum: 0,
    maximum: 100,
  })
  score: number;

  @ApiProperty({
    description: 'Feedback category',
    example: 'perfect',
    enum: ['perfect', 'could_improve'],
  })
  feedback: 'perfect' | 'could_improve';

  @ApiProperty({
    description: 'Azure error type for this word (when not perfect)',
    enum: PRONUNCIATION_ERROR_TYPES,
    required: false,
  })
  errorType?: PronunciationErrorTypeDto;

  @ApiProperty({
    description: 'Per-phoneme accuracy for this word',
    type: [PhonemeScoreDto],
    required: false,
  })
  phonemes?: PhonemeScoreDto[];
}

export class PronunciationResponseDto {
  @ApiProperty({
    description: 'Overall pronunciation score (0-100)',
    example: 92,
    minimum: 0,
    maximum: 100,
  })
  overallScore: number;

  @ApiProperty({
    description: 'Transcribed text from the audio',
    example: 'Come stai?',
  })
  transcription: string;

  @ApiProperty({
    description: 'Word-by-word analysis',
    type: [WordAnalysisDto],
  })
  words: WordAnalysisDto[];

  @ApiProperty({
    description: 'Whether the pronunciation is acceptable (score >= 80)',
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'Score for validation (0-100)',
    example: 92,
    minimum: 0,
    maximum: 100,
  })
  score: number;
}
