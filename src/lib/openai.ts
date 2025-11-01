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
import fs from 'fs';
import https from 'https';
import http from 'http';

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

    openaiClient = new OpenAI({ apiKey });
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
        const client = getOpenAIClient()

        const response = await client.chat.completions.create({
            model: modelConfig.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: modelConfig.temperature ?? 0.7,
            max_tokens: modelConfig.maxTokens,
            top_p: modelConfig.topP
        })

        const content = response.choices[0]?.message?.content

        if (!content) {
            throw new Error('No content returned from OpenAI API')
        }

        return content
    } catch (error) {
        console.error('Error generating text completion:', error)
        throw new Error(
            `Failed to generate text completion: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        )
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

/**
 * Download an image from a URL and save it to a local file
 * 
 * @param url - The URL of the image to download
 * @param outputPath - The local file path where the image should be saved
 * @returns Promise that resolves when the download is complete
 */
export async function downloadImage(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Determine which protocol to use
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Check if response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      // Create write stream
      const fileStream = fs.createWriteStream(outputPath);
      
      // Pipe the response to the file
      response.pipe(fileStream);
      
      // Handle completion
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      // Handle errors
      fileStream.on('error', (error) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(error);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}
