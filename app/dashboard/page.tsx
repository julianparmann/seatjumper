'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { User, MapPin, Package, Settings, LogOut, Shield, Home, ShoppingBag } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = (session.user as any).isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {session.user?.name || session.user?.email}!
              </h1>
              <p className="text-gray-300">
                {isAdmin ? 'Admin Dashboard' : 'Your SeatJumper Dashboard'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Admin Notice */}
        {isAdmin && (
          <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-200 font-semibold">Admin Access Enabled</p>
                <p className="text-yellow-100 text-sm">
                  You have administrative privileges. Access the{' '}
                  <Link href="/admin" className="underline hover:text-yellow-400">
                    Admin Panel
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400/20 p-3 rounded-lg">
                <Package className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Spins</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-400/20 p-3 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Orders</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-400/20 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Saved Addresses</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-400/20 p-3 rounded-lg">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Profile Status</p>
                <p className="text-xl font-bold text-white">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-400" />
                Profile Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{session.user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white">{session.user?.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account Type</p>
                  <p className="text-white">{isAdmin ? 'Administrator' : 'Regular User'}</p>
                </div>
              </div>
              <Link
                href="/dashboard/profile"
                className="mt-6 w-full bg-white/20 text-white py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No recent activity</p>
                <p className="text-gray-500 text-sm mt-2">
                  Your spins and orders will appear here
                </p>
                <Link
                  href="/events"
                  className="mt-6 inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Browse Events
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link
            href="/events"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Find Events</h3>
            <p className="text-gray-400 text-sm">Browse upcoming games and events</p>
          </Link>

          <Link
            href="/dashboard/addresses"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Manage Addresses</h3>
            <p className="text-gray-400 text-sm">Add or edit shipping addresses</p>
          </Link>

          <Link
            href="/dashboard/orders"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Order History</h3>
            <p className="text-gray-400 text-sm">View past spins and orders</p>
          </Link>
        </div>
      </div>
    </div>
  );
}