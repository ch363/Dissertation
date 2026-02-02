import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createLogger } from '@/services/logging';

export interface UseAsyncDataOptions {
  skip?: boolean;
  onSuccess?: (data: any) => void;
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
  options: UseAsyncDataOptions = {},
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
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load data';
      setError(errorMessage);
      logger.error('Failed to load data', err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError, logger]);

  useEffect(() => {
    if (!skip) {
      loadData();
    }
  }, deps);

  return {
    data,
    loading,
    error,
    reload: loadData,
  };
}
