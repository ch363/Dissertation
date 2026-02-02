export interface AttemptFeatures {
  correct: boolean;
  timeMs: number;
  score?: number;
}

export interface FsrsState {
  stability: number;
  difficulty: number;
  lastReview: Date;
  repetitions: number;
}

export interface FsrsResult {
  stability: number;
  difficulty: number;
  repetitions: number;
  nextDue: Date;
  intervalDays: number;
}
