'use client';

import { useState, useEffect } from 'react';
import { Crown, Star, Ticket, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TierLevel } from '@prisma/client';
import { classifyTicketTier, getTierDisplay } from '@/lib/utils/ticket-classifier';

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
  availablePacks?: string[];
  tierLevel?: TierLevel | null;
  tierPriority?: number | null;
}

interface TicketGroup {
  id: string;
  section: string;
  row: string;
  seatViewUrl?: string;
  seatViewUrl2?: string;
  seatViewUrl3?: string;
  primaryImageIndex?: number;
  quantity: number;
  pricePerSeat: number;
  status: string;
  availableUnits?: number[];
  availablePacks?: string[];
  tierLevel?: TierLevel | null;
  tierPriority?: number | null;
  notes?: string;
}

interface PrizeCard {
  id: string;
  title: string;
  subtitle?: string;
  value: number;
  quantity: number;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  primaryImageIndex?: number;
  tier: TierLevel;
  type: 'ticket' | 'special';
}

interface PrizeTiersDisplayProps {
  ticketLevels?: TicketLevel[];
  ticketGroups?: TicketGroup[];
  bundleQuantity: number;
  selectedPack?: string;
}

export default function PrizeTiersDisplay({
  ticketLevels = [],
  ticketGroups = [],
  bundleQuantity,
  selectedPack = 'blue'
}: PrizeTiersDisplayProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [organizedPrizes, setOrganizedPrizes] = useState<{
    vip: PrizeCard[];
    gold: PrizeCard[];
    upper: PrizeCard[];
  }>({ vip: [], gold: [], upper: [] });
  const [modalImage, setModalImage] = useState<{
    images: string[];
    currentIndex: number;
    title: string
  } | null>(null);
  const [hitRates, setHitRates] = useState<{
    vip: number;
    gold: number;
    upper: number;
  }>({ vip: 0, gold: 0, upper: 0 });

  useEffect(() => {
    // Organize all prizes by tier
    const prizes: PrizeCard[] = [];

    // Process ticket levels
    ticketLevels
      .filter(level => {
        // Check if item is available for selected pack
        const availablePacks = level.availablePacks as string[] | undefined;
        const isAvailableForPack = !availablePacks || availablePacks.includes(selectedPack);

        // Filter out VIP backup items (tierPriority > 1)
        const isVipBackup = level.tierLevel === TierLevel.VIP_ITEM && level.tierPriority && level.tierPriority > 1;

        return level.quantity > 0 && isAvailableForPack && !isVipBackup;
      })
      .forEach(level => {
        const tier = level.tierLevel || classifyTicketTier(level.pricePerSeat).tierLevel;
        prizes.push({
          id: `level-${level.id}`,
          title: level.levelName,
          subtitle: `Level ${level.level}`,
          value: level.pricePerSeat,
          quantity: level.quantity,
          imageUrl: level.viewImageUrl,
          tier,
          type: 'ticket'
        });
      });

    // Special prizes removed from system

    // Process individual ticket groups
    ticketGroups
      .filter(group => {
        // Check if item is available for selected pack
        const availablePacks = group.availablePacks as string[] | undefined;
        const isAvailableForPack = !availablePacks || availablePacks.includes(selectedPack);

        // Filter out VIP backup items (tierPriority > 1)
        const isVipBackup = group.tierLevel === TierLevel.VIP_ITEM && group.tierPriority && group.tierPriority > 1;

        return group.status === 'AVAILABLE' && group.quantity > 0 && isAvailableForPack && !isVipBackup;
      })
      .forEach(group => {
        const tier = group.tierLevel || classifyTicketTier(group.pricePerSeat).tierLevel;

        // Get images based on primaryImageIndex
        const primaryIdx = (group.primaryImageIndex || 1) - 1;
        const allImages = [group.seatViewUrl, group.seatViewUrl2, group.seatViewUrl3];

        // Select primary image based on index
        let primaryImage = allImages[primaryIdx];

        // If primary image doesn't exist, fall back to first available image
        if (!primaryImage) {
          primaryImage = allImages.find(img => img) || undefined;
        }

        // Get secondary images in their original order, excluding the primary
        let secondaryImages: (string | undefined)[] = [];
        allImages.forEach((img, idx) => {
          if (idx !== primaryIdx && img) {
            secondaryImages.push(img);
          }
        });

        // Debug logging for primary image selection
        if (group.primaryImageIndex && group.primaryImageIndex !== 1) {
          console.log(`[PrizeTiers] Section ${group.section} Row ${group.row}: primaryIndex=${group.primaryImageIndex}, primaryImage=${primaryImage ? 'exists' : 'missing'}`);
        }

        prizes.push({
          id: `ticket-${group.id}`,
          title: `Section ${group.section}`,
          subtitle: `Row ${group.row}`,
          value: group.pricePerSeat,
          quantity: group.quantity,
          imageUrl: primaryImage,
          imageUrl2: secondaryImages[0],
          imageUrl3: secondaryImages[1],
          primaryImageIndex: group.primaryImageIndex,
          tier,
          type: 'ticket'
        });
      });

    // Sort prizes by value within each tier
    const sorted = {
      vip: prizes.filter(p => p.tier === TierLevel.VIP_ITEM).sort((a, b) => b.value - a.value),
      gold: prizes.filter(p => p.tier === TierLevel.GOLD_LEVEL).sort((a, b) => b.value - a.value),
      upper: prizes.filter(p => p.tier === TierLevel.UPPER_DECK).sort((a, b) => b.value - a.value)
    };

    setOrganizedPrizes(sorted);

    // Calculate hit rates based on total quantity (like Arena Club)
    const totalQuantity = prizes.reduce((sum, p) => sum + p.quantity, 0);
    if (totalQuantity > 0) {
      const vipQuantity = sorted.vip.reduce((sum, p) => sum + p.quantity, 0);
      const goldQuantity = sorted.gold.reduce((sum, p) => sum + p.quantity, 0);
      const upperQuantity = sorted.upper.reduce((sum, p) => sum + p.quantity, 0);

      setHitRates({
        vip: (vipQuantity / totalQuantity) * 100,
        gold: (goldQuantity / totalQuantity) * 100,
        upper: (upperQuantity / totalQuantity) * 100
      });
    }
  }, [ticketLevels, ticketGroups, selectedPack]);

  const handleImageClick = (card: PrizeCard) => {
    const images: string[] = [];
    if (card.imageUrl) images.push(card.imageUrl);
    if (card.imageUrl2) images.push(card.imageUrl2);
    if (card.imageUrl3) images.push(card.imageUrl3);

    if (images.length > 0) {
      setModalImage({
        images,
        currentIndex: 0,
        title: card.title
      });
    }
  };

  const nextImage = () => {
    if (modalImage && modalImage.images.length > 1) {
      setModalImage({
        ...modalImage,
        currentIndex: (modalImage.currentIndex + 1) % modalImage.images.length
      });
    }
  };

  const prevImage = () => {
    if (modalImage && modalImage.images.length > 1) {
      setModalImage({
        ...modalImage,
        currentIndex: modalImage.currentIndex === 0 ? modalImage.images.length - 1 : modalImage.currentIndex - 1
      });
    }
  };

  const renderPrizeCard = (card: PrizeCard, size: 'large' | 'medium' | 'small', showValue: boolean = true) => {
    const isHovered = hoveredCard === card.id;
    const hasMultipleImages = !!(card.imageUrl && (card.imageUrl2 || card.imageUrl3));
    // On hover, show the second image if available
    const currentImage = (isHovered && (card.imageUrl2 || card.imageUrl3)) ?
      (card.imageUrl2 || card.imageUrl3) : card.imageUrl;

    // Calculate the actual view number being displayed
    const getActualViewNumber = () => {
      const primaryIdx = card.primaryImageIndex || 1;

      if (!isHovered) {
        // When not hovered, we show the primary image
        return primaryIdx;
      } else {
        // When hovered, we show the first non-primary image
        // Since imageUrl2 and imageUrl3 are already reordered (non-primary images),
        // we need to figure out which original position they came from
        if (card.imageUrl2) {
          // If primary was 1, imageUrl2 is original position 2
          // If primary was 2, imageUrl2 is original position 1
          // If primary was 3, imageUrl2 is original position 1
          if (primaryIdx === 1) return 2;
          else if (primaryIdx === 2) return 1;
          else return 1;
        } else if (card.imageUrl3) {
          // Only shown if imageUrl2 doesn't exist
          // This would be original position 3
          return 3;
        }
        return primaryIdx; // Fallback
      }
    };

    const currentViewNum = getActualViewNumber();

    const sizeClasses = {
      large: 'h-64',
      medium: 'h-52',
      small: 'h-44'
    };

    const gridClasses = {
      large: 'lg:col-span-1',
      medium: 'lg:col-span-1',
      small: 'lg:col-span-1'
    };

    return (
      <div
        key={card.id}
        className={`relative group ${gridClasses[size]}`}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className={`bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 ${sizeClasses[size]}`}>
          {/* Image Section */}
          <div
            className="relative h-3/4 bg-gradient-to-b from-gray-800 to-gray-900 cursor-pointer overflow-hidden"
            onClick={() => handleImageClick(card)}
          >
            {currentImage ? (
              <div className="relative w-full h-full">
                <img
                  src={currentImage}
                  alt={card.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                {/* View indicator */}
                {hasMultipleImages && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    View {currentViewNum}
                    {!isHovered && card.primaryImageIndex && card.primaryImageIndex !== 1 && (
                      <span className="text-yellow-400 ml-1">(Primary)</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <span className="text-gray-500 text-sm">No Image</span>
                </div>
              </div>
            )}
            {/* Hover overlay */}
            {isHovered && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                <div className="text-white">
                  <p className="text-sm font-bold">{card.quantity} available</p>
                  {hasMultipleImages && (
                    <p className="text-xs opacity-75">Click to view both images</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="p-3 bg-black">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white font-semibold text-sm truncate">{card.title}</p>
                {card.subtitle && (
                  <p className="text-gray-400 text-xs truncate">{card.subtitle}</p>
                )}
              </div>
              {showValue && (
                <div className="text-right">
                  <p className="text-green-400 font-bold text-sm">${card.value}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTierSection = (
    title: string,
    icon: React.ReactNode,
    cards: PrizeCard[],
    size: 'large' | 'medium' | 'small',
    gradientFrom: string,
    gradientTo: string,
    iconBg: string,
    hitRate: number,
    showValues: boolean = true
  ) => {
    if (cards.length === 0) return null;

    return (
      <div className="mb-12">
        {/* Tier Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`${iconBg} rounded-full p-2`}>
              {icon}
            </div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Hit Rate per Ticket</p>
              <p className="text-2xl font-bold text-white">{hitRate.toFixed(1)}%</p>
            </div>
            <div className="h-12 w-px bg-gray-700"></div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Available</p>
              <p className="text-2xl font-bold text-white">{cards.reduce((sum, c) => sum + c.quantity, 0)}</p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map(card => renderPrizeCard(card, size, showValues))}
        </div>
      </div>
    );
  };

  const totalPrizes = organizedPrizes.vip.length + organizedPrizes.gold.length + organizedPrizes.upper.length;

  if (totalPrizes === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No prizes available for this jump</p>
      </div>
    );
  }

  // Get pack name for display
  const getPackName = () => {
    switch(selectedPack) {
      case 'red': return 'Red Pack';
      case 'gold': return 'Gold Pack';
      default: return 'Blue Pack';
    }
  };

  const getPackDescription = () => {
    switch(selectedPack) {
      case 'red': return 'No upper deck seats - 300 level and below only';
      case 'gold': return 'Front row seats in any section';
      default: return 'All seats available - from nosebleeds to courtside';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Available Prizes</h2>
        <p className="text-gray-400 mb-2">Win amazing seats and exclusive items in this jump!</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Showing prizes for:</span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-yellow-400 font-semibold">
            {getPackName()}
          </span>
          <span className="text-gray-400 italic">- {getPackDescription()}</span>
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={modalImage.images[modalImage.currentIndex]}
              alt={`${modalImage.title} - View ${modalImage.currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close button */}
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation buttons if multiple images */}
            {modalImage.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {modalImage.currentIndex + 1} / {modalImage.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* VIP Items */}
      {renderTierSection(
        'VIP ITEMS',
        <Crown className="w-5 h-5 text-black" />,
        organizedPrizes.vip,
        'large',
        'yellow-400',
        'yellow-600',
        'bg-gradient-to-r from-yellow-400 to-yellow-600',
        hitRates.vip,
        true // Show values for VIP
      )}

      {/* Gold Level */}
      {renderTierSection(
        'GOLD LEVEL',
        <Star className="w-5 h-5 text-white" />,
        organizedPrizes.gold,
        'medium',
        'gray-300',
        'gray-400',
        'bg-gradient-to-r from-gray-300 to-gray-400',
        hitRates.gold,
        true // Show values for Gold
      )}

      {/* Upper Deck */}
      {renderTierSection(
        'UPPER DECK',
        <Ticket className="w-5 h-5 text-white" />,
        organizedPrizes.upper,
        'small',
        'blue-500',
        'blue-600',
        'bg-blue-600',
        hitRates.upper,
        false // Hide values for Upper Deck
      )}

    </div>
  );
}