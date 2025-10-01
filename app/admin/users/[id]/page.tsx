'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Truck,
  Eye,
  MoreVertical,
  Loader2
} from 'lucide-react';
import UserActionsDropdown from '@/components/admin/UserActionsDropdown';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  emailVerified: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    dateOfBirth: string | null;
    preferredSport: string | null;
    notifyEmail: boolean;
    notifySms: boolean;
    marketingEmails: boolean;
  } | null;
  addresses: Array<{
    id: string;
    type: string;
    isDefault: boolean;
    fullName: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string | null;
  }>;
  stats: {
    totalJumps: number;
    totalSpent: number;
    totalValue: number;
    totalBundles: number;
    averageSpendPerJump: number;
    roi: number;
    memberSince: string;
    lastActive: string | null;
  };
  recentJumps: Array<{
    id: string;
    eventName: string;
    eventDate: string;
    venue: string;
    city: string;
    state: string;
    quantity: number;
    jumpPrice: number;
    totalPrice: number;
    totalValue: number;
    createdAt: string;
    ticketsTransferred: boolean;
    ticketsTransferredAt: string | null;
    memorabiliaShipped: boolean;
    memorabiliaShippedAt: string | null;
    trackingNumber: string | null;
    shippingCarrier: string | null;
    bundles: any[];
  }>;
  security: {
    lastLogin: string | null;
    authMethods: Array<{
      provider: string;
      type: string;
    }>;
    hasPassword: boolean;
    emailVerified: boolean;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    amount: number;
    createdAt: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  }>;
}

export default function AdminUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/profile`);

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load user profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = () => {
    fetchUserProfile();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTrackingUrl = (carrier: string | null, trackingNumber: string | null) => {
    if (!carrier || !trackingNumber) return null;

    const carriers: { [key: string]: string } = {
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
    };

    return carriers[carrier] || null;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            {error || 'User not found'}
          </div>
          <Link
            href="/admin/users"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-500">Administrative view</p>
          </div>
        </div>
        <UserActionsDropdown user={user} onUserUpdate={handleUserUpdate} />
      </div>

      {/* User Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt={user.name || 'User'} className="w-16 h-16 rounded-full" />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.name || 'Unknown User'}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                  {user.isAdmin ? 'Admin' : 'User'}
                </span>
                {user.emailVerified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Member since {formatDate(user.createdAt)}</p>
            <p>Last updated {formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${user.stats.totalSpent.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jumps</p>
              <p className="text-2xl font-bold text-gray-900">{user.stats.totalJumps}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Win Value</p>
              <p className="text-2xl font-bold text-gray-900">${user.stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className={`text-2xl font-bold ${user.stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {user.stats.roi.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          {user.addresses.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Addresses</h3>
              <div className="space-y-3">
                {user.addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{address.fullName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        address.isDefault ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {address.type} {address.isDefault ? '(Default)' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}, {address.state} {address.zipCode}</p>
                      <p>{address.country}</p>
                      {address.phone && <p>Phone: {address.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jumps */}
          {user.recentJumps.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Jumps</h3>
              <div className="space-y-3">
                {user.recentJumps.map((jump) => (
                  <div key={jump.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{jump.eventName}</h4>
                      <span className="text-sm text-gray-500">{formatDateTime(jump.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <p>{jump.venue}, {jump.city}, {jump.state}</p>
                      <p>Event Date: {formatDate(jump.eventDate)}</p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm">{jump.quantity} bundle{jump.quantity > 1 ? 's' : ''}</span>
                      <div className="text-right">
                        <p className="text-sm font-medium">Jump Price: ${jump.jumpPrice.toFixed(2)}</p>
                        <p className={`text-sm ${jump.totalValue > jump.jumpPrice ? 'text-green-600' : 'text-gray-600'}`}>
                          Value: ${jump.totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {/* Fulfillment Status */}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Tickets:</span>
                        </div>
                        {jump.ticketsTransferred ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              Transferred {jump.ticketsTransferredAt ? formatDate(jump.ticketsTransferredAt) : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-600">Pending Transfer</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Memorabilia:</span>
                        </div>
                        {jump.memorabiliaShipped ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600">
                                Shipped {jump.memorabiliaShippedAt ? formatDate(jump.memorabiliaShippedAt) : ''}
                              </span>
                            </div>
                            {jump.trackingNumber && (
                              <a
                                href={getTrackingUrl(jump.shippingCarrier, jump.trackingNumber) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                              >
                                {jump.shippingCarrier}: {jump.trackingNumber}
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-600">Pending Shipment</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Verified</span>
                {user.security.emailVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Has Password</span>
                {user.security.hasPassword ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              {user.security.lastLogin && (
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="text-sm font-medium">{formatDateTime(user.security.lastLogin)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Authentication Methods */}
          {user.security.authMethods.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Auth Methods</h3>
              <div className="space-y-2">
                {user.security.authMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{method.provider}</span>
                    <span className="text-xs text-gray-500">{method.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {user.recentOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {user.recentOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">#{order.orderNumber}</span>
                      <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">${order.amount.toFixed(2)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.fulfillmentStatus)}`}>
                        {order.fulfillmentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}