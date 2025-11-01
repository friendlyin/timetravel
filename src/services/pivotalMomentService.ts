/**
 * Pivotal Moment Service
 * 
 * This service generates pivotal moments in a character's life - critical
 * decision points that significantly impact their future. This is a reusable
 * service that can be called multiple times throughout the game.
 */

import { PivotalMoment, PivotalMomentGenerationInput } from '@/types/pivotalMoment.types';
import { generateJSONCompletion } from '@/lib/openai';
import { MODELS } from '@/config/models.config';
import { getPromptsForStep } from '@/config/prompts.config';

/**
 * Generate a pivotal moment with multiple choice options
 * 
 * This function can be called multiple times throughout a character's life,
 * creating different pivotal moments at different ages.
 * 
 * @param input - Historical context, current lifeline, and moment number
 * @returns A pivotal moment with multiple choice options
 */
export async function generatePivotalMoment(
  input: PivotalMomentGenerationInput
): Promise<PivotalMoment> {
  // TODO: Implement actual OpenAI call when prompts are finalized
  
  // Get the configured model and prompts
  const modelConfig = MODELS.pivotalMomentGeneration;
  const { systemPrompt, userPrompt } = getPromptsForStep('pivotalMomentGeneration', {
    historicalContextJson: JSON.stringify(input.historicalContext, null, 2),
    lifelineJson: JSON.stringify(input.currentLifeline, null, 2),
    momentNumber: input.momentNumber.toString(),
  });
  
  // For now, return mock data with proper structure
  // When ready to implement, uncomment the following:
  /*
  const pivotalMoment = await generateJSONCompletion<PivotalMoment>(
    systemPrompt,
    userPrompt,
    modelConfig
  );
  return pivotalMoment;
  */
  
  // Mock response for testing
  return {
    id: `pivotal-moment-${Date.now()}`,
    age: input.currentLifeline.endAge,
    year: 'Mock Year',
    title: `Mock Pivotal Moment #${input.momentNumber}`,
    situation: 'Mock situation description. A critical moment has arrived...',
    context: 'Mock context explaining why this moment is pivotal',
    stakes: 'Mock description of what is at stake',
    choices: [
      {
        id: 'choice-1',
        title: 'Mock Choice 1',
        description: 'Detailed description of choice 1',
        immediateConsequences: [
          'Mock immediate consequence 1',
          'Mock immediate consequence 2',
        ],
        potentialOutcomes: [
          'Mock potential outcome 1',
          'Mock potential outcome 2',
        ],
        risk: 'medium',
        alignment: ['duty', 'stability'],
      },
      {
        id: 'choice-2',
        title: 'Mock Choice 2',
        description: 'Detailed description of choice 2',
        immediateConsequences: [
          'Mock immediate consequence 3',
          'Mock immediate consequence 4',
        ],
        potentialOutcomes: [
          'Mock potential outcome 3',
          'Mock potential outcome 4',
        ],
        risk: 'high',
        alignment: ['ambition', 'change'],
      },
      {
        id: 'choice-3',
        title: 'Mock Choice 3',
        description: 'Detailed description of choice 3',
        immediateConsequences: [
          'Mock immediate consequence 5',
        ],
        potentialOutcomes: [
          'Mock potential outcome 5',
          'Mock potential outcome 6',
        ],
        risk: 'low',
        alignment: ['safety', 'tradition'],
      },
    ],
    timeConstraint: 'Mock time constraint',
    influencingFactors: [
      'Mock influencing factor 1',
      'Mock influencing factor 2',
      'Mock influencing factor 3',
    ],
    imagePrompt: 'Mock scene description for pivotal moment visualization',
  };
}

