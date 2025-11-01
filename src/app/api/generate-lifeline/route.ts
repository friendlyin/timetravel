/**
 * API Route: Generate Lifeline
 * 
 * POST /api/generate-lifeline
 * 
 * Generates a character's life narrative until a pivotal moment.
 * This is a reusable endpoint that can be called multiple times
 * as the character's story progresses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateLifeline } from '@/services/lifelineService';
import { GenerateLifelineRequest, GenerateLifelineResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GenerateLifelineRequest = await request.json();
    
    // Validate input
    if (!body.input?.historicalContext || !body.input?.selectedPersona) {
      return NextResponse.json<GenerateLifelineResponse>(
        {
          success: false,
          error: 'Missing required fields: historicalContext and selectedPersona',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Validate that if previousLifeline exists, previousChoice must also exist
    if (body.input.previousLifeline && !body.input.previousChoice) {
      return NextResponse.json<GenerateLifelineResponse>(
        {
          success: false,
          error: 'When previousLifeline is provided, previousChoice is also required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Generate lifeline
    const lifeline = await generateLifeline(body.input);
    
    // Return successful response
    return NextResponse.json<GenerateLifelineResponse>(
      {
        success: true,
        data: lifeline,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-lifeline API:', error);
    
    return NextResponse.json<GenerateLifelineResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

