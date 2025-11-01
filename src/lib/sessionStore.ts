import { promises as fs } from 'fs';
import path from 'path';

import {
  SessionHistoryItem,
  StoredSessions,
} from '@/types/session.types';

const DATA_DIRECTORY = path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIRECTORY, 'sessions.json');

const DATE_FORMATTER = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const DEFAULT_SESSIONS: StoredSessions = {
  sessions: [],
  selectedId: null,
};

async function ensureStorageFile(): Promise<void> {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(STORAGE_FILE);
  } catch {
    await fs.writeFile(
      STORAGE_FILE,
      JSON.stringify(DEFAULT_SESSIONS, null, 2),
      'utf-8',
    );
  }
}

async function readStorage(): Promise<StoredSessions> {
  await ensureStorageFile();

  try {
    const raw = await fs.readFile(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StoredSessions;

    return {
      sessions: parsed.sessions ?? [],
      selectedId: parsed.selectedId ?? null,
    };
  } catch (error) {
    console.error('Failed to read sessions store', error);
    return { ...DEFAULT_SESSIONS };
  }
}

async function writeStorage(payload: StoredSessions): Promise<void> {
  await ensureStorageFile();
  await fs.writeFile(STORAGE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
}

export async function getSessions(): Promise<StoredSessions> {
  return readStorage();
}

export async function createSession(): Promise<StoredSessions> {
  const current = await readStorage();
  const timestamp = Date.now();

  const newSession: SessionHistoryItem = {
    id: `session-${timestamp}`,
    label: `New life ${current.sessions.length + 1}`,
    subtitle: `Created ${DATE_FORMATTER.format(timestamp)}`,
    createdAt: timestamp,
  };

  const nextState: StoredSessions = {
    sessions: [newSession, ...current.sessions],
    selectedId: newSession.id,
  };

  await writeStorage(nextState);
  return nextState;
}

export async function renameSession(
  id: string,
  label: string,
): Promise<StoredSessions | null> {
  const current = await readStorage();
  const index = current.sessions.findIndex((session) => session.id === id);

  if (index === -1) {
    return null;
  }

  if (current.sessions[index].label === label) {
    return {
      sessions: current.sessions,
      selectedId: current.selectedId,
    };
  }

  const nextSessions = current.sessions.slice();
  nextSessions[index] = {
    ...nextSessions[index],
    label,
  };

  const nextState: StoredSessions = {
    sessions: nextSessions,
    selectedId: current.selectedId,
  };

  await writeStorage(nextState);
  return nextState;
}

export async function selectSession(id: string): Promise<StoredSessions | null> {
  const current = await readStorage();
  const exists = current.sessions.some((session) => session.id === id);

  if (!exists) {
    return null;
  }

  const nextState: StoredSessions = {
    sessions: current.sessions,
    selectedId: id,
  };

  await writeStorage(nextState);
  return nextState;
}
