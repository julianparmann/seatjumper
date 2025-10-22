import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webhookAPI } from '@/lib/api/webhook';

/**
 * Admin endpoint to setup/register webhooks with TicketNetwork
 * This should be called once during initial setup or when webhook URL changes
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add proper admin role checking
    // For now, we'll allow any authenticated user

    console.log('[Webhook Setup] Starting webhook registration');

    // Get the base URL from request or environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;

    console.log(`[Webhook Setup] Using base URL: ${baseUrl}`);

    // Setup Mercury webhooks
    await webhookAPI.setupMercuryWebhooks(baseUrl);

    console.log('[Webhook Setup] Webhooks registered successfully');

    // Get current registrations to confirm
    const registrations = await webhookAPI.getRegistrations();

    return NextResponse.json({
      success: true,
      message: 'Webhooks registered successfully',
      registrations: registrations.map(r => ({
        id: r.id,
        url: r.webHookUri,
        filters: r.filters,
        isPaused: r.isPaused
      }))
    });

  } catch (error) {
    console.error('[Webhook Setup] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to setup webhooks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get current webhook registrations
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Webhook Setup] Fetching current registrations');

    // Get registrations
    const registrations = await webhookAPI.getRegistrations();

    // Get available filters
    const filters = await webhookAPI.getFilters();

    return NextResponse.json({
      registrations,
      availableFilters: filters
    });

  } catch (error) {
    console.error('[Webhook Setup] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webhook info',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Delete all webhook registrations
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Webhook Setup] Deleting all webhooks');

    await webhookAPI.deleteAllWebhooks();

    return NextResponse.json({
      success: true,
      message: 'All webhooks deleted successfully'
    });

  } catch (error) {
    console.error('[Webhook Setup] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete webhooks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}