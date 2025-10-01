import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { gameId, urls } = await req.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'At least one URL is required' },
        { status: 400 }
      );
    }

    const importedItems = [];
    const errors = [];

    for (const url of urls) {
      try {
        // Fetch the page content
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          next: { revalidate: 0 }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Parse Layton Sports Cards page
        // Look for product information in the HTML
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                          html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                          html.match(/<title>([^<]+)<\/title>/i);

        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                          html.match(/<img[^>]+class="[^"]*product[^"]*"[^>]+src="([^"]+)"/i);

        const priceMatch = html.match(/\$([0-9,]+\.?[0-9]*)/i) ||
                          html.match(/<span[^>]+class="[^"]*price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i);

        const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                                html.match(/<meta name="description" content="([^"]+)"/i);

        if (!titleMatch) {
          errors.push({ url, error: 'Could not extract product information' });
          continue;
        }

        const title = titleMatch[1].trim().replace(/&[^;]+;/g, ' ');
        const imageUrl = imageMatch ? imageMatch[1].trim() : null;
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        const description = descriptionMatch ? descriptionMatch[1].trim().replace(/&[^;]+;/g, ' ') : '';

        // Create a CardBreak entry for this item
        const cardBreak = await prisma.cardBreak.create({
          data: {
            gameId,
            breakName: title,
            breakValue: price,
            breakDateTime: new Date(),
            breaker: 'Layton Import',
            status: 'AVAILABLE',
            itemType: 'memorabilia',
            imageUrl: imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `https://laytonsportscards.com${imageUrl}` : null,
            description,
            category: 'card',
            sourceUrl: url,
            scrapedAt: new Date(),
            spotPrice: price
          }
        });

        importedItems.push({
          id: cardBreak.id,
          name: title,
          price,
          imageUrl: cardBreak.imageUrl,
          source: 'laytonsports'
        });

      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
        errors.push({ url, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Update game's average break value
    if (importedItems.length > 0) {
      const allBreaks = await prisma.cardBreak.findMany({
        where: { gameId }
      });

      const avgBreakValue = allBreaks.reduce((sum, b) => sum + (b.breakValue || 0), 0) / allBreaks.length;

      await prisma.dailyGame.update({
        where: { id: gameId },
        data: { avgBreakValue }
      });
    }

    return NextResponse.json({
      success: true,
      importedItems,
      errors,
      itemsCreated: importedItems.length,
      totalProcessed: urls.length
    });

  } catch (error) {
    console.error('Layton import error:', error);
    return NextResponse.json(
      { error: 'Failed to import from Layton Sports Cards' },
      { status: 500 }
    );
  }
}