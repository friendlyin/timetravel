/**
 * Image Prompt Service
 * 
 * This service generates detailed, historically accurate prompts for image generation.
 * Uses the unified agent executor system.
 */

import { getAgentConfig } from '@/config/agents.config';
import { executeAgent } from './agentExecutor';
import { readSession, writeSession } from './sessionService';
import { ImagePrompt } from '@/types/session.types';

/**
 * Generate a detailed image prompt for a specific scene
 * 
 * This function creates a historically accurate prompt that will be used
 * by the image generation agent to create documentary-realistic images.
 * 
 * @param sessionId - The session ID
 * @param sourceType - Type of content to generate image for
 * @param sourceId - ID of the specific content
 * @returns Generated image prompt data
 */
export async function generateImagePrompt(
  sessionId: string,
  sourceType: 'lifeline' | 'pivotalMoment' | 'context',
  sourceId: string
): Promise<ImagePrompt> {
  // Get agent configuration
  const agentConfig = getAgentConfig('imagePromptGeneration');
  
  // Execute agent (reads from session, writes to session)
  const result = await executeAgent(agentConfig, sessionId);
  
  // If agent didn't return data (mock mode), generate and add mock data
  if (!result) {
    const session = readSession(sessionId);
    const mockPrompt: ImagePrompt = {
      id: `prompt-${Date.now()}`,
      prompt: `Documentary-realistic photograph of a scene from ${session.input.location}, ${session.input.date}. Period-accurate clothing, architecture, and atmosphere.`,
      sourceType,
      sourceId,
      timestamp: new Date().toISOString(),
    };
    return mockPrompt;
  }
  
  // Read the result from session and get latest prompt
  const session = readSession(sessionId);
  const latestPrompt = session.imagePrompts[session.imagePrompts.length - 1];

  if (!latestPrompt) {
    throw new Error('Image prompt generation succeeded but no prompt found in session');
  }
  
  // Update the source information and persist
  latestPrompt.sourceType = sourceType;
  latestPrompt.sourceId = sourceId;
  writeSession(sessionId, session);
  
  return latestPrompt;
}
