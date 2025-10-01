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
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const filterAdmin = searchParams.get('filterAdmin') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Admin filter
    if (filterAdmin === 'admin') {
      where.isAdmin = true;
    } else if (filterAdmin === 'user') {
      where.isAdmin = false;
    }

    // Count total users
    const total = await prisma.user.count({ where });

    // Fetch users with pagination
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: sortBy === 'createdAt'
        ? { createdAt: sortOrder as 'asc' | 'desc' }
        : undefined,
      include: {
        addresses: {
          take: 1,
          orderBy: { isDefault: 'desc' }
        },
        spinResults: {
          select: {
            totalPrice: true,
            createdAt: true
          }
        },
        sessions: {
          select: {
            expires: true
          },
          orderBy: {
            expires: 'desc'
          },
          take: 1
        }
      }
    });

    // Transform user data
    const transformedUsers = users.map(user => {
      const totalSpent = user.spinResults.reduce((sum, result) => sum + result.totalPrice, 0);
      const lastActive = user.sessions[0]?.expires || user.spinResults[0]?.createdAt || null;
      const defaultAddress = user.addresses[0];

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt.toISOString(),
        city: defaultAddress?.city || null,
        state: defaultAddress?.state || null,
        totalSpent,
        totalJumps: user.spinResults.length,
        lastActive: lastActive ? lastActive.toISOString() : null
      };
    });

    // Sort by totalSpent or lastActive if needed (since these are computed fields)
    if (sortBy === 'totalSpent') {
      transformedUsers.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.totalSpent - b.totalSpent
          : b.totalSpent - a.totalSpent;
      });
    } else if (sortBy === 'lastActive') {
      transformedUsers.sort((a, b) => {
        const aDate = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const bDate = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      });
    }

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      users: transformedUsers,
      total,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}