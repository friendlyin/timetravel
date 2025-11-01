'use client';

type AppHeaderProps = {
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
};

export function AppHeader({ isHistoryOpen, onToggleHistory }: AppHeaderProps) {
  return (
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
              <button
                  type="button"
                  onClick={onToggleHistory}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:ring-slate-500 min-w-[150px]"
                  aria-pressed={isHistoryOpen}
              >
                  <svg
                      aria-hidden
                      className="h-4 w-4 text-slate-500"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                  >
                      <path d="M3 6h14M3 10h14M3 14h10" strokeLinecap="round" />
                  </svg>
                  <span className="hidden sm:inline">
                      {isHistoryOpen ? 'Hide sessions' : 'Show sessions'}
                  </span>
              </button>
              <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                      Time Threads
                  </p>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Temporal Life Architect
                  </h1>
              </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span>Version 0.1.0</span>
          </div>
      </header>
  )
}
