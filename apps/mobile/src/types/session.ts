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
  };
};

export type MultipleChoiceCard = BaseCard & {
  kind: CardKind.MultipleChoice;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation?: string;
};

export type FillBlankCard = BaseCard & {
  kind: CardKind.FillBlank;
  text: string;
  answer: string;
  hint?: string;
};

export type TranslateCard = BaseCard & {
  kind: CardKind.TranslateToEn | CardKind.TranslateFromEn;
  source: string;
  targetLanguage: string;
  expected: string;
  hint?: string;
};

export type ListeningCard = BaseCard & {
  kind: CardKind.Listening;
  audioUrl: string;
  expected: string;
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
};
