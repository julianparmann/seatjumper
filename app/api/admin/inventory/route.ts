import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Fetch all games with their ticket groups and card breaks
    const games = await prisma.dailyGame.findMany({
      include: {
        ticketGroups: true,
        cardBreaks: true,
        entries: true,
        spinResults: true,
        stadium: true
      },
      orderBy: {
        eventDate: 'desc'
      }
    });

    return NextResponse.json(games);
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
          console.log(`Made ${session.user.email} an admin`);
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    const {
      eventName,
      eventDate,
      venue,
      city,
      state,
      sport,
      stadiumId,
      ticketGroups,
      avgTicketPrice,
      spinPricePerBundle,
      memorabiliaImage,
      memorabiliaName,
      memorabiliaPrice
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

    console.log('Game created successfully:', newGame.id);

    // Create ticket groups if provided
    if (ticketGroups && ticketGroups.length > 0) {
      for (const group of ticketGroups) {
        if (group.section && group.row) {
          try {
            await prisma.ticketGroup.create({
              data: {
                gameId: newGame.id,
                section: group.section,
                row: group.row,
                quantity: parseInt(group.seats) || 1,
                pricePerSeat: parseFloat(group.pricePerSeat) || 0,
                status: 'AVAILABLE',
                notes: group.notes || null
              }
            });
            console.log('Created ticket group:', group.section, group.row);
          } catch (groupError: any) {
            console.error('Error creating ticket group:', groupError);
          }
        }
      }
    }

    // Create memorabilia card break if provided
    if (memorabiliaImage && memorabiliaName) {
      try {
        await prisma.cardBreak.create({
          data: {
            gameId: newGame.id,
            breakName: memorabiliaName,
            breakValue: memorabiliaPrice || 0,
            breakDateTime: new Date(),
            breaker: 'Admin Import',
            status: 'AVAILABLE',
            itemType: 'memorabilia',
            imageUrl: memorabiliaImage,
            description: memorabiliaName,
            category: 'card'
          }
        });
        console.log('Created memorabilia card break:', memorabiliaName);
      } catch (memorabiliaError: any) {
        console.error('Error creating memorabilia card break:', memorabiliaError);
      }
    }

    // Return the game with related data
    const game = await prisma.dailyGame.findUnique({
      where: { id: newGame.id },
      include: {
        ticketGroups: true,
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