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

export interface FsrsParameters {
  w0: number;
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  w6: number;
  w7: number;
  w8: number;
  w9: number;
  w10: number;
  w11: number;
  w12: number;
  w13: number;
  w14: number;
  w15: number;
  w16: number;
}

export const DEFAULT_FSRS_PARAMETERS: FsrsParameters = {
  w0: 0.4872,
  w1: 1.4003,
  w2: 3.7145,
  w3: 13.8206,
  w4: 5.1618,
  w5: 1.2298,
  w6: 0.8975,
  w7: 0.031,
  w8: 1.6474,
  w9: 0.1367,
  w10: 1.0461,
  w11: 2.1072,
  w12: 0.0793,
  w13: 0.3246,
  w14: 1.587,
  w15: 0.2272,
  w16: 2.8755,
};
