import { NextRequest, NextResponse } from 'next/server';

import { selectSession } from '@/lib/sessionStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SelectPayload = {
  id?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelectPayload;
    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json(
        { error: 'Session id is required' },
        { status: 400 },
      );
    }

    const sessions = await selectSession(id);
    if (!sessions) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to select session', error);
    return NextResponse.json(
      { error: 'Failed to select session' },
      { status: 500 },
    );
  }
}
