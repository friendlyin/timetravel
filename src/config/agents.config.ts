/**
 * Unified Agent Configuration
 * 
 * This file defines all agents in the system with a uniform structure.
 * Each agent specifies its inputs, outputs, prompts, and model configuration.
 * All agents communicate through the session JSON file.
 */

import { ModelConfig, ImageModelConfig, MODELS } from './models.config';
import { SYSTEM_PROMPTS, USER_PROMPTS } from './prompts.config';

export type AgentType = 
  | 'historicalContext'
  | 'personaGeneration'
  | 'lifelineGeneration'
  | 'pivotalMomentGeneration'
  | 'imageGeneration';

export interface AgentInputField {
  field: string; // Path in session JSON (e.g., "input.date", "historicalContext")
  required: boolean;
  description: string;
}

export interface AgentConfig {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  
  // Model configuration
  modelConfig: ModelConfig | ImageModelConfig;
  
  // Prompts
  systemPrompt: string;
  userPromptTemplate: string;
  
  // Input/Output mapping to session JSON
  inputFields: AgentInputField[];
  outputField: string; // Where to write in session JSON
  
  // Branching logic
  nextAgentRules: NextAgentRule[];
  
  // Execution options
  repeatable: boolean;
  requiresUserInput?: boolean; // If true, needs user selection before proceeding
}

export interface NextAgentRule {
  condition?: 'always' | 'userSelection' | 'endCondition' | 'custom';
  nextAgentId?: string; // null means end of workflow
  description: string;
}

/**
 * Configuration for all agents in the system
 */
export const AGENTS: Record<AgentType, AgentConfig> = {
  historicalContext: {
    id: 'historicalContext',
    type: 'historicalContext',
    name: 'Historical Context Agent',
    description: 'Generates detailed historical context based on date and location',
    
    modelConfig: MODELS.historicalContext,
    systemPrompt: SYSTEM_PROMPTS.historicalContext,
    userPromptTemplate: USER_PROMPTS.historicalContext,
    
    inputFields: [
      {
        field: 'input.date',
        required: true,
        description: 'The historical date',
      },
      {
        field: 'input.location',
        required: true,
        description: 'The geographical location',
      },
    ],
    outputField: 'historicalContext',
    
    nextAgentRules: [
      {
        condition: 'always',
        nextAgentId: 'personaGeneration',
        description: 'After generating historical context, proceed to persona generation',
      },
    ],
    
    repeatable: false,
  },

  personaGeneration: {
    id: 'personaGeneration',
    type: 'personaGeneration',
    name: 'Persona Generation Agent',
    description: 'Generates possible personas based on historical context',
    
    modelConfig: MODELS.personaGeneration,
    systemPrompt: SYSTEM_PROMPTS.personaGeneration,
    userPromptTemplate: USER_PROMPTS.personaGeneration,
    
    inputFields: [
      {
        field: 'historicalContext',
        required: true,
        description: 'Historical context for the personas',
      },
      {
        field: 'config.numberOfPersonaOptions',
        required: false,
        description: 'Number of persona options to generate',
      },
    ],
    outputField: 'personaOptions',
    
    nextAgentRules: [
      {
        condition: 'userSelection',
        nextAgentId: 'lifelineGeneration',
        description: 'User must select a persona before proceeding to lifeline generation',
      },
    ],
    
    repeatable: false,
    requiresUserInput: true,
  },

  lifelineGeneration: {
    id: 'lifelineGeneration',
    type: 'lifelineGeneration',
    name: 'Lifeline Generation Agent',
    description: 'Generates character life narrative until a pivotal moment',
    
    modelConfig: MODELS.lifelineGeneration,
    systemPrompt: SYSTEM_PROMPTS.lifelineGeneration,
    userPromptTemplate: USER_PROMPTS.lifelineGeneration,
    
    inputFields: [
      {
        field: 'historicalContext',
        required: true,
        description: 'Historical context',
      },
      {
        field: 'selectedPersona',
        required: true,
        description: 'The persona selected by the user',
      },
      {
        field: 'lifelines',
        required: false,
        description: 'Previous lifelines (for continuation)',
      },
      {
        field: 'lastChoice',
        required: false,
        description: 'Last choice made at previous pivotal moment',
      },
    ],
    outputField: 'lifelines', // Appends to array
    
    nextAgentRules: [
      {
        condition: 'always',
        nextAgentId: 'pivotalMomentGeneration',
        description: 'After lifeline, generate a pivotal moment',
      },
    ],
    
    repeatable: true,
  },

  pivotalMomentGeneration: {
    id: 'pivotalMomentGeneration',
    type: 'pivotalMomentGeneration',
    name: 'Pivotal Moment Agent',
    description: 'Generates pivotal moments with multiple choices',
    
    modelConfig: MODELS.pivotalMomentGeneration,
    systemPrompt: SYSTEM_PROMPTS.pivotalMomentGeneration,
    userPromptTemplate: USER_PROMPTS.pivotalMomentGeneration,
    
    inputFields: [
      {
        field: 'historicalContext',
        required: true,
        description: 'Historical context',
      },
      {
        field: 'lifelines',
        required: true,
        description: 'Character lifelines (use latest)',
      },
      {
        field: 'pivotalMoments',
        required: false,
        description: 'Previous pivotal moments for context',
      },
    ],
    outputField: 'pivotalMoments', // Appends to array
    
    nextAgentRules: [
      {
        condition: 'userSelection',
        nextAgentId: 'lifelineGeneration',
        description: 'User makes a choice, then continue to next lifeline',
      },
      {
        condition: 'endCondition',
        nextAgentId: undefined,
        description: 'If end condition met (death, max moments), end the game',
      },
    ],
    
    repeatable: true,
    requiresUserInput: true,
  },

  imageGeneration: {
    id: 'imageGeneration',
    type: 'imageGeneration',
    name: 'Image Generation Agent',
    description: 'Generates documentary-realistic historical images',
    
    modelConfig: MODELS.imageGeneration as ImageModelConfig,
    systemPrompt: SYSTEM_PROMPTS.imageGeneration,
    userPromptTemplate: USER_PROMPTS.imageGeneration,
    
    inputFields: [
      {
        field: 'lifelines',
        required: false,
        description: 'Latest lifeline for image generation',
      },
      {
        field: 'pivotalMoments',
        required: false,
        description: 'Latest pivotal moment for image generation',
      },
      {
        field: 'historicalContext',
        required: true,
        description: 'Historical context for styling',
      },
    ],
    outputField: 'images', // Appends to array
    
    nextAgentRules: [
      {
        condition: 'always',
        nextAgentId: undefined,
        description: 'Image generation is optional and returns to caller',
      },
    ],
    
    repeatable: true,
  },
};

/**
 * Get agent configuration by ID
 */
export function getAgentConfig(agentId: AgentType): AgentConfig {
  return AGENTS[agentId];
}

/**
 * Get the first agent in the workflow
 */
export function getInitialAgent(): AgentConfig {
  return AGENTS.historicalContext;
}

/**
 * Determine the next agent based on current agent and conditions
 */
export function getNextAgent(
  currentAgentId: AgentType,
  sessionData: any
): AgentType | null {
  const currentAgent = AGENTS[currentAgentId];
  
  // Check for end conditions
  if (currentAgentId === 'pivotalMomentGeneration') {
    const pivotalMoments = sessionData.pivotalMoments || [];
    const maxMoments = sessionData.config?.maxPivotalMoments || 5;
    
    // Check if we've reached max pivotal moments
    if (pivotalMoments.length >= maxMoments) {
      return null; // End game
    }
    
    // Check if character died (this would be in the last pivotal moment)
    const lastMoment = pivotalMoments[pivotalMoments.length - 1];
    if (lastMoment?.characterDied) {
      return null; // End game
    }
  }
  
  // Find applicable next agent rule
  for (const rule of currentAgent.nextAgentRules) {
    if (rule.condition === 'always' || rule.condition === 'userSelection') {
      return rule.nextAgentId as AgentType;
    }
    if (rule.condition === 'endCondition') {
      // Already checked above
      continue;
    }
  }
  
  return null;
}

