import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { url, gameId } = await req.json();

    if (!url || !url.includes('sportsmemorabilia.com')) {
      return NextResponse.json(
        { error: 'Invalid URL. Must be from sportsmemorabilia.com' },
        { status: 400 }
      );
    }


    // Add headers to avoid being blocked
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      next: { revalidate: 0 } // Disable caching
    });

    if (!response.ok) {
      console.error('Failed to fetch URL:', response.status, response.statusText);
      if (response.status === 403) {
        throw new Error(`Access forbidden (403). The website may be blocking automated requests. Try using a different URL or contacting the site directly.`);
      } else if (response.status === 404) {
        throw new Error(`Page not found (404). Please check the URL is correct.`);
      }
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Parse the HTML to extract memorabilia details
    // Using regex patterns to extract data from the HTML
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                       html.match(/<img[^>]+class="[^"]*product[^"]*"[^>]+src="([^"]+)"/i) ||
                       html.match(/<img[^>]+id="[^"]*main[^"]*"[^>]+src="([^"]+)"/i);
    
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    
    const priceMatch = html.match(/\$([0-9,]+\.?[0-9]*)/i) ||
                       html.match(/<span[^>]+class="[^"]*price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i) ||
                       html.match(/<meta property="product:price:amount" content="([^"]+)"/i);

    const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                            html.match(/<meta name="description" content="([^"]+)"/i);

    const imageUrl = imageMatch ? imageMatch[1].trim() : null;
    const title = titleMatch ? titleMatch[1].trim().replace(/&[^;]+;/g, ' ') : 'Unknown Item';
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;
    const description = descriptionMatch ? descriptionMatch[1].trim().replace(/&[^;]+;/g, ' ') : '';

    // Clean up the title - remove site name if present
    const cleanTitle = title.replace(/ - .*sportsmemorabilia.*/i, '').trim();

    // If gameId is provided, create a CardBreak entry
    let cardBreak = null;
    if (gameId) {
      cardBreak = await prisma.cardBreak.create({
        data: {
          gameId,
          breakName: cleanTitle,
          breakValue: price || 0,
          breakDateTime: new Date(),
          breaker: 'Admin Import',
          status: 'AVAILABLE',
          itemType: 'memorabilia',
          imageUrl: imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `https://www.sportsmemorabilia.com${imageUrl}` : null,
          description: description || cleanTitle,
          category: 'memorabilia',
          sourceUrl: url,
          scrapedAt: new Date(),
          spotPrice: price || 0
        }
      });

      // Update game's average break value
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
      data: {
        imageUrl: imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `https://www.sportsmemorabilia.com${imageUrl}` : null,
        name: cleanTitle,
        price,
        description,
        sourceUrl: url,
        cardBreakId: cardBreak?.id
      },
      itemsCreated: cardBreak ? 1 : 0
    });

  } catch (error) {
    console.error('Scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to scrape memorabilia data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}