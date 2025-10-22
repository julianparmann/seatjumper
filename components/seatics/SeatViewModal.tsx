'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight, Eye, Info } from 'lucide-react';
import Image from 'next/image';

interface SeatViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  vfsUrl?: string;
  sectionData?: {
    priceRange: { min: number; max: number };
    ticketCount: number;
    priceCategory: string;
    displayName: string;
  };
  nearbyViews?: Array<{
    sectionName: string;
    vfsUrl: string;
  }>;
}

export default function SeatViewModal({
  isOpen,
  onClose,
  sectionName,
  vfsUrl,
  sectionData,
  nearbyViews = [],
}: SeatViewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  // Create array of all views (current section + nearby)
  const allViews = [
    { sectionName, vfsUrl },
    ...nearbyViews
  ].filter(v => v.vfsUrl);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setCurrentViewIndex(0);
    }
  }, [isOpen, sectionName]);

  if (!isOpen) return null;

  const currentView = allViews[currentViewIndex];
  const hasMultipleViews = allViews.length > 1;

  const handlePrevious = () => {
    setCurrentViewIndex((prev) =>
      prev === 0 ? allViews.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentViewIndex((prev) =>
      prev === allViews.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('Unable to load seat view image');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 max-w-5xl w-full max-h-[90vh] overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  View from {currentView.sectionName}
                </h2>
                {hasMultipleViews && (
                  <p className="text-sm text-gray-400 mt-1">
                    {currentViewIndex + 1} of {allViews.length} views available
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Section Info Bar */}
          {sectionData && currentViewIndex === 0 && (
            <div className="bg-gray-850 px-6 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">
                    <strong className="text-white">{sectionData.displayName}</strong>
                  </span>
                  <span className="text-gray-400">
                    {sectionData.ticketCount} tickets available
                  </span>
                  <span className="text-gray-400">
                    ${sectionData.priceRange.min} - ${sectionData.priceRange.max}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sectionData.priceCategory === 'vip'
                      ? 'bg-purple-500/20 text-purple-400'
                      : sectionData.priceCategory === 'premium'
                      ? 'bg-orange-500/20 text-orange-400'
                      : sectionData.priceCategory === 'standard'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {sectionData.priceCategory.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Image Content */}
          <div className="relative bg-black" style={{ height: '500px' }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-gray-400">Loading seat view...</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">{error}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    View from seat image not available
                  </p>
                </div>
              </div>
            )}

            {currentView.vfsUrl && !error && (
              <img
                src={currentView.vfsUrl}
                alt={`View from ${currentView.sectionName}`}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: loading ? 'none' : 'block' }}
              />
            )}

            {/* Navigation Arrows */}
            {hasMultipleViews && !loading && !error && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  aria-label="Previous view"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  aria-label="Next view"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Footer with tips */}
          <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-400">
                <p>This is an approximate view from this section.</p>
                <p className="mt-1">
                  Remember: With SeatJumper, you're selecting sections you'd be happy with.
                  Your final seats will be randomly assigned from your selected pool after payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}