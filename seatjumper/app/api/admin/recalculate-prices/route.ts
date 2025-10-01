import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateBundlePricing, calculateBundleSpecificPricing } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  try {
    // Fetch all games with their ticket groups, levels, prizes, and card breaks
    const games = await prisma.dailyGame.findMany({
      include: {
        ticketGroups: true,
        ticketLevels: true,
        specialPrizes: true,
        cardBreaks: true
      }
    });

    const updates = [];

    for (const game of games) {
      // Calculate general pricing based on available inventory only
      const pricing = calculateBundlePricing(
        game.ticketGroups,
        game.cardBreaks,
        30, // 30% margin
        game.ticketLevels,
        game.specialPrizes
      );

      // Calculate bundle-specific pricing
      const bundlePricing = calculateBundleSpecificPricing(
        game.ticketLevels,
        game.ticketGroups,
        game.specialPrizes,
        game.cardBreaks,
        30 // 30% margin
      );

      // Update the game with new pricing
      const updated = await prisma.dailyGame.update({
        where: { id: game.id },
        data: {
          avgTicketPrice: pricing.avgTicketPrice,
          avgBreakValue: pricing.avgBreakValue,
          spinPricePerBundle: pricing.spinPricePerBundle,
          spinPrice1x: bundlePricing.spinPrice1x,
          spinPrice2x: bundlePricing.spinPrice2x,
          spinPrice3x: bundlePricing.spinPrice3x,
          spinPrice4x: bundlePricing.spinPrice4x
        }
      });

      updates.push({
        gameId: game.id,
        eventName: game.eventName,
        oldAvgTicketPrice: game.avgTicketPrice,
        newAvgTicketPrice: pricing.avgTicketPrice,
        oldAvgBreakValue: game.avgBreakValue,
        newAvgBreakValue: pricing.avgBreakValue,
        oldSpinPrice: game.spinPricePerBundle,
        newSpinPrice: pricing.spinPricePerBundle,
        bundlePrices: bundlePricing,
        availableTickets: pricing.availableTickets,
        availableBreaks: pricing.availableBreaks
      });
    }

    return NextResponse.json({
      success: true,
      gamesUpdated: updates.length,
      updates
    });
  } catch (error: any) {
    console.error('Error recalculating prices:', error);
    return NextResponse.json(
      {
        error: 'Failed to recalculate prices',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}