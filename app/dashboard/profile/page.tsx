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
  Loader2
} from 'lucide-react';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

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
          </div>
        </div>
      </div>
    </div>
  );
}