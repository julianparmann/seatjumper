'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    ageVerified: false,
    consentPrivacyPolicy: false,
    consentTermsOfService: false,
    consentMarketing: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate age verification
    if (!formData.ageVerified) {
      setError('You must be 18 or older to create an account');
      return;
    }

    // Validate required consents
    if (!formData.consentPrivacyPolicy || !formData.consentTermsOfService) {
      setError('You must agree to the Privacy Policy and Terms of Service');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          ageVerified: formData.ageVerified,
          consentPrivacyPolicy: formData.consentPrivacyPolicy,
          consentTermsOfService: formData.consentTermsOfService,
          consentMarketing: formData.consentMarketing,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
      } else {
        // Registration successful, show verification message
        setShowVerificationMessage(true);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Show verification message after registration
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Okay, here's where we prove you're not a robot.
              </h1>
              <p className="text-xl text-gray-200 mb-6">
                Click the link we just sent you.
              </p>
              <p className="text-gray-400 text-sm mb-8">
                (Unless you are a robot, in which case… impressive taste in event tickets.)
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm">
                  Check your inbox at <strong>{formData.email}</strong>
                </p>
                <p className="text-yellow-200/80 text-xs mt-2">
                  (Be sure to check your spam folder for anything from SeatJumper.com in case it fell through the crack in the bleachers!)
                </p>
              </div>
              <Link
                href="/auth/signin"
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-300">Join SeatJumper for exclusive deals</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                  placeholder="Create a password (min 8 characters)"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.ageVerified}
                  onChange={(e) => setFormData({ ...formData, ageVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/20 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer"
                  required
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I am over the age of 18 <span className="text-red-400">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.consentTermsOfService}
                  onChange={(e) => setFormData({ ...formData, consentTermsOfService: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/20 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer"
                  required
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I agree to the{' '}
                  <Link href="/terms" className="text-yellow-400 hover:text-yellow-300 underline">
                    Terms of Service
                  </Link>
                  <span className="text-red-400"> *</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.consentPrivacyPolicy}
                  onChange={(e) => setFormData({ ...formData, consentPrivacyPolicy: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/20 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer"
                  required
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I agree to the{' '}
                  <Link href="/privacy" className="text-yellow-400 hover:text-yellow-300 underline">
                    Privacy Policy
                  </Link>
                  <span className="text-red-400"> *</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.consentMarketing}
                  onChange={(e) => setFormData({ ...formData, consentMarketing: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/20 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I want to receive marketing emails and special offers (optional)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-yellow-400 hover:text-yellow-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}