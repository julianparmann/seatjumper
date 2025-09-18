'use client';

import { useRouter } from 'next/navigation';
import {
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Package,
  Activity,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  totalGames: number;
  totalJumps: number;
  revenueGrowth: number;
  userGrowth: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    totalSpent: number;
  }>;
  recentOrders: Array<{
    id: string;
    userName: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

interface AdminDashboardClientProps {
  stats: DashboardStats | null;
}

export default function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  const router = useRouter();

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome to SeatJumper Admin Panel</p>
        </div>
        <div className="bg-red-900/20 backdrop-blur-md rounded-xl border border-red-700 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">Failed to load dashboard statistics</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to SeatJumper Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 hover:bg-gray-700/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-400 mt-2">
                <span className="font-semibold">{stats.activeUsers}</span> active
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          {stats.userGrowth !== 0 && (
            <div className="mt-4 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">+{stats.userGrowth}%</span>
              <span className="text-xs text-gray-500 ml-1">this month</span>
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 hover:bg-gray-700/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Lifetime value</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          {stats.revenueGrowth !== 0 && (
            <div className="mt-4 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">+{stats.revenueGrowth}%</span>
              <span className="text-xs text-gray-500 ml-1">this month</span>
            </div>
          )}
        </div>

        <div
          className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 hover:bg-gray-700/50 transition-colors cursor-pointer"
          onClick={() => router.push('/admin/orders?status=pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending Orders</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.pendingOrders.toLocaleString()}</p>
              <p className="text-xs text-yellow-400 mt-2">Click to view</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Package className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 hover:bg-gray-700/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Games</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalGames.toLocaleString()}</p>
              <p className="text-xs text-purple-400 mt-2">
                <span className="font-semibold">{stats.totalJumps}</span> jumps
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Users</h2>
          <div className="space-y-3">
            {stats.recentUsers.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent users</p>
            ) : (
              stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      ${user.totalSpent.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent orders</p>
            ) : (
              stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/orders?id=${order.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{order.userName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      ${order.amount.toFixed(2)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}