/**
 * API Route: Generate Image Prompt
 * 
 * POST /api/generate-image-prompt
 * 
 * Generates detailed, historically accurate prompts for image generation.
 * This prompt is then used by the image generation endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateImagePrompt } from '@/services/imagePromptService';

interface GenerateImagePromptRequest {
  sessionId: string;
  sourceType: 'lifeline' | 'pivotalMoment' | 'context';
  sourceId: string;
}

interface GenerateImagePromptResponse {
  success: boolean;
  data?: {
    id: string;
    prompt: string;
    sourceType: string;
    sourceId: string;
    timestamp: string;
  };
  error?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GenerateImagePromptRequest = await request.json();
    
    // Validate input
    if (!body.sessionId) {
      return NextResponse.json<GenerateImagePromptResponse>(
        {
          success: false,
          error: 'Missing required field: sessionId',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (!body.sourceType) {
      return NextResponse.json<GenerateImagePromptResponse>(
        {
          success: false,
          error: 'Missing required field: sourceType',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (!body.sourceId) {
      return NextResponse.json<GenerateImagePromptResponse>(
        {
          success: false,
          error: 'Missing required field: sourceId',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Generate image prompt
    const imagePrompt = await generateImagePrompt(
      body.sessionId,
      body.sourceType,
      body.sourceId
    );
    
    // Return successful response
    return NextResponse.json<GenerateImagePromptResponse>(
      {
        success: true,
        data: {
          id: imagePrompt.id,
          prompt: imagePrompt.prompt,
          sourceType: imagePrompt.sourceType,
          sourceId: imagePrompt.sourceId,
          timestamp: imagePrompt.timestamp,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-image-prompt API:', error);
    
    return NextResponse.json<GenerateImagePromptResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

