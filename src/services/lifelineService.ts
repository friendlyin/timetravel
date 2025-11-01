/**
 * Lifeline Service
 * 
 * This service generates a character's life narrative from their current point
 * until they reach a pivotal moment. Now uses the unified agent executor system.
 */

import { getAgentConfig } from '@/config/agents.config';
import { GAME_CONFIG } from '@/config/workflow.config';
import { Lifeline } from '@/types/lifeline.types';
import { executeAgent } from './agentExecutor';
import { generateSceneImage } from './imageWorkflowService';
import { readSession } from './sessionService';

/**
 * Generate a lifeline narrative until a pivotal moment
 * 
 * This function can be called multiple times:
 * - First time: generates from birth to first pivotal moment
 * - Subsequent times: continues from previous lifeline based on player's choice
 * 
 * @param sessionId - The session ID
 * @returns A lifeline segment ending at a pivotal moment
 */
export async function generateLifeline(
  sessionId: string
): Promise<Lifeline> {
  // Get agent configuration
  const agentConfig = getAgentConfig('lifelineGeneration');
  
  // Execute agent (reads from session, writes to session)
  const result = await executeAgent(agentConfig, sessionId);
  
  // If agent didn't return data (mock mode), generate and add mock data
  if (!result) {
    const session = readSession(sessionId);
    const startAge = 0;
    const endAge = startAge + (Math.floor(Math.random() * 10) + 5); // 5-15 years
    
    const mockLifeline: Lifeline = {
      id: `lifeline-${Date.now()}`,
      startAge,
      endAge,
      narrative: `Born as ${session.selectedPersona?.title || 'a child'}. Life from birth to age ${endAge}. Growing up in ${session.input.location}, experiencing the trials and opportunities of the time...`,
      events: [
        {
          age: startAge + 3,
          year: 'Year 3',
          event: 'Early childhood milestone',
          impact: 'moderate',
          location: session.input.location,
        },
        {
          age: startAge + 7,
          year: 'Year 7',
          event: 'Significant family event',
          impact: 'significant',
          location: session.input.location,
        },
        {
          age: endAge,
          year: `Year ${endAge}`,
          event: 'Approaching pivotal moment',
          impact: 'major',
          location: session.input.location,
        },
      ],
      characterDevelopment: {
        skills: ['Basic literacy', 'Practical skills from family trade'],
        relationships: ['Family bonds', 'Local community connections'],
        beliefs: ['Traditional values', 'Respect for elders'],
        reputation: 'Known in local community',
        physicalCondition: 'Healthy and developing',
        mentalState: 'Curious and learning',
      },
      pivotalMomentReached: true,
      imagePrompt: `${session.selectedPersona?.title || 'A person'} at age ${endAge} in ${session.input.location} during ${session.input.date}`,
    };
    return mockLifeline;
  }
  
  // Read the result from session and get latest lifeline
  const session = readSession(sessionId);
  const lifeline = session.lifelines[session.lifelines.length - 1];

  if (lifeline) {
    const shouldGenerateImage =
      session.config.generateImages ??
      GAME_CONFIG.generateImageForEachLifeline;
    const alreadyHasImage =
      session.images?.some(
        (image) =>
          image.sourceType === 'lifeline' && image.sourceId === lifeline.id,
      ) ?? false;

    if (shouldGenerateImage && !alreadyHasImage) {
      try {
        await generateSceneImage(sessionId, 'lifeline', lifeline.id);
      } catch (error) {
        console.error(
          '⚠️  Failed to auto-generate lifeline image:',
          error,
        );
      }
    }
  }

  return lifeline;
}
