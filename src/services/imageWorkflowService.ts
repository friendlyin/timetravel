/**
 * Image Workflow Service
 *
 * Coordinates prompt and image generation for specific session content.
 */

import { generateImagePrompt } from './imagePromptService';
import { generateHistoricalImage } from './imageService';
import type {
  GeneratedImage,
  ImagePrompt,
} from '@/types/session.types';

type ImageSourceType = 'lifeline' | 'pivotalMoment' | 'context';

export interface SceneImageResult {
  prompt: ImagePrompt;
  image: GeneratedImage;
}

/**
 * Generate both the prompt and the final image for a given session artifact.
 *
 * @param sessionId - The session identifier.
 * @param sourceType - The type of artifact we are illustrating.
 * @param sourceId - The specific artifact id.
 */
export async function generateSceneImage(
  sessionId: string,
  sourceType: ImageSourceType,
  sourceId: string,
): Promise<SceneImageResult> {
  const prompt = await generateImagePrompt(sessionId, sourceType, sourceId);
  const image = await generateHistoricalImage(sessionId, sourceType, sourceId);

  return {
    prompt,
    image,
  };
}
