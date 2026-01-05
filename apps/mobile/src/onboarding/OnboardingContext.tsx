import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { saveOnboarding } from '../lib/onboardingRepo';

import { getCurrentUser } from '@/modules/auth';

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
  setAnswerAndSave: <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K]
  ) => void;
  reset: () => void;
};

const OnboardingContext = createContext<Ctx | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});

  const retryRef = useRef<NodeJS.Timeout | null>(null);

  const persist = useCallback(async (next: OnboardingAnswers, attempt = 0) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      await saveOnboarding(user.id, next);
    } catch {
      if (attempt < 3) {
        const delay = [1000, 2000, 5000][attempt] ?? 5000;
        retryRef.current && clearTimeout(retryRef.current);
        retryRef.current = setTimeout(() => persist(next, attempt + 1), delay);
      }
    }
  }, []);

  const api = useMemo<Ctx>(
    () => ({
      answers,
      setAnswer: (key, value) => setAnswers((prev) => ({ ...prev, [key]: value })),
      setAnswerAndSave: (key, value) => {
        setAnswers((prev) => {
          const next = { ...prev, [key]: value };
          // optimistic update then persist
          persist(next);
          return next;
        });
      },
      reset: () => setAnswers({}),
    }),
    [answers, persist]
  );

  return <OnboardingContext.Provider value={api}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};
