export type SessionHistoryItem = {
  id: string;
  label: string;
  subtitle: string;
  createdAt: number;
};

export type StoredSessions = {
  sessions: SessionHistoryItem[];
  selectedId: string | null;
};
