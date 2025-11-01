/**
 * Image Service
 * 
 * This service generates documentary-realistic images to visualize historical
 * contexts, lifelines, and pivotal moments. Now uses the unified agent executor system.
 */

import { getAgentConfig } from '@/config/agents.config';
import { downloadImage } from '@/lib/openai';
import { GeneratedImage } from '@/types/session.types';
import { executeAgent } from './agentExecutor';
import { getImageFilePath, readSession, writeSession } from './sessionService';

function buildSessionImagePath(sessionId: string, imageId: string): string {
  const encodedSession = encodeURIComponent(sessionId);
  const encodedImage = encodeURIComponent(imageId);
  return `/api/session-images/${encodedSession}/${encodedImage}`;
}

/**
 * Generate a documentary-realistic historical image
 * 
 * This function can be called multiple times to generate images for:
 * - Historical contexts
 * - Life events and periods
 * - Pivotal moments
 * 
 * The function:
 * 1. Uses the latest image prompt from the session
 * 2. Generates an image via Gemini 2.5 Flash Image (Nano Banana)
 * 3. Downloads the image from the data URL
 * 4. Saves it to the session folder
 * 5. Updates the session with the image data including local file path
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
  // The agent will use the latest imagePrompt from the session
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

  if (!latestImage) {
    throw new Error('Image generation succeeded but no image found in session');
  }

  // Update the source information
  latestImage.sourceType = sourceType;
  latestImage.sourceId = sourceId;
  writeSession(sessionId, session);

  // Download and save the image to the session folder
  try {
    const imageFilePath = getImageFilePath(sessionId, latestImage.id);
    await downloadImage(latestImage.url, imageFilePath);
    
    // Update the image with the file path
    latestImage.filePath = imageFilePath;

    // Serve images via internal API when stored locally
    latestImage.url = buildSessionImagePath(sessionId, latestImage.id);
    
    writeSession(sessionId, session);
    
    console.log(`✅ Image saved to: ${imageFilePath}`);
  } catch (error) {
    console.error(`Failed to download image:`, error);
    // Persist source information even if download fails
    writeSession(sessionId, session);
    // Continue without file path - the URL is still available
  }
  
  return latestImage;
}
