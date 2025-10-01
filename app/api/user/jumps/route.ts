import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's jump history with full details
    const jumps = await prisma.spinResult.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        game: {
          select: {
            eventName: true,
            eventDate: true,
            venue: true,
            city: true,
            state: true,
            sport: true
          }
        },
        bundles: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const totalJumps = jumps.length;
    const totalBundlesWon = jumps.reduce((sum, jump) => sum + jump.quantity, 0);

    // Calculate total tickets won
    const totalTicketsWon = jumps.reduce((sum, jump) => {
      return sum + jump.bundles.reduce((bundleSum, bundle) => bundleSum + (bundle.ticketQuantity || 1), 0);
    }, 0);

    // Get upcoming events (events in the future that user has tickets for)
    const now = new Date();
    const upcomingEvents = jumps
      .filter(jump => new Date(jump.game.eventDate) > now)
      .map(jump => ({
        ...jump.game,
        ticketsWon: jump.bundles.map(b => ({
          section: b.ticketSection,
          row: b.ticketRow
        })),
        jumpDate: jump.createdAt
      }))
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    // Calculate total memorabilia won
    const totalMemorabilia = jumps.reduce((sum, jump) => {
      return sum + jump.bundles.reduce((bundleSum, bundle) => {
        const breaks = bundle.breaks as any[];
        return bundleSum + (breaks?.length || 0);
      }, 0);
    }, 0);

    // Get user account creation date for "member since"
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true }
    });

    // Calculate win streak (consecutive days with wins)
    let currentStreak = 0;
    if (jumps.length > 0) {
      const sortedJumps = [...jumps].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      let lastDate = new Date(sortedJumps[0].createdAt);
      lastDate.setHours(0, 0, 0, 0);
      currentStreak = 1;

      for (let i = 1; i < sortedJumps.length; i++) {
        const jumpDate = new Date(sortedJumps[i].createdAt);
        jumpDate.setHours(0, 0, 0, 0);

        const dayDiff = (lastDate.getTime() - jumpDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
          currentStreak++;
          lastDate = jumpDate;
        } else if (dayDiff > 1) {
          break;
        }
      }
    }

    // Get all memorabilia as a flat list
    const allMemorabilia = jumps.flatMap(jump =>
      jump.bundles.flatMap(bundle => {
        const breaks = bundle.breaks as any[];
        return breaks?.map(b => ({
          ...b,
          eventName: jump.game.eventName,
          eventDate: jump.game.eventDate
        })) || [];
      })
    );

    return NextResponse.json({
      jumps,
      stats: {
        totalJumps,
        totalBundlesWon,
        totalTicketsWon,
        totalMemorabilia,
        upcomingEventsCount: upcomingEvents.length,
        currentStreak,
        memberSince: user?.createdAt
      },
      upcomingEvents: upcomingEvents.slice(0, 5), // Top 5 upcoming
      allMemorabilia
    });
  } catch (error) {
    console.error('Error fetching user jumps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jump history' },
      { status: 500 }
    );
  }
}