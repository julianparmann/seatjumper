import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { LaytonBreaksScraper, calculateBreakInventory } from '@/lib/scrapers/layton-breaks';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { gameId, urls, breakDateTime, updateExisting = false } = body;

    if (!gameId || !urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'Missing gameId or urls array' },
        { status: 400 }
      );
    }

    // Initialize scraper
    const scraper = new LaytonBreaksScraper();

    try {
      await scraper.init();

      // Scrape all provided URLs
      const scrapedBreaks = await scraper.scrapeMultipleBreaks(urls);

      // Calculate inventory totals
      const inventory = calculateBreakInventory(scrapedBreaks);

      // Create or update card breaks in database
      const createdBreaks = await prisma.$transaction(async (tx) => {
        const breaks = [];

        // If updating existing, first mark all existing breaks from these URLs as unavailable
        if (updateExisting) {
          // Get all source URLs we're updating
          const sourceUrls = scrapedBreaks.map(b => b.url);

          await tx.cardBreak.updateMany({
            where: {
              gameId,
              breaker: 'Layton Sports Cards',
              sourceUrl: {
                in: sourceUrls
              }
            },
            data: {
              status: 'SOLD',
              scrapedAt: new Date()
            }
          });
        }

        for (const breakData of scrapedBreaks) {
          // Create or update a break entry for each team
          for (const team of breakData.teams) {
            const breakIdentifier = `${breakData.title} - ${team.teamName}`;

            if (updateExisting) {
              // Try to update existing break first
              // Include sourceUrl in the uniqueness check
              const existingBreak = await tx.cardBreak.findFirst({
                where: {
                  gameId,
                  breakName: breakIdentifier,
                  breaker: 'Layton Sports Cards',
                  sourceUrl: breakData.url
                }
              });

              if (existingBreak) {
                const updatedBreak = await tx.cardBreak.update({
                  where: { id: existingBreak.id },
                  data: {
                    breakValue: team.price,
                    spotPrice: team.price,
                    status: team.available ? 'AVAILABLE' : 'SOLD',
                    scrapedAt: new Date()
                  }
                });
                breaks.push(updatedBreak);
              } else if (team.available) {
                // Only create new breaks if they're available
                // Check if this break already exists for this specific URL
                const existingNewBreak = await tx.cardBreak.findFirst({
                  where: {
                    gameId,
                    teamName: team.teamName,
                    breaker: 'Layton Sports Cards',
                    sourceUrl: breakData.url
                  }
                });

                if (!existingNewBreak) {
                  const cardBreak = await tx.cardBreak.create({
                    data: {
                      gameId,
                      breakName: breakIdentifier,
                      breakValue: team.price,
                      breakDateTime: breakDateTime ? new Date(breakDateTime) : new Date(),
                      streamUrl: breakData.url,
                      breaker: 'Layton Sports Cards',
                      teamName: team.teamName,
                      spotPrice: team.price,
                      breakType: 'TEAM',
                      sourceUrl: breakData.url,
                      status: 'AVAILABLE',
                      scrapedAt: new Date()
                    }
                  });
                  breaks.push(cardBreak);
                }
              }
            } else if (team.available) {
              // Not updating, only create if available
              // Check if this break already exists for this specific URL
              const existingBreak = await tx.cardBreak.findFirst({
                where: {
                  gameId,
                  teamName: team.teamName,
                  breaker: 'Layton Sports Cards',
                  sourceUrl: breakData.url
                }
              });

              if (!existingBreak) {
                const cardBreak = await tx.cardBreak.create({
                  data: {
                    gameId,
                    breakName: breakIdentifier,
                    breakValue: team.price,
                    breakDateTime: breakDateTime ? new Date(breakDateTime) : new Date(),
                    streamUrl: breakData.url,
                    breaker: 'Layton Sports Cards',
                    teamName: team.teamName,
                    spotPrice: team.price,
                    breakType: 'TEAM',
                    sourceUrl: breakData.url,
                    status: 'AVAILABLE',
                    scrapedAt: new Date()
                  }
                });
                breaks.push(cardBreak);
              }
            }
          }
        }

        // Update game with new average break value
        const game = await tx.dailyGame.findUnique({ where: { id: gameId } });
        if (game) {
          await tx.dailyGame.update({
            where: { id: gameId },
            data: {
              avgBreakValue: inventory.averageSpotPrice,
              // Keep using the ticket price * 1.35 formula for spin price
              // The break value is stored separately for reference
              spinPricePerBundle: (game.avgTicketPrice || 0) * 1.35
            }
          });
        }

        return breaks;
      });

      // Close the scraper
      await scraper.close();

      return NextResponse.json({
        success: true,
        breaksCreated: createdBreaks.length,
        inventory,
        scrapedData: scrapedBreaks.map(b => ({
          title: b.title,
          availableTeams: b.teams.filter(t => t.available).length,
          totalValue: b.availableValue,
          averagePrice: b.averagePrice
        }))
      });
    } finally {
      await scraper.close();
    }
  } catch (error) {
    console.error('Error scraping breaks:', error);
    return NextResponse.json(
      { error: 'Failed to scrape breaks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}