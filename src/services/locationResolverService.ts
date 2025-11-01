import { LOCATION_CONFIG, resolveLocationProvider } from '@/config/location.config';
import { MODELS } from '@/config/models.config';
import { getPromptsForStep } from '@/config/prompts.config';
import { generateJSONCompletion } from '@/lib/openai';
import type {
  LocationResolutionContext,
  LocationResolutionResult,
  LocationProviderType,
} from '@/types/location.types';

type WhgFeature = {
  properties?: {
    title?: string;
    ccodes?: string[];
    minmax?: [number | null, number | null] | null;
  };
  geometry?: {
    coordinates?: [number, number];
  };
  related?: Array<{
    relation_type?: string;
    label?: string;
  }>;
  whens?: Array<{
    timespans?: Array<{
      start?: { earliest?: string | number | null; latest?: string | number | null };
      end?: { earliest?: string | number | null; latest?: string | number | null };
    }>;
  }>;
};

type WhgResponse = {
  features?: WhgFeature[];
};

type OpenAiLocationPayload = {
  area: string;
  country: string | null;
  settlement: string | null;
  confidence: number;
  notes?: string | null;
};

const REGION_NAMES =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : undefined;

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(
  origin: { lat: number; lon: number },
  target: { lat: number; lon: number },
): number {
  const dLat = toRadians(target.lat - origin.lat);
  const dLon = toRadians(target.lon - origin.lon);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(target.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function safeParseYear(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function extractTimespans(feature: WhgFeature): Array<[number | null, number | null]> {
  const timespans: Array<[number | null, number | null]> = [];

  const minmax = feature.properties?.minmax;
  if (Array.isArray(minmax) && minmax.length === 2) {
    timespans.push([
      safeParseYear(minmax[0]),
      safeParseYear(minmax[1]),
    ]);
  }

  const whens = feature.whens ?? [];
  for (const when of whens) {
    const spanList = when?.timespans ?? [];
    for (const timespan of spanList) {
      const start =
        safeParseYear(timespan?.start?.earliest) ??
        safeParseYear(timespan?.start?.latest);
      const end =
        safeParseYear(timespan?.end?.latest) ??
        safeParseYear(timespan?.end?.earliest);
      timespans.push([start, end]);
    }
  }

  return timespans;
}

function coversYear(timespans: Array<[number | null, number | null]>, year: number): boolean {
  if (timespans.length === 0) {
    return false;
  }

  return timespans.some(([start, end]) => {
    const afterStart = start === null || year >= start;
    const beforeEnd = end === null || year <= end;
    return afterStart && beforeEnd;
  });
}

function computeTimespanDistance(
  timespans: Array<[number | null, number | null]>,
  year: number,
): number {
  if (timespans.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let minDistance = Number.POSITIVE_INFINITY;
  for (const [start, end] of timespans) {
    if (start !== null && year < start) {
      minDistance = Math.min(minDistance, start - year);
    } else if (end !== null && year > end) {
      minDistance = Math.min(minDistance, year - end);
    } else {
      return 0;
    }
  }
  return minDistance;
}

function pickBestWhgFeature(
  features: WhgFeature[],
  context: LocationResolutionContext,
): { feature: WhgFeature; confidence: number } | null {
  if (features.length === 0) {
    return null;
  }

  let bestScore = -Infinity;
  let best: { feature: WhgFeature; confidence: number } | null = null;

  for (const feature of features) {
    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length !== 2) {
      continue;
    }

    const [lon, lat] = coordinates;
    const distanceKm = haversineDistanceKm(
      { lat: context.lat, lon: context.lon },
      { lat, lon },
    );

    const timespans = extractTimespans(feature);
    const yearMatch = coversYear(timespans, context.year);
    const yearDistance = computeTimespanDistance(timespans, context.year);

    const hasCountry = (feature.properties?.ccodes ?? []).length > 0;
    const hasTitle = Boolean(feature.properties?.title);

    let score = 0;
    score -= distanceKm; // closer is better
    if (yearMatch) {
      score += 500;
    } else if (Number.isFinite(yearDistance)) {
      score += Math.max(0, 50 - yearDistance);
    }
    if (hasCountry) {
      score += 25;
    }
    if (hasTitle) {
      score += 10;
    }
    if (timespans.length > 0) {
      score += 5;
    }

    if (score > bestScore) {
      const confidenceBase = yearMatch ? 0.75 : 0.45;
      const confidenceDistancePenalty = Math.min(distanceKm / 200, 0.4);
      const confidence = Math.max(
        0.1,
        Math.min(0.95, confidenceBase - confidenceDistancePenalty),
      );
      bestScore = score;
      best = { feature, confidence };
    }
  }

  return best;
}

function deriveAreaAndCountry(feature: WhgFeature): {
  settlement?: string;
  area?: string;
  country?: string;
} {
  const settlement = feature.properties?.title?.trim() || undefined;

  let country: string | undefined;
  const ccodes = feature.properties?.ccodes ?? [];
  if (ccodes.length > 0) {
    const normalized = ccodes[0]?.trim().toUpperCase();
    if (normalized && REGION_NAMES) {
      country = REGION_NAMES.of(normalized) ?? normalized;
    } else if (normalized) {
      country = normalized;
    }
  }

  let area: string | undefined;
  const broader = feature.related?.find(
    (entry) => entry.relation_type?.includes('broader') && entry.label,
  );
  if (broader?.label) {
    const parts = broader.label.split(',').map((item) => item.trim()).filter(Boolean);
    if (parts.length > 0) {
      area = parts[0];
    }
    if (!country && parts.length > 1) {
      country = parts[1];
    }
  }

  return { settlement, area, country };
}

async function resolveWithWhg(
  context: LocationResolutionContext,
): Promise<LocationResolutionResult> {
  const { baseUrl, defaultRadiusKm, maxResults } = LOCATION_CONFIG.whg;
  const radius = context.radiusKm ?? defaultRadiusKm;

  const endpoint = `${baseUrl}/spatial/`;
  const url = new URL(endpoint);
  url.searchParams.set('type', 'nearby');
  url.searchParams.set('lon', context.lon.toString());
  url.searchParams.set('lat', context.lat.toString());
  url.searchParams.set('km', radius.toString());
  url.searchParams.set('pagesize', maxResults.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'eurasia-hackathon/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`WHG request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as WhgResponse;
  const features = payload.features ?? [];

  const best = pickBestWhgFeature(features, context);
  if (!best) {
    return {
      area: 'Unknown area',
      country: undefined,
      settlement: undefined,
      provider: 'whg',
      confidence: 0.1,
      raw: payload,
    };
  }

  const { settlement, area, country } = deriveAreaAndCountry(best.feature);
  const fallbackArea = area ?? settlement ?? 'Unknown area';

  return {
    area: fallbackArea,
    country,
    settlement,
    provider: 'whg',
    confidence: best.confidence,
    raw: best.feature,
  };
}

async function resolveWithOpenAi(
  context: LocationResolutionContext,
): Promise<LocationResolutionResult> {
  const modelConfig = { ...MODELS.locationResolution };
  if (LOCATION_CONFIG.openai.modelOverride) {
    modelConfig.model = LOCATION_CONFIG.openai.modelOverride;
  }
  console.log({modelConfig})

  const { systemPrompt, userPrompt } = getPromptsForStep('locationResolution', {
    lon: context.lon.toFixed(4),
    lat: context.lat.toFixed(4),
    year: context.year.toString(),
  });

  let result: OpenAiLocationPayload;

  try {
    result = await generateJSONCompletion<OpenAiLocationPayload>(
      systemPrompt,
      userPrompt,
      modelConfig,
    );
  } catch (error) {
    if (error instanceof Error) {
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes('openai_api_key')) {
        throw new Error(
          'OpenAI location provider is misconfigured. Please set OPENAI_API_KEY in your environment.',
        );
      }
      if (lowerMessage.includes('api key')) {
        throw new Error(
          'OpenAI rejected the request. Double-check OPENAI_API_KEY and project permissions.',
        );
      }
      if (lowerMessage.includes('unexpected token') && lowerMessage.includes('please pro')) {
        console.log({lowerMessage})
        throw new Error(
          'OpenAI returned an HTML error (likely missing or invalid API key). Verify OPENAI_API_KEY before retrying.',
        );
      }
    }
    throw error;
  }

  const sanitizedConfidence = Number.isFinite(result.confidence)
    ? Math.max(0, Math.min(1, Number(result.confidence)))
    : 0.5;

  return {
    area: result.area?.trim() || 'Unknown area',
    country: result.country?.trim() || undefined,
    settlement: result.settlement?.trim() || undefined,
    provider: 'openai',
    confidence: sanitizedConfidence,
    raw: result,
  };
}

export async function resolveLocation(
  context: LocationResolutionContext,
  providerOverride?: LocationProviderType,
): Promise<LocationResolutionResult> {
  const provider = providerOverride ?? resolveLocationProvider();

  if (provider === 'openai') {
    return resolveWithOpenAi(context);
  }

  return resolveWithWhg(context);
}
