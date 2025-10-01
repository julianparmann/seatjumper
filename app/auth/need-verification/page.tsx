'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

function NeedVerificationContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const email = searchParams.get('email') || session?.user?.email || '';

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [initialEmailSent, setInitialEmailSent] = useState(false);

  // Automatically send verification email on first load
  useEffect(() => {
    if (email && !initialEmailSent) {
      setInitialEmailSent(true);
      handleResendEmail(true);
    }
  }, [email, initialEmailSent]);

  const handleResendEmail = async (isAutomatic = false) => {
    if (!email) {
      setResendError('No email address provided');
      return;
    }

    setIsResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      if (!isAutomatic) {
        setResendSuccess(true);
        // Reset success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error: any) {
      setResendError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-yellow-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              One More Step! 🎟️
            </h1>

            {session && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <p className="text-green-300 text-sm">
                  ✅ You're logged in as <span className="font-semibold">{session.user?.name || session.user?.email}</span>
                </p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <AlertCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-200 text-sm">
                We need to verify your email before you can start jumping into the game!
              </p>
            </div>

            {email && (
              <p className="text-gray-300 mb-6">
                We've sent a verification email to:
                <br />
                <span className="font-semibold text-yellow-400">{email}</span>
              </p>
            )}

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                Check your inbox and click the verification link to get started.
              </p>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">
                  🔥 <strong>Pro tip:</strong> Check your spam folder!
                </p>
                <p className="text-xs text-gray-500">
                  Sometimes our emails party too hard and end up in spam
                </p>
              </div>
            </div>

            {/* Resend Email Section */}
            {email && (
              <div className="mb-6">
                {resendSuccess ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-400 inline mr-2" />
                    <span className="text-green-300 text-sm">
                      Verification email sent! Check your inbox
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-3">
                      Didn't receive the email?
                    </p>
                    <button
                      onClick={() => handleResendEmail()}
                      disabled={isResending}
                      className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Resend Verification Email
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {resendError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm mb-6">
                {resendError}
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back to Sign In
              </Link>

              <Link
                href="/auth/signup"
                className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm"
              >
                Need a different account? Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Fun Footer Message */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Once verified, you'll be jumping higher than
            <br />
            Cheech and Chong on a trampoline! 🤸
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NeedVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <NeedVerificationContent />
    </Suspense>
  );
}