import { useEffect, useState, useCallback } from 'react';

import { getProgressSummary, getCompletedModules, type ProgressSummary } from '@/modules/progress';
import { useAuth } from '@/providers/AuthProvider';

export type ProgressViewModel = {
  summary: ProgressSummary | null;
  completed: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useProgressSummary(): ProgressViewModel {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const userId = user?.id;
        if (userId) {
          const [summaryRes, completedRes] = await Promise.all([
            getProgressSummary(userId),
            getCompletedModules(),
          ]);
          if (!cancelled) {
            setSummary(summaryRes);
            setCompleted(completedRes);
          }
        } else if (!cancelled) {
          setSummary(null);
          setCompleted([]);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Unable to load progress');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const cancel = refresh();
    return cancel;
  }, [refresh]);

  return { summary, completed, loading, error, refresh };
}
