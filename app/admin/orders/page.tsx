'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  Truck,
  User,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  X
} from 'lucide-react';

interface OrderData {
  id: string;
  userId: string;
  gameId: string;
  quantity: number;
  totalPrice: number;
  totalValue: number;
  adjacentSeats: boolean;
  createdAt: string;
  paidAt: string | null;
  ticketsTransferred: boolean;
  ticketsTransferredAt: string | null;
  memorabiliaShipped: boolean;
  memorabiliaShippedAt: string | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  user: {
    name: string | null;
    email: string;
  };
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
    ticketQuantity: number;
    ticketValue: number;
    breaks: any; // JSON field containing break information
    bundleValue: number;
  }>;
}

interface EditingState {
  [key: string]: {
    trackingNumber: string;
    shippingCarrier: string;
  };
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterStatus = searchParams.get('status') || 'pending';

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState>({});
  const pageSize = 20;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        status: filterStatus
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalOrders(data.total);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFulfillmentStatus = async (orderId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/jumps/${orderId}/fulfillment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        fetchOrders();
        setEditingOrder(null);
      } else {
        const error = await response.text();
        console.error('Failed to update fulfillment status:', response.status, error);
        alert(`Failed to update order: ${error}`);
      }
    } catch (error) {
      console.error('Error updating fulfillment status:', error);
      alert('Network error updating order. Please try again.');
    }
  };

  const handleEditOrder = (orderId: string, order: OrderData) => {
    setEditingOrder(orderId);
    setEditingState({
      [orderId]: {
        trackingNumber: order.trackingNumber || '',
        shippingCarrier: order.shippingCarrier || ''
      }
    });
  };

  const handleSaveTracking = (orderId: string) => {
    const state = editingState[orderId];
    updateFulfillmentStatus(orderId, {
      memorabiliaShipped: true,
      trackingNumber: state.trackingNumber,
      shippingCarrier: state.shippingCarrier
    });
  };

  const isPending = (order: OrderData) => {
    return !order.ticketsTransferred || !order.memorabiliaShipped;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Order Management
          </h1>
          <p className="text-gray-400 mt-1">Manage order fulfillment and tracking</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-1 inline-flex">
        <button
          onClick={() => router.push('/admin/orders?status=pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'pending'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pending Fulfillment
        </button>
        <button
          onClick={() => router.push('/admin/orders?status=all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Orders
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Bundles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tickets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Memorabilia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="flex items-center cursor-pointer hover:text-purple-400"
                      onClick={() => router.push(`/admin/users/${order.userId}`)}
                    >
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {order.user.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-400">{order.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium">{order.game.eventName}</div>
                    <div className="text-xs text-gray-400">
                      {formatDate(order.game.eventDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.game.venue}, {order.game.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium mb-2">{order.quantity} bundle{order.quantity > 1 ? 's' : ''}</div>
                    {order.bundles.map((bundle, idx) => (
                      <div key={bundle.id} className="mb-3 p-2 bg-gray-900/50 rounded-lg">
                        <div className="text-xs font-medium text-purple-400">Bundle {idx + 1}</div>
                        <div className="text-xs text-gray-300 mt-1">
                          Section {bundle.ticketSection}, Row {bundle.ticketRow}
                        </div>
                        <div className="text-xs text-gray-400">
                          {bundle.ticketQuantity} ticket{bundle.ticketQuantity > 1 ? 's' : ''} • ${bundle.ticketValue}
                        </div>
                        {bundle.breaks && Array.isArray(bundle.breaks) && bundle.breaks.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium text-blue-400">Card Breaks:</div>
                            {bundle.breaks.map((breakItem: any, breakIdx: number) => (
                              <div key={breakIdx} className="text-xs text-gray-400 pl-2">
                                • {breakItem.breakName || breakItem.name}
                                {breakItem.breakValue && <span className="text-green-400"> (${breakItem.breakValue})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.ticketsTransferred ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Transferred</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-400">Pending</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.memorabiliaShipped ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">Shipped</span>
                        </div>
                        {order.trackingNumber && (
                          <div className="text-xs text-blue-400 mt-1">
                            {order.shippingCarrier}: {order.trackingNumber}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {editingOrder === order.id ? (
                          <div className="space-y-2">
                            <select
                              value={editingState[order.id]?.shippingCarrier || ''}
                              onChange={(e) => setEditingState({
                                ...editingState,
                                [order.id]: {
                                  ...editingState[order.id],
                                  shippingCarrier: e.target.value
                                }
                              })}
                              className="text-xs px-2 py-1 bg-gray-900/50 border border-gray-600 rounded text-white"
                            >
                              <option value="">Carrier</option>
                              <option value="USPS">USPS</option>
                              <option value="UPS">UPS</option>
                              <option value="FedEx">FedEx</option>
                              <option value="DHL">DHL</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Tracking #"
                              value={editingState[order.id]?.trackingNumber || ''}
                              onChange={(e) => setEditingState({
                                ...editingState,
                                [order.id]: {
                                  ...editingState[order.id],
                                  trackingNumber: e.target.value
                                }
                              })}
                              className="text-xs px-2 py-1 bg-gray-900/50 border border-gray-600 rounded text-white w-24"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">Pending</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {!order.ticketsTransferred && (
                        <button
                          onClick={() => updateFulfillmentStatus(order.id, { ticketsTransferred: true })}
                          className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                        >
                          Mark Tickets Sent
                        </button>
                      )}
                      {!order.memorabiliaShipped && (
                        <>
                          {editingOrder === order.id ? (
                            <>
                              <button
                                onClick={() => handleSaveTracking(order.id)}
                                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingOrder(null)}
                                className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditOrder(order.id, order)}
                              className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                            >
                              Add Tracking
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-900/50 px-4 py-3 border-t border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing{' '}
                  <span className="font-medium text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-white">
                    {Math.min(currentPage * pageSize, totalOrders)}
                  </span>{' '}
                  of <span className="font-medium text-white">{totalOrders}</span> orders
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}