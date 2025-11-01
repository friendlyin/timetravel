'use client';

import { AppShell } from '@/components/layout/AppShell';
import { BasicSessionsConfiguration } from '@/components/sessions/BasicSessionsConfiguration';
import { SessionTimeline } from '@/components/sessions/SessionTimeline';
import { useSessionHistory } from '@/hooks/useSessionHistory';

export default function Home() {
  const sessionHistory = useSessionHistory();

  return (
    <AppShell sessionHistory={sessionHistory}>
      <div className="flex flex-col items-center gap-6 py-6">
        <BasicSessionsConfiguration sessionHistory={sessionHistory} />
        <SessionTimeline sessionHistory={sessionHistory} />
      </div>
    </AppShell>
  );
}
