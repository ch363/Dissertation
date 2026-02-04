import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { getUserFriendlyMessage } from '@/services/errors';
import { createLogger } from '@/services/logging';

export interface UseAsyncDataOptions<T = unknown> {
  skip?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAsyncData<T>(
  context: string,
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncDataOptions<T> = {},
): UseAsyncDataResult<T> {
  const { skip = false, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const logger = useMemo(() => createLogger(context), [context]);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      setData(result);
      onSuccess?.(result);
    } catch (err: unknown) {
      setError(getUserFriendlyMessage(err));
      logger.error('Failed to load data', err instanceof Error ? err : new Error(String(err)));
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError, logger]);

  useEffect(() => {
    if (!skip) {
      loadData();
    }
    // Refetch when skip or deps change; omit loadData to avoid refetches when onSuccess/onError/logger change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData is stable for refetch triggers (deps).
  }, [skip, ...deps]);

  return {
    data,
    loading,
    error,
    reload: loadData,
  };
}
