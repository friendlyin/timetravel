/**
 * API Route: Generate Image
 * 
 * POST /api/generate-image
 * 
 * Generates documentary-realistic historical images.
 * This is a reusable endpoint that can be called multiple times
 * to visualize different stages of the game.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateHistoricalImage } from '@/services/imageService';
import { GenerateImageRequest, GenerateImageResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GenerateImageRequest = await request.json();
    
    // Validate input
    if (!body.input?.prompt) {
      return NextResponse.json<GenerateImageResponse>(
        {
          success: false,
          error: 'Missing required field: prompt',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Generate image
    const image = await generateHistoricalImage(body.input);
    
    // Return successful response
    return NextResponse.json<GenerateImageResponse>(
      {
        success: true,
        data: {
          url: image.url,
          revisedPrompt: image.revisedPrompt,
          timestamp: image.timestamp,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-image API:', error);
    
    return NextResponse.json<GenerateImageResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

