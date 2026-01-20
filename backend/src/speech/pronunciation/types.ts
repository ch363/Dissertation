export type PronunciationErrorType =
  | 'None'
  | 'Omission'
  | 'Insertion'
  | 'Mispronunciation'
  | 'UnexpectedBreak'
  | 'MissingBreak';

export interface PronunciationPhonemeScore {
  phoneme: string;
  accuracy: number; // 0-100
}

export interface PronunciationWordScore {
  word: string;
  accuracy: number; // 0-100
  errorType?: PronunciationErrorType;
  phonemes?: PronunciationPhonemeScore[];
}

export interface PronunciationOverallScores {
  accuracy: number; // 0-100
  fluency: number; // 0-100
  completeness: number; // 0-100
  pronunciation: number; // 0-100
}

/**
 * Internal service result.
 * Note: `recognizedText` is intentionally excluded from the public `/speech` DTO.
 */
export interface PronunciationAssessmentResult {
  locale: string;
  referenceText: string;
  scores: PronunciationOverallScores;
  words: PronunciationWordScore[];
  recognizedText?: string;
}
