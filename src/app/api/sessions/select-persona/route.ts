import { NextRequest, NextResponse } from 'next/server';

import { setSelectedPersona, updateSessionMetadata, readSession } from '@/services/sessionService';
import { generateLifeline } from '@/services/lifelineService';
import { generatePivotalMoment } from '@/services/pivotalMomentService';
import type { PersonaOption } from '@/types/persona.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SelectPersonaPayload = {
  sessionId?: string;
  personaId?: string;
};

type SelectPersonaResponse = {
  success: boolean;
  error?: string;
  timestamp: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelectPersonaPayload;
    const sessionId = body.sessionId?.trim();
    const personaId = body.personaId?.trim();

    if (!sessionId) {
      return NextResponse.json<SelectPersonaResponse>(
        { 
          success: false,
          error: 'Session ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (!personaId) {
      return NextResponse.json<SelectPersonaResponse>(
        { 
          success: false,
          error: 'Persona ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    // Read session to get persona options
    const session = readSession(sessionId);

    if (!session.personaOptions) {
      return NextResponse.json<SelectPersonaResponse>(
        { 
          success: false,
          error: 'No persona options available for this session',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    // Find the selected persona
    const selectedPersona = session.personaOptions.options.find(
      (option: PersonaOption) => option.id === personaId
    );

    if (!selectedPersona) {
      return NextResponse.json<SelectPersonaResponse>(
        { 
          success: false,
          error: 'Invalid persona ID',
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }

    // Set the selected persona in the session
    setSelectedPersona(sessionId, selectedPersona);

    // Update session metadata
    await updateSessionMetadata(sessionId, {
      currentStep: 'Generating lifeline',
    });

    // Generate the first lifeline
    await generateLifeline(sessionId);

    // Update session metadata
    await updateSessionMetadata(sessionId, {
      currentStep: 'Generating pivotal moment',
    });

    // Generate the first pivotal moment
    await generatePivotalMoment(sessionId);

    // Update session metadata
    await updateSessionMetadata(sessionId, {
      currentStep: 'Awaiting choice',
    });

    return NextResponse.json<SelectPersonaResponse>({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to select persona', error);
    return NextResponse.json<SelectPersonaResponse>(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select persona',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

