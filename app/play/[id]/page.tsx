'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Ticket, Package, Loader2, DollarSign, LogIn, Filter, Check, X, Info, Crown, Star } from 'lucide-react';
import TierBadge from '@/components/tickets/TierBadge';
import { TierLevel } from '@prisma/client';
import AllegiantStadiumAnimation from '@/components/jumps/AllegiantStadiumAnimation';
import { SeatViewImage } from '@/components/SeatViewImage';
import PrizeTiersDisplay from '@/components/prizes/PrizeTiersDisplay';
import PackSelection from '@/components/packs/PackSelection';
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
  availableUnits?: number[];
  tierLevel?: TierLevel | null;
  tierPriority?: number | null;
  availablePacks?: string[];
}

interface SpecialPrize {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl?: string;
  prizeType: string;
  availableUnits?: number[];
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
  spinPrice1x?: number;
  spinPrice2x?: number;
  spinPrice3x?: number;
  spinPrice4x?: number;
  ticketGroups?: Array<{
    id: string;
    section: string;
    row: string;
    quantity: number;
    pricePerSeat: number;
    status: string;
    seatViewUrl?: string;
    seatViewUrl2?: string;
    availableUnits?: number[];
    tierLevel?: TierLevel | null;
    tierPriority?: number | null;
    notes?: string;
    availablePacks?: string[];
  }>;
  ticketLevels: TicketLevel[];
  cardBreaks: CardBreak[];
  bestPrizes?: {
    bestTicket: any;
    bestMemorabillia: any;
  };
  stadium?: {
    id: string;
    name: string;
    city: string;
    state: string;
    defaultSeatViewUrl?: string | null;
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
  const [selectedPack, setSelectedPack] = useState<string>('blue'); // Default to blue pack
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);
  const [flippedImages, setFlippedImages] = useState<Set<string>>(new Set());
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
  const [availableBundleSizes, setAvailableBundleSizes] = useState<number[]>([]);
  const [dynamicPrices, setDynamicPrices] = useState<{ blue: number; red: number; gold: number }>({ blue: 500, red: 1000, gold: 1500 });

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/public/games/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
        // Initialize selected levels with all selectable levels
        if (data.ticketLevels && data.ticketLevels.length > 0) {
          const selectableLevels = data.ticketLevels
            .filter((level: TicketLevel) => level.isSelectable && level.quantity > 0)
            .map((level: TicketLevel) => level.level);
          setSelectedLevels(selectableLevels);
        } else if (data.ticketGroups && data.ticketGroups.length > 0) {
          // If no ticket levels but have ticket groups, set a dummy value to enable the button
          setSelectedLevels(['all']);
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

  // Calculate pack-specific pricing based on available inventory
  const calculateTierPrices = () => {
    if (!game) return { blue: 500, red: 1000, gold: 1500 };

    const margin = 1.3; // 30% margin
    const allItems = [...(game.ticketLevels || []), ...(game.ticketGroups || [])];

    // Calculate Blue Pack price - includes items available in blue pack
    const blueItems = allItems.filter(item => {
      const packs = (item.availablePacks as string[]) || ['blue', 'red', 'gold'];
      const units = (item.availableUnits as number[]) || [1, 2, 3, 4];
      return packs.includes('blue') && units.includes(bundleQuantity) && item.quantity >= bundleQuantity;
    });
    const blueTotal = blueItems.reduce((sum, item) => sum + (item.pricePerSeat * item.quantity), 0);
    const blueQty = blueItems.reduce((sum, item) => sum + item.quantity, 0);
    const blueAvg = blueQty > 0 ? blueTotal / blueQty : 500 / margin;

    // Calculate Red Pack price - includes items available in red pack
    const redItems = allItems.filter(item => {
      const packs = (item.availablePacks as string[]) || ['blue', 'red', 'gold'];
      const units = (item.availableUnits as number[]) || [1, 2, 3, 4];
      return packs.includes('red') && units.includes(bundleQuantity) && item.quantity >= bundleQuantity;
    });
    const redTotal = redItems.reduce((sum, item) => sum + (item.pricePerSeat * item.quantity), 0);
    const redQty = redItems.reduce((sum, item) => sum + item.quantity, 0);
    const redAvg = redQty > 0 ? redTotal / redQty : 1000 / margin;

    // Calculate Gold Pack price - includes items available in gold pack
    const goldItems = allItems.filter(item => {
      const packs = (item.availablePacks as string[]) || ['blue', 'red', 'gold'];
      const units = (item.availableUnits as number[]) || [1, 2, 3, 4];
      return packs.includes('gold') && units.includes(bundleQuantity) && item.quantity >= bundleQuantity;
    });
    const goldTotal = goldItems.reduce((sum, item) => sum + (item.pricePerSeat * item.quantity), 0);
    const goldQty = goldItems.reduce((sum, item) => sum + item.quantity, 0);
    const goldAvg = goldQty > 0 ? goldTotal / goldQty : 1500 / margin;

    // Apply margin and multiply by bundle quantity to get final prices
    // NOTE: Backend calculatePackSpecificPricing already multiplies by bundle size,
    // so we should match that logic here for consistency
    return {
      blue: Math.round(blueAvg * margin * bundleQuantity),
      red: Math.round(redAvg * margin * bundleQuantity),
      gold: Math.round(goldAvg * margin * bundleQuantity)
    };
  };

  // Use dynamic pricing based on tier levels
  useEffect(() => {
    if (!game) return;

    // Calculate dynamic prices based on tier levels and bundle quantity
    const prices = calculateTierPrices();
    setDynamicPrices(prices);

    // Set calculated price based on selected pack (already includes bundle quantity)
    const packPriceMap: { [key: string]: number } = prices;
    setCalculatedPrice(packPriceMap[selectedPack] || prices.blue);

  }, [game, selectedLevels, bundleQuantity, selectedPack]);

  const calculateAvailableBundles = () => {
    if (!game) return 0;

    // Calculate based on available inventory from both ticketLevels and ticketGroups
    let totalTickets = 0;

    // Count tickets from ticketLevels (grouped inventory) - filter by availableUnits
    if (game.ticketLevels) {
      const eligibleTicketLevels = game.ticketLevels.filter(level => {
        // Check if selected
        if (!selectedLevels.includes(level.level)) return false;
        // Check availableUnits compatibility
        const availableUnits = level.availableUnits as number[] || [1, 2, 3, 4];
        return availableUnits.includes(bundleQuantity);
      });
      totalTickets += eligibleTicketLevels.reduce((sum, level) => sum + level.quantity, 0);
    }

    // Count tickets from ticketGroups (individual tickets) - filter by availableUnits
    if (game.ticketGroups) {
      const eligibleTicketGroups = game.ticketGroups.filter(group => {
        // Check if available
        if (group.status !== 'AVAILABLE') return false;
        // Check availableUnits compatibility
        if (group.availableUnits) {
          const availableUnits = group.availableUnits as number[];
          return availableUnits.includes(bundleQuantity);
        }
        return true; // If no availableUnits specified, available for all
      });
      totalTickets += eligibleTicketGroups.reduce((sum, group) => sum + group.quantity, 0);
    }

    // Memorabilia removed - tickets only
    // const availableBreaks = game.cardBreaks?.filter(cb => cb.status === 'AVAILABLE').length || 0;

    // Each bundle needs tickets only
    const maxBundlesFromTickets = Math.floor(totalTickets / bundleQuantity);
    // const maxBundlesFromBreaks = Math.floor(availableBreaks / bundleQuantity);

    return maxBundlesFromTickets; // Only limited by ticket availability now
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

    setJumping(true);

    try {
      // Create Stripe checkout session
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: id,
          quantity: bundleQuantity,
          selectedLevels,
          selectedPack
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await res.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
      setJumping(false);
    }
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
          selectedLevels,
          selectedPack
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

  // Update available bundle sizes when game data changes - must be before early returns
  useEffect(() => {
    if (game) {
      // Calculate which bundle sizes are available based on selected pack
      const sizes: number[] = [];

      for (let size = 1; size <= 4; size++) {
        let hasEnoughTickets = false;

        // Check ticketGroups for this size and selected pack
        if (game.ticketGroups) {
          // Count total available tickets for this size and pack
          let totalAvailableForSize = 0;

          game.ticketGroups.forEach(group => {
            if (group.status !== 'AVAILABLE') return;

            // Check if this group is available for the selected pack
            const availablePacks = (group.availablePacks as string[]) || ['blue', 'red', 'gold'];
            if (!availablePacks.includes(selectedPack)) return;

            // Check if this group supports this bundle size
            const availableUnits = (group.availableUnits as number[]) || [1, 2, 3, 4];
            if (!availableUnits.includes(size)) return;

            // Add quantity to total
            totalAvailableForSize += group.quantity;
          });

          // Check if we have enough for at least one bundle of this size
          if (totalAvailableForSize >= size) {
            hasEnoughTickets = true;
          }
        }

        // Check ticketLevels for this size and selected pack
        if (!hasEnoughTickets && game.ticketLevels) {
          let totalAvailableForSize = 0;

          game.ticketLevels.forEach(level => {
            if (level.quantity <= 0) return;

            // Check if this level is available for the selected pack
            const availablePacks = (level.availablePacks as string[]) || ['blue', 'red', 'gold'];
            if (!availablePacks.includes(selectedPack)) return;

            // Check if this level supports this bundle size
            const availableUnits = (level.availableUnits as number[]) || [1, 2, 3, 4];
            if (!availableUnits.includes(size)) return;

            // Add quantity to total
            totalAvailableForSize += level.quantity;
          });

          // Check if we have enough for at least one bundle of this size
          if (totalAvailableForSize >= size) {
            hasEnoughTickets = true;
          }
        }

        // Add size only if we have enough tickets for this pack and size
        if (hasEnoughTickets) {
          sizes.push(size);
        }
      }

      setAvailableBundleSizes(sizes);

      // Set bundle quantity to the first available size if current is not available
      if (sizes.length > 0 && !sizes.includes(bundleQuantity)) {
        setBundleQuantity(sizes[0]);
      }
    }
  }, [game, selectedPack]); // Also recalculate when selected pack changes

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
          </div>

          {/* Level Filter Section - Hidden */}
          {false && game?.ticketLevels && (game?.ticketLevels?.length ?? 0) > 0 && (
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
                    {game?.ticketLevels?.filter(level => level.quantity > 0).map(level => (
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

          {/* Pack Selection - Moved to top */}
          {availableBundles > 0 && (
            <div className="mb-8">
              <PackSelection
                selectedPack={selectedPack}
                onPackSelect={setSelectedPack}
                dynamicPrices={{
                  blue: dynamicPrices.blue || 500,
                  red: dynamicPrices.red || 1000,
                  gold: dynamicPrices.gold || 1500
                }}
              />
            </div>
          )}


          {/* Ticket Quantity Selector and Payment - Moved here */}
          {availableBundles > 0 && !jumpResult && (
            <div className="text-center mb-8">
              <div className="bg-white/5 rounded-lg p-6 max-w-md mx-auto mb-6">
                <label className="text-white font-semibold block mb-3">
                  How many tickets do you want?
                </label>

                {/* Show available bundle sizes */}
                {availableBundleSizes.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[1, 2, 3, 4].map(size => {
                        const isAvailable = availableBundleSizes.includes(size);
                        const isSelected = bundleQuantity === size;
                        return (
                          <button
                            key={size}
                            onClick={() => isAvailable && setBundleQuantity(size)}
                            disabled={!isAvailable}
                            className={`
                              py-3 rounded-lg font-bold transition-all
                              ${isSelected
                                ? 'bg-yellow-500 text-black border-2 border-yellow-400'
                                : isAvailable
                                  ? 'bg-white/20 hover:bg-white/30 text-white border-2 border-white/20'
                                  : 'bg-white/5 text-gray-500 border-2 border-white/5 cursor-not-allowed opacity-50'
                              }
                            `}
                          >
                            {size}x
                            {!isAvailable && (
                              <div className="text-xs mt-1">N/A</div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-center">
                      <div className="text-gray-400 text-sm flex items-center gap-1 justify-center group relative">
                        <span>{bundleQuantity} ticket{bundleQuantity > 1 ? 's' : ''}</span>
                        <Info className="w-3 h-3" />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 whitespace-nowrap">
                            <p className="font-semibold mb-1">Each ticket includes:</p>
                            <p>• 1 game ticket</p>
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
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    <p>No tickets available</p>
                    <p className="text-sm mt-2">Check back later for inventory updates</p>
                  </div>
                )}

                {/* Total Price Display */}
                {availableBundleSizes.length > 0 && (
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Price per ticket:</span>
                      <span className="text-white">${Math.round((dynamicPrices[selectedPack as keyof typeof dynamicPrices] || 500) / bundleQuantity)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-semibold">Total ({bundleQuantity} {bundleQuantity === 1 ? 'ticket' : 'tickets'}):</span>
                      <span className="text-yellow-400 text-2xl font-bold">
                        ${dynamicPrices[selectedPack as keyof typeof dynamicPrices] || 500}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handlePayAndJump}
                disabled={jumping || (selectedLevels.length === 0 && availableBundles === 0)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-12 py-4 rounded-lg font-bold text-xl disabled:opacity-50 flex items-center gap-3 mx-auto"
              >
                {jumping ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-6 h-6" />
                    Checkout ${dynamicPrices[selectedPack as keyof typeof dynamicPrices] || 500}
                  </>
                )}
              </button>
              <p className="text-gray-400 text-sm mt-3">
                Secure payment via Stripe • All sales are final
              </p>
            </div>
          )}

          {/* Tier Information */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-4 mb-6 border border-purple-500/30">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-400" />
              Prize Tier System
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-2">
                  <Crown className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">VIP Items</p>
                  <p className="text-gray-400 text-xs">Premium seats $500+</p>
                  <p className="text-gray-500 text-xs mt-1">Best views, exclusive access</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-full p-2">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-300 font-semibold">Gold Level</p>
                  <p className="text-gray-400 text-xs">Great seats $200-$499</p>
                  <p className="text-gray-500 text-xs mt-1">Excellent views, prime locations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 rounded-full p-2">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-blue-400 font-semibold">Upper Deck</p>
                  <p className="text-gray-400 text-xs">Value seats under $200</p>
                  <p className="text-gray-500 text-xs mt-1">Great atmosphere, budget-friendly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prize Tiers Display */}
          <div className="mb-6">
            <PrizeTiersDisplay
              ticketLevels={game.ticketLevels}
              ticketGroups={game.ticketGroups}
              bundleQuantity={bundleQuantity}
              selectedPack={selectedPack}
            />
          </div>

          {/* Animation */}
          {showAnimation && animationResult && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
              <AllegiantStadiumAnimation
                targetSection={animationResult.bundles?.[0]?.ticket?.level || animationResult.bundles?.[0]?.ticket?.name || ''}
                targetRow={animationResult.bundles?.[0]?.ticket?.levelName || ''}
                targetSeats={[]}
                cardBreak={undefined} // Memorabilia removed - tickets only
                seatViewUrl={animationResult.bundles?.[0]?.ticket?.viewImageUrl || animationResult.bundles?.[0]?.ticket?.imageUrl}
                bundles={animationResult.bundles}
                onComplete={onAnimationComplete}
                isAnimating={showAnimation}
                stadium={game.stadium}
                venueName={game.venue}
              />
            </div>
          )}

          {/* Jump Result Display */}
          {jumpResult ? (
            <div className="text-center">
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-green-400 mb-4">🎉 Congratulations!</h3>
                  <div className="text-white space-y-3">
                    <p className="text-lg">
                      You won {jumpResult.quantity} ticket{jumpResult.quantity > 1 ? 's' : ''}!
                    </p>

                    {jumpResult.bundles && jumpResult.bundles.map((bundle: any, bundleIdx: number) => (
                      <div key={bundleIdx} className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-400 mb-2">Ticket {bundleIdx + 1}:</p>

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
                            ) : bundle.ticket.individual ? (
                              <>
                                <p className="font-semibold mb-2">🎟️ Ticket:</p>
                                <div className="flex items-start gap-3">
                                  <div className="flex gap-2">
                                    {/* Show both seat view images if available */}
                                    {bundle.ticket.seatViewUrl && (
                                      <div
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setModalImage({
                                          url: bundle.ticket.seatViewUrl,
                                          alt: `Section ${bundle.ticket.section} - View 1`
                                        })}
                                      >
                                        <SeatViewImage
                                          seatViewUrl={bundle.ticket.seatViewUrl}
                                          defaultViewUrl={game?.stadium?.defaultSeatViewUrl}
                                          section={bundle.ticket.section}
                                          row={bundle.ticket.row}
                                          alt={`Section ${bundle.ticket.section} - View 1`}
                                          width={96}
                                          height={96}
                                          className="rounded"
                                        />
                                      </div>
                                    )}
                                    {bundle.ticket.seatViewUrl2 && (
                                      <div
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setModalImage({
                                          url: bundle.ticket.seatViewUrl2,
                                          alt: `Section ${bundle.ticket.section} - View 2`
                                        })}
                                      >
                                        <SeatViewImage
                                          seatViewUrl={bundle.ticket.seatViewUrl2}
                                          defaultViewUrl={null}
                                          section={bundle.ticket.section}
                                          row={bundle.ticket.row}
                                          alt={`Section ${bundle.ticket.section} - View 2`}
                                          width={96}
                                          height={96}
                                          className="rounded"
                                        />
                                      </div>
                                    )}
                                    {!bundle.ticket.seatViewUrl && (
                                      <div
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                          const imageUrl = game?.stadium?.defaultSeatViewUrl;
                                          if (imageUrl) {
                                            setModalImage({ url: imageUrl, alt: `Section ${bundle.ticket.section} view` });
                                          }
                                        }}
                                      >
                                        <SeatViewImage
                                          seatViewUrl={null}
                                          defaultViewUrl={game?.stadium?.defaultSeatViewUrl}
                                          section={bundle.ticket.section}
                                          row={bundle.ticket.row}
                                          alt={`Section ${bundle.ticket.section} view`}
                                          width={96}
                                          height={96}
                                          className="rounded"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-lg font-medium">Section {bundle.ticket.section}</p>
                                    <p className="text-sm text-gray-300">Row {bundle.ticket.row}</p>
                                    {bundle.ticket.notes && (
                                      <p className="text-xs text-gray-400 mt-1">{bundle.ticket.notes}</p>
                                    )}
                                    <p className="text-sm text-yellow-400 mt-1">Value: ${bundle.ticket.value}</p>
                                    <p className="text-xs text-gray-400 mt-1 italic">
                                      * Or comparable seats if these have been taken
                                    </p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold mb-2">🎟️ Ticket:</p>
                                <div className="flex items-start gap-3">
                                  <div
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      const imageUrl = bundle.ticket.viewImageUrl || game?.stadium?.defaultSeatViewUrl;
                                      if (imageUrl) {
                                        setModalImage({ url: imageUrl, alt: `${bundle.ticket.levelName || bundle.ticket.level} view` });
                                      }
                                    }}
                                  >
                                    <SeatViewImage
                                      seatViewUrl={bundle.ticket.viewImageUrl}
                                      defaultViewUrl={game?.stadium?.defaultSeatViewUrl}
                                      section={bundle.ticket.level}
                                      row={`Level ${bundle.ticket.level}`}
                                      alt={`${bundle.ticket.levelName || bundle.ticket.level} view`}
                                      width={96}
                                      height={96}
                                      className="rounded"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-lg font-medium">{bundle.ticket.levelName || `Level ${bundle.ticket.level}`}</p>
                                    {bundle.ticket.level && (
                                      <p className="text-sm text-gray-300">Level {bundle.ticket.level}</p>
                                    )}
                                    {bundle.ticket.sections && bundle.ticket.sections.length > 0 && (
                                      <p className="text-xs text-gray-400 mt-1">Sections: {bundle.ticket.sections.join(', ')}</p>
                                    )}
                                    <p className="text-sm text-yellow-400 mt-1">Value: ${bundle.ticket.value}</p>
                                    <p className="text-xs text-gray-400 mt-1 italic">
                                      * Or comparable seats if these have been taken
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    ))}

                  </div>

                  {/* Email notification message */}
                  <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <p className="text-blue-300">
                      📧 <span className="font-semibold">Check your email!</span> You will receive detailed instructions to receive your tickets shortly.
                    </p>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Jump Again
                  </button>
                </div>
            </div>
          ) : availableBundles === 0 ? (
            <div className="text-center bg-red-500/20 border border-red-500 rounded-lg p-6">
              <p className="text-red-300 text-xl font-semibold">No tickets available</p>
              <p className="text-gray-300 mt-2">Check back later for inventory updates.</p>
            </div>
          ) : null}
        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-6">Shipping Information</h3>
              <p className="text-gray-400 mb-6">
                Please provide your shipping address for ticket delivery
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
                  You need to be signed in to jump for tickets. Create an account or sign in to continue.
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

        {/* Official Rules Disclaimer */}
        <div className="mt-8 text-center pb-8">
          <p className="text-xs text-gray-400">
            No Purchase Necessary.{' '}
            <Link href="/officialrules" className="text-gray-300 hover:text-white underline">
              See details here
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}