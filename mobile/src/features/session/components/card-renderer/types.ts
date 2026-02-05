import { Card, PronunciationResult } from '@/types/session';

/**
 * Card Renderer Props - Interface Segregation Principle
 *
 * Each card type has its own focused interface containing only the props it needs.
 * This follows the Interface Segregation Principle: clients should not depend on
 * interfaces they don't use.
 */

// Base interface - required by all cards
export interface BaseCardProps {
  card: Card;
}

// Shared feedback props used by most cards (not Teach)
export interface ResultFeedbackProps {
  showResult?: boolean;
  isCorrect?: boolean;
}

// Shared text input props used by Translate and Listening cards
export interface TextInputProps {
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
}

// Grammatical feedback used by FillBlank, Translate, and Listening cards
export interface GrammaticalFeedbackProps {
  grammaticalCorrectness?: number | null;
}

// Card-specific interfaces following ISP

export interface TeachCardProps extends BaseCardProps {
  // Teach cards only need the card itself - they render their own complete layout
}

export interface MultipleChoiceCardProps extends BaseCardProps, ResultFeedbackProps {
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
  showCorrectAnswer?: boolean;
  onCheckAnswer?: () => void;
  onTryAgain?: () => void;
  incorrectAttemptCount?: number;
}

export interface FillBlankCardProps
  extends BaseCardProps,
    ResultFeedbackProps,
    GrammaticalFeedbackProps {
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
}

export interface TranslateCardProps
  extends BaseCardProps,
    ResultFeedbackProps,
    TextInputProps,
    GrammaticalFeedbackProps {
  meaningCorrect?: boolean;
  naturalPhrasing?: string;
  feedbackWhy?: string;
  acceptedVariants?: string[];
  validationFeedback?: string;
  showHint?: boolean;
  showSuggestedAnswer?: boolean;
  onCheckAnswer?: () => void;
  onTryAgain?: () => void;
  onRating?: (rating: number) => void;
  selectedRating?: number;
  incorrectAttemptCount?: number;
}

export interface ListeningCardProps
  extends BaseCardProps,
    ResultFeedbackProps,
    TextInputProps,
    GrammaticalFeedbackProps {
  onCheckAnswer?: (audioUri?: string) => void;
  onContinue?: () => void;
  pronunciationResult?: PronunciationResult | null;
  isPronunciationProcessing?: boolean;
  onPracticeAgain?: () => void;
}

// Union type for all card props - enables type-safe discrimination by card.kind
export type CardRendererProps =
  | TeachCardProps
  | MultipleChoiceCardProps
  | FillBlankCardProps
  | TranslateCardProps
  | ListeningCardProps;

// Helper type guards for discriminating card props
export function isMultipleChoiceCardProps(props: CardRendererProps): props is MultipleChoiceCardProps {
  return props.card.kind === 'mcq';
}

export function isFillBlankCardProps(props: CardRendererProps): props is FillBlankCardProps {
  return props.card.kind === 'fill_blank';
}

export function isTranslateCardProps(props: CardRendererProps): props is TranslateCardProps {
  return props.card.kind === 'translate_to_en' || props.card.kind === 'translate_from_en';
}

export function isListeningCardProps(props: CardRendererProps): props is ListeningCardProps {
  return props.card.kind === 'listening';
}

export function isTeachCardProps(props: CardRendererProps): props is TeachCardProps {
  return props.card.kind === 'teach';
}

// Legacy monolithic props type for backward compatibility
// TODO: Remove this once SessionRunner is fully refactored
export interface LegacyCardRendererProps extends BaseCardProps {
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  grammaticalCorrectness?: number | null;
  meaningCorrect?: boolean;
  naturalPhrasing?: string;
  feedbackWhy?: string;
  acceptedVariants?: string[];
  validationFeedback?: string;
  showHint?: boolean;
  showSuggestedAnswer?: boolean;
  showCorrectAnswer?: boolean;
  onCheckAnswer?: (audioUri?: string) => void;
  onContinue?: () => void;
  onTryAgain?: () => void;
  onRating?: (rating: number) => void;
  selectedRating?: number;
  pronunciationResult?: PronunciationResult | null;
  isPronunciationProcessing?: boolean;
  onPracticeAgain?: () => void;
  incorrectAttemptCount?: number;
}
