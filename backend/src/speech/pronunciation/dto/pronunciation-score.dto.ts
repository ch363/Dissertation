import { ApiProperty } from '@nestjs/swagger';
import type { PronunciationErrorType } from '../types';

export class PronunciationPhonemeScoreDto {
  @ApiProperty({ example: 'k' })
  phoneme: string;

  @ApiProperty({ example: 92, minimum: 0, maximum: 100 })
  accuracy: number;
}

export class PronunciationWordScoreDto {
  @ApiProperty({ example: 'Come' })
  word: string;

  @ApiProperty({ example: 95, minimum: 0, maximum: 100 })
  accuracy: number;

  @ApiProperty({
    required: false,
    enum: [
      'None',
      'Omission',
      'Insertion',
      'Mispronunciation',
      'UnexpectedBreak',
      'MissingBreak',
    ],
  })
  errorType?: PronunciationErrorType;

  @ApiProperty({ required: false, type: [PronunciationPhonemeScoreDto] })
  phonemes?: PronunciationPhonemeScoreDto[];
}

export class PronunciationOverallScoresDto {
  @ApiProperty({ example: 90, minimum: 0, maximum: 100 })
  accuracy: number;

  @ApiProperty({ example: 88, minimum: 0, maximum: 100 })
  fluency: number;

  @ApiProperty({ example: 92, minimum: 0, maximum: 100 })
  completeness: number;

  @ApiProperty({ example: 89, minimum: 0, maximum: 100 })
  pronunciation: number;
}

export class PronunciationScoreDto {
  @ApiProperty({ example: 'it-IT' })
  locale: string;

  @ApiProperty({ example: 'Come stai?' })
  referenceText: string;

  @ApiProperty({ type: PronunciationOverallScoresDto })
  scores: PronunciationOverallScoresDto;

  @ApiProperty({ type: [PronunciationWordScoreDto] })
  words: PronunciationWordScoreDto[];
}
