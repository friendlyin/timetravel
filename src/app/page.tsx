'use client';

import { AppShell } from '@/components/layout/AppShell';
import { BasicSessionsConfiguration } from '@/components/sessions/BasicSessionsConfiguration';

export default function Home() {
  return (
    <AppShell>
      <div className="flex justify-center py-6">
        <BasicSessionsConfiguration />
      </div>
    </AppShell>
  );
}
