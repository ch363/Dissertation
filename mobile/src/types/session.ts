export type SessionKind = 'learn' | 'review';

export enum CardKind {
  Teach = 'teach',
  MultipleChoice = 'mcq',
  FillBlank = 'fill_blank',
  TranslateToEn = 'translate_to_en',
  TranslateFromEn = 'translate_from_en',
  Listening = 'listening',
}

type BaseCard = {
  id: string;
  kind: CardKind;
  prompt: string;
};

export type TeachCard = BaseCard & {
  kind: CardKind.Teach;
  content: {
    phrase: string;
    translation?: string;
    mediaUrl?: string;
    usageNote?: string;
    emoji?: string;
  };
};

export type MultipleChoiceCard = BaseCard & {
  kind: CardKind.MultipleChoice;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation?: string;
  audioUrl?: string; // Audio for source phrase (e.g., "Good morning")
  sourceText?: string; // Source text to translate (for translation MCQ)
};

export type FillBlankCard = BaseCard & {
  kind: CardKind.FillBlank;
  text: string;
  answer: string;
  hint?: string;
  audioUrl?: string; // Audio for "Listen and complete"
  options?: Array<{ id: string; label: string }>; // Options for tap-to-fill
};

export type TranslateCard = BaseCard & {
  kind: CardKind.TranslateToEn | CardKind.TranslateFromEn;
  source: string;
  targetLanguage: string;
  expected: string;
  hint?: string;
  audioUrl?: string; // Audio preview for source text
  isFlashcard?: boolean; // If true, shows flip card interaction
  example?: string; // Example sentence for flashcard back view
  /** Match teach card: emoji + usage note for same look as teaching */
  emoji?: string;
  usageNote?: string;
};

export type ListeningCard = BaseCard & {
  kind: CardKind.Listening;
  audioUrl?: string;
  expected: string;
  translation?: string; // Translation for "Speak This Phrase" mode
  mode?: 'type' | 'speak'; // 'type' = Type What You Hear, 'speak' = Speak This Phrase
};

export type PronunciationErrorType =
  | 'None'
  | 'Omission'
  | 'Insertion'
  | 'Mispronunciation'
  | 'UnexpectedBreak'
  | 'MissingBreak';

export interface PronunciationWordPhoneme {
  phoneme: string;
  accuracy: number;
}

export interface PronunciationWordResult {
  word: string;
  score: number;
  feedback: 'perfect' | 'could_improve';
  errorType?: PronunciationErrorType;
  phonemes?: PronunciationWordPhoneme[];
}

export type PronunciationResult = {
  overallScore: number; // 0-100
  transcription: string;
  words: PronunciationWordResult[];
};

export type Card = TeachCard | MultipleChoiceCard | FillBlankCard | TranslateCard | ListeningCard;

export type SessionPlan = {
  id: string;
  kind: SessionKind;
  lessonId?: string;
  title?: string;
  cards: Card[];
};

export type AttemptLog = {
  cardId: string;
  attemptNumber: number;
  answer: string;
  isCorrect: boolean;
  elapsedMs: number;
  errorType?: string;
  timestamp?: string;
  awardedXp?: number;
};
