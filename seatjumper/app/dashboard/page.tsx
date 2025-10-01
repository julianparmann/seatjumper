'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  MapPin,
  Package,
  Settings,
  LogOut,
  Shield,
  Home,
  Ticket,
  Calendar,
  TrendingUp,
  Trophy,
  Sparkles,
  Clock,
  Users,
  Gift,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface JumpData {
  jumps: any[];
  stats: {
    totalJumps: number;
    totalBundlesWon: number;
    totalTicketsWon: number;
    totalMemorabilia: number;
    upcomingEventsCount: number;
    currentStreak: number;
    memberSince: string;
  };
  upcomingEvents: any[];
  allMemorabilia: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jumpData, setJumpData] = useState<JumpData>({
    jumps: [],
    stats: {
      totalJumps: 0,
      totalBundlesWon: 0,
      totalTicketsWon: 0,
      totalMemorabilia: 0,
      upcomingEventsCount: 0,
      currentStreak: 0,
      memberSince: new Date().toISOString()
    },
    upcomingEvents: [],
    allMemorabilia: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchJumpData();
    }
  }, [status, router]);

  const fetchJumpData = async () => {
    try {
      const res = await fetch('/api/user/jumps');
      if (res.ok) {
        const data = await res.json();
        // Map the API response to match our interface
        setJumpData({
          jumps: data.spins || data.jumps || [],
          stats: {
            totalJumps: data.stats?.totalSpins || data.stats?.totalJumps || 0,
            totalBundlesWon: data.stats?.totalBundlesWon || 0,
            totalTicketsWon: data.stats?.totalTicketsWon || 0,
            totalMemorabilia: data.stats?.totalMemorabilia || 0,
            upcomingEventsCount: data.stats?.upcomingEventsCount || 0,
            currentStreak: data.stats?.currentStreak || 0,
            memberSince: data.stats?.memberSince || new Date().toISOString()
          },
          upcomingEvents: data.upcomingEvents || [],
          allMemorabilia: data.allMemorabilia || []
        });
      }
    } catch (error) {
      console.error('Error fetching jump data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getDaysUntilEvent = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
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
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatDate(jumpData.stats.memberSince)}</span>
                </div>
                {jumpData.stats.currentStreak > 0 && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{jumpData.stats.currentStreak} day streak!</span>
                  </div>
                )}
              </div>
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

        {/* Exciting Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400/30 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-200 text-sm font-medium">Total Tickets Won</p>
                <p className="text-3xl font-bold text-white">{jumpData.stats.totalBundlesWon}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-4">
              <div className="bg-blue-400/30 p-3 rounded-lg">
                <Ticket className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium">Tickets Won</p>
                <p className="text-3xl font-bold text-white">{jumpData.stats.totalTicketsWon}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center gap-4">
              <div className="bg-green-400/30 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-green-200 text-sm font-medium">Upcoming Events</p>
                <p className="text-3xl font-bold text-white">{jumpData.stats.upcomingEventsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="bg-purple-400/30 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-purple-200 text-sm font-medium">Memorabilia</p>
                <p className="text-3xl font-bold text-white">{jumpData.stats.totalMemorabilia}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-xl p-6 mb-8 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready for another jump?</h2>
              <p className="text-gray-300">Check out today's featured games and win more tickets!</p>
            </div>
            <Link
              href="/events"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Jump Again
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Events Section */}
          {jumpData.upcomingEvents.length > 0 && (
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  Your Upcoming Events
                </h2>
                <div className="space-y-4">
                  {jumpData.upcomingEvents.map((event: any, idx: number) => {
                    const daysUntil = getDaysUntilEvent(event.eventDate);
                    return (
                      <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-yellow-400/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-white font-semibold text-lg">{event.eventName}</h3>
                            <p className="text-gray-400 text-sm">
                              {event.venue}, {event.city}, {event.state}
                            </p>
                            <p className="text-gray-300 text-sm mt-1">
                              {formatEventDate(event.eventDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="bg-yellow-400/20 px-3 py-1 rounded-lg">
                              <p className="text-yellow-400 font-bold">
                                {daysUntil === 0 ? 'Today!' :
                                 daysUntil === 1 ? 'Tomorrow!' :
                                 `${daysUntil} days`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-gray-400 text-xs mb-2">Your Tickets:</p>
                          <div className="flex flex-wrap gap-2">
                            {event.ticketsWon.map((ticket: any, tIdx: number) => (
                              <span key={tIdx} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                                Section {ticket.section}, Row {ticket.row}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent Wins or Profile Section */}
          <div className={jumpData.upcomingEvents.length > 0 ? 'lg:col-span-1' : 'lg:col-span-3'}>
            {jumpData.jumps.length > 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Recent Wins
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {jumpData.jumps.slice(0, 3).map((jump: any) => (
                    <div key={jump.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-semibold">{jump.game.eventName}</p>
                          <p className="text-gray-400 text-xs">
                            {formatDate(jump.createdAt)}
                          </p>
                        </div>
                        {jump.totalValue > jump.totalPrice * 1.5 && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                            Big Win!
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        {jump.bundles.map((bundle: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-300">
                            • Section {bundle.ticketSection}, Row {bundle.ticketRow}
                            {bundle.breaks && bundle.breaks.length > 0 && (
                              <span className="text-gray-400">
                                {' '}+ {bundle.breaks.length} item{bundle.breaks.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {jumpData.jumps.length > 3 && (
                    <Link
                      href="/dashboard/orders"
                      className="block text-center text-yellow-400 hover:text-yellow-300 text-sm mt-2"
                    >
                      View all wins →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
                <Gift className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Wins Yet</h3>
                <p className="text-gray-400 mb-4">
                  Start jumping to win tickets and memorabilia!
                </p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Jumping
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Memorabilia Collection */}
        {jumpData.allMemorabilia.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-400" />
              Your Memorabilia Collection
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
              {jumpData.allMemorabilia.slice(0, 8).map((item: any, idx: number) => (
                <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-white font-medium text-sm">{item.teamName || item.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.eventName}</p>
                  <p className="text-gray-500 text-xs">{formatDate(item.eventDate)}</p>
                </div>
              ))}
            </div>
            {jumpData.allMemorabilia.length > 8 && (
              <Link
                href="/dashboard/orders"
                className="block text-center text-yellow-400 hover:text-yellow-300 text-sm mt-4"
              >
                View all {jumpData.allMemorabilia.length} items →
              </Link>
            )}
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link
            href="/events"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all hover:scale-105 border border-white/10 hover:border-yellow-400/50"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Find More Events</h3>
                <p className="text-gray-400 text-sm">Browse and jump for new tickets</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </Link>

          <Link
            href="/dashboard/orders"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all hover:scale-105 border border-white/10 hover:border-yellow-400/50"
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Win History</h3>
                <p className="text-gray-400 text-sm">View all your past wins</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </Link>

          <Link
            href="/dashboard/profile"
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all hover:scale-105 border border-white/10 hover:border-yellow-400/50"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Settings</h3>
                <p className="text-gray-400 text-sm">Manage your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}