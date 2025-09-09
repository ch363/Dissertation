import React, { createContext, useContext, useMemo, useState } from 'react';

export type OnboardingAnswers = {
  motivation?: { key: string; otherText?: string } | null;
  learningStyles?: string[] | null; // up to 2
  memoryHabit?: string | null;
  difficulty?: string | null;
  gamification?: string | null;
  feedback?: string | null;
  sessionStyle?: string | null;
  tone?: string | null;
  experience?: string | null;
};

type Ctx = {
  answers: OnboardingAnswers;
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  reset: () => void;
};

const OnboardingContext = createContext<Ctx | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});

  const api = useMemo<Ctx>(() => ({
    answers,
    setAnswer: (key, value) => setAnswers((prev) => ({ ...prev, [key]: value })),
    reset: () => setAnswers({}),
  }), [answers]);

  return <OnboardingContext.Provider value={api}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};
