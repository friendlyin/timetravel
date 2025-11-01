/**
 * Types for pivotal moment generation
 */

import { HistoricalContext } from './context.types';
import { Lifeline } from './lifeline.types';

export interface PivotalMomentGenerationInput {
  historicalContext: HistoricalContext;
  currentLifeline: Lifeline;
  momentNumber: number; // Which pivotal moment this is (1st, 2nd, 3rd, etc.)
}

export interface Choice {
  id: string; // Unique identifier for this choice
  title: string; // Short title of the choice
  description: string; // Detailed description of what this choice entails
  immediateConsequences: string[]; // Immediate results of this choice
  potentialOutcomes: string[]; // Possible long-term outcomes
  risk: 'low' | 'medium' | 'high' | 'extreme'; // Risk level of this choice
  alignment: string[]; // What values/beliefs this aligns with (e.g., "duty", "ambition", "survival")
}

export interface PivotalMoment {
  id: string; // Unique identifier for this pivotal moment
  age: number; // Character's age at this moment
  year: string; // Historical year
  title: string; // Title of the pivotal moment
  situation: string; // Detailed description of the situation
  context: string; // Why this moment is pivotal
  stakes: string; // What's at stake in this decision
  choices: Choice[]; // Available choices (typically 2-4 options)
  timeConstraint?: string; // Optional: time pressure or urgency
  influencingFactors: string[]; // Factors that should influence the decision
  imagePrompt?: string; // Optional: suggested prompt for image generation
}

