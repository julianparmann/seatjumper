import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get users with marketing opt-in
    const marketingOptIns = await prisma.userProfile.count({
      where: {
        marketingEmails: true
      }
    });

    // Get emails sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const emailsSentToday = await prisma.emailCampaign.aggregate({
      where: {
        sentAt: {
          gte: todayStart
        }
      },
      _sum: {
        sentCount: true
      }
    });

    // Get last campaign
    const lastCampaign = await prisma.emailCampaign.findFirst({
      where: {
        status: {
          in: ['SENT', 'PARTIAL']
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      select: {
        id: true,
        subject: true,
        sentAt: true,
        sentCount: true,
        recipientCount: true
      }
    });

    return NextResponse.json({
      totalUsers,
      marketingOptIns,
      emailsSentToday: emailsSentToday._sum.sentCount || 0,
      lastCampaign
    });

  } catch (error) {
    console.error('Error fetching email marketing stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}