import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    console.log('Attempting simple fetch of:', url);

    // Try a simple fetch first to see if we can get the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });

    const html = await response.text();

    // Check if we got blocked
    if (html.includes('Access Denied') || html.includes('cloudflare') || html.includes('captcha')) {
      return NextResponse.json({
        success: false,
        message: 'TickPick is blocking automated requests',
        note: 'This site has anti-bot protection. We need to use different techniques.',
        suggestions: [
          '1. Use a proxy service',
          '2. Deploy to a cloud service (Vercel/Netlify)',
          '3. Use a ticket API service instead',
          '4. Manual data entry for MVP'
        ]
      });
    }

    // Try to find ticket data in the HTML
    const hasListings = html.includes('listing') || html.includes('ticket') || html.includes('section');

    // Look for JSON data in the page
    const jsonMatch = html.match(/<script[^>]*>window\.__INITIAL_STATE__\s*=\s*({.*?})<\/script>/);
    let ticketData = null;

    if (jsonMatch) {
      try {
        ticketData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.log('Could not parse JSON data');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Fetched page successfully',
      htmlLength: html.length,
      hasListings,
      hasJsonData: !!ticketData,
      preview: html.substring(0, 500),
      note: hasListings
        ? 'Page contains ticket listings but needs proper parsing'
        : 'Page loaded but may need JavaScript rendering'
    });

  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      note: 'Direct fetch failed. This usually means the site requires JavaScript or has protection.'
    });
  }
}