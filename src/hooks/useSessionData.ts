'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SessionDetailsResponse } from '@/types/api.types';
import type { SessionData } from '@/types/session.types';

type UseSessionDataResult = {
  data: SessionData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdatedAt: string | null;
};

export function useSessionData(sessionId: string | null | undefined): UseSessionDataResult {
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchSession() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/session-data/${encodeURIComponent(sessionId)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        const payload = (await response.json()) as SessionDetailsResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Failed to load session data');
        }

        setData(payload.data);
        setLastUpdatedAt(payload.timestamp);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          fetchError instanceof Error ? fetchError.message : 'Unknown error';
        setError(message);
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchSession();

    return () => {
      controller.abort();
    };
  }, [refreshToken, sessionId]);

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      refresh,
      lastUpdatedAt,
    }),
    [data, error, isLoading, lastUpdatedAt, refresh],
  );
}
