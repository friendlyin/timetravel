'use client';

import { ReactNode, useState } from 'react';
import { AppHeader } from './AppHeader';
import { SessionHistory } from '../sessions/SessionHistory';

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isHistoryOpen, setHistoryOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppHeader
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setHistoryOpen((prev) => !prev)}
      />
      <div className="flex flex-1 overflow-hidden">
        <SessionHistory isOpen={isHistoryOpen} />
        <main className="flex-1 overflow-y-auto bg-white/70 px-8 py-8 backdrop-blur dark:bg-slate-900/70">
          {children}
        </main>
      </div>
    </div>
  );
}
