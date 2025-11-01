/**
 * Configuration for the game workflow and sequence of steps
 * 
 * This file defines the order and structure of the game flow.
 * You can easily modify the sequence, add new steps, or change the logic.
 * 
 * NOTE: The main workflow sequence is now defined in agents.config.ts
 * This file maintains backwards compatibility and game configuration.
 */

export type WorkflowStepType = 
  | 'historicalContext'
  | 'personaGeneration'
  | 'lifelineGeneration'
  | 'pivotalMomentGeneration'
  | 'imageGeneration';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  description: string;
  required: boolean;
  repeatable: boolean; // Can this step be called multiple times in a game?
}

/**
 * Define the sequence of steps in the game
 */
export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'step-1',
    type: 'historicalContext',
    name: 'Generate Historical Context',
    description: 'Generate detailed historical context based on date and location',
    required: true,
    repeatable: false,
  },
  {
    id: 'step-2',
    type: 'personaGeneration',
    name: 'Generate Persona Options',
    description: 'Generate possible personas for the player to choose from',
    required: true,
    repeatable: false,
  },
  {
    id: 'step-3',
    type: 'lifelineGeneration',
    name: 'Generate Initial Lifeline',
    description: 'Generate the character\'s life story until the first pivotal moment',
    required: true,
    repeatable: true, // Will be called multiple times as the story progresses
  },
  {
    id: 'step-4',
    type: 'pivotalMomentGeneration',
    name: 'Generate Pivotal Moment',
    description: 'Generate a pivotal moment with multiple choices',
    required: true,
    repeatable: true, // Will be called multiple times throughout the character's life
  },
  {
    id: 'step-5',
    type: 'imageGeneration',
    name: 'Generate Image',
    description: 'Generate documentary-realistic images for each stage',
    required: false, // Images enhance the experience but aren't strictly necessary
    repeatable: true, // Images can be generated for each life stage and pivotal moment
  },
];

/**
 * Configuration for game flow
 */
export const GAME_CONFIG = {
    // Number of persona options to generate
    defaultPersonaOptions: 4,

    // Number of pivotal moments before character's death
    // This can be varied based on the character's circumstances
    minPivotalMoments: 3,
    maxPivotalMoments: 7,
    defaultPivotalMoments: 5,

    // Age ranges
    defaultStartAge: 0, // Characters start at birth
    typicalDeathAgeRange: {
        min: 30, // Historical life expectancy could be quite low
        max: 80
    },

    // Image generation preferences
    generateImageForEachLifeline: true, // Temporarily disabled due to Gemini quota
    generateImageForEachPivotalMoment: true, // Temporarily disabled due to Gemini quota

    // Lifeline generation preferences
    typicalYearsBetweenPivotalMoments: {
        min: 5,
        max: 15
    }
} as const

/**
 * Check if game should end based on session state
 */
export function shouldEndGame(pivotalMomentCount: number, maxMoments: number): boolean {
  return pivotalMomentCount >= maxMoments;
}

/**
 * Get the workflow step by ID
 */
export function getWorkflowStep(id: string): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find(step => step.id === id);
}

/**
 * Get the workflow step by type
 */
export function getWorkflowStepByType(type: WorkflowStepType): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find(step => step.type === type);
}

/**
 * Get all repeatable steps
 */
export function getRepeatableSteps(): WorkflowStep[] {
  return WORKFLOW_STEPS.filter(step => step.repeatable);
}

/**
 * Check if a step is repeatable
 */
export function isStepRepeatable(type: WorkflowStepType): boolean {
  const step = getWorkflowStepByType(type);
  return step?.repeatable ?? false;
}

