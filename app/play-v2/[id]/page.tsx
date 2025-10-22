'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Dice1, Check, X, Loader2, Eye, ArrowRight, Map } from 'lucide-react';
import SeatPoolSelector from '@/components/seat-pool-selector';
import VenueMapSelector from '@/components/seatics/VenueMapSelector';
import SeaticsScriptLoader from '@/components/seatics/SeaticsScriptLoader';
import SeatViewModal from '@/components/seatics/SeatViewModal';
import type { CalculateJumpResponse } from '@/app/api/events/[id]/calculate-jump/route';
import type { VenueMapResponse } from '@/app/api/events/[id]/venue-map/route';

interface SectionSelection {
  section: string;
  selected: boolean;
  optionCount: number;
}

export default function EventJumpPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<CalculateJumpResponse | null>(null);
  const [selectedSections, setSelectedSections] = useState<Map<string, boolean>>(new Map());
  const [selectedQuantity, setSelectedQuantity] = useState(2);
  const [calculating, setCalculating] = useState(false);
  const [jumpPrices, setJumpPrices] = useState<CalculateJumpResponse['jumpPrices']>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdminPricing, setShowAdminPricing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'quantity' | 'seats'>('quantity');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [venueMapData, setVenueMapData] = useState<VenueMapResponse | null>(null);
  const [mapView, setMapView] = useState<'map' | 'list'>('map');
  const [seaticsLoaded, setSeaticsLoaded] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalSection, setViewModalSection] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = session?.user?.email === 'julianparmann@gmail.com' ||
                  session?.user?.email === 'admin@seatjumper.com';

  // Load initial event data
  useEffect(() => {
    loadEventData();
    loadVenueMapData();
  }, [eventId]);

  // Recalculate when selection changes
  useEffect(() => {
    if (eventData && selectedSections.size > 0) {
      const hasSelection = Array.from(selectedSections.values()).some(v => v);
      if (hasSelection) {
        recalculateJumpPrices();
      }
    }
  }, [selectedSections, selectedQuantity]);

  async function loadEventData() {
    try {
      setLoading(true);
      const url = isAdmin
        ? `/api/events/${eventId}/calculate-jump?admin=true`
        : `/api/events/${eventId}/calculate-jump`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load event');
      }

      setEventData(data);
      setJumpPrices(data.jumpPrices);

      // Initialize all sections as selected
      const initialSelection = new Map<string, boolean>();
      data.sections.forEach((section: any) => {
        initialSelection.set(section.section, true);
      });
      setSelectedSections(initialSelection);

      // Set default quantity based on what's available
      if (data.jumpPrices.length > 0) {
        const hasTwo = data.jumpPrices.find((p: any) => p.quantity === 2);
        setSelectedQuantity(hasTwo ? 2 : data.jumpPrices[0].quantity);
      }
    } catch (err) {
      console.error('Error loading event:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }

  async function loadVenueMapData() {
    try {
      console.log(`[VenueMap] Loading map data for event ${eventId}`);
      const response = await fetch(`/api/events/${eventId}/venue-map`);
      const data = await response.json();

      if (response.ok && data) {
        setVenueMapData(data);
        console.log('[VenueMap] Map data loaded:', data);
      } else {
        console.warn('[VenueMap] No map data available');
      }
    } catch (err) {
      console.error('[VenueMap] Error loading map data:', err);
      // Don't set error - map is optional enhancement
    }
  }

  async function recalculateJumpPrices() {
    try {
      setCalculating(true);

      // Get excluded sections (those that are unchecked)
      const excludedSections = Array.from(selectedSections.entries())
        .filter(([_, selected]) => !selected)
        .map(([section, _]) => section);

      const url = isAdmin
        ? `/api/events/${eventId}/calculate-jump?admin=true`
        : `/api/events/${eventId}/calculate-jump`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludedSections })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate prices');
      }

      // Update both jump prices and sections
      setJumpPrices(data.jumpPrices);
      setEventData(prevData => prevData ? {
        ...prevData,
        jumpPrices: data.jumpPrices,
        poolSize: data.poolSize
      } : null);
    } catch (err) {
      console.error('Error calculating prices:', err);
    } finally {
      setCalculating(false);
    }
  }

  function toggleSection(section: string) {
    const newSelection = new Map(selectedSections);
    newSelection.set(section, !newSelection.get(section));
    setSelectedSections(newSelection);
  }

  function selectAllSections() {
    const newSelection = new Map<string, boolean>();
    eventData?.sections.forEach(section => {
      newSelection.set(section.section, true);
    });
    setSelectedSections(newSelection);
  }

  function deselectAllSections() {
    const newSelection = new Map<string, boolean>();
    eventData?.sections.forEach(section => {
      newSelection.set(section.section, false);
    });
    setSelectedSections(newSelection);
  }

  async function handleJumpClick() {
    try {
      setCalculating(true);

      // Get excluded sections (those that are unchecked)
      const excludedSections = Array.from(selectedSections.entries())
        .filter(([_, selected]) => !selected)
        .map(([section, _]) => section);

      // Create checkout session with selected seats if we're on the seats step
      const checkoutData: any = {
        quantity: selectedQuantity,
        excludedSections
      };

      if (currentStep === 'seats' && selectedSeats.length > 0) {
        checkoutData.selectedTicketIds = selectedSeats;
      }

      const response = await fetch(`/api/events/${eventId}/jump/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Error initiating jump:', error);
      setError(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setCalculating(false);
    }
  }

  function handleQuantitySelect() {
    // Move to seat selection step
    setCurrentStep('seats');
  }

  function handleSeatSelectionContinue(seats: string[]) {
    setSelectedSeats(seats);
    // Proceed to checkout with selected seats
    handleJumpClick();
  }

  function handleBackToQuantity() {
    setCurrentStep('quantity');
    setSelectedSeats([]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Event not found'}</p>
          <button
            onClick={() => router.push('/events')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = Array.from(selectedSections.values()).filter(v => v).length;
  const currentJumpPrice = jumpPrices.find(p => p.quantity === selectedQuantity);
  const availableQuantities = jumpPrices.map(p => p.quantity);

  // If we're on the seats step, show the seat selector
  if (currentStep === 'seats') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <SeatPoolSelector
            eventId={eventId}
            quantity={selectedQuantity}
            onContinue={handleSeatSelectionContinue}
            onBack={handleBackToQuantity}
          />
        </div>
      </div>
    );
  }

  // Otherwise show the quantity selection step
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Load Seatics Scripts */}
      <SeaticsScriptLoader onLoad={() => setSeaticsLoaded(true)} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{eventData.eventName}</h1>
          <p className="text-gray-400">
            {eventData.eventDate} • {eventData.venue}
          </p>
        </div>

        {/* View Toggle Buttons */}
        {venueMapData?.mapData?.hasMap && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMapView('map')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                mapView === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Map className="w-4 h-4" />
              Venue Map
            </button>
            <button
              onClick={() => setMapView('list')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                mapView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Dice1 className="w-4 h-4" />
              Section List
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Section Selector - Map or List View */}
          <div className="lg:col-span-2">
            {venueMapData?.mapData?.hasMap && mapView === 'map' && seaticsLoaded ? (
              /* Venue Map View */
              <VenueMapSelector
                eventId={eventId}
                venueData={venueMapData}
                selectedSections={new Set(
                  Array.from(selectedSections.entries())
                    .filter(([_, selected]) => selected)
                    .map(([section, _]) => section)
                )}
                onSectionToggle={toggleSection}
                onSelectAll={selectAllSections}
                onClearAll={deselectAllSections}
                jumpPrice={currentJumpPrice?.jumpPrice}
                poolSize={currentJumpPrice?.poolSize}
              />
            ) : (
              /* List View */
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Customize Your Seat Pool</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllSections}
                      className="text-sm px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllSections}
                      className="text-sm px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {eventData.sections.map(section => (
                  <div
                    key={section.section}
                    onClick={() => toggleSection(section.section)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg cursor-pointer
                      transition-all duration-200
                      ${selectedSections.get(section.section)
                        ? 'bg-blue-500/20 border border-blue-500/50'
                        : 'bg-gray-800/50 border border-gray-700 opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded flex items-center justify-center
                        ${selectedSections.get(section.section)
                          ? 'bg-blue-500'
                          : 'bg-gray-700 border border-gray-600'
                        }
                      `}>
                        {selectedSections.get(section.section) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{section.displayName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* View from Seat button */}
                      {(() => {
                        const sectionData = venueMapData?.inventory?.sections?.find(
                          s => s.name === section.section
                        );
                        return sectionData?.viewFromSeatUrl ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewModalSection(section.section);
                              setViewModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                            title="View from Seat"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                        ) : null;
                      })()}
                      {/* Admin pricing display */}
                      {isAdmin && section.priceRange && (
                        <span className="text-yellow-400 text-sm font-mono">
                          ${section.priceRange.min === section.priceRange.max
                            ? section.priceRange.min
                            : `${section.priceRange.min}-${section.priceRange.max}`
                          }/ticket
                        </span>
                      )}
                      <span className="text-sm text-gray-400">
                        {section.optionCount} option{section.optionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

                {eventData.sections.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No inventory available for this event
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Jump Price Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-6 sticky top-8">
              <h3 className="text-xl font-semibold mb-4">Your Jump Price</h3>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">
                  Quantity Needed
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableQuantities.map(qty => (
                    <button
                      key={qty}
                      onClick={() => setSelectedQuantity(qty)}
                      className={`
                        px-4 py-2 rounded-lg transition-all
                        ${selectedQuantity === qty
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }
                      `}
                    >
                      {qty} {qty === 1 ? 'Seat' : 'Seats'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Display */}
              {currentJumpPrice && selectedCount > 0 ? (
                <div className="mb-6">
                  <div className="text-center py-4 bg-gray-800 rounded-lg">
                    <p className="text-3xl font-bold text-blue-400">
                      ${currentJumpPrice.jumpPrice}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      for {selectedQuantity} seat{selectedQuantity !== 1 ? 's' : ''}
                    </p>
                  </div>

                </div>
              ) : (
                <div className="mb-6">
                  <div className="text-center py-4 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">
                      {selectedCount === 0
                        ? 'Select sections to see price'
                        : 'Calculating...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Continue Button (goes to seat selection) */}
              <button
                onClick={handleQuantitySelect}
                disabled={!currentJumpPrice || selectedCount === 0 || calculating}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${currentJumpPrice && selectedCount > 0
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <ArrowRight className="h-5 w-5" />
                Continue to Seat Selection
              </button>

              {/* Pool Info */}
              {currentJumpPrice && (
                <p className="text-sm text-gray-400 text-center mt-3">
                  Your pool includes {currentJumpPrice.poolSize} seat option
                  {currentJumpPrice.poolSize !== 1 ? 's' : ''}
                </p>
              )}

              {/* Admin Pricing Panel */}
              {isAdmin && currentJumpPrice && (
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-yellow-500/30">
                  <button
                    onClick={() => setShowAdminPricing(!showAdminPricing)}
                    className="flex items-center gap-2 text-yellow-400 text-sm font-semibold w-full"
                  >
                    <Eye className="h-4 w-4" />
                    Admin Pricing Details
                  </button>

                  {showAdminPricing && currentJumpPrice && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-sm space-y-2">
                      <div className="flex justify-between text-gray-300">
                        <span>Wholesale Avg:</span>
                        <span className="font-mono">
                          ${currentJumpPrice.wholesalePrice ? currentJumpPrice.wholesalePrice.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Margin (30%):</span>
                        <span className="font-mono">
                          ${currentJumpPrice.marginAmount ? currentJumpPrice.marginAmount.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-yellow-400 font-semibold pt-2 border-t border-gray-700">
                        <span>Jump Price:</span>
                        <span className="font-mono">${currentJumpPrice.jumpPrice}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Pool: {currentJumpPrice.poolSize} options | Qty: {selectedQuantity}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seat View Modal */}
      {viewModalSection && (
        <SeatViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewModalSection(null);
          }}
          sectionName={viewModalSection}
          vfsUrl={
            venueMapData?.inventory?.sections?.find(s => s.name === viewModalSection)?.viewFromSeatUrl
          }
          sectionData={(() => {
            const section = venueMapData?.inventory?.sections?.find(s => s.name === viewModalSection);
            return section
              ? {
                  displayName: section.displayName,
                  priceRange: section.priceRange,
                  ticketCount: section.ticketCount,
                  priceCategory: section.priceCategory,
                }
              : undefined;
          })()}
        />
      )}
    </div>
  );
}