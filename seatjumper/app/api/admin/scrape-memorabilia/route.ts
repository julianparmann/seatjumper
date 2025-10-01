import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SportsCollectiblesScraper, calculateMemorabiliaTotals } from '@/lib/scrapers/sports-collectibles';

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
    const { gameId, urls, updateExisting = false } = body;

    if (!gameId || !urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'Missing gameId or urls array' },
        { status: 400 }
      );
    }

    // Initialize scraper
    const scraper = new SportsCollectiblesScraper();

    try {

      await scraper.init();

      // Scrape all provided URLs
      const scrapedPages = await scraper.scrapeMultiplePages(urls);

      // Check if any pages actually returned items
      const totalScrapedItems = scrapedPages.reduce((sum, page) => sum + page.items.length, 0);

      if (totalScrapedItems === 0) {
        await scraper.close();
        return NextResponse.json({
          success: false,
          error: 'No items found on the provided URLs. The page may still be loading or the URL format may have changed.',
          itemsCreated: 0,
          scrapedData: scrapedPages.map(page => ({
            url: page.url,
            title: page.title,
            totalItems: 0,
            message: 'No products found - page may require more loading time'
          }))
        }, { status: 400 });
      }

      // Calculate inventory totals
      const inventory = calculateMemorabiliaTotals(scrapedPages);

      // Create or update memorabilia items in database
      const createdItems = await prisma.$transaction(async (tx) => {
        const items = [];

        // If updating existing, first mark all existing items from these URLs as unavailable
        if (updateExisting) {
          await tx.cardBreak.updateMany({
            where: {
              gameId,
              sourceUrl: {
                in: urls
              }
            },
            data: {
              status: 'SOLD'
            }
          });
        }

        for (const page of scrapedPages) {
          for (const item of page.items) {
            // Only process available items or all items if updating
            if (item.available || updateExisting) {
              // Check if this item already exists
              const existingItem = await tx.cardBreak.findFirst({
                where: {
                  gameId,
                  breakName: item.name,
                  sourceUrl: page.url
                }
              });

              if (existingItem && updateExisting) {
                // Update existing item
                const updatedItem = await tx.cardBreak.update({
                  where: { id: existingItem.id },
                  data: {
                    breakValue: item.price,
                    spotPrice: item.price,
                    status: item.available ? 'AVAILABLE' : 'SOLD',
                    imageUrl: item.imageUrl || existingItem.imageUrl,
                    description: item.description || existingItem.description,
                    category: item.category || existingItem.category
                  }
                });
                items.push(updatedItem);
              } else if (!existingItem && item.available) {
                // Create new item
                const memorabiliaItem = await tx.cardBreak.create({
                  data: {
                    gameId,
                    breakName: item.name,
                    breakValue: item.price,
                    breakDateTime: new Date(), // Use current date as placeholder
                    breaker: 'Sports Collectibles',
                    imageUrl: item.imageUrl,
                    description: item.description,
                    category: item.category,
                    spotPrice: item.price,
                    sourceUrl: page.url,
                    status: 'AVAILABLE'
                  }
                });
                items.push(memorabiliaItem);
              }
            }
          }
        }

        // Update game with memorabilia information
        const game = await tx.dailyGame.findUnique({ where: { id: gameId } });
        if (game) {
          // Count total memorabilia items for this game
          const totalMemorabilia = await tx.cardBreak.count({
            where: {
              gameId,
              status: 'AVAILABLE'
            }
          });

          await tx.dailyGame.update({
            where: { id: gameId },
            data: {
              // You might want to add a field for memorabilia count or update pricing
              updatedAt: new Date()
            }
          });
        }

        return items;
      });

      // Close the scraper
      await scraper.close();

      return NextResponse.json({
        success: true,
        itemsCreated: createdItems.length,
        inventory,
        scrapedData: scrapedPages.map(page => ({
          title: page.title,
          url: page.url,
          totalItems: page.totalItems,
          availableItems: page.availableItems,
          averagePrice: page.averagePrice,
          itemsWithImages: page.items.filter(i => i.imageUrl).length
        }))
      });
    } finally {
      await scraper.close();
    }
  } catch (error) {
    console.error('Error scraping memorabilia:', error);
    return NextResponse.json(
      { error: 'Failed to scrape memorabilia', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}