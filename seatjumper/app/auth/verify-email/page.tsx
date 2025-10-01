'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');

          // Update the session to reflect the verified status
          if (session) {
            await update();
          }

          // Redirect to dashboard if logged in, otherwise to events page
          setTimeout(() => {
            if (session) {
              router.push('/dashboard');
            } else {
              router.push('/events');
            }
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-400">Please wait a moment</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-xl text-gray-300 mb-6">Let's jump! 🎟️</p>
            <p className="text-gray-400 mb-4">{message}</p>
            <p className="text-gray-500 text-sm">
              {session ? 'Redirecting you to your dashboard...' : 'Redirecting you to browse events...'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-300 mb-6">{message}</p>

            {/* Check if the token is expired or already used */}
            {(message.includes('expired') || message.includes('already been used')) && (
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-3">
                  Need a new verification link?
                </p>
                <Link
                  href="/auth/need-verification"
                  className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Request New Verification Email
                </Link>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Sign In
              </Link>
              <Link
                href="/"
                className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm"
              >
                Return Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
