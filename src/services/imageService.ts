/**
 * Image Service
 * 
 * This service generates documentary-realistic images to visualize historical
 * contexts, lifelines, and pivotal moments. Now uses the unified agent executor system.
 */

import { getAgentConfig } from '@/config/agents.config';
import { executeAgent } from './agentExecutor';
import { readSession } from './sessionService';
import { GeneratedImage } from '@/types/session.types';

/**
 * Generate a documentary-realistic historical image
 * 
 * This function can be called multiple times to generate images for:
 * - Historical contexts
 * - Life events and periods
 * - Pivotal moments
 * 
 * @param sessionId - The session ID
 * @param sourceType - Type of content to generate image for
 * @param sourceId - ID of the specific content
 * @returns Generated image data
 */
export async function generateHistoricalImage(
  sessionId: string,
  sourceType: 'lifeline' | 'pivotalMoment' | 'context',
  sourceId: string
): Promise<GeneratedImage> {
  // Get agent configuration
  const agentConfig = getAgentConfig('imageGeneration');
  
  // Execute agent (reads from session, writes to session)
  const result = await executeAgent(agentConfig, sessionId);
  
  // If agent didn't return data (mock mode), generate and add mock data
  if (!result) {
    const session = readSession(sessionId);
    const mockImage: GeneratedImage = {
      id: `image-${Date.now()}`,
      url: 'https://via.placeholder.com/1792x1024.png?text=Historical+Scene',
      revisedPrompt: `Documentary-realistic image of ${sourceType} in ${session.input.location}, ${session.input.date}`,
      sourceType,
      sourceId,
      timestamp: new Date().toISOString(),
    };
    return mockImage;
  }
  
  // Read the result from session and get latest image
  const session = readSession(sessionId);
  const latestImage = session.images[session.images.length - 1];
  
  // Update the source information
  latestImage.sourceType = sourceType;
  latestImage.sourceId = sourceId;
  
  return latestImage;
}

