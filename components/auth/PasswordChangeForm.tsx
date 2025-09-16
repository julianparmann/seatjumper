'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PasswordChangeForm({ onSuccess, onCancel }: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setStatus('error');
      setMessage('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus('error');
      setMessage('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatus('error');
      setMessage('New password must be at least 6 characters long');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setStatus('error');
      setMessage('New password must be different from current password');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Password changed successfully!');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to change password');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-yellow-400/20 p-3 rounded-lg">
          <Lock className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Change Password</h2>
          <p className="text-gray-400 text-sm">Update your account password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Enter your current password"
              disabled={status === 'loading' || status === 'success'}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Enter your new password"
              disabled={status === 'loading' || status === 'success'}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-1">Must be at least 6 characters long</p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Confirm your new password"
              disabled={status === 'loading' || status === 'success'}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            status === 'success'
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {status === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="flex-1 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'loading' ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                Changing...
              </div>
            ) : status === 'success' ? (
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Changed!
              </div>
            ) : (
              'Change Password'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={status === 'loading'}
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}