import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * Session card state shared across all card types.
 * This context eliminates prop drilling from SessionRunner -> CardRenderer -> individual cards.
 */
export interface SessionCardState {
  // Answer state
  selectedOptionId?: string;
  selectedAnswer?: string;
  userAnswer: string;

  // Result state
  showResult: boolean;
  isCorrect: boolean;

  // Validation feedback
  grammaticalCorrectness: number | null;
  meaningCorrect: boolean;
  naturalPhrasing: string | null;
  feedbackWhy: string | null;
  acceptedVariants: string[];
  validationFeedback: string | null;
  showSuggestedAnswer: boolean;
  showCorrectAnswer: boolean;

  // Pronunciation (for listening cards)
  pronunciationResult: {
    isCorrect: boolean;
    score: number;
    overallScore: number;
    transcription: string | null;
  } | null;
  isPronunciationProcessing: boolean;

  // Flashcard rating
  selectedRating: number | null;

  // Attempt tracking
  incorrectAttemptCount: number;
}

/**
 * Session card handlers shared across all card types.
 */
export interface SessionCardHandlers {
  onSelectOption: (optionId: string) => void;
  onSelectAnswer: (answer: string) => void;
  onAnswerChange: (answer: string) => void;
  onCheckAnswer: (optionIdOrAudioUri?: string) => void;
  onContinue?: () => void;
  onTryAgain: () => void;
  onRating: (rating: number) => void;
  onPracticeAgain?: () => void;
}

interface SessionContextValue {
  state: SessionCardState;
  handlers: SessionCardHandlers;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  state: SessionCardState;
  handlers: SessionCardHandlers;
}

/**
 * SessionProvider wraps the card renderer and provides shared state/handlers to all cards.
 *
 * Usage in SessionRunner:
 * ```tsx
 * <SessionProvider state={cardState} handlers={cardHandlers}>
 *   <CardRenderer card={currentCard} />
 * </SessionProvider>
 * ```
 */
export function SessionProvider({ children, state, handlers }: SessionProviderProps): JSX.Element {
  const value = { state, handlers };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Hook to access session card state and handlers.
 * Must be used within a SessionProvider.
 *
 * @example
 * ```tsx
 * function MyCard() {
 *   const { state, handlers } = useSessionContext();
 *   const { userAnswer, isCorrect } = state;
 *   const { onAnswerChange, onCheckAnswer } = handlers;
 *   // ... use state and handlers
 * }
 * ```
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }

  return context;
}
