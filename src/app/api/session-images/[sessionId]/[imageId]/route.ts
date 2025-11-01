import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

import { readSession } from '@/services/sessionService';

type RouteContext = {
  params: Promise<{
    sessionId: string;
    imageId: string;
  }>;
};

function inferContentType(filePath: string): string {
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (filePath.endsWith('.webp')) {
    return 'image/webp';
  }

  if (filePath.endsWith('.gif')) {
    return 'image/gif';
  }

  return 'image/png';
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { sessionId, imageId } = await context.params;
    const normalizedSessionId = sessionId?.trim();
    const normalizedImageId = imageId?.trim();

    if (!normalizedSessionId || !normalizedImageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session id and image id are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const session = readSession(normalizedSessionId);
    const image = session.images.find(
      (entry) => entry.id === normalizedImageId,
    );

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image not found for session',
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }

    if (!image.filePath) {
      if (image.url) {
        return NextResponse.redirect(image.url);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Image file is not available',
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }

    const fileBuffer = await fs.readFile(image.filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': inferContentType(image.filePath),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Failed to load session image', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load session image',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
