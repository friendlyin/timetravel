/**
 * API request and response types
 */

import { HistoricalContext, HistoricalContextInput } from './context.types';
import { PersonaOptions, PersonaGenerationInput } from './persona.types';
import { Lifeline, LifelineGenerationInput } from './lifeline.types';
import { PivotalMoment, PivotalMomentGenerationInput } from './pivotalMoment.types';
import {
  LocationResolutionContext,
  LocationResolutionResult,
} from './location.types';

// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Generate Context API
export interface GenerateContextRequest {
  input: HistoricalContextInput;
}

export type GenerateContextResponse = ApiResponse<HistoricalContext>;

// Generate Personas API
export interface GeneratePersonasRequest {
  input: PersonaGenerationInput;
}

export type GeneratePersonasResponse = ApiResponse<PersonaOptions>;

// Generate Lifeline API
export interface GenerateLifelineRequest {
  input: LifelineGenerationInput;
}

export type GenerateLifelineResponse = ApiResponse<Lifeline>;

// Generate Pivotal Moment API
export interface GeneratePivotalMomentRequest {
  input: PivotalMomentGenerationInput;
}

export type GeneratePivotalMomentResponse = ApiResponse<PivotalMoment>;

// Generate Image API
export interface ImageGenerationInput {
  prompt: string; // The scene description to visualize
  context?: string; // Optional: additional context for the image
  style?: string; // Optional: specific style instructions (e.g., "documentary photography", "historical painting")
  aspectRatio?: '1:1' | '16:9' | '4:3'; // Optional: desired aspect ratio
}

export interface GenerateImageRequest {
  input: ImageGenerationInput;
}

export interface GeneratedImage {
  url: string; // URL to the generated image
  revisedPrompt?: string; // The actual prompt used (may be revised by the AI)
  timestamp: string;
}

export type GenerateImageResponse = ApiResponse<GeneratedImage>;

// Resolve Location API
export interface ResolveLocationRequest {
  input: LocationResolutionContext;
}

export type ResolveLocationResponse = ApiResponse<LocationResolutionResult>;
