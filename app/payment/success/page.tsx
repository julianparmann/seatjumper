'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Package, Ticket } from 'lucide-react';
import Link from 'next/link';
import VideoReveal from '@/components/jumps/video-reveal';

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

    // Fetch spin result data with retry logic for webhook processing
    const fetchSpinResult = async (retryCount = 0) => {
      try {
        const res = await fetch(`/api/stripe/verify-session?sessionId=${sessionId}`);
        if (!res.ok) {
          throw new Error('Failed to verify payment');
        }
        const data = await res.json();
        console.log('Spin result data:', data);

        // Check if bundles are available, if not retry a few times
        if ((!data.bundles || data.bundles.length === 0) && retryCount < 5) {
          console.log(`No bundles yet, retrying... (attempt ${retryCount + 1})`);
          setTimeout(() => fetchSpinResult(retryCount + 1), 2000);
          return;
        }

        setSpinResult(data);
        setLoading(false);
        // Auto-start animation after loading if we have bundles
        if (data.bundles && data.bundles.length > 0) {
          setTimeout(() => setShowAnimation(true), 500);
        }
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

  // Check if we have valid data to show
  if (spinResult && spinResult.bundles && spinResult.bundles.length > 0 && showAnimation) {
    // Transform spinResult.bundles into the format VideoReveal expects
    const bundles = spinResult.bundles.map((bundle: any) => ({
      ticket: {
        level: bundle.ticketSection,
        levelName: bundle.ticketRow,
        value: bundle.ticketValue,
        individual: !bundle.ticketSection, // If no section, it's individual seats
        special: false
      },
      memorabilia: bundle.memorabiliaName ? {
        name: bundle.memorabiliaName,
        value: bundle.memorabiliaValue || 0,
        imageUrl: bundle.memorabiliaImageUrl
      } : undefined
    }));

    return (
      <VideoReveal
        bundles={bundles}
        selectedPack={spinResult.selectedPack || 'blue'}
        onComplete={() => {
          // After animation, redirect to orders
          setTimeout(() => router.push('/dashboard/orders'), 3000);
        }}
      />
    );
  }

  // Loading state while waiting for animation to start
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
        <p className="text-white text-lg">Preparing your results...</p>
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