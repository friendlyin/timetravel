/**
 * Lifeline Service
 * 
 * This service generates a character's life narrative from their current point
 * until they reach a pivotal moment. This is a reusable service that can be
 * called multiple times throughout the game as the character's story progresses.
 */

import { Lifeline, LifelineGenerationInput } from '@/types/lifeline.types';
import { generateJSONCompletion } from '@/lib/openai';
import { MODELS } from '@/config/models.config';
import { getPromptsForStep } from '@/config/prompts.config';

/**
 * Generate a lifeline narrative until a pivotal moment
 * 
 * This function can be called multiple times:
 * - First time: generates from birth to first pivotal moment
 * - Subsequent times: continues from previous lifeline based on player's choice
 * 
 * @param input - Historical context, persona, and optional previous lifeline
 * @returns A lifeline segment ending at a pivotal moment
 */
export async function generateLifeline(
  input: LifelineGenerationInput
): Promise<Lifeline> {
  // TODO: Implement actual OpenAI call when prompts are finalized
  
  // Get the configured model and prompts
  const modelConfig = MODELS.lifelineGeneration;
  
  // Build the prompt variables
  const variables: Record<string, string> = {
    historicalContextJson: JSON.stringify(input.historicalContext, null, 2),
    personaJson: JSON.stringify(input.selectedPersona, null, 2),
    previousLifelineSection: '',
  };
  
  // If there's a previous lifeline, include it and the choice made
  if (input.previousLifeline && input.previousChoice) {
    variables.previousLifelineSection = `
Previous Lifeline:
${JSON.stringify(input.previousLifeline, null, 2)}

Previous Choice Made:
${input.previousChoice}
`;
  }
  
  const { systemPrompt, userPrompt } = getPromptsForStep('lifelineGeneration', variables);
  
  // For now, return mock data with proper structure
  // When ready to implement, uncomment the following:
  /*
  const lifeline = await generateJSONCompletion<Lifeline>(
    systemPrompt,
    userPrompt,
    modelConfig
  );
  return lifeline;
  */
  
  // Determine the age range for this lifeline segment
  const startAge = input.previousLifeline ? input.previousLifeline.endAge : 0;
  const endAge = startAge + (Math.floor(Math.random() * 10) + 5); // 5-15 years
  
  // Mock response for testing
  return {
    id: `lifeline-${Date.now()}`,
    startAge,
    endAge,
    narrative: input.previousLifeline
      ? `Continuation of life from age ${startAge} to ${endAge}. The choice "${input.previousChoice}" had significant impacts...`
      : `Born as ${input.selectedPersona.title}. Life from birth to age ${endAge}...`,
    events: [
      {
        age: startAge + 2,
        year: 'Mock Year',
        event: 'Mock life event',
        impact: 'moderate',
        location: 'Mock Location',
      },
      {
        age: startAge + 5,
        year: 'Mock Year 2',
        event: 'Mock life event 2',
        impact: 'significant',
        location: 'Mock Location 2',
      },
    ],
    characterDevelopment: {
      skills: ['Mock skill 1', 'Mock skill 2'],
      relationships: ['Mock relationship 1', 'Mock relationship 2'],
      beliefs: ['Mock belief 1'],
      reputation: 'Mock reputation',
      physicalCondition: 'Mock physical condition',
      mentalState: 'Mock mental state',
    },
    pivotalMomentReached: true,
    imagePrompt: 'Mock scene description for image generation',
  };
}

