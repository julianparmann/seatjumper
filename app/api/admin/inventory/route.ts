import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
        specialPrizes: true,
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
      specialPrizes,
      memorabiliaItems,
      avgTicketPrice,
      spinPricePerBundle
    } = body;

    // Create the game
    const newGame = await prisma.dailyGame.create({
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
        status: 'DRAFT'
      }
    });


    // Create ticket levels if provided
    if (ticketLevels && ticketLevels.length > 0) {
      for (const level of ticketLevels) {
        if (level.level && level.quantity > 0) {
          try {
            await prisma.ticketLevel.create({
              data: {
                gameId: newGame.id,
                level: level.level,
                levelName: level.levelName,
                quantity: parseInt(level.quantity) || 0,
                pricePerSeat: parseFloat(level.pricePerSeat) || 0,
                viewImageUrl: level.viewImageUrl || null,
                sections: level.sections || [],
                isSelectable: level.isSelectable !== false,
                availableUnits: level.availableUnits || [1, 2, 3, 4]
              }
            });
          } catch (levelError: any) {
            console.error('Error creating ticket level:', levelError);
          }
        }
      }
    }

    // Create special prizes if provided
    if (specialPrizes && specialPrizes.length > 0) {
      for (const prize of specialPrizes) {
        if (prize.name && prize.quantity > 0) {
          try {
            await prisma.specialPrize.create({
              data: {
                gameId: newGame.id,
                name: prize.name,
                description: prize.description || '',
                value: parseFloat(prize.value) || 0,
                quantity: parseInt(prize.quantity) || 0,
                imageUrl: prize.imageUrl || null,
                prizeType: prize.prizeType || 'EXPERIENCE',
                metadata: prize.metadata || null,
                availableUnits: prize.availableUnits || [1, 2, 3, 4]
              }
            });
          } catch (prizeError: any) {
            console.error('Error creating special prize:', prizeError);
          }
        }
      }
    }

    // Create memorabilia card breaks if provided
    if (memorabiliaItems && memorabiliaItems.length > 0) {
      for (const item of memorabiliaItems) {
        if (item.name && item.quantity > 0) {
          // Create individual records for each quantity
          for (let i = 0; i < item.quantity; i++) {
            try {
              await prisma.cardBreak.create({
                data: {
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
                }
              });
            } catch (memorabiliaError: any) {
              console.error('Error creating memorabilia card break:', memorabiliaError);
            }
          }
        }
      }
    }

    // Return the game with related data
    const game = await prisma.dailyGame.findUnique({
      where: { id: newGame.id },
      include: {
        ticketGroups: true,
        ticketLevels: true,
        specialPrizes: true,
        cardBreaks: true
      }
    });

    return NextResponse.json(game);
  } catch (error: any) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      {
        error: 'Failed to create game',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}