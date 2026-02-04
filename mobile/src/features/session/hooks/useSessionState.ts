import { useState, useEffect } from 'react';

import { AttemptLog, Card, CardKind, PronunciationResult } from '@/types/session';

export interface SessionState {
  index: number;
  setIndex: (index: number) => void;
  selectedOptionId: string | undefined;
  setSelectedOptionId: (id: string | undefined) => void;
  selectedAnswer: string | undefined;
  setSelectedAnswer: (answer: string | undefined) => void;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  flashcardRating: number | undefined;
  setFlashcardRating: (rating: number | undefined) => void;
  showResult: boolean;
  setShowResult: (show: boolean) => void;
  isCorrect: boolean;
  setIsCorrect: (correct: boolean) => void;
  pronunciationResult: PronunciationResult | null;
  setPronunciationResult: (result: PronunciationResult | null) => void;
  audioRecordingUri: string | null;
  setAudioRecordingUri: (uri: string | null) => void;
  attempts: AttemptLog[];
  setAttempts: (attempts: AttemptLog[]) => void;
  recordedAttempts: Set<string>;
  setRecordedAttempts: (attempts: Set<string>) => void;
  awardedXpByCard: Map<string, number>;
  setAwardedXpByCard: (xp: Map<string, number>) => void;
  cardStartTime: number | null;
  setCardStartTime: (time: number | null) => void;
  resetCardState: () => void;
  goToNextCard: () => void;
  goToPreviousCard: () => void;
}

export function useSessionState(totalCards: number, currentCard?: Card): SessionState {
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(undefined);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [flashcardRating, setFlashcardRating] = useState<number | undefined>(undefined);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [audioRecordingUri, setAudioRecordingUri] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);
  const [recordedAttempts, setRecordedAttempts] = useState<Set<string>>(new Set());
  const [awardedXpByCard, setAwardedXpByCard] = useState<Map<string, number>>(new Map());
  const [cardStartTime, setCardStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (currentCard && currentCard.kind !== CardKind.Teach) {
      setCardStartTime(Date.now());
    } else {
      setCardStartTime(null);
    }
  }, [currentCard]);

  const resetCardState = () => {
    setSelectedOptionId(undefined);
    setSelectedAnswer(undefined);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setFlashcardRating(undefined);
    setPronunciationResult(null);
    setAudioRecordingUri(null);
  };

  const goToNextCard = () => {
    if (index < totalCards - 1) {
      setIndex(index + 1);
      resetCardState();
    }
  };

  const goToPreviousCard = () => {
    if (index > 0) {
      setIndex(index - 1);
      resetCardState();
    }
  };

  return {
    index,
    setIndex,
    selectedOptionId,
    setSelectedOptionId,
    selectedAnswer,
    setSelectedAnswer,
    userAnswer,
    setUserAnswer,
    flashcardRating,
    setFlashcardRating,
    showResult,
    setShowResult,
    isCorrect,
    setIsCorrect,
    pronunciationResult,
    setPronunciationResult,
    audioRecordingUri,
    setAudioRecordingUri,
    attempts,
    setAttempts,
    recordedAttempts,
    setRecordedAttempts,
    awardedXpByCard,
    setAwardedXpByCard,
    cardStartTime,
    setCardStartTime,
    resetCardState,
    goToNextCard,
    goToPreviousCard,
  };
}
