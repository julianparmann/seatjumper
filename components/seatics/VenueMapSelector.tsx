'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, MapPin, Info, Eye, Check, X } from 'lucide-react';
import { seaticsConfig, getSeaticsFrameworkUrl } from '@/lib/config/seatics';
import SeatViewModal from './SeatViewModal';
import type { VenueMapResponse } from '@/app/api/events/[id]/venue-map/route';

interface VenueMapSelectorProps {
  eventId: string;
  venueData: VenueMapResponse;
  selectedSections: Set<string>;
  onSectionToggle: (section: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  jumpPrice?: number;
  poolSize?: number;
  className?: string;
}

// Declare Seatics global
declare global {
  interface Window {
    Seatics: any;
    jQuery: any;
    $: any;
  }
}

export default function VenueMapSelector({
  eventId,
  venueData,
  selectedSections,
  onSectionToggle,
  onSelectAll,
  onClearAll,
  jumpPrice = 0,
  poolSize = 0,
  className = '',
}: VenueMapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalSection, setViewModalSection] = useState<string | null>(null);

  // Initialize Seatics map when component mounts
  useEffect(() => {
    if (!venueData.mapData.hasMap) {
      setMapLoading(false);
      setMapError('No interactive map available for this venue');
      return;
    }

    initializeMap();

    // Cleanup on unmount
    return () => {
      if (window.Seatics?.MapComponent) {
        try {
          window.Seatics.MapComponent.destroy?.();
        } catch (e) {
          console.error('[VenueMap] Cleanup error:', e);
        }
      }
    };
  }, [venueData]);

  // Update map when selections change
  useEffect(() => {
    if (mapInitialized && window.Seatics?.MapComponent) {
      updateMapSelections();
    }
  }, [selectedSections, mapInitialized]);

  const initializeMap = async () => {
    try {
      setMapLoading(true);
      setMapError(null);

      // Check if jQuery is loaded
      if (typeof window.jQuery === 'undefined') {
        console.warn('[VenueMap] jQuery not loaded, map features may be limited');
      }

      // Check if Seatics is loaded
      if (typeof window.Seatics === 'undefined') {
        console.warn('[VenueMap] Seatics framework not loaded, using fallback display');
        setMapError('Map framework not loaded');
        setMapLoading(false);
        return;
      }

      // Configure Seatics
      window.Seatics.config = {
        ...window.Seatics.config,
        levelColors: seaticsConfig.visual.levelColors,
        selectionScheme: seaticsConfig.interaction.selectionScheme,
        selectionColor: seaticsConfig.visual.selectionColor,
        hoverEnabled: true,
        largeScreenFormat: true,
        mouseWheelZoomEnabled: true,
        showZoomControls: true,
        enableLegend: true,
        noZones: true, // Don't use zone maps
      };

      // Format ticket data for Seatics
      const formattedTickets = formatInventoryForSeatics();

      // Create the map component
      if (mapContainerRef.current) {
        window.Seatics.MapComponent.create({
          imgSrc: venueData.mapData.mapImage || '',
          tickets: formattedTickets,
          mapData: venueData.mapData.seaticsData,
          vfsUrl: 'https://vfs.seatics.com',
          container: mapContainerRef.current,
          presentationInterface: {
            updateTicketsList: handleMapUpdate,
            onSectionClick: handleSectionClick,
            onSectionHover: handleSectionHover,
          },
          mapWidth: mapContainerRef.current.offsetWidth || 600,
          mapHeight: 600,
          mapName: venueData.venue,
          enableSectionInfoPopups: true,
        });

        setMapInitialized(true);
      }

      setMapLoading(false);
    } catch (error) {
      console.error('[VenueMap] Initialization error:', error);
      setMapError('Failed to initialize venue map');
      setMapLoading(false);
    }
  };

  const formatInventoryForSeatics = () => {
    const formattedTickets: any[] = [];

    venueData.inventory.sections.forEach(section => {
      // Get sample tickets or create a representative ticket group
      if (section.sampleTickets && section.sampleTickets.length > 0) {
        section.sampleTickets.forEach((ticket: any) => {
          formattedTickets.push({
            tgUserSec: section.name,
            tgUserRow: ticket.row || '',
            tgUserSeats: ticket.seats || '',
            tgQty: ticket.quantity,
            tgPrice: ticket.price,
            tgID: ticket.id,
            tgType: 1,
            tgColor: section.color,
            tgSelected: selectedSections.has(section.name),
          });
        });
      } else {
        // Create a summary ticket group for the section
        formattedTickets.push({
          tgUserSec: section.name,
          tgUserRow: 'Various',
          tgQty: section.ticketCount,
          tgPrice: section.priceRange.min,
          tgID: `section-${section.name}`,
          tgType: 1,
          tgColor: section.color,
          tgSelected: selectedSections.has(section.name),
        });
      }
    });

    return formattedTickets;
  };

  const updateMapSelections = () => {
    // Update visual state of sections on the map
    if (!window.Seatics?.MapComponent) return;

    venueData.inventory.sections.forEach(section => {
      const isSelected = selectedSections.has(section.name);
      // Call Seatics API to update section visual state
      try {
        if (isSelected) {
          window.Seatics.MapComponent.selectSection?.(section.name);
        } else {
          window.Seatics.MapComponent.deselectSection?.(section.name);
        }
      } catch (e) {
        console.warn('[VenueMap] Error updating section:', e);
      }
    });
  };

  const handleMapUpdate = useCallback((ticketDataSegmented: any) => {
    // This is called by Seatics when the map state changes
    console.log('[VenueMap] Map update:', ticketDataSegmented);
  }, []);

  const handleSectionClick = useCallback((section: any) => {
    console.log('[VenueMap] Section clicked:', section);
    const sectionName = typeof section === 'string' ? section : section.name || section.id;
    onSectionToggle(sectionName);
  }, [onSectionToggle]);

  const handleSectionHover = useCallback((section: any) => {
    const sectionName = typeof section === 'string' ? section : section?.name || null;
    setHoveredSection(sectionName);
  }, []);

  // Find section data for hovered section
  const hoveredSectionData = hoveredSection
    ? venueData.inventory.sections.find(s => s.name === hoveredSection)
    : null;

  if (!venueData.mapData.hasMap) {
    return (
      <div className={`bg-gray-900 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Interactive map not available for this venue</p>
        <p className="text-sm text-gray-500 mt-2">Use the section list below to select your seats</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Map Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {venueData.venue}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Select All
            </button>
            <button
              onClick={onClearAll}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Click sections to include/exclude from your jump pool
          </span>
          <span className="text-blue-400">
            {selectedSections.size} of {venueData.inventory.sections.length} sections selected
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gray-950">
        {mapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-400">Loading venue map...</p>
            </div>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
            <div className="text-center">
              <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-400">{mapError}</p>
            </div>
          </div>
        )}

        {/* Seatics Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full"
          style={{ minHeight: '600px' }}
          id={`seatics-map-${eventId}`}
        />

        {/* Hover Tooltip */}
        {hoveredSectionData && (
          <div className="absolute top-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-20 max-w-xs">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-white">
                {hoveredSectionData.displayName}
              </h4>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedSections.has(hoveredSectionData.name)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {selectedSections.has(hoveredSectionData.name) ? 'Selected' : 'Not Selected'}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Available:</span>
                <span className="text-white">{hoveredSectionData.ticketCount} tickets</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price Range:</span>
                <span className="text-white">
                  ${hoveredSectionData.priceRange.min} - ${hoveredSectionData.priceRange.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ backgroundColor: hoveredSectionData.color + '33', color: hoveredSectionData.color }}
                >
                  {hoveredSectionData.priceCategory}
                </span>
              </div>
            </div>
            {hoveredSectionData.viewFromSeatUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewModalSection(hoveredSectionData.name);
                  setViewModalOpen(true);
                }}
                className="mt-2 text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300"
              >
                <Eye className="w-3 h-3" />
                View from Seat
              </button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-10">
          <h4 className="text-sm font-semibold text-white mb-2">Price Categories</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: seaticsConfig.visual.priceColors.budget }} />
              <span className="text-xs text-gray-400">Budget</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: seaticsConfig.visual.priceColors.standard }} />
              <span className="text-xs text-gray-400">Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: seaticsConfig.visual.priceColors.premium }} />
              <span className="text-xs text-gray-400">Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: seaticsConfig.visual.priceColors.vip }} />
              <span className="text-xs text-gray-400">VIP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pool Stats Footer */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <Info className="w-4 h-4 inline mr-1" />
            Your pool includes {poolSize} seat options
          </div>
          {jumpPrice > 0 && (
            <div className="text-right">
              <span className="text-sm text-gray-400">Jump Price:</span>
              <span className="ml-2 text-xl font-bold text-blue-400">${jumpPrice}</span>
            </div>
          )}
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
            venueData.inventory.sections.find(s => s.name === viewModalSection)?.viewFromSeatUrl
          }
          sectionData={
            venueData.inventory.sections.find(s => s.name === viewModalSection)
              ? {
                  displayName: venueData.inventory.sections.find(s => s.name === viewModalSection)!.displayName,
                  priceRange: venueData.inventory.sections.find(s => s.name === viewModalSection)!.priceRange,
                  ticketCount: venueData.inventory.sections.find(s => s.name === viewModalSection)!.ticketCount,
                  priceCategory: venueData.inventory.sections.find(s => s.name === viewModalSection)!.priceCategory,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}