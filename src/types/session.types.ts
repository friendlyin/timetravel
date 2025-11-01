/**
 * Session Data Types
 * 
 * These types define the structure of the session JSON file that serves
 * as the communication medium between all agents.
 */

import { HistoricalContext } from './context.types';
import { PersonaOptions, PersonaOption } from './persona.types';
import { Lifeline } from './lifeline.types';
import { PivotalMoment, Choice } from './pivotalMoment.types';

/**
 * Initial input provided by the user
 */
export interface SessionInput {
  date: string;
  location: string;
  time?: string;
}

/**
 * Configuration options for the session
 */
export interface SessionConfig {
  numberOfPersonaOptions?: number;
  maxPivotalMoments?: number;
  generateImages?: boolean;
}

/**
 * User choice made at a pivotal moment
 */
export interface UserChoice {
  pivotalMomentId: string;
  choiceId: string;
  choiceTitle: string;
  timestamp: string;
}

/**
 * Image prompt data
 */
export interface ImagePrompt {
  id: string;
  prompt: string;
  sourceType: 'lifeline' | 'pivotalMoment' | 'context';
  sourceId: string;
  timestamp: string;
}

/**
 * Generated image data
 */
export interface GeneratedImage {
  id: string;
  url: string;
  revisedPrompt?: string;
  filePath?: string; // Local file path in session folder
  sourceType: 'lifeline' | 'pivotalMoment' | 'context';
  sourceId: string;
  timestamp: string;
}

/**
 * Agent execution log entry
 */
export interface AgentExecutionLog {
  agentId: string;
  agentName: string;
  startTime: string;
  endTime: string;
  duration: number; // milliseconds
  inputData: any;
  outputData: any;
  success: boolean;
  error?: string;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  sessionId: string;
  startTime: string;
  endTime?: string;
  currentStep: string;
  status: 'active' | 'completed' | 'failed';
  totalSteps: number;
}

/**
 * Complete session data structure
 * This is what gets saved to session JSON files
 */
export interface SessionData {
  // Metadata
  metadata: SessionMetadata;
  
  // Initial input
  input: SessionInput;
  
  // Configuration
  config: SessionConfig;
  
  // Agent outputs (in order of workflow)
  historicalContext?: HistoricalContext;
  personaOptions?: PersonaOptions;
  selectedPersona?: PersonaOption;
  lifelines: Lifeline[];
  pivotalMoments: PivotalMoment[];
  choices: UserChoice[];
  imagePrompts: ImagePrompt[];
  images: GeneratedImage[];
  
  // Execution logs for debugging and analysis
  executionLogs: AgentExecutionLog[];
  
  // Game state
  gameState: {
    currentAge?: number;
    isAlive: boolean;
    endReason?: string; // 'death', 'max_moments', 'natural_end'
  };
}

/**
 * Create a new empty session
 */
export function createEmptySession(
  sessionId: string,
  input: SessionInput,
  config: SessionConfig = {}
): SessionData {
  return {
    metadata: {
      sessionId,
      startTime: new Date().toISOString(),
      currentStep: 'initialization',
      status: 'active',
      totalSteps: 0,
    },
    input,
    config: {
      numberOfPersonaOptions: config.numberOfPersonaOptions || 4,
      maxPivotalMoments: config.maxPivotalMoments || 5,
      generateImages: config.generateImages ?? false,
    },
    lifelines: [],
    pivotalMoments: [],
    choices: [],
    imagePrompts: [],
    images: [],
    executionLogs: [],
    gameState: {
      isAlive: true,
    },
  };
}

/**
 * Type guard to check if session has historical context
 */
export function hasHistoricalContext(session: SessionData): session is SessionData & { historicalContext: HistoricalContext } {
  return session.historicalContext !== undefined;
}

/**
 * Type guard to check if session has persona options
 */
export function hasPersonaOptions(session: SessionData): session is SessionData & { personaOptions: PersonaOptions } {
  return session.personaOptions !== undefined;
}

/**
 * Type guard to check if session has selected persona
 */
export function hasSelectedPersona(session: SessionData): session is SessionData & { selectedPersona: PersonaOption } {
  return session.selectedPersona !== undefined;
}

/**
 * Get the latest lifeline from session
 */
export function getLatestLifeline(session: SessionData): Lifeline | undefined {
  if (session.lifelines.length === 0) return undefined;
  return session.lifelines[session.lifelines.length - 1];
}

/**
 * Get the latest pivotal moment from session
 */
export function getLatestPivotalMoment(session: SessionData): PivotalMoment | undefined {
  if (session.pivotalMoments.length === 0) return undefined;
  return session.pivotalMoments[session.pivotalMoments.length - 1];
}

/**
 * Get the latest user choice from session
 */
export function getLatestChoice(session: SessionData): UserChoice | undefined {
  if (session.choices.length === 0) return undefined;
  return session.choices[session.choices.length - 1];
}

