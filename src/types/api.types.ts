/**
 * API request and response types
 */

import { HistoricalContext, HistoricalContextInput } from './context.types';
import { PersonaOptions, PersonaGenerationInput } from './persona.types';
import { Lifeline, LifelineGenerationInput } from './lifeline.types';
import { PivotalMoment, PivotalMomentGenerationInput } from './pivotalMoment.types';

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

export interface GenerateContextResponse extends ApiResponse<HistoricalContext> {}

// Generate Personas API
export interface GeneratePersonasRequest {
  input: PersonaGenerationInput;
}

export interface GeneratePersonasResponse extends ApiResponse<PersonaOptions> {}

// Generate Lifeline API
export interface GenerateLifelineRequest {
  input: LifelineGenerationInput;
}

export interface GenerateLifelineResponse extends ApiResponse<Lifeline> {}

// Generate Pivotal Moment API
export interface GeneratePivotalMomentRequest {
  input: PivotalMomentGenerationInput;
}

export interface GeneratePivotalMomentResponse extends ApiResponse<PivotalMoment> {}

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

export interface GenerateImageResponse extends ApiResponse<GeneratedImage> {}

