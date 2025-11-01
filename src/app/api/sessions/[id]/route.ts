import { NextRequest, NextResponse } from 'next/server';

import { renameSession } from '@/lib/sessionStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RenamePayload = {
  label?: string;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const body = (await request.json()) as RenamePayload;
    const label = body.label?.trim();

    if (!label) {
      return NextResponse.json(
        { error: 'Label is required' },
        { status: 400 },
      );
    }

    const sessions = await renameSession(id, label);
    if (!sessions) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to rename session', error);
    return NextResponse.json(
      { error: 'Failed to rename session' },
      { status: 500 },
    );
  }
}
