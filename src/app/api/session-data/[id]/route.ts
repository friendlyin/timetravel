import { NextRequest, NextResponse } from 'next/server';

import { readSession } from '@/services/sessionService';
import type { SessionDetailsResponse } from '@/types/api.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const normalizedId = id?.trim();

    if (!normalizedId) {
      return NextResponse.json<SessionDetailsResponse>(
        {
          success: false,
          error: 'Session id is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const session = readSession(normalizedId);

    return NextResponse.json<SessionDetailsResponse>({
      success: true,
      data: session,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to load session data', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json<SessionDetailsResponse>(
      {
        success: false,
        error: status === 404 ? 'Session not found' : message,
        timestamp: new Date().toISOString(),
      },
      { status },
    );
  }
}
