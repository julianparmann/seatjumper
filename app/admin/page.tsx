import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

async function getAdminStats() {
  console.log('[Admin Dashboard] Fetching stats...');

  try {
    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch statistics with individual error handling
    const totalUsers = await prisma.user.count().catch(err => {
      console.error('[Admin] Error counting users:', err);
      return 0;
    });

    const activeUsers = await prisma.user.count({
      where: {
        spinResults: { some: { createdAt: { gte: thirtyDaysAgo } } }
      }
    }).catch(err => {
      console.error('[Admin] Error counting active users:', err);
      return 0;
    });

    const totalRevenue = await prisma.spinResult.aggregate({
      _sum: { totalPrice: true }
    }).catch(err => {
      console.error('[Admin] Error calculating revenue:', err);
      return { _sum: { totalPrice: 0 } };
    });

    const pendingOrders = await prisma.spinResult.count().catch(err => {
      console.error('[Admin] Error counting orders:', err);
      return 0;
    });

    const totalGames = await prisma.dailyGame.count({
      where: { status: { in: ['ACTIVE', 'DRAFT'] } }
    }).catch(err => {
      console.error('[Admin] Error counting games:', err);
      return 0;
    });

    const totalJumps = await prisma.spinResult.count().catch(err => {
      console.error('[Admin] Error counting jumps:', err);
      return 0;
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        spinResults: {
          select: { totalPrice: true }
        }
      }
    }).catch(err => {
      console.error('[Admin] Error fetching recent users:', err);
      return [];
    });

    const recentOrders = await prisma.spinResult.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }).catch(err => {
      console.error('[Admin] Error fetching recent orders:', err);
      return [];
    });

    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    }).catch(() => 0);

    const thisMonthUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thisMonthStart }
      }
    }).catch(() => 0);

    const lastMonthRevenue = await prisma.spinResult.aggregate({
      _sum: { totalPrice: true },
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    }).catch(() => ({ _sum: { totalPrice: 0 } }));

    const thisMonthRevenue = await prisma.spinResult.aggregate({
      _sum: { totalPrice: true },
      where: {
        createdAt: { gte: thisMonthStart }
      }
    }).catch(() => ({ _sum: { totalPrice: 0 } }));

    // Calculate growth percentages
    const userGrowth = lastMonthUsers > 0
      ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : 0;

    const lastMonthRev = lastMonthRevenue._sum.totalPrice || 0;
    const thisMonthRev = thisMonthRevenue._sum.totalPrice || 0;
    const revenueGrowth = lastMonthRev > 0
      ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
      : 0;

    // Format recent users data
    const formattedRecentUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || 'No email',
      createdAt: user.createdAt.toISOString(),
      totalSpent: user.spinResults.reduce((sum, result) => sum + result.totalPrice, 0)
    }));

    // Format recent orders data
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      userName: order.user?.name || order.user?.email || 'Unknown',
      amount: order.totalPrice,
      status: order.paidAt ? 'COMPLETED' : 'PENDING',
      createdAt: order.createdAt.toISOString()
    }));

    console.log('[Admin Dashboard] Stats fetched successfully');

    return {
      totalUsers,
      activeUsers,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingOrders,
      totalGames,
      totalJumps,
      userGrowth,
      revenueGrowth,
      recentUsers: formattedRecentUsers,
      recentOrders: formattedRecentOrders
    };
  } catch (error) {
    console.error('[Admin Dashboard] Critical error fetching stats:', error);
    // Return default empty stats instead of null
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      totalGames: 0,
      totalJumps: 0,
      userGrowth: 0,
      revenueGrowth: 0,
      recentUsers: [],
      recentOrders: []
    };
  }
}

export default async function AdminDashboard() {
  console.log('[Admin Page] Starting admin dashboard render');

  const session = await getServerSession(authOptions);
  console.log('[Admin Page] Session:', session ? 'Found' : 'Not found', session?.user?.email);

  // Check if user is admin
  if (!session?.user?.email) {
    console.log('[Admin Page] No session email, redirecting to signin');
    redirect('/api/auth/signin');
  }

  console.log('[Admin Page] Looking up user in database:', session.user.email);
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  }).catch(err => {
    console.error('[Admin Page] Error finding user:', err);
    return null;
  });

  console.log('[Admin Page] User found:', user ? 'Yes' : 'No', 'isAdmin:', user?.isAdmin);

  if (!user?.isAdmin) {
    console.log('[Admin Page] User is not admin, redirecting to home');
    redirect('/');
  }

  console.log('[Admin Page] Fetching admin stats');
  const stats = await getAdminStats();
  console.log('[Admin Page] Stats fetched, rendering client component');

  return <AdminDashboardClient stats={stats} />;
}