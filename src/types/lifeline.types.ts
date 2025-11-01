/**
 * Types for lifeline generation
 */

import { HistoricalContext } from './context.types';
import { PersonaOption } from './persona.types';

export interface LifelineGenerationInput {
  historicalContext: HistoricalContext;
  selectedPersona: PersonaOption;
  previousLifeline?: Lifeline; // Optional: for continuing after a pivotal moment
  previousChoice?: string; // Optional: the choice made at the previous pivotal moment
}

export interface LifeEvent {
  age: number; // Age at which this event occurred
  year: string; // Historical year
  event: string; // Description of the event
  impact: 'minor' | 'moderate' | 'significant' | 'major'; // Impact on the character's life
  location: string; // Where the event took place
}

export interface CharacterDevelopment {
  skills: string[]; // Skills acquired
  relationships: string[]; // Important relationships formed
  beliefs: string[]; // Beliefs and values developed
  reputation: string; // Social standing and reputation
  physicalCondition: string; // Health and physical state
  mentalState: string; // Mental and emotional state
}

export interface Lifeline {
  id: string; // Unique identifier for this lifeline segment
  startAge: number; // Starting age for this segment
  endAge: number; // Ending age (age at pivotal moment)
  narrative: string; // Narrative description of this life period
  events: LifeEvent[]; // Key events that occurred
  characterDevelopment: CharacterDevelopment;
  pivotalMomentReached: boolean; // Whether this segment ends at a pivotal moment
  imagePrompt?: string; // Optional: suggested prompt for image generation
}

