'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Package, Ticket, Loader2 } from 'lucide-react';

interface SpinHistory {
  id: string;
  quantity: number;
  totalPrice: number;
  totalValue: number;
  adjacentSeats: boolean;
  createdAt: string;
  game: {
    eventName: string;
    eventDate: string;
    venue: string;
    city: string;
    state: string;
  };
  bundles: Array<{
    id: string;
    ticketSection: string;
    ticketRow: string;
    ticketValue: number;
    ticketQuantity: number;
    breaks: any[];
    bundleValue: number;
  }>;
}

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [spins, setSpins] = useState<SpinHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpins, setTotalSpins] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchSpinHistory();
    }
  }, [status, router]);

  const fetchSpinHistory = async () => {
    try {
      const res = await fetch('/api/user/spins');
      if (res.ok) {
        const data = await res.json();
        setSpins(data.spins);
        setTotalSpins(data.totalSpins);
      }
    } catch (error) {
      console.error('Error fetching spin history:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-white">Spin History</h1>
          </div>
          <p className="text-gray-300">
            You've completed {totalSpins} spin{totalSpins !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Spin History */}
        {spins.length > 0 ? (
          <div className="space-y-6">
            {spins.map((spin) => (
              <div key={spin.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {spin.game.eventName}
                    </h3>
                    <div className="flex items-center gap-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(spin.game.eventDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {spin.game.venue}, {spin.game.city}, {spin.game.state}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-lg">
                      {spin.quantity} bundle{spin.quantity > 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(spin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Bundle Details */}
                {spin.bundles && spin.bundles.length > 0 && (
                  <div className="border-t border-white/20 pt-4">
                    <h4 className="text-white font-semibold mb-3">Bundles Won:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {spin.bundles.map((bundle, idx) => (
                        <div
                          key={bundle.id}
                          className="bg-white/5 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <Ticket className="w-5 h-5 text-yellow-400 mt-1" />
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                Bundle {idx + 1}
                              </p>
                              <p className="text-gray-300 text-sm">
                                Section {bundle.ticketSection}, Row {bundle.ticketRow}
                              </p>
                              {bundle.breaks && bundle.breaks.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-gray-400 text-xs">Card Breaks:</p>
                                  {bundle.breaks.map((breakItem: any, breakIdx: number) => (
                                    <p key={breakIdx} className="text-gray-300 text-sm">
                                      • {breakItem.teamName}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {spin.adjacentSeats && spin.quantity > 1 && (
                      <p className="text-yellow-400 text-sm mt-3">
                        ✨ Adjacent seats
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Spins Yet</h3>
            <p className="text-gray-400 mb-6">
              You haven't spun for any bundles yet. Start spinning to win tickets and card breaks!
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}