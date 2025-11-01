/**
 * API Route: Generate Persona Options
 * 
 * POST /api/generate-personas
 * 
 * Generates multiple persona options based on historical context.
 * This is the second step in the game flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePersonaOptions } from '@/services/personaService';
import { GeneratePersonasRequest, GeneratePersonasResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: GeneratePersonasRequest = await request.json();
    
    // Validate input
    if (!body.input?.historicalContext) {
      return NextResponse.json<GeneratePersonasResponse>(
        {
          success: false,
          error: 'Missing required field: historicalContext',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Generate persona options
    const personas = await generatePersonaOptions(body.input);
    
    // Return successful response
    return NextResponse.json<GeneratePersonasResponse>(
      {
        success: true,
        data: personas,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-personas API:', error);
    
    return NextResponse.json<GeneratePersonasResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

