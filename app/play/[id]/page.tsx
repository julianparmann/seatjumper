'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Ticket, Package, Loader2, DollarSign, LogIn } from 'lucide-react';
// import MultiStageJump from '@/components/jumps/multi-stage-jump'; // Component needs to be created
import Link from 'next/link';

interface TicketGroup {
  id: string;
  section: string;
  row: string;
  quantity: number;
  pricePerSeat: number;
}

interface CardBreak {
  id: string;
  teamName: string;
  breakValue: number;
  status: string;
}

interface Game {
  id: string;
  eventName: string;
  eventDate: string;
  venue: string;
  city: string;
  state: string;
  sport: string;
  avgTicketPrice: number;
  avgBreakValue: number;
  spinPricePerBundle: number;
  ticketGroups: TicketGroup[];
  cardBreaks: CardBreak[];
}

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [jumping, setJumping] = useState(false);
  const [jumpResult, setJumpResult] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [bundleQuantity, setBundleQuantity] = useState(1);
  const [adjacentWarning, setAdjacentWarning] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/admin/games/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
      } else {
        router.push('/events');
      }
    } catch (error) {
      console.error('Error fetching game:', error);
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableBundles = () => {
    if (!game) return 0;

    // Calculate based on available inventory
    const availableTickets = game.ticketGroups.reduce((sum, group) => sum + group.quantity, 0);
    const availableBreaks = game.cardBreaks.filter(cb => cb.status === 'AVAILABLE').length;

    // A bundle needs at least 1 ticket and some breaks
    // Assuming we need at least 1 break per bundle
    return Math.min(availableTickets, Math.floor(availableBreaks / 1));
  };

  const checkAdjacentSeats = (quantity: number) => {
    if (!game || quantity === 1) {
      setAdjacentWarning(null);
      return true;
    }

    // Check if any ticket group has enough adjacent seats
    const hasAdjacentSeats = game.ticketGroups.some(group => group.quantity >= quantity);

    if (!hasAdjacentSeats) {
      const maxAdjacent = Math.max(...game.ticketGroups.map(g => g.quantity));
      if (maxAdjacent > 1) {
        setAdjacentWarning(`Maximum adjacent seats available: ${maxAdjacent}. Your seats may not be together.`);
      } else {
        setAdjacentWarning('No adjacent seats available. Each ticket will be in a different location.');
      }
      return false;
    }

    setAdjacentWarning(null);
    return true;
  };

  useEffect(() => {
    checkAdjacentSeats(bundleQuantity);
  }, [bundleQuantity, game]);

  const handlePayAndJump = async () => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      setShowLoginPrompt(true);
      return;
    }

    // For now, simulate the payment and go straight to jump
    // When Stripe is ready, this will handle the actual payment
    setShowPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      setShowPayment(false);
      handleJump();
    }, 1500);
  };

  const handleJump = async () => {
    setJumping(true);

    try {
      // Call the API to get random bundle assignments
      const res = await fetch('/api/jump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: id,
          quantity: bundleQuantity,
          preferAdjacent: !adjacentWarning
        })
      });

      if (res.ok) {
        const result = await res.json();
        setJumpResult(result);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to jump. Please try again.');
      }
    } catch (error) {
      console.error('Jump error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setJumping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return null;
  }

  const availableBundles = calculateAvailableBundles();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{game.eventName}</h1>
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(game.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{game.venue}, {game.city}, {game.state}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 text-sm font-semibold mb-1">Jump Price</div>
              <div className="text-white text-4xl font-bold">${game.spinPricePerBundle.toFixed(2)}</div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Package className="w-5 h-5" />
                <span className="font-semibold">Available Bundles</span>
              </div>
              <div className="text-white text-3xl font-bold">{availableBundles}</div>
              <div className="text-gray-400 text-sm mt-1">Ready to win</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Ticket className="w-5 h-5" />
                <span className="font-semibold">Ticket Inventory</span>
              </div>
              <div className="text-white text-2xl font-bold">
                {game.ticketGroups.reduce((sum, g) => sum + g.quantity, 0)} tickets
              </div>
              <div className="text-gray-400 text-sm mt-1">
                Avg value: ${game.avgTicketPrice?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Package className="w-5 h-5" />
                <span className="font-semibold">Memorabilia</span>
              </div>
              <div className="text-white text-2xl font-bold">
                {game.cardBreaks.filter(cb => cb.status === 'AVAILABLE').length} items
              </div>
              <div className="text-gray-400 text-sm mt-1">
                Avg value: ${game.avgBreakValue?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {/* Action Area */}
          {availableBundles > 0 ? (
            <div className="text-center">
              {!jumpResult ? (
                <>
                  <p className="text-gray-300 mb-6">
                    Jump to win random tickets and memorabilia bundles!
                  </p>

                  {/* Bundle Quantity Selector */}
                  <div className="bg-white/5 rounded-lg p-6 max-w-md mx-auto mb-6">
                    <label className="text-white font-semibold block mb-3">
                      How many bundles do you want?
                    </label>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={() => setBundleQuantity(Math.max(1, bundleQuantity - 1))}
                        disabled={bundleQuantity <= 1}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white w-10 h-10 rounded-lg font-bold text-xl"
                      >
                        -
                      </button>
                      <div className="text-center">
                        <div className="text-white text-3xl font-bold">{bundleQuantity}</div>
                        <div className="text-gray-400 text-sm">bundle{bundleQuantity > 1 ? 's' : ''}</div>
                      </div>
                      <button
                        onClick={() => setBundleQuantity(Math.min(availableBundles, bundleQuantity + 1))}
                        disabled={bundleQuantity >= availableBundles}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white w-10 h-10 rounded-lg font-bold text-xl"
                      >
                        +
                      </button>
                    </div>

                    {/* Adjacent Seats Warning */}
                    {adjacentWarning && (
                      <div className="bg-yellow-500/20 border border-yellow-500 rounded p-3 mb-4">
                        <p className="text-yellow-300 text-sm">⚠️ {adjacentWarning}</p>
                      </div>
                    )}

                    {/* Total Price Display */}
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Price per bundle:</span>
                        <span className="text-white">${game.spinPricePerBundle.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold">Total:</span>
                        <span className="text-yellow-400 text-2xl font-bold">
                          ${(game.spinPricePerBundle * bundleQuantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePayAndJump}
                    disabled={jumping || showPayment}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-12 py-4 rounded-lg font-bold text-xl disabled:opacity-50 flex items-center gap-3 mx-auto"
                  >
                    {showPayment ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-6 h-6" />
                        Pay ${(game.spinPricePerBundle * bundleQuantity).toFixed(2)} & Jump
                      </>
                    )}
                  </button>
                  <p className="text-gray-400 text-sm mt-3">
                    Payment simulation - Stripe integration coming soon
                  </p>
                </>
              ) : (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-green-400 mb-4">🎉 Congratulations!</h3>
                  <div className="text-white space-y-3">
                    <p className="text-lg">
                      You won {jumpResult.quantity} bundle{jumpResult.quantity > 1 ? 's' : ''}!
                      {jumpResult.adjacentSeats && jumpResult.quantity > 1 && (
                        <span className="text-yellow-400 ml-2">✨ Adjacent seats!</span>
                      )}
                    </p>

                    {jumpResult.bundles ? (
                      // Multiple bundles
                      jumpResult.bundles.map((bundle: any, bundleIdx: number) => (
                        <div key={bundleIdx} className="bg-white/10 rounded p-3">
                          <p className="font-semibold text-yellow-400 mb-2">Bundle {bundleIdx + 1}:</p>

                          <div className="ml-4 space-y-2">
                            <div>
                              <p className="font-semibold">🎟️ Ticket:</p>
                              <p>Section {bundle.ticket.section}, Row {bundle.ticket.row}</p>
                              <p className="text-sm text-gray-300">Value: ${bundle.ticket.value}</p>
                            </div>

                            {bundle.breaks && bundle.breaks.length > 0 && (
                              <div>
                                <p className="font-semibold">🎁 Memorabilia:</p>
                                <div className="space-y-2 mt-2">
                                  {bundle.breaks.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      {item.imageUrl && (
                                        <img
                                          src={item.imageUrl}
                                          alt={item.teamName}
                                          className="w-16 h-16 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{item.teamName}</p>
                                        <p className="text-xs text-gray-400">${item.value}</p>
                                        {item.description && (
                                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Single bundle (backwards compatibility)
                      <>
                        {jumpResult.ticket && (
                          <div className="bg-white/10 rounded p-3">
                            <p className="font-semibold">🎟️ Ticket:</p>
                            <p>Section {jumpResult.ticket.section}, Row {jumpResult.ticket.row}</p>
                            <p className="text-sm text-gray-300">Value: ${jumpResult.ticket.value}</p>
                          </div>
                        )}
                        {jumpResult.breaks && jumpResult.breaks.length > 0 && (
                          <div className="bg-white/10 rounded p-3">
                            <p className="font-semibold">🎁 Memorabilia:</p>
                            <div className="space-y-2 mt-2">
                              {jumpResult.breaks.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  {item.imageUrl && (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.teamName}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{item.teamName}</p>
                                    <p className="text-xs text-gray-400">${item.value}</p>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-white/20 pt-4 mt-4">
                      <p className="text-2xl font-bold text-yellow-400">
                        Total Value: ${jumpResult.totalValue.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        You paid: ${(game.spinPricePerBundle * (jumpResult.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Jump Again
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center bg-red-500/20 border border-red-500 rounded-lg p-6">
              <p className="text-red-300 text-xl font-semibold">Sold Out!</p>
              <p className="text-gray-300 mt-2">No bundles available for this game.</p>
            </div>
          )}
        </div>

        {/* Jump Wheel Component - Commented out until MultiStageJump is created */}
        {/* {jumping && !jumpResult && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
              <MultiStageJump
                onJumpComplete={(result) => {
                  // This would be populated by the API response
                  console.log('Jump complete:', result);
                }}
              />
            </div>
          </div>
        )} */}

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full">
              <div className="text-center">
                <LogIn className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
                <p className="text-gray-300 mb-6">
                  You need to be signed in to jump for bundles. Create an account or sign in to continue.
                </p>

                <div className="space-y-3">
                  <Link
                    href={`/auth/signin?callbackUrl=/play/${id}`}
                    className="block w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block w-full bg-white/20 text-white py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
                  >
                    Create Account
                  </Link>
                  <button
                    onClick={() => setShowLoginPrompt(false)}
                    className="block w-full text-gray-400 hover:text-white py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}