import { NextRequest, NextResponse } from 'next/server';
import { mercuryIntegrationService } from '@/lib/services/mercury-integration-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const packType = searchParams.get('pack') as 'blue' | 'red' | 'gold' || 'blue';
    const bundleSize = parseInt(searchParams.get('bundleSize') || '1');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    // Calculate pricing for each pack type
    const [bluePrice, redPrice, goldPrice] = await Promise.all([
      mercuryIntegrationService.calculateJumpPrice(id, 'blue', bundleSize),
      mercuryIntegrationService.calculateJumpPrice(id, 'red', bundleSize),
      mercuryIntegrationService.calculateJumpPrice(id, 'gold', bundleSize)
    ]);

    // Get inventory counts for each pack
    const [blueInventory, redInventory, goldInventory] = await Promise.all([
      mercuryIntegrationService.getFilteredInventory(id, 'blue'),
      mercuryIntegrationService.getFilteredInventory(id, 'red'),
      mercuryIntegrationService.getFilteredInventory(id, 'gold')
    ]);

    // Get probability breakdown for selected pack
    const probabilities = await mercuryIntegrationService.calculateProbabilities(
      id,
      packType
    );

    return NextResponse.json({
      blue: bluePrice.jumpPrice,
      red: redPrice.jumpPrice,
      gold: goldPrice.jumpPrice,
      inventoryCount: {
        blue: blueInventory.totalCount,
        red: redInventory.totalCount,
        gold: goldInventory.totalCount
      },
      selectedPackDetails: {
        type: packType,
        price: packType === 'blue' ? bluePrice : packType === 'red' ? redPrice : goldPrice,
        inventory: packType === 'blue' ? blueInventory : packType === 'red' ? redInventory : goldInventory,
        probabilities
      }
    });
  } catch (error) {
    console.error('[Pricing API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}