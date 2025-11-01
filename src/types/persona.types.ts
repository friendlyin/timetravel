/**
 * Types for persona generation
 */

import { HistoricalContext } from './context.types';

export interface PersonaGenerationInput {
  historicalContext: HistoricalContext;
  numberOfOptions?: number; // Number of persona options to generate (default: 3-5)
}

export interface FamilyBackground {
  socialClass: string; // Nobility, merchant class, peasantry, etc.
  occupation: string; // Family's primary occupation
  wealth: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'very wealthy';
  familySize: number; // Number of family members
  parentalStatus: string; // Both parents alive, single parent, orphan, etc.
  location: string; // Specific location within the historical context
}

export interface PersonaOption {
  id: string; // Unique identifier for this persona
  title: string; // Brief title describing this persona option
  familyBackground: FamilyBackground;
  birthCircumstances: string; // Specific circumstances of birth
  initialAttributes: {
    gender: 'male' | 'female' | 'other';
    ethnicity: string;
    physicalTraits: string[];
    earlyChildhood: string; // Description of early childhood circumstances
  };
  probability: number; // Probability percentage (0-100) of being born into this situation
  opportunities: string[]; // Potential opportunities available to this persona
  challenges: string[]; // Likely challenges this persona would face
}

export interface PersonaOptions {
  options: PersonaOption[];
  timestamp: string; // When these options were generated
}

