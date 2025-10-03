'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Package, Ticket, Loader2, CheckCircle, Clock, Truck, CreditCard, Image } from 'lucide-react';

interface SpinHistory {
  id: string;
  quantity: number;
  totalPrice: number;
  totalValue: number;
  adjacentSeats: boolean;
  createdAt: string;
  ticketsTransferred: boolean;
  ticketsTransferredAt: string | null;
  memorabiliaShipped: boolean;
  memorabiliaShippedAt: string | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  game: {
    eventName: string;
    eventDate: string;
    venue: string;
    city: string;
    state: string;
    spinPricePerBundle: number;
  };
  bundles: Array<{
    id: string;
    ticketSection: string;
    ticketRow: string;
    ticketValue: number;
    ticketQuantity: number;
    breaks: any[];
    bundleValue: number;
    memorabiliaName?: string | null;
    memorabiliaValue?: number | null;
    memorabiliaImageUrl?: string | null;
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
                      {spin.quantity} ticket{spin.quantity > 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-300 text-sm">
                      Jump Price: ${spin.totalPrice.toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(spin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                {spin.bundles && spin.bundles.length > 0 && (
                  <div className="border-t border-white/20 pt-4">
                    <h4 className="text-white font-semibold mb-3">Tickets Won:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {spin.bundles.map((bundle, idx) => (
                        <div
                          key={bundle.id}
                          className="bg-gradient-to-br from-white/10 to-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-yellow-400/20 p-2 rounded-lg">
                              <Package className="w-5 h-5 text-yellow-400" />
                            </div>
                            <p className="text-white font-semibold text-lg">
                              Ticket Set {idx + 1}
                            </p>
                          </div>

                          {/* Tickets Section */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Ticket className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 font-medium text-sm">Event Tickets</span>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-medium">
                                    Section {bundle.ticketSection}, Row {bundle.ticketRow}
                                  </p>
                                  <p className="text-gray-400 text-sm">
                                    {bundle.ticketQuantity} ticket{bundle.ticketQuantity > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Memorabilia Section (New format) */}
                          {bundle.memorabiliaName && (
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="w-4 h-4 text-purple-400" />
                                <span className="text-purple-400 font-medium text-sm">Memorabilia</span>
                              </div>
                              <div className="bg-black/30 rounded-lg p-3">
                                <div className="flex items-start gap-3">
                                  {bundle.memorabiliaImageUrl && (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                      <img
                                        src={bundle.memorabiliaImageUrl}
                                        alt={bundle.memorabiliaName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-white font-medium">
                                      {bundle.memorabiliaName}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Card Breaks Section (Legacy) */}
                          {bundle.breaks && bundle.breaks.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-purple-400" />
                                <span className="text-purple-400 font-medium text-sm">Card Breaks</span>
                              </div>
                              <div className="space-y-2">
                                {bundle.breaks.map((breakItem: any, breakIdx: number) => (
                                  <div key={breakIdx} className="bg-black/30 rounded-lg p-3">
                                    <div className="flex items-start gap-3">
                                      {breakItem.imageUrl && (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                          <img
                                            src={breakItem.imageUrl}
                                            alt={breakItem.breakName || breakItem.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <p className="text-white font-medium">
                                          {breakItem.breakName || breakItem.name || 'Card Break'}
                                        </p>
                                        {breakItem.teamName && (
                                          <p className="text-gray-400 text-sm">
                                            Team: {breakItem.teamName}
                                          </p>
                                        )}
                                        {breakItem.category && (
                                          <p className="text-gray-400 text-sm">
                                            {breakItem.category}
                                          </p>
                                        )}
                                        {breakItem.breaker && (
                                          <p className="text-gray-500 text-xs">
                                            Breaker: {breakItem.breaker}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {spin.adjacentSeats && spin.quantity > 1 && (
                      <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                        <CheckCircle className="w-5 h-5 text-yellow-400" />
                        <p className="text-yellow-400 font-medium">
                          Adjacent seats confirmed
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fulfillment Status */}
                <div className="border-t border-white/20 pt-4 mt-4">
                  <h4 className="text-white font-semibold mb-3">Fulfillment Status:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Tickets:</span>
                      </div>
                      {spin.ticketsTransferred ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">
                            Transferred {spin.ticketsTransferredAt ? new Date(spin.ticketsTransferredAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-yellow-400">Pending Transfer</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Memorabilia:</span>
                      </div>
                      {spin.memorabiliaShipped ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">
                              Shipped {spin.memorabiliaShippedAt ? new Date(spin.memorabiliaShippedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          {spin.trackingNumber && (
                            <span className="text-xs text-blue-400 mt-1">
                              {spin.shippingCarrier}: {spin.trackingNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-yellow-400">Pending Shipment</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Spins Yet</h3>
            <p className="text-gray-400 mb-6">
              You haven't jumped for any tickets yet. Start jumping to win tickets and card breaks!
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