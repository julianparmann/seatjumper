'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  Settings,
  Shield,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses'>('profile');
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isDefault: false
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchAddresses();
      setLoading(false);
    }
  }, [status, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleAddressSubmit = async () => {
    try {
      const method = editingAddress ? 'PUT' : 'POST';
      const body = editingAddress
        ? { ...formData, id: editingAddress.id }
        : formData;

      const res = await fetch('/api/user/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        fetchAddresses();
        setShowAddressForm(false);
        setEditingAddress(null);
        setFormData({
          fullName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          isDefault: false
        });
      }
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        const res = await fetch(`/api/user/addresses?id=${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchAddresses();
        }
      } catch (error) {
        console.error('Error deleting address:', error);
      }
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phone: address.phone || '',
      isDefault: address.isDefault
    });
    setShowAddressForm(true);
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true })
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error setting default address:', error);
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

  const isAdmin = (session.user as any).isAdmin;
  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Account Settings</h1>
            <p className="text-gray-400">Manage your profile and security settings</p>
          </div>
        </div>

        {/* Admin Notice */}
        {isAdmin && (
          <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-200 font-semibold">Admin Account</p>
                <p className="text-yellow-100 text-sm">
                  You have administrative privileges for this application.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <User className="w-5 h-5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-5 h-5" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'addresses'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <MapPin className="w-5 h-5" />
              Addresses
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{user?.name || 'User'}</h3>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-2 px-3 py-1 bg-yellow-400/20 text-yellow-400 text-xs font-bold rounded-full">
                    Admin
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Member since {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-yellow-400" />
                    Profile Information
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || ''}
                        disabled
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 disabled:opacity-50"
                      />
                    </div>

                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Profile Updates</p>
                          <p className="text-blue-100 text-xs mt-1">
                            Contact support to update your profile information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Change */}
                <PasswordChangeForm
                  onSuccess={() => {
                    // Optional: Show success notification
                  }}
                />

                {/* Security Info */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    Security Information
                  </h2>

                  <div className="space-y-4">
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-green-200 font-medium text-sm">Account Security</p>
                          <p className="text-green-100 text-xs mt-1">
                            Your account is secured with password authentication.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white font-medium text-sm">Last Sign In</p>
                        <p className="text-gray-400 text-xs mt-1">Today</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white font-medium text-sm">Account Type</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {isAdmin ? 'Administrator' : 'Standard User'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-yellow-400" />
                      Shipping Addresses
                    </h2>
                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setFormData({
                          fullName: '',
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          phone: '',
                          isDefault: false
                        });
                        setShowAddressForm(true);
                      }}
                      className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Address
                    </button>
                  </div>

                  {/* Address List */}
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div key={address.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-white">{address.fullName}</p>
                              {address.isDefault && (
                                <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300">{address.addressLine1}</p>
                            {address.addressLine2 && <p className="text-gray-300">{address.addressLine2}</p>}
                            <p className="text-gray-300">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            {address.phone && <p className="text-gray-300">Phone: {address.phone}</p>}
                          </div>
                          <div className="flex gap-2">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefault(address.id)}
                                className="text-gray-400 hover:text-white p-2"
                                title="Set as default"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="text-gray-400 hover:text-white p-2"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-gray-400 hover:text-red-400 p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {addresses.length === 0 && (
                      <p className="text-gray-400 text-center py-8">No addresses saved yet.</p>
                    )}
                  </div>
                </div>

                {/* Address Form Modal */}
                {showAddressForm && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <h3 className="text-2xl font-bold text-white mb-6">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            value={formData.addressLine1}
                            onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={formData.addressLine2}
                            onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({...formData, city: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              value={formData.state}
                              onChange={(e) => setFormData({...formData, state: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                              maxLength={2}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              value={formData.zipCode}
                              onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                            className="mr-2"
                          />
                          <label htmlFor="isDefault" className="text-gray-300">
                            Set as default address
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                          }}
                          className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddressSubmit}
                          className="flex-1 px-4 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300"
                        >
                          {editingAddress ? 'Update' : 'Save'} Address
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}