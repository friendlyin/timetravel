/**
 * API Route: Generate Pivotal Moment
 * 
 * POST /api/generate-pivotal-moment
 * 
 * Generates a pivotal moment with multiple choice options.
 * This is a reusable endpoint that can be called multiple times
 * throughout a character's life.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePivotalMoment } from '@/services/pivotalMomentService';
import { GeneratePivotalMomentRequest, GeneratePivotalMomentResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GeneratePivotalMomentRequest = await request.json();
    
    // Validate input
    if (!body.input?.historicalContext || !body.input?.currentLifeline) {
      return NextResponse.json<GeneratePivotalMomentResponse>(
        {
          success: false,
          error: 'Missing required fields: historicalContext and currentLifeline',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (typeof body.input.momentNumber !== 'number' || body.input.momentNumber < 1) {
      return NextResponse.json<GeneratePivotalMomentResponse>(
        {
          success: false,
          error: 'momentNumber must be a positive number',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Generate pivotal moment
    const pivotalMoment = await generatePivotalMoment(body.input);
    
    // Return successful response
    return NextResponse.json<GeneratePivotalMomentResponse>(
      {
        success: true,
        data: pivotalMoment,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-pivotal-moment API:', error);
    
    return NextResponse.json<GeneratePivotalMomentResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

