/**
 * Unified Agent Configuration
 *
 * This file defines all agents in the system with a uniform structure.
 * Each agent specifies its inputs, outputs, prompts, and model configuration.
 * All agents communicate through the session JSON file.
 */

import { ModelConfig, ImageModelConfig, MODELS } from "./models.config";
import { SYSTEM_PROMPTS, USER_PROMPTS } from "./prompts.config";
import type { SessionData } from "@/types/session.types";

export type AgentType =
  | "historicalContext"
  | "personaGeneration"
  | "lifelineGeneration"
  | "pivotalMomentGeneration"
  | "imagePromptGeneration"
  | "imageGeneration";

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
  condition?: "always" | "userSelection" | "endCondition" | "custom";
  nextAgentId?: string; // null means end of workflow
  description: string;
}

/**
 * Configuration for all agents in the system
 */
export const AGENTS: Record<AgentType, AgentConfig> = {
  historicalContext: {
    id: "historicalContext",
    type: "historicalContext",
    name: "Historical Context Agent",
    description:
      "Generates detailed historical context based on date and location",

    modelConfig: MODELS.historicalContext,
    systemPrompt: SYSTEM_PROMPTS.historicalContext,
    userPromptTemplate: USER_PROMPTS.historicalContext,

    inputFields: [
      {
        field: "input.date",
        required: true,
        description: "The historical date",
      },
      {
        field: "input.location",
        required: true,
        description: "The geographical location",
      },
    ],
    outputField: "historicalContext",

    nextAgentRules: [
      {
        condition: "always",
        nextAgentId: "personaGeneration",
        description:
          "After generating historical context, proceed to persona generation",
      },
    ],

    repeatable: false,
  },

  personaGeneration: {
    id: "personaGeneration",
    type: "personaGeneration",
    name: "Persona Generation Agent",
    description: "Generates possible personas based on historical context",

    modelConfig: MODELS.personaGeneration,
    systemPrompt: SYSTEM_PROMPTS.personaGeneration,
    userPromptTemplate: USER_PROMPTS.personaGeneration,

    inputFields: [
      {
        field: "historicalContext",
        required: true,
        description: "Historical context for the personas",
      },
      {
        field: "config.numberOfPersonaOptions",
        required: false,
        description: "Number of persona options to generate",
      },
    ],
    outputField: "personaOptions",

    nextAgentRules: [
      {
        condition: "userSelection",
        nextAgentId: "lifelineGeneration",
        description:
          "User must select a persona before proceeding to lifeline generation",
      },
    ],

    repeatable: false,
    requiresUserInput: true,
  },

  lifelineGeneration: {
    id: "lifelineGeneration",
    type: "lifelineGeneration",
    name: "Lifeline Generation Agent",
    description: "Generates character life narrative until a pivotal moment",

    modelConfig: MODELS.lifelineGeneration,
    systemPrompt: SYSTEM_PROMPTS.lifelineGeneration,
    userPromptTemplate: USER_PROMPTS.lifelineGeneration,

    inputFields: [
      {
        field: "historicalContext",
        required: true,
        description: "Historical context",
      },
      {
        field: "selectedPersona",
        required: true,
        description: "The persona selected by the user",
      },
      {
        field: "lifelines",
        required: false,
        description: "Previous lifelines (for continuation)",
      },
      {
        field: "lastChoice",
        required: false,
        description: "Last choice made at previous pivotal moment",
      },
    ],
    outputField: "lifelines", // Appends to array

    nextAgentRules: [
      {
        condition: "always",
        nextAgentId: "pivotalMomentGeneration",
        description: "After lifeline, generate a pivotal moment",
      },
    ],

    repeatable: true,
  },

  pivotalMomentGeneration: {
    id: "pivotalMomentGeneration",
    type: "pivotalMomentGeneration",
    name: "Pivotal Moment Agent",
    description: "Generates pivotal moments with multiple choices",

    modelConfig: MODELS.pivotalMomentGeneration,
    systemPrompt: SYSTEM_PROMPTS.pivotalMomentGeneration,
    userPromptTemplate: USER_PROMPTS.pivotalMomentGeneration,

    inputFields: [
      {
        field: "historicalContext",
        required: true,
        description: "Historical context",
      },
      {
        field: "lifelines",
        required: true,
        description: "Character lifelines (use latest)",
      },
      {
        field: "pivotalMoments",
        required: false,
        description: "Previous pivotal moments for context",
      },
    ],
    outputField: "pivotalMoments", // Appends to array

    nextAgentRules: [
      {
        condition: "userSelection",
        nextAgentId: "lifelineGeneration",
        description: "User makes a choice, then continue to next lifeline",
      },
      {
        condition: "endCondition",
        nextAgentId: undefined,
        description: "If end condition met (death, max moments), end the game",
      },
    ],

    repeatable: true,
    requiresUserInput: true,
  },

  imagePromptGeneration: {
    id: "imagePromptGeneration",
    type: "imagePromptGeneration",
    name: "Image Prompt Generation Agent",
    description: "Generates detailed prompts for documentary-realistic historical images",

    modelConfig: MODELS.imagePromptGeneration,
    systemPrompt: SYSTEM_PROMPTS.imagePromptGeneration,
    userPromptTemplate: USER_PROMPTS.imagePromptGeneration,

    inputFields: [
      {
        field: "lifelines",
        required: false,
        description: "Latest lifeline for context",
      },
      {
        field: "pivotalMoments",
        required: false,
        description: "Latest pivotal moment for context",
      },
      {
        field: "historicalContext",
        required: true,
        description: "Historical context for accuracy",
      },
    ],
    outputField: "imagePrompts", // Appends to array

    nextAgentRules: [
      {
        condition: "always",
        nextAgentId: "imageGeneration",
        description: "After generating prompt, proceed to image generation",
      },
    ],

    repeatable: true,
  },

  imageGeneration: {
    id: "imageGeneration",
    type: "imageGeneration",
    name: "Image Generation Agent",
    description: "Generates documentary-realistic historical images",

    modelConfig: MODELS.imageGeneration as ImageModelConfig,
    systemPrompt: SYSTEM_PROMPTS.imageGeneration,
    userPromptTemplate: USER_PROMPTS.imageGeneration,

    inputFields: [
      {
        field: "imagePrompts",
        required: true,
        description: "Latest image prompt to use for generation",
      },
      {
        field: "historicalContext",
        required: true,
        description: "Historical context for styling",
      },
    ],
    outputField: "images", // Appends to array

    nextAgentRules: [
      {
        condition: "always",
        nextAgentId: undefined,
        description: "Image generation is optional and returns to caller",
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
 *
 * @param currentAgentId - The agent that just executed
 * @param sessionData - The current session state
 * @param userJustMadeSelection - Whether the user just made a selection (for agents with requiresUserInput)
 */
export function getNextAgent(
  currentAgentId: AgentType,
  sessionData: SessionData,
  userJustMadeSelection: boolean = false
): AgentType | null {
  const currentAgent = AGENTS[currentAgentId];

  // Check for end conditions
  if (currentAgentId === "pivotalMomentGeneration") {
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

  // Check if current agent requires user input
  if (currentAgent.requiresUserInput && !userJustMadeSelection) {
    // Agent requires user input but user hasn't made a selection yet
    // Return null to pause the workflow
    return null;
  }

  // Find applicable next agent rule
  for (const rule of currentAgent.nextAgentRules) {
    if (rule.condition === "always") {
      return rule.nextAgentId as AgentType;
    }

    // Only proceed on userSelection if user has made a selection
    if (rule.condition === "userSelection" && userJustMadeSelection) {
      return rule.nextAgentId as AgentType;
    }

    if (rule.condition === "endCondition") {
      // Already checked above
      continue;
    }
  }

  return null;
}
