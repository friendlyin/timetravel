import { NextRequest, NextResponse } from 'next/server';

import { generateHistoricalContext } from '@/services/historicalContextService';
import { generatePersonaOptions } from '@/services/personaService';
import {
  createSession,
  updateSessionMetadata,
  getSessionPath,
} from '@/services/sessionService';
import { GAME_CONFIG } from '@/config/workflow.config';
import { registerSession } from '@/lib/sessionStore';
import type { StartSessionResponse } from '@/types/api.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type StartSessionRequestBody = {
  year?: number;
  coordinate?: {
    lat?: number;
    lon?: number;
  };
  location?: {
    label?: string;
    area?: string;
    country?: string;
    settlement?: string;
    provider?: string;
  };
};

const DEFAULT_MONTH = '01';
const DEFAULT_DAY = '01';

function buildSessionLabel({
  location,
  year,
}: {
  location: StartSessionRequestBody['location'];
  year: number;
}): string {
  const locationParts = [
    location?.settlement,
    location?.area,
    location?.country,
  ]
    .filter((part) => Boolean(part))
    .map((part) => part!.trim());

  const locationLabel = locationParts.length > 0
    ? locationParts.join(', ')
    : location?.label?.trim() ?? 'Unknown place';

  return `${locationLabel} · Year ${year}`;
}

function buildSessionSubtitle(createdAt: number, provider?: string): string {
  const formatter = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const providerLabel = provider
    ? ` · Source ${provider.trim().toUpperCase()}`
    : '';

  return `Started ${formatter.format(createdAt)}${providerLabel}`;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<StartSessionResponse>> {
  try {
    const body = (await request.json()) as StartSessionRequestBody;

    if (typeof body.year !== 'number' || Number.isNaN(body.year)) {
      return NextResponse.json<StartSessionResponse>(
        {
          success: false,
          error: 'Year is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const locationLabel = body.location?.label?.trim();
    if (!locationLabel) {
      return NextResponse.json<StartSessionResponse>(
        {
          success: false,
          error: 'Location label is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (
      body.coordinate?.lat === undefined ||
      body.coordinate?.lon === undefined
    ) {
      return NextResponse.json<StartSessionResponse>(
        {
          success: false,
          error: 'Coordinates are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const normalizedYear = Math.round(body.year);
    const paddedYear = normalizedYear.toString().padStart(4, '0');
    const sessionInput = {
      date: `${paddedYear}-${DEFAULT_MONTH}-${DEFAULT_DAY}`,
      location: locationLabel,
    } as const;

    const createdAt = Date.now();

    const { sessionId } = createSession(sessionInput, {
      generateImages: GAME_CONFIG.generateImageForEachLifeline,
    });

    await generateHistoricalContext(sessionId);
    await generatePersonaOptions(sessionId);

    await updateSessionMetadata(sessionId, {
      currentStep: 'Awaiting persona selection',
    });

    const sessions = await registerSession(sessionId, {
      createdAt,
      label: buildSessionLabel({ location: body.location, year: normalizedYear }),
      subtitle: buildSessionSubtitle(createdAt, body.location?.provider),
    });

    return NextResponse.json<StartSessionResponse>({
      success: true,
      data: {
        sessionId,
        sessionPath: getSessionPath(sessionId),
        sessions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to start session', error);

    return NextResponse.json<StartSessionResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
