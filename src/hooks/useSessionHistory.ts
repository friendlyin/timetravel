'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SessionHistoryItem,
  StoredSessions,
} from '@/types/session.types';

const SESSIONS_ENDPOINT = '/api/sessions';
const SELECT_ENDPOINT = '/api/sessions/select';
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadFromServer = async () => {
      if (cancelled) {
        return;
      }

      try {
        const response = await fetch(SESSIONS_ENDPOINT, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load sessions');
        }

        const payload = (await response.json()) as StoredSessions;
        if (cancelled) {
          return;
        }

        setSessions(payload.sessions ?? []);
        setSelectedSessionId(payload.selectedId ?? null);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setSessions([]);
          setSelectedSessionId(null);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    };

    loadFromServer();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyServerState = useCallback((data: StoredSessions) => {
    setSessions(data.sessions ?? []);
    setSelectedSessionId(data.selectedId ?? null);
  }, []);

  const createSession = useCallback(async () => {
    if (!isHydrated) {
      return;
    }

    try {
      const response = await fetch(SESSIONS_ENDPOINT, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const payload = (await response.json()) as StoredSessions;
      applyServerState(payload);
    } catch (error) {
      console.error(error);
    }
  }, [applyServerState, isHydrated]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      if (!isHydrated) {
        return;
      }

      try {
        const response = await fetch(SELECT_ENDPOINT, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ id: sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to select session');
        }

        const payload = (await response.json()) as StoredSessions;
        applyServerState(payload);
      } catch (error) {
        console.error(error);
      }
    },
    [applyServerState, isHydrated],
  );

  const renameSession = useCallback(
    async (sessionId: string) => {
      if (!isHydrated) {
        return;
      }

      const target = sessions.find((session) => session.id === sessionId);
      if (!target) {
        return;
      }

      const nextLabel = window.prompt('Rename session', target.label);
      if (!nextLabel) {
        return;
      }

      const trimmed = nextLabel.trim();
      if (!trimmed || trimmed === target.label) {
        return;
      }

      try {
        const response = await fetch(`${SESSIONS_ENDPOINT}/${sessionId}`, {
          method: 'PATCH',
          headers: JSON_HEADERS,
          body: JSON.stringify({ label: trimmed }),
        });

        if (!response.ok) {
          throw new Error('Failed to rename session');
        }

        const payload = (await response.json()) as StoredSessions;
        applyServerState(payload);
      } catch (error) {
        console.error(error);
      }
    },
    [applyServerState, isHydrated, sessions],
  );

  const value = useMemo(
    () => ({
      sessions,
      selectedSessionId,
      createSession,
      selectSession,
      renameSession,
      isHydrated,
    }),
    [
      createSession,
      isHydrated,
      renameSession,
      selectSession,
      selectedSessionId,
      sessions,
    ],
  );

  return value;
}
