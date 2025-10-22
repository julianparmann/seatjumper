'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';

interface JumpPurchase {
  id: string;
  eventId: string;
  section: string;
  row: string;
  quantity: number;
  jumpPrice: number;
  wholesalePrice: number;
  mercuryOrderId: string;
  status: string;
  eventName?: string;
  eventDate?: string;
  venue?: string;
}

function JumpSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jumpResult, setJumpResult] = useState<JumpPurchase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('[Jump Success] URL params:', window.location.search);
    console.log('[Jump Success] Extracted session ID:', sessionId);

    if (!sessionId) {
      setError('No session ID found in URL');
      setLoading(false);
      console.error('[Jump Success] Missing session_id parameter');
      return;
    }

    // Extract event info from URL for fallback
    const eventId = searchParams.get('event_id');
    const quantity = parseInt(searchParams.get('quantity') || '1');
    const jumpPrice = parseFloat(searchParams.get('price') || '0');

    // Create placeholder record if needed (in case webhook is delayed)
    const ensurePurchaseRecord = async () => {
      if (eventId) {
        try {
          console.log('[Jump Success] Creating placeholder record for immediate display');
          await fetch('/api/jump/prepare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, eventId, quantity, jumpPrice })
          });
        } catch (err) {
          console.error('[Jump Success] Failed to create placeholder:', err);
        }
      }
    };

    // Fetch jump result data with retry logic for webhook processing
    const fetchJumpResult = async (retryCount = 0) => {
      try {
        console.log(`[Jump Success] Fetching result for session ${sessionId}, attempt ${retryCount + 1}`);
        const res = await fetch(`/api/jump/result?sessionId=${sessionId}`);

        if (!res.ok) {
          const errorText = await res.text();
          console.log(`[Jump Success] Response not OK: ${res.status}, ${errorText}`);

          if (res.status === 404 && retryCount < 15) {
            // Webhook might still be processing, retry with longer delay
            console.log(`[Jump Success] Retrying in 3 seconds...`);
            setTimeout(() => fetchJumpResult(retryCount + 1), 3000);
            return;
          }
          throw new Error(`Failed to verify purchase (${res.status})`);
        }

        const data = await res.json();
        console.log('Jump result data:', data);

        setJumpResult(data);
        setLoading(false);
        // Start video animation after loading
        setTimeout(() => setShowVideo(true), 500);
      } catch (err: any) {
        console.error('Error fetching jump result:', err);
        if (retryCount < 15) {
          // Retry with longer delay
          console.log(`[Jump Success] Retrying in 3 seconds...`);
          setTimeout(() => fetchJumpResult(retryCount + 1), 3000);
        } else {
          setError('Purchase is being processed. Please check your order history in a few moments.');
          setLoading(false);
          // Still redirect to orders page after delay
          setTimeout(() => router.push('/dashboard/orders'), 5000);
        }
      }
    };

    // Call both functions
    ensurePurchaseRecord().then(() => {
      fetchJumpResult();
    });
  }, [searchParams]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Auto-redirect to orders after a short delay
    setTimeout(() => router.push('/dashboard/orders'), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white text-lg">Processing your jump purchase...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
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
            href="/events"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold inline-block"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  // Show video reveal animation
  if (jumpResult && showVideo && !videoEnded) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
        >
          <source src="/videos/revealred.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Show results after video
  if (jumpResult && videoEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Jump Successful!</h1>
            <p className="text-gray-400">Your tickets have been secured</p>
          </div>

          {/* Ticket Details Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-blue-500" />
              Your Tickets
            </h2>

            <div className="space-y-4">
              {/* Event Info */}
              <div>
                <p className="text-gray-400 text-sm mb-1">Event</p>
                <p className="text-white text-xl font-semibold">{jumpResult.eventName || 'Event'}</p>
                {jumpResult.venue && (
                  <p className="text-gray-300 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {jumpResult.venue}
                  </p>
                )}
              </div>

              {/* Seat Details */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-700">
                <div>
                  <p className="text-gray-400 text-sm">Section</p>
                  <p className="text-white text-lg font-semibold">{jumpResult.section || 'Processing...'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Row</p>
                  <p className="text-white text-lg font-semibold">{jumpResult.row || 'Processing...'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Quantity</p>
                  <p className="text-white text-lg font-semibold">{jumpResult.quantity}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-4 border-t border-gray-700">
                <span className="text-gray-400">Status</span>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                  {jumpResult.status === 'completed' ? 'Confirmed' : 'Processing'}
                </span>
              </div>

              {/* Order ID */}
              {jumpResult.mercuryOrderId && (
                <div className="text-center pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">Order ID</p>
                  <p className="text-gray-300 font-mono text-sm">{jumpResult.mercuryOrderId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Link
              href="/dashboard/orders"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
            >
              View My Orders
            </Link>
            <Link
              href="/events"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
            >
              Browse More Events
            </Link>
          </div>

          {/* Redirect Notice */}
          <p className="text-center text-gray-500 text-sm mt-4">
            Redirecting to your orders in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function JumpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    }>
      <JumpSuccessContent />
    </Suspense>
  );
}