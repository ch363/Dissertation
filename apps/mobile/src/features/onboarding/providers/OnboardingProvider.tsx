import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { saveOnboarding } from '@/app/api/onboarding';
import { getCurrentUser } from '@/features/auth/api';
import type { OnboardingAnswers } from '@/features/onboarding/types/schema';

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
  const activeUserRef = useRef<string | null>(null);

  const persist = useCallback(
    async (next: OnboardingAnswers, attempt = 0, targetUserId?: string) => {
      try {
        const user = targetUserId ? { id: targetUserId } : await getCurrentUser();
        const currentUserId = user?.id ?? null;
        if (!currentUserId) return;

        // Prevent persisting answers for a different user than the one currently active.
        if (activeUserRef.current && activeUserRef.current !== currentUserId) {
          return;
        }

        activeUserRef.current = currentUserId;
        await saveOnboarding(currentUserId, next);
      } catch {
        if (attempt < 3) {
          const delay = [1000, 2000, 5000][attempt] ?? 5000;
          retryRef.current && clearTimeout(retryRef.current);
          const retryUserId = activeUserRef.current ?? undefined;
          retryRef.current = setTimeout(() => persist(next, attempt + 1, retryUserId), delay);
        }
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };
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
