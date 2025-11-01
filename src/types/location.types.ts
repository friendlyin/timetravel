/**
 * Types representing human-readable location metadata tied to a specific year.
 */

export type LocationProviderType = 'whg' | 'openai';

export interface TemporalCoordinate {
  lon: number;
  lat: number;
  year: number;
}

export interface LocationName {
  /**
   * Broader area name (region, province, or descriptive label).
   * Always present even if other fields are missing.
   */
  area: string;
  /**
   * Optional modern or historical country/state name.
   */
  country?: string;
  /**
   * Optional settlement name (city, town, village, etc.).
   */
  settlement?: string;
}

export interface LocationResolutionContext extends TemporalCoordinate {
  /**
   * Optional number of kilometers to search around the coordinate.
   */
  radiusKm?: number;
}

export interface LocationResolutionResult extends LocationName {
  /**
   * Provider that produced this result.
   */
  provider: LocationProviderType;
  /**
   * Simple heuristic confidence score between 0 and 1.
   */
  confidence: number;
  /**
   * Optional raw payload for debugging or downstream enrichment.
   */
  raw?: unknown;
}

