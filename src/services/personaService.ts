/**
 * Persona Service
 * 
 * This service generates possible personas (character options) based on
 * the historical context. Each persona represents a different type of
 * person who could have lived in those circumstances.
 */

import { PersonaOptions, PersonaGenerationInput } from '@/types/persona.types';
import { generateJSONCompletion } from '@/lib/openai';
import { MODELS } from '@/config/models.config';
import { getPromptsForStep } from '@/config/prompts.config';
import { GAME_CONFIG } from '@/config/workflow.config';

/**
 * Generate persona options based on historical context
 * 
 * @param input - Historical context and configuration
 * @returns Multiple persona options for the player to choose from
 */
export async function generatePersonaOptions(
  input: PersonaGenerationInput
): Promise<PersonaOptions> {
  // TODO: Implement actual OpenAI call when prompts are finalized
  
  const numberOfOptions = input.numberOfOptions || GAME_CONFIG.defaultPersonaOptions;
  
  // Get the configured model and prompts
  const modelConfig = MODELS.personaGeneration;
  const { systemPrompt, userPrompt } = getPromptsForStep('personaGeneration', {
    historicalContextJson: JSON.stringify(input.historicalContext, null, 2),
    numberOfOptions: numberOfOptions.toString(),
  });
  
  // For now, return mock data with proper structure
  // When ready to implement, uncomment the following:
  /*
  const personas = await generateJSONCompletion<PersonaOptions>(
    systemPrompt,
    userPrompt,
    modelConfig
  );
  return personas;
  */
  
  // Mock response for testing
  return {
    options: [
      {
        id: 'persona-1',
        title: 'Mock Persona 1',
        familyBackground: {
          socialClass: 'Mock Class',
          occupation: 'Mock Occupation',
          wealth: 'modest',
          familySize: 5,
          parentalStatus: 'Both parents alive',
          location: 'Mock Location',
        },
        birthCircumstances: 'Mock birth circumstances',
        initialAttributes: {
          gender: 'male',
          ethnicity: 'Mock Ethnicity',
          physicalTraits: ['Mock trait 1', 'Mock trait 2'],
          earlyChildhood: 'Mock early childhood',
        },
        probability: 35,
        opportunities: ['Mock opportunity 1', 'Mock opportunity 2'],
        challenges: ['Mock challenge 1', 'Mock challenge 2'],
      },
      {
        id: 'persona-2',
        title: 'Mock Persona 2',
        familyBackground: {
          socialClass: 'Mock Class 2',
          occupation: 'Mock Occupation 2',
          wealth: 'poor',
          familySize: 7,
          parentalStatus: 'Single parent',
          location: 'Mock Location 2',
        },
        birthCircumstances: 'Mock birth circumstances 2',
        initialAttributes: {
          gender: 'female',
          ethnicity: 'Mock Ethnicity 2',
          physicalTraits: ['Mock trait 3', 'Mock trait 4'],
          earlyChildhood: 'Mock early childhood 2',
        },
        probability: 40,
        opportunities: ['Mock opportunity 3'],
        challenges: ['Mock challenge 3', 'Mock challenge 4'],
      },
      {
        id: 'persona-3',
        title: 'Mock Persona 3',
        familyBackground: {
          socialClass: 'Mock Class 3',
          occupation: 'Mock Occupation 3',
          wealth: 'wealthy',
          familySize: 3,
          parentalStatus: 'Both parents alive',
          location: 'Mock Location 3',
        },
        birthCircumstances: 'Mock birth circumstances 3',
        initialAttributes: {
          gender: 'male',
          ethnicity: 'Mock Ethnicity 3',
          physicalTraits: ['Mock trait 5'],
          earlyChildhood: 'Mock early childhood 3',
        },
        probability: 25,
        opportunities: ['Mock opportunity 4', 'Mock opportunity 5', 'Mock opportunity 6'],
        challenges: ['Mock challenge 5'],
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

