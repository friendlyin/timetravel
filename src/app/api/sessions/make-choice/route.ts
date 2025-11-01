import { NextRequest, NextResponse } from 'next/server';

import { addUserChoice, updateSessionMetadata, readSession } from '@/services/sessionService';
import { generateLifeline } from '@/services/lifelineService';
import { generatePivotalMoment } from '@/services/pivotalMomentService';
import type { UserChoice } from '@/types/session.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type MakeChoicePayload = {
  sessionId?: string;
  pivotalMomentId?: string;
  choiceId?: string;
};

type MakeChoiceResponse = {
  success: boolean;
  error?: string;
  timestamp: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MakeChoicePayload;
    const sessionId = body.sessionId?.trim();
    const pivotalMomentId = body.pivotalMomentId?.trim();
    const choiceId = body.choiceId?.trim();

    if (!sessionId) {
      return NextResponse.json<MakeChoiceResponse>(
        { 
          success: false,
          error: 'Session ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (!pivotalMomentId) {
      return NextResponse.json<MakeChoiceResponse>(
        { 
          success: false,
          error: 'Pivotal moment ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (!choiceId) {
      return NextResponse.json<MakeChoiceResponse>(
        { 
          success: false,
          error: 'Choice ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    // Read session to get pivotal moment and choice details
    const session = readSession(sessionId);

    // Find the pivotal moment
    const pivotalMoment = session.pivotalMoments.find(
      (moment) => moment.id === pivotalMomentId
    );

    if (!pivotalMoment) {
      return NextResponse.json<MakeChoiceResponse>(
        { 
          success: false,
          error: 'Pivotal moment not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }

    // Find the choice
    const choice = pivotalMoment.choices.find((c) => c.id === choiceId);

    if (!choice) {
      return NextResponse.json<MakeChoiceResponse>(
        { 
          success: false,
          error: 'Choice not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }

    // Check if a choice has already been made for this pivotal moment
    const existingChoice = session.choices.find(
      (c) => c.pivotalMomentId === pivotalMomentId
    );

    if (existingChoice) {
      return NextResponse.json<MakeChoiceResponse>(
        { 
          success: false,
          error: 'A choice has already been made for this pivotal moment',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    // Create the user choice
    const userChoice: UserChoice = {
      pivotalMomentId,
      choiceId,
      choiceTitle: choice.title,
      timestamp: new Date().toISOString(),
    };

    // Add the choice to the session
    addUserChoice(sessionId, userChoice);

    // Check if the character died
    if (pivotalMoment.characterDied) {
      // End the session
      await updateSessionMetadata(sessionId, {
        currentStep: 'Game ended - character died',
        status: 'completed',
        endTime: new Date().toISOString(),
      });

      return NextResponse.json<MakeChoiceResponse>({
        success: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if we've reached the maximum number of pivotal moments
    const maxMoments = session.config.maxPivotalMoments || 5;
    if (session.pivotalMoments.length >= maxMoments) {
      // End the session
      await updateSessionMetadata(sessionId, {
        currentStep: 'Game ended - max moments reached',
        status: 'completed',
        endTime: new Date().toISOString(),
      });

      return NextResponse.json<MakeChoiceResponse>({
        success: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Update session metadata
    await updateSessionMetadata(sessionId, {
      currentStep: 'Generating next lifeline',
    });

    // Generate the next lifeline
    await generateLifeline(sessionId);

    // Update session metadata
    await updateSessionMetadata(sessionId, {
      currentStep: 'Generating next pivotal moment',
    });

    // Generate the next pivotal moment
    await generatePivotalMoment(sessionId);

    // Update session metadata
    await updateSessionMetadata(sessionId, {
      currentStep: 'Awaiting choice',
    });

    return NextResponse.json<MakeChoiceResponse>({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to make choice', error);
    return NextResponse.json<MakeChoiceResponse>(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to make choice',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

