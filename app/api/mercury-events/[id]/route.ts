import { NextRequest, NextResponse } from 'next/server';
import { mercuryIntegrationService } from '@/lib/services/mercury-integration-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    // Get event details from Mercury
    const event = await mercuryIntegrationService.getEventDetails(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[Event Details API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event details', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}