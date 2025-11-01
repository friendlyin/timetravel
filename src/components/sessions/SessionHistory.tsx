'use client';

import type { SessionHistoryItem } from '@/types/session.types';

type SessionHistoryProps = {
  isOpen: boolean;
  sessions: SessionHistoryItem[];
  selectedSessionId: string | null;
  isHydrated: boolean;
  onCreateSession?: () => void;
  onSelectSession: (id: string) => void;
  onRenameSession: (id: string) => void;
};

export function SessionHistory({
  isOpen,
  sessions,
  selectedSessionId,
  isHydrated,
  onCreateSession,
  onSelectSession,
  onRenameSession,
}: SessionHistoryProps) {
  const activeSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );

  const canCreateSession = typeof onCreateSession === 'function';

  return (
      <aside
          className={[
              'relative flex h-full flex-col border-r border-slate-200 bg-white/85 transition-[width] duration-300 ease-in-out backdrop-blur dark:border-slate-800 dark:bg-slate-900/70',
              isOpen ? 'w-72 pointer-events-auto' : 'w-0 pointer-events-none'
          ].join(' ')}
      >
          <div
              className={
                  isOpen ? 'flex flex-1 flex-col overflow-hidden' : 'hidden'
              }
          >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="flex flex-1 flex-col">
                      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Current Session
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {activeSession?.label ?? 'No session selected'}
                      </span>
                  </div>
                  {canCreateSession && (
                      <button
                          type="button"
                          onClick={() => {
                              if (onCreateSession) {
                                  void onCreateSession();
                              }
                          }}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:ring-slate-500"
                      >
                          New
                      </button>
                  )}
              </div>

              <ul className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
                  {!isHydrated ? (
                      <li className="rounded-md border border-dashed border-slate-200 bg-white/60 px-3 py-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                          Loading history…
                      </li>
                  ) : sessions.length === 0 ? (
                      <li className="rounded-md border border-dashed border-slate-200 bg-white/60 px-3 py-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                          Use the configuration panel to start a new session.
                      </li>
                  ) : (
                      sessions.map((session) => (
                          <li key={session.id} className="px-1">
                              <button
                                  type="button"
                                  onClick={() => {
                                      void onSelectSession(session.id);
                                  }}
                                  onDoubleClick={() => {
                                      void onRenameSession(session.id);
                                  }}
                                  className={[
                                      'group flex w-full flex-col rounded-md border px-3 py-2 text-left text-sm transition',
                                      session.id === selectedSessionId
                                          ? 'border-slate-400 bg-slate-100 shadow-sm dark:border-slate-600 dark:bg-slate-800'
                                          : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/80'
                                  ].join(' ')}
                              >
                                  <span className="font-medium text-slate-900 dark:text-slate-50">
                                      {session.label}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {session.subtitle}
                                  </span>
                              </button>
                          </li>
                      ))
                  )}
              </ul>

              {activeSession ? (
                  <div className="border-t border-slate-200 px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      Continue crafting choices for{' '}
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                          {activeSession.label}
                      </span>
                      .
                  </div>
              ) : (
                  <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                      Double click a session to rename it.
                  </div>
              )}
          </div>
      </aside>
  )
}
