'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Package, Ticket } from 'lucide-react';
import Link from 'next/link';
import MultiStageJump from '@/components/jumps/multi-stage-jump';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Fetch spin result data
    const fetchSpinResult = async () => {
      try {
        const res = await fetch(`/api/stripe/verify-session?sessionId=${sessionId}`);
        if (!res.ok) {
          throw new Error('Failed to verify payment');
        }
        const data = await res.json();
        setSpinResult(data);
        setLoading(false);
        // Auto-start animation after loading
        setTimeout(() => setShowAnimation(true), 500);
      } catch (err: any) {
        console.error('Error fetching spin result:', err);
        setError(err.message || 'Failed to load order details');
        setLoading(false);
      }
    };

    fetchSpinResult();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-white text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold inline-block"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Show jump animation if we have results
  if (showAnimation && spinResult && spinResult.bundles && spinResult.bundles.length > 0) {
    // Transform spinResult.bundles into the format MultiStageJump expects
    const firstBundle = spinResult.bundles[0];
    const jumpResult = {
      tickets: {
        section: firstBundle.ticketSection || '',
        row: firstBundle.ticketRow || '',
        seats: ['1'], // We don't have individual seat numbers
        value: firstBundle.ticketValue || 0
      },
      breaks: {
        name: '',
        value: 0
      },
      totalValue: firstBundle.bundleValue || firstBundle.ticketValue || 0,
      tier: 'club' as const, // Default tier
      bundles: spinResult.bundles.map((bundle: any) => ({
        ticket: {
          level: bundle.ticketSection,
          levelName: bundle.ticketRow,
          value: bundle.ticketValue,
          individual: false,
          special: false
        }
      }))
    };

    return (
      <MultiStageJump
        isJumping={true}
        result={jumpResult}
        onComplete={() => {
          // After animation, could redirect to orders
          setTimeout(() => router.push('/dashboard/orders'), 3000);
        }}
      />
    );
  }

  // Show success summary after animation or if no animation needed
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-xl text-gray-400">Loading your jump results...</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}