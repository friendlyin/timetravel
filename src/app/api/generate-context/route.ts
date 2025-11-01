/**
 * API Route: Generate Historical Context
 * 
 * POST /api/generate-context
 * 
 * Generates detailed historical context based on a date and location.
 * This is the first step in the game flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateHistoricalContext } from '@/services/historicalContextService';
import { GenerateContextRequest, GenerateContextResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GenerateContextRequest = await request.json();
    
    // Validate input
    if (!body.input?.date || !body.input?.location) {
      return NextResponse.json<GenerateContextResponse>(
        {
          success: false,
          error: 'Missing required fields: date and location',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Generate historical context
    const context = await generateHistoricalContext(body.input);
    
    // Return successful response
    return NextResponse.json<GenerateContextResponse>(
      {
        success: true,
        data: context,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-context API:', error);
    
    return NextResponse.json<GenerateContextResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

