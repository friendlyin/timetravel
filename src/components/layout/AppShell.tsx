'use client';

import { ReactNode, useMemo, useState } from 'react';
import { AppHeader } from './AppHeader';
import { SessionHistory } from '../sessions/SessionHistory';
import type { SessionHistoryController } from '@/hooks/useSessionHistory';

type AppShellProps = {
  children?: ReactNode;
  sessionHistory: SessionHistoryController;
};

export function AppShell({ children, sessionHistory }: AppShellProps) {
  const [isHistoryOpen, setHistoryOpen] = useState(true);
  const {
    sessions,
    selectedSessionId,
    createSession,
    selectSession,
    renameSession,
    isHydrated,
  } = sessionHistory;

  const handlers = useMemo(
    () => ({
      handleCreate: () => {
        void createSession();
      },
      handleSelect: (id: string) => {
        void selectSession(id);
      },
      handleRename: (id: string) => {
        void renameSession(id);
      },
    }),
    [createSession, renameSession, selectSession],
  );

  return (
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <AppHeader
              isHistoryOpen={isHistoryOpen}
              onToggleHistory={() => setHistoryOpen((prev) => !prev)}
          />
          <div className="flex flex-1">
              <SessionHistory
                  isOpen={isHistoryOpen}
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  isHydrated={isHydrated}
                  onCreateSession={handlers.handleCreate}
                  onSelectSession={handlers.handleSelect}
                  onRenameSession={handlers.handleRename}
              />
              <main
                  className={[
                      'flex-1 overflow-y-auto bg-white/70 px-8 py-8 backdrop-blur transition-[margin] duration-300 ease-in-out dark:bg-slate-900/70 mt-10',
                      isHistoryOpen ? 'ml-72' : 'ml-0'
                  ].join(' ')}
              >
                  {children}
              </main>
          </div>
      </div>
  )
}
