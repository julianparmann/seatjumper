import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Count total leads
    const total = await prisma.lead.count({ where });

    // Fetch leads with pagination
    const leads = await prisma.lead.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      leads,
      total,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}