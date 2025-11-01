import { NextResponse } from 'next/server';

import { createSession, getSessions } from '@/lib/sessionStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sessions = await getSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to load sessions', error);
    return NextResponse.json(
      { error: 'Failed to load sessions' },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const sessions = await createSession();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to create session', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 },
    );
  }
}
