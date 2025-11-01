'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'time-travel-sessions';

export type SessionHistoryItem = {
  id: string;
  label: string;
  subtitle: string;
  createdAt: number;
};

type StoredSessions = {
  sessions: SessionHistoryItem[];
  selectedId: string | null;
};

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;

    const loadFromStorage = () => {
      if (cancelled) {
        return;
      }

      try {
        const rawValue = window.localStorage.getItem(STORAGE_KEY);
        if (!rawValue) {
          setHydrated(true);
          return;
        }

        const parsed = JSON.parse(rawValue) as StoredSessions;
        setSessions(parsed.sessions ?? []);
        setSelectedSessionId(parsed.selectedId ?? null);
        setHydrated(true);
      } catch {
        setHydrated(true);
      }
    };

    const frame = window.requestAnimationFrame(loadFromStorage);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const persist = useCallback(
    (nextSessions: SessionHistoryItem[], nextSelectedId: string | null) => {
      if (typeof window === 'undefined') {
        return;
      }

      const payload: StoredSessions = {
        sessions: nextSessions,
        selectedId: nextSelectedId,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    [],
  );

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

  const createSession = useCallback(() => {
    if (!isHydrated) {
      return;
    }

    const timestamp = Date.now();

    setSessions((prev) => {
      const index = prev.length + 1;
      const nextSession: SessionHistoryItem = {
        id: `session-${timestamp}`,
        label: `New life ${index}`,
        subtitle: `Created ${formatter.format(timestamp)}`,
        createdAt: timestamp,
      };

      const nextSessions = [nextSession, ...prev];

      setSelectedSessionId(nextSession.id);
      persist(nextSessions, nextSession.id);
      return nextSessions;
    });
  }, [formatter, isHydrated, persist]);

  const selectSession = useCallback(
    (sessionId: string) => {
      if (!isHydrated) {
        return;
      }

      setSelectedSessionId(sessionId);
      persist(sessions, sessionId);
    },
    [isHydrated, persist, sessions],
  );

  const renameSession = useCallback(
    (sessionId: string) => {
      if (!isHydrated) {
        return;
      }

      const target = sessions.find((session) => session.id === sessionId);
      if (!target) {
        return;
      }

      if (typeof window === 'undefined') {
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

      setSessions((prev) => {
        const nextSessions = prev.map((session) =>
          session.id === sessionId ? { ...session, label: trimmed } : session,
        );

        persist(nextSessions, selectedSessionId);
        return nextSessions;
      });
    },
    [isHydrated, persist, selectedSessionId, sessions],
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
