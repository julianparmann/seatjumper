import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(req: NextRequest) {
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
    const { gameId, sourceUrl } = body;

    if (!gameId || !sourceUrl) {
      return NextResponse.json(
        { error: 'Missing gameId or sourceUrl' },
        { status: 400 }
      );
    }

    // Delete all card breaks for this game and source URL
    const deleteResult = await prisma.cardBreak.deleteMany({
      where: {
        gameId,
        sourceUrl
      }
    });

    return NextResponse.json({
      success: true,
      deleted: deleteResult.count
    });
  } catch (error) {
    console.error('Error deleting breaks:', error);
    return NextResponse.json(
      { error: 'Failed to delete breaks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}