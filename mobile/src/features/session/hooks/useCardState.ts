import { useState, useRef, useCallback } from 'react';

/**
 * Shared state management hook for session cards.
 * Extracted from SessionRunner to improve testability and reusability.
 */
export function useCardState() {
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(undefined);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [grammaticalCorrectness, setGrammaticalCorrectness] = useState<number | null>(null);
  const [meaningCorrect, setMeaningCorrect] = useState(false);
  const [naturalPhrasing, setNaturalPhrasing] = useState<string | null>(null);
  const [feedbackWhy, setFeedbackWhy] = useState<string | null>(null);
  const [acceptedVariants, setAcceptedVariants] = useState<string[]>([]);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [showSuggestedAnswer, setShowSuggestedAnswer] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [flashcardRating, setFlashcardRating] = useState<number | null>(null);
  const [pronunciationResult, setPronunciationResult] = useState<{
    isCorrect: boolean;
    score: number;
    overallScore: number;
    transcription: string | null;
  } | null>(null);
  const [isPronunciationProcessing, setIsPronunciationProcessing] = useState(false);
  const [incorrectAttemptCount, setIncorrectAttemptCount] = useState(0);
  const [audioRecordingUri, setAudioRecordingUri] = useState<string | null>(null);

  const cardStartTimeRef = useRef<number | null>(null);

  const resetCardState = useCallback(() => {
    setSelectedOptionId(undefined);
    setSelectedAnswer(undefined);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setGrammaticalCorrectness(null);
    setMeaningCorrect(false);
    setNaturalPhrasing(null);
    setFeedbackWhy(null);
    setAcceptedVariants([]);
    setValidationFeedback(null);
    setShowSuggestedAnswer(false);
    setShowCorrectAnswer(false);
    setFlashcardRating(null);
    setPronunciationResult(null);
    setIsPronunciationProcessing(false);
    setIncorrectAttemptCount(0);
    setAudioRecordingUri(null);
    cardStartTimeRef.current = Date.now();
  }, []);

  return {
    // State
    selectedOptionId,
    selectedAnswer,
    userAnswer,
    showResult,
    isCorrect,
    grammaticalCorrectness,
    meaningCorrect,
    naturalPhrasing,
    feedbackWhy,
    acceptedVariants,
    validationFeedback,
    showSuggestedAnswer,
    showCorrectAnswer,
    flashcardRating,
    pronunciationResult,
    isPronunciationProcessing,
    incorrectAttemptCount,
    audioRecordingUri,
    cardStartTime: cardStartTimeRef.current,

    // Setters
    setSelectedOptionId,
    setSelectedAnswer,
    setUserAnswer,
    setShowResult,
    setIsCorrect,
    setGrammaticalCorrectness,
    setMeaningCorrect,
    setNaturalPhrasing,
    setFeedbackWhy,
    setAcceptedVariants,
    setValidationFeedback,
    setShowSuggestedAnswer,
    setShowCorrectAnswer,
    setFlashcardRating,
    setPronunciationResult,
    setIsPronunciationProcessing,
    setIncorrectAttemptCount,
    setAudioRecordingUri,

    // Actions
    resetCardState,
  };
}
