import { NextRequest, NextResponse } from 'next/server';
import { resolveLocation } from '@/services/locationResolverService';
import type { ResolveLocationResponse } from '@/types/api.types';
import type { LocationProviderType } from '@/types/location.types';

function parseNumberParam(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function parseProviderParam(value: string | null): LocationProviderType | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'whg' || normalized === 'openai') {
    return normalized;
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const lon = parseNumberParam(params.get('lon'));
  const lat = parseNumberParam(params.get('lat'));
  const year = parseNumberParam(params.get('year'));
  const provider = parseProviderParam(params.get('provider'));

  if (lon === null || lat === null || year === null) {
    return NextResponse.json<ResolveLocationResponse>(
      {
        success: false,
        error: 'Missing or invalid query params: lon, lat, and year are required.',
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  try {
    const location = await resolveLocation(
      {
        lon,
        lat,
        year,
      },
      provider,
    );

    return NextResponse.json<ResolveLocationResponse>(
      {
        success: true,
        data: location,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error resolving location:', error);

    return NextResponse.json<ResolveLocationResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to resolve location.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      lon?: number;
      lat?: number;
      year?: number;
      radiusKm?: number;
      provider?: string;
    };

    if (
      typeof body.lon !== 'number' ||
      typeof body.lat !== 'number' ||
      typeof body.year !== 'number'
    ) {
      return NextResponse.json<ResolveLocationResponse>(
        {
          success: false,
          error: 'Request body must include lon, lat, and year numbers.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const location = await resolveLocation(
      {
        lon: body.lon,
        lat: body.lat,
        year: body.year,
        radiusKm:
          typeof body.radiusKm === 'number' ? Math.max(body.radiusKm, 1) : undefined,
      },
      parseProviderParam(body.provider ?? null),
    );

    return NextResponse.json<ResolveLocationResponse>(
      {
        success: true,
        data: location,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error resolving location via POST:', error);

    return NextResponse.json<ResolveLocationResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to resolve location.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
