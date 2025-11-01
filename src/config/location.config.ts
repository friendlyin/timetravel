import type { LocationProviderType } from '@/types/location.types';

const FALLBACK_PROVIDER: LocationProviderType = 'whg';

/**
 * Resolve the configured location provider.
 * Uses NEXT_PUBLIC_LOCATION_PROVIDER on the client and LOCATION_PROVIDER on the server.
 */
export function resolveLocationProvider(): LocationProviderType {
  const envProvider =
    (typeof window === 'undefined'
      ? process.env.LOCATION_PROVIDER
      : process.env.NEXT_PUBLIC_LOCATION_PROVIDER) ?? '';

  const normalized = envProvider.trim().toLowerCase();

  if (normalized === 'whg' || normalized === 'openai') {
    return normalized;
  }

  return FALLBACK_PROVIDER;
}

export const LOCATION_CONFIG = {
  whg: {
    baseUrl:
      process.env.WHG_API_BASE_URL?.replace(/\/+$/, '') ??
      'https://whgazetteer.org/api',
    defaultRadiusKm: Number.parseFloat(
      process.env.WHG_DEFAULT_RADIUS_KM ?? '25'
    ),
    maxResults: Number.parseInt(process.env.WHG_MAX_RESULTS ?? '40', 10),
  },
  openai: {
    // Optional override for the model used for location resolution
    modelOverride: process.env.LOCATION_OPENAI_MODEL,
  },
} as const;
