/**
 * OpenAI API Client Wrapper
 * 
 * This module provides a centralized interface for interacting with OpenAI's API.
 * It handles initialization, error management, and provides type-safe methods
 * for text and image generation.
 */

import OpenAI from 'openai';
import { ModelConfig, ImageModelConfig } from '@/config/models.config';
import localConfig from '../../config.local';

/**
 * Initialize the OpenAI client
 * API key can be set in:
 * 1. config.local.ts (recommended for local development)
 * 2. Environment variable OPENAI_API_KEY (for production/deployment)
 */
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    // Try to get API key from local config first, then fall back to environment variables
    const apiKey = localConfig.openaiApiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not configured. ' +
        'Please add it to config.local.ts (copy from config.local.example.ts) ' +
        'or set it in your .env.local file.'
      );
    }
    
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  return openaiClient;
}

/**
 * Generate text completion using OpenAI's chat API
 */
export async function generateTextCompletion(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: ModelConfig
): Promise<string> {
  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: modelConfig.temperature ?? 0.7,
      max_tokens: modelConfig.maxTokens,
      top_p: modelConfig.topP,
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }
    
    return content;
  } catch (error) {
    console.error('Error generating text completion:', error);
    throw new Error(
      `Failed to generate text completion: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate text completion and parse as JSON
 */
export async function generateJSONCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: ModelConfig
): Promise<T> {
  try {
    const client = getOpenAIClient();
    
    // Use JSON mode to force JSON output
    const response = await client.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: modelConfig.temperature ?? 0.7,
      max_tokens: modelConfig.maxTokens,
      top_p: modelConfig.topP,
      response_format: { type: "json_object" },
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }
    
    // Parse the JSON response
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Error parsing JSON completion:', error);
    throw new Error(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate an image using OpenAI's DALL-E API
 */
export async function generateImage(
  prompt: string,
  modelConfig: ImageModelConfig
): Promise<{ url: string; revisedPrompt?: string }> {
  try {
    const client = getOpenAIClient();
    
    const response = await client.images.generate({
      model: modelConfig.model,
      prompt: prompt,
      n: 1,
      size: modelConfig.size || '1024x1024',
      quality: modelConfig.quality,
      style: modelConfig.style,
    });
    
    const imageData = response.data[0];
    
    if (!imageData?.url) {
      throw new Error('No image URL returned from OpenAI API');
    }
    
    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Test the OpenAI connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = getOpenAIClient();
    await client.models.list();
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

