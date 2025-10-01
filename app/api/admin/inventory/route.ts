import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generatePrizePools } from '@/lib/services/prize-pool-service';
import { sanitizeTicketGroups } from '@/lib/utils/image-validator';

export async function GET(req: NextRequest) {
  try {
    // Get pagination parameters from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalCount = await prisma.dailyGame.count();

    // Fetch paginated games with necessary includes for admin page
    const games = await prisma.dailyGame.findMany({
      skip,
      take: limit,
      include: {
        ticketGroups: true,
        ticketLevels: true,
        cardBreaks: true, // Include all card breaks
        entries: false, // Don't include entries to save memory
        spinResults: false, // Don't include spin results to save memory
        stadium: true
      },
      orderBy: {
        eventDate: 'desc'
      }
    });

    return NextResponse.json({
      games,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email) {
      console.warn('No session found - in development mode, allowing access');
      // In development, allow creating games without auth for testing
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user?.isAdmin) {
        console.warn(`User ${session.user.email} is not admin`);
        // In development, make the user admin automatically
        if (process.env.NODE_ENV === 'development' && user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isAdmin: true }
          });
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const body = await req.json();

    const {
      eventName,
      eventDate,
      venue,
      city,
      state,
      sport,
      stadiumId,
      ticketGroups,
      ticketLevels,
      memorabiliaItems,
      avgTicketPrice,
      spinPricePerBundle
    } = body;

    // Add retry logic and better error handling
    let retryCount = 0;
    const maxRetries = 3;
    let game = null;

    while (retryCount < maxRetries && !game) {
      try {
        // Use transaction for atomic operation with increased timeout
        game = await prisma.$transaction(async (tx) => {
      // Create the game
      const newGame = await tx.dailyGame.create({
        data: {
          eventName: eventName || 'Unnamed Event',
          eventDate: new Date(eventDate || new Date()),
          venue: venue || 'TBD',
          city: city || 'TBD',
          state: state || 'TBD',
          sport: sport || 'NFL',
          stadiumId: stadiumId || null,
          avgTicketPrice: parseFloat(avgTicketPrice) || 0,
          avgBreakValue: null,
          spinPricePerBundle: parseFloat(spinPricePerBundle) || 0,
          status: 'ACTIVE',
        }
      });

      // Bulk create ticket groups if provided
      if (ticketGroups && ticketGroups.length > 0) {
        // Sanitize all ticket groups first
        const sanitizedTicketGroups = sanitizeTicketGroups(ticketGroups);

        // Process in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < sanitizedTicketGroups.length; i += batchSize) {
          const batch = sanitizedTicketGroups.slice(i, i + batchSize);
          const ticketGroupData = batch.map((ticket: any, batchIndex: number) => {
            const ticketIndex = i + batchIndex;
            console.log(`[INVENTORY API] Processing ticket ${ticketIndex}: section=${ticket.section}, row=${ticket.row}`);
            console.log(`[INVENTORY API] Ticket ${ticketIndex} URLs - url1=${ticket.seatViewUrl ? 'valid' : 'null'}, url2=${ticket.seatViewUrl2 ? 'valid' : 'null'}`);

            return {
              gameId: newGame.id,
              section: ticket.section || 'TBD',
              row: ticket.row || 'TBD',
              quantity: parseInt(ticket.quantity) || 2,
              pricePerSeat: parseFloat(ticket.pricePerSeat) || 0,
              seatViewUrl: ticket.seatViewUrl,  // Already sanitized
              seatViewUrl2: ticket.seatViewUrl2,  // Already sanitized
              notes: ticket.notes || null,
              status: 'AVAILABLE' as const,
              availableUnits: ticket.availableUnits || [1, 2, 3, 4],
              tierLevel: ticket.tierLevel || null,
              tierPriority: ticket.tierPriority || null
            };
          });

          await tx.ticketGroup.createMany({
            data: ticketGroupData,
            skipDuplicates: false
          });
          console.log(`Bulk created batch ${Math.floor(i/batchSize) + 1}: ${ticketGroupData.length} ticket groups`);
        }
      }

      // Bulk create ticket levels if provided
      if (ticketLevels && ticketLevels.length > 0) {
        const ticketLevelData = ticketLevels
          .filter((level: any) => level.level && level.quantity > 0)
          .map((level: any) => ({
            gameId: newGame.id,
            level: level.level,
            levelName: level.levelName,
            quantity: parseInt(level.quantity) || 0,
            pricePerSeat: parseFloat(level.pricePerSeat) || 0,
            viewImageUrl: level.viewImageUrl || null,
            sections: level.sections || [],
            isSelectable: level.isSelectable !== false,
            availableUnits: level.availableUnits || [1, 2, 3, 4],
            tierLevel: level.tierLevel || null,
            tierPriority: level.tierPriority || null,
          }));

        if (ticketLevelData.length > 0) {
          await tx.ticketLevel.createMany({
            data: ticketLevelData,
            skipDuplicates: false
          });
          console.log(`Bulk created ${ticketLevelData.length} ticket levels`);
        }
      }

      // Special prizes removed - using tier system instead

      // Bulk create memorabilia card breaks if provided
      if (memorabiliaItems && memorabiliaItems.length > 0) {
        const cardBreakData: any[] = [];

        for (const item of memorabiliaItems) {
          if (item.name && item.quantity > 0) {
            // Create individual records for each quantity
            for (let i = 0; i < item.quantity; i++) {
              cardBreakData.push({
                gameId: newGame.id,
                breakName: item.name,
                breakValue: parseFloat(item.value) || 0,
                breakDateTime: new Date(),
                breaker: 'Admin Import',
                status: 'AVAILABLE',
                itemType: 'memorabilia',
                imageUrl: item.imageUrl || null,
                description: item.description || item.name,
                category: 'card',
                quantity: 1  // Each record represents 1 item
              });
            }
          }
        }

        if (cardBreakData.length > 0) {
          // Process in batches
          const batchSize = 100;
          for (let i = 0; i < cardBreakData.length; i += batchSize) {
            const batch = cardBreakData.slice(i, i + batchSize);
            await tx.cardBreak.createMany({
              data: batch,
              skipDuplicates: false
            });
            console.log(`Bulk created batch ${Math.floor(i/batchSize) + 1}: ${batch.length} memorabilia card breaks`);
          }
        }
      }

      // Return the game with related data
      return await tx.dailyGame.findUnique({
        where: { id: newGame.id },
        include: {
          ticketGroups: true,
          ticketLevels: true,
            cardBreaks: true
        }
      });
    }, {
      maxWait: 30000, // 30 seconds max wait
      timeout: 60000, // 60 seconds timeout
    });

        // If we get here, the transaction succeeded
        break;
      } catch (error: any) {
        retryCount++;
        console.error(`Transaction attempt ${retryCount} failed:`, error);

        if (retryCount >= maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!game) {
      throw new Error('Failed to create game after multiple retries');
    }

    // Generate prize pools in background (don't block response)
    generatePrizePools(game.id, 5).catch(error => {
      console.error('Error generating prize pools:', error);
    });

    return NextResponse.json(game);
  } catch (error: any) {
    console.error('Error creating game - Full error:', error);
    console.error('Error stack:', error?.stack);

    // Log specific validation errors if present
    if (error?.name === 'PrismaClientValidationError') {
      console.error('Prisma Validation Error Details:', JSON.stringify(error, null, 2));
    }

    return NextResponse.json(
      {
        error: 'Failed to create game',
        details: error?.message || 'Unknown error',
        fullError: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}