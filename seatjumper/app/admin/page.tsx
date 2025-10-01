import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

async function getAdminStats() {
  try {
    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all statistics in parallel
    const [
      totalUsers,
      activeUsers,
      totalRevenue,
      pendingOrders,
      totalGames,
      totalJumps,
      recentUsers,
      recentOrders,
      lastMonthUsers,
      thisMonthUsers,
      lastMonthRevenue,
      thisMonthRevenue
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (logged in within 30 days)
      prisma.user.count({
        where: {
          OR: [
            { sessions: { some: { expires: { gte: thirtyDaysAgo } } } },
            { spinResults: { some: { createdAt: { gte: thirtyDaysAgo } } } }
          ]
        }
      }),

      // Total revenue (sum of all spin results - temporarily counting all as paid)
      prisma.spinResult.aggregate({
        _sum: { totalPrice: true }
      }),

      // Pending orders - count all SpinResults since payment isn't implemented yet
      prisma.spinResult.count(),

      // Total games
      prisma.dailyGame.count({
        where: { status: { in: ['ACTIVE', 'DRAFT'] } }
      }),

      // Total jumps (spin results)
      prisma.spinResult.count(),

      // Recent users with spending
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          spinResults: {
            select: { totalPrice: true }
          }
        }
      }),

      // Recent orders
      prisma.spinResult.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),

      // User growth calculations
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      }),

      prisma.user.count({
        where: {
          createdAt: { gte: thisMonthStart }
        }
      }),

      // Revenue growth calculations
      prisma.spinResult.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      }),

      prisma.spinResult.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: { gte: thisMonthStart }
        }
      })
    ]);

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
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      totalSpent: user.spinResults.reduce((sum, result) => sum + result.totalPrice, 0)
    }));

    // Format recent orders data
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      userName: order.user.name || order.user.email,
      amount: order.totalPrice,
      status: order.paidAt ? 'COMPLETED' : 'PENDING',
      createdAt: order.createdAt.toISOString()
    }));

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
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Check if user is admin
  if (!session?.user?.email) {
    redirect('/api/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user?.isAdmin) {
    redirect('/');
  }

  const stats = await getAdminStats();

  return <AdminDashboardClient stats={stats} />;
}