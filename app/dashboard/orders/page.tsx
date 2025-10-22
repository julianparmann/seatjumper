'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Package, Ticket, Loader2, CheckCircle, Clock, Truck, CreditCard, Zap, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  type: 'spin' | 'jump';
  eventName: string;
  eventDate: string;
  venue: string;
  quantity: number;
  totalPrice?: number;
  jumpPrice?: number;
  createdAt: string;
  status: string;

  // Spin-specific fields
  totalValue?: number;
  adjacentSeats?: boolean;
  ticketsTransferred?: boolean;
  memorabiliaShipped?: boolean;
  bundles?: Array<{
    id: string;
    ticketSection: string;
    ticketRow: string;
    ticketValue: number;
    ticketQuantity: number;
    memorabiliaName?: string | null;
    memorabiliaValue?: number | null;
    memorabiliaImageUrl?: string | null;
  }>;

  // Jump-specific fields
  section?: string;
  row?: string;
  mercuryOrderId?: string;
  error?: string;
}

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [jumpCount, setJumpCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/user/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalOrders(data.totalOrders);
        setSpinCount(data.spinCount);
        setJumpCount(data.jumpCount);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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
            <h1 className="text-3xl font-bold text-white">Order History</h1>
          </div>
          <div className="flex gap-6 text-gray-300">
            <p>Total Orders: {totalOrders}</p>
            {spinCount > 0 && <p>Spins: {spinCount}</p>}
            {jumpCount > 0 && <p>Jumps: {jumpCount}</p>}
          </div>
        </div>

        {/* Order History */}
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {order.eventName}
                      </h3>
                      {order.type === 'jump' && (
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Jump
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {order.eventDate ? new Date(order.eventDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Date TBA'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{order.venue || 'Venue TBA'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-lg">
                      {order.quantity} ticket{order.quantity > 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-300 text-sm">
                      ${(order.totalPrice || order.jumpPrice || 0).toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Jump Purchase Details */}
                {order.type === 'jump' && (
                  <div className="border-t border-white/20 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Section</p>
                        <p className="text-white font-semibold">{order.section || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Row</p>
                        <p className="text-white font-semibold">{order.row || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <div className="flex items-center gap-2">
                          {order.status === 'completed' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 font-semibold">Confirmed</span>
                            </>
                          ) : order.status === 'requires_fulfillment' ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 font-semibold">Processing</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 font-semibold">Pending</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {order.mercuryOrderId && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-gray-400 text-xs">Order ID: {order.mercuryOrderId}</p>
                      </div>
                    )}
                    {order.error && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                        <p className="text-yellow-400 text-sm">
                          We're working on fulfilling your order. You'll receive an email confirmation soon.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Spin Purchase Details */}
                {order.type === 'spin' && order.bundles && order.bundles.length > 0 && (
                  <div className="border-t border-white/20 pt-4">
                    <h4 className="text-white font-semibold mb-3">Tickets Won:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {order.bundles.map((bundle, idx) => (
                        <div
                          key={bundle.id}
                          className="bg-gradient-to-br from-white/10 to-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-yellow-400/20 p-2 rounded-lg">
                              <Package className="w-5 h-5 text-yellow-400" />
                            </div>
                            <p className="text-white font-semibold text-lg">
                              Bundle {idx + 1}
                            </p>
                          </div>

                          {/* Tickets */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Ticket className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 font-medium text-sm">Event Tickets</span>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3">
                              <p className="text-white font-medium">
                                Section {bundle.ticketSection}, Row {bundle.ticketRow}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {bundle.ticketQuantity} ticket{bundle.ticketQuantity > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Memorabilia */}
                          {bundle.memorabiliaName && (
                            <div>
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
                        </div>
                      ))}
                    </div>

                    {order.adjacentSeats && order.quantity > 1 && (
                      <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                        <CheckCircle className="w-5 h-5 text-yellow-400" />
                        <p className="text-yellow-400 font-medium">Adjacent seats confirmed</p>
                      </div>
                    )}

                    {/* Fulfillment Status for Spins */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Ticket Status:</span>
                        {order.ticketsTransferred ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Transferred</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">Pending Transfer</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
            <p className="text-gray-400 mb-6">
              You haven't made any jumps yet. Start jumping to win tickets!
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