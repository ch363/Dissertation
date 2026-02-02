import { CardKind, Card, CardTeach, CardMCQ, CardFillBlank, CardFlashcard, CardListening } from '@/types/session';

export function isTeachCard(card: Card): card is CardTeach {
  return card.kind === CardKind.Teach;
}

export function isMCQCard(card: Card): card is CardMCQ {
  return card.kind === CardKind.MCQ;
}

export function isFillBlankCard(card: Card): card is CardFillBlank {
  return card.kind === CardKind.FillBlank;
}

export function isFlashcard(card: Card): card is CardFlashcard {
  return card.kind === CardKind.Flashcard;
}

export function isListeningCard(card: Card): card is CardListening {
  return card.kind === CardKind.Listening;
}

export function isPronunciationCard(card: Card): boolean {
  return card.kind === CardKind.Pronunciation;
}

export function cardRequiresSelection(card: Card): boolean {
  if (isMCQCard(card)) return true;
  if (isFillBlankCard(card) && card.options && card.options.length > 0) return true;
  return false;
}

export function cardRequiresTextInput(card: Card): boolean {
  if (isFillBlankCard(card) && (!card.options || card.options.length === 0)) return true;
  return false;
}

export function isListeningSpeakMode(card: Card): boolean {
  return isListeningCard(card) && 'mode' in card && card.mode === 'speak';
}

export function getCardId(card: Card): string {
  if ('id' in card) return card.id;
  if ('questionId' in card) return card.questionId;
  if ('teachingId' in card) return card.teachingId;
  return 'unknown';
}

export function canSubmitCard(card: Card, state: {
  selectedOptionId?: string;
  selectedAnswer?: string;
  userAnswer?: string;
  pronunciationResult?: unknown;
  flashcardRating?: number;
}): boolean {
  if (isTeachCard(card)) return true;

  if (isMCQCard(card)) return !!state.selectedOptionId;

  if (isFillBlankCard(card) && card.options && card.options.length > 0) {
    return !!state.selectedAnswer;
  }

  if (isFillBlankCard(card) && (!card.options || card.options.length === 0)) {
    return !!state.userAnswer?.trim();
  }

  if (isPronunciationCard(card)) return !!state.pronunciationResult;

  if (isFlashcard(card)) return state.flashcardRating !== undefined;

  if (isListeningSpeakMode(card)) return !!state.pronunciationResult;

  return false;
}
