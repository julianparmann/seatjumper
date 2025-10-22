import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mercuryAPI } from '@/lib/api/mercury';

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

    // Check if user is admin (you may want to add proper role checking)
    // For now, we'll allow any authenticated user to view credit limits
    // In production, you should restrict this to admins only

    console.log('[Admin API] Fetching Mercury credit limits');

    // Fetch credit limits from Mercury
    const creditLimits = await mercuryAPI.getCreditLimits();

    console.log('[Admin API] Credit limits fetched successfully');

    return NextResponse.json(creditLimits);

  } catch (error) {
    console.error('[Admin API] Error fetching credit limits:', error);

    // Check for specific Mercury API errors
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Mercury account not configured for this broker' },
          { status: 404 }
        );
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Mercury authentication failed. Please check API credentials.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch credit limits',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}