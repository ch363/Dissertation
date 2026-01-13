/**
 * SRS (Spaced Repetition System) types
 */

export interface SrsState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextDue: Date;
}

export interface AttemptFeatures {
  correct: boolean;
  timeMs: number;
  score?: number; // Optional score (0-100)
}
