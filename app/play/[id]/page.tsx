'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Ticket, Package, Loader2, DollarSign, LogIn, Filter, Check, X, Info } from 'lucide-react';
import AllegiantStadiumAnimation from '@/components/jumps/AllegiantStadiumAnimation';
import Link from 'next/link';

interface TicketLevel {
  id: string;
  level: string;
  levelName: string;
  quantity: number;
  pricePerSeat: number;
  viewImageUrl?: string;
  sections: string[];
  isSelectable: boolean;
}

interface SpecialPrize {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl?: string;
  prizeType: string;
}

interface CardBreak {
  id: string;
  teamName?: string;
  breakValue?: number;
  status: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  itemType?: string;
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
  ticketGroups?: any[];
  ticketLevels: TicketLevel[];
  specialPrizes: SpecialPrize[];
  cardBreaks: CardBreak[];
  stadium?: {
    id: string;
    name: string;
    city: string;
    state: string;
    footballImage?: string;
    concertImage?: string;
    basketballImage?: string;
    configurations?: any;
  };
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/admin/games/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
        // Initialize selected levels with all selectable levels
        if (data.ticketLevels) {
          const selectableLevels = data.ticketLevels
            .filter((level: TicketLevel) => level.isSelectable && level.quantity > 0)
            .map((level: TicketLevel) => level.level);
          setSelectedLevels(selectableLevels);
        }
        // Don't use pre-calculated price - will calculate dynamically in useEffect
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

  // Use consistent pricing from backend
  useEffect(() => {
    if (!game) return;

    // Use the pre-calculated price from the backend for consistency
    // This is already calculated with proper averages and 30% margin
    const basePrice = game.spinPricePerBundle || 0;

    // If we have a valid pre-calculated price, use it
    if (basePrice > 0) {
      setCalculatedPrice(basePrice);
    } else {
      // Fallback calculation if spinPricePerBundle is not set
      // Calculate average ticket price from selected levels
      let ticketValue = 0;
      let ticketCount = 0;

      game.ticketLevels
        .filter(level => selectedLevels.includes(level.level))
        .forEach(level => {
          ticketValue += level.pricePerSeat * level.quantity;
          ticketCount += level.quantity;
        });

      // Add special prizes
      game.specialPrizes.forEach(prize => {
        ticketValue += prize.value * prize.quantity;
        ticketCount += prize.quantity;
      });

      const avgTicketPrice = ticketCount > 0 ? ticketValue / ticketCount : 0;

      // Calculate average memorabilia value
      const availableBreaks = game.cardBreaks.filter(cb => cb.status === 'AVAILABLE');
      const breakValue = availableBreaks.reduce((sum, cb) => sum + (cb.breakValue || 0), 0);
      const avgBreakValue = availableBreaks.length > 0 ? breakValue / availableBreaks.length : 0;

      // Bundle = 1 ticket + 1 memorabilia, with 30% margin
      const bundleValue = avgTicketPrice + avgBreakValue;
      const priceWithMargin = bundleValue * 1.3;

      setCalculatedPrice(priceWithMargin);
    }

  }, [game, selectedLevels, bundleQuantity]);

  const calculateAvailableBundles = () => {
    if (!game) return 0;

    // Calculate based on available inventory in selected levels
    const selectedTickets = game.ticketLevels
      .filter(level => selectedLevels.includes(level.level))
      .reduce((sum, level) => sum + level.quantity, 0);

    const totalSpecialPrizes = game.specialPrizes.reduce((sum, prize) => sum + prize.quantity, 0);
    const totalTicketsAndPrizes = selectedTickets + totalSpecialPrizes;

    const availableBreaks = game.cardBreaks.filter(cb => cb.status === 'AVAILABLE').length;

    // Each bundle needs 1 ticket/prize + 1 memorabilia
    return Math.min(totalTicketsAndPrizes, availableBreaks);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => {
      if (prev.includes(level)) {
        // Don't allow deselecting all levels
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== level);
      } else {
        return [...prev, level];
      }
    });
  };

  const [showAnimation, setShowAnimation] = useState(false);
  const [animationResult, setAnimationResult] = useState<any>(null);

  const handlePayAndJump = async () => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      setShowLoginPrompt(true);
      return;
    }

    // Fetch saved addresses if not already loaded
    if (savedAddresses.length === 0 && session?.user?.email) {
      try {
        const res = await fetch('/api/user/addresses');
        if (res.ok) {
          const addresses = await res.json();
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            setSelectedAddressId(addresses[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    }

    // Show address modal first
    setShowAddressModal(true);
  };

  const handleAddressSubmit = async () => {
    // Validate address
    if (selectedAddressId || (
      shippingAddress.fullName &&
      shippingAddress.addressLine1 &&
      shippingAddress.city &&
      shippingAddress.state &&
      shippingAddress.zipCode
    )) {
      setShowAddressModal(false);
      setShowPayment(true);

      // Save address if it's a new one
      if (!selectedAddressId && session?.user?.email) {
        try {
          await fetch('/api/user/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shippingAddress)
          });
        } catch (error) {
          console.error('Error saving address:', error);
        }
      }

      // Simulate payment processing
      setTimeout(() => {
        setShowPayment(false);
        handleJump();
      }, 1500);
    } else {
      alert('Please complete all required fields');
    }
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
          selectedLevels
        })
      });

      if (res.ok) {
        const result = await res.json();

        // Store result but don't show it yet
        setAnimationResult(result);

        // Show animation first
        setShowAnimation(true);

        // Animation will call onAnimationComplete when done
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to jump. Please try again.');
        setJumping(false);
      }
    } catch (error) {
      console.error('Jump error:', error);
      alert('An error occurred. Please try again.');
      setJumping(false);
    }
  };

  const onAnimationComplete = () => {
    // Show the actual result after animation
    setJumpResult(animationResult);
    setShowAnimation(false);
    setJumping(false);
    setAnimationResult(null);
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
              <div className="text-white text-4xl font-bold">${calculatedPrice.toFixed(2)}</div>
              <div className="text-gray-400 text-xs mt-1">per bundle</div>
            </div>
          </div>

          {/* Level Filter Section */}
          {game.ticketLevels && game.ticketLevels.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-3"
              >
                <Filter className="w-5 h-5" />
                <span className="font-semibold">Customize Risk Profile</span>
              </button>

              {showFilters && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-3">
                    Select which ticket levels to include in your jump pool. Deselecting levels changes your risk/reward ratio.
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {game.ticketLevels.filter(level => level.quantity > 0).map(level => (
                      <button
                        key={level.id}
                        onClick={() => toggleLevel(level.level)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedLevels.includes(level.level)
                            ? 'border-yellow-400 bg-yellow-400/20 text-white'
                            : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{level.levelName}</span>
                          {selectedLevels.includes(level.level) && <Check className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <div className="text-sm">
                          <p>Level {level.level}</p>
                          <p>${level.pricePerSeat}/seat</p>
                          <p className="text-xs opacity-75">{level.quantity} available</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
                <span className="font-semibold">Ticket Pool</span>
              </div>
              <div className="text-white text-2xl font-bold">
                {game.ticketLevels
                  .filter(level => selectedLevels.includes(level.level))
                  .reduce((sum, level) => sum + level.quantity, 0)} tickets
              </div>
              <div className="text-gray-400 text-sm mt-1">
                {game.specialPrizes.length > 0 && (
                  <span>+ {game.specialPrizes.reduce((sum, p) => sum + p.quantity, 0)} special prizes</span>
                )}
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

          {/* Special Prizes Display */}
          {game.specialPrizes && game.specialPrizes.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-400 font-bold mb-3">🌟 Special Prizes Available!</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {game.specialPrizes.map(prize => (
                  <div key={prize.id} className="flex items-start gap-3 bg-black/20 rounded-lg p-2">
                    {prize.imageUrl && (
                      <img
                        src={prize.imageUrl}
                        alt={prize.name}
                        className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setModalImage({ url: prize.imageUrl!, alt: prize.name })}
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{prize.name}</p>
                      <p className="text-gray-400 text-xs">({prize.quantity}x)</p>
                      {prize.description && (
                        <p className="text-gray-500 text-xs mt-1">{prize.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Animation */}
          {showAnimation && animationResult && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
              <AllegiantStadiumAnimation
                targetSection={animationResult.bundles?.[0]?.ticket?.level || animationResult.bundles?.[0]?.ticket?.name || ''}
                targetRow={animationResult.bundles?.[0]?.ticket?.levelName || ''}
                targetSeats={[]}
                cardBreak={animationResult.bundles?.[0]?.memorabilia}
                seatViewUrl={animationResult.bundles?.[0]?.ticket?.viewImageUrl || animationResult.bundles?.[0]?.ticket?.imageUrl}
                bundles={animationResult.bundles}
                onComplete={onAnimationComplete}
                isAnimating={showAnimation}
                stadium={game.stadium}
                venueName={game.venue}
              />
            </div>
          )}

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
                        <div className="text-gray-400 text-sm flex items-center gap-1 justify-center group relative">
                          <span>bundle{bundleQuantity > 1 ? 's' : ''}</span>
                          <Info className="w-3 h-3" />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <div className="bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 whitespace-nowrap">
                              <p className="font-semibold mb-1">Each bundle includes:</p>
                              <p>• 1 game ticket</p>
                              <p>• 1 memorabilia item</p>
                              {bundleQuantity > 1 && (
                                <p className="mt-1 text-yellow-400">✓ Seats will be together</p>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                <div className="border-8 border-transparent border-t-gray-800"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setBundleQuantity(Math.min(availableBundles, bundleQuantity + 1))}
                        disabled={bundleQuantity >= availableBundles}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white w-10 h-10 rounded-lg font-bold text-xl"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price Display */}
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Price per bundle:</span>
                        <span className="text-white">${calculatedPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold">Total:</span>
                        <span className="text-yellow-400 text-2xl font-bold">
                          ${(calculatedPrice * bundleQuantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePayAndJump}
                    disabled={jumping || showPayment || selectedLevels.length === 0}
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
                        Pay ${(calculatedPrice * bundleQuantity).toFixed(2)} & Jump
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
                    </p>

                    {jumpResult.bundles && jumpResult.bundles.map((bundle: any, bundleIdx: number) => (
                      <div key={bundleIdx} className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-400 mb-2">Bundle {bundleIdx + 1}:</p>

                        <div className="ml-4 space-y-4">
                          <div>
                            {bundle.ticket.special ? (
                              <>
                                <p className="font-semibold mb-2">🌟 Special Prize:</p>
                                <div className="flex items-start gap-3">
                                  {bundle.ticket.imageUrl && (
                                    <img
                                      src={bundle.ticket.imageUrl}
                                      alt={bundle.ticket.name}
                                      className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setModalImage({ url: bundle.ticket.imageUrl!, alt: bundle.ticket.name })}
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-lg font-medium">{bundle.ticket.name}</p>
                                    <p className="text-sm text-gray-300 mt-1">{bundle.ticket.description}</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold mb-2">🎟️ Ticket:</p>
                                <div className="flex items-start gap-3">
                                  {bundle.ticket.viewImageUrl && (
                                    <img
                                      src={bundle.ticket.viewImageUrl}
                                      alt={`${bundle.ticket.levelName} view`}
                                      className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setModalImage({ url: bundle.ticket.viewImageUrl!, alt: `${bundle.ticket.levelName} view` })}
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-lg font-medium">{bundle.ticket.levelName}</p>
                                    <p className="text-sm text-gray-300">Level {bundle.ticket.level}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {bundle.memorabilia && (
                            <div>
                              <p className="font-semibold mb-2">🎁 Memorabilia:</p>
                              <div className="flex items-start gap-3">
                                {bundle.memorabilia.imageUrl && (
                                  <img
                                    src={bundle.memorabilia.imageUrl}
                                    alt={bundle.memorabilia.name}
                                    className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setModalImage({ url: bundle.memorabilia.imageUrl!, alt: bundle.memorabilia.name })}
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-lg font-medium">{bundle.memorabilia.name}</p>
                                  {bundle.memorabilia.description && (
                                    <p className="text-sm text-gray-300 mt-1">{bundle.memorabilia.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

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

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-6">Shipping Information</h3>
              <p className="text-gray-400 mb-6">
                Please provide your shipping address for memorabilia delivery
              </p>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Select a saved address:</h4>
                  <div className="space-y-2">
                    {savedAddresses.map(addr => (
                      <label
                        key={addr.id}
                        className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1"
                        />
                        <div className="text-sm text-gray-300">
                          <p className="font-semibold">{addr.fullName}</p>
                          <p>{addr.addressLine1}</p>
                          {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                          <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                          {addr.phone && <p>Phone: {addr.phone}</p>}
                        </div>
                      </label>
                    ))}
                    <label
                      className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                    >
                      <input
                        type="radio"
                        name="address"
                        value="new"
                        checked={selectedAddressId === null}
                        onChange={() => setSelectedAddressId(null)}
                        className="mt-1"
                      />
                      <div className="text-sm text-gray-300 font-semibold">
                        Add a new address
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* New Address Form */}
              {(savedAddresses.length === 0 || selectedAddressId === null) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine1: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine2: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                      placeholder="Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                        placeholder="NY"
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
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                        placeholder="10001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddressSubmit}
                  className="flex-1 px-4 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Image Modal */}
        {modalImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4"
            onClick={() => setModalImage(null)}
          >
            <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <img
                src={modalImage.url}
                alt={modalImage.alt}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setModalImage(null)}
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}