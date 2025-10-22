'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getSeaticsFrameworkUrl } from '@/lib/config/seatics';

interface SeaticsScriptLoaderProps {
  onLoad?: () => void;
  onError?: (error: any) => void;
}

/**
 * Component to load jQuery and Seatics framework scripts
 * Must be included on pages that use Seatics maps
 */
export default function SeaticsScriptLoader({ onLoad, onError }: SeaticsScriptLoaderProps) {
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const [seaticsLoaded, setSeaticsLoaded] = useState(false);

  useEffect(() => {
    // Check if scripts are already loaded
    if (typeof window !== 'undefined') {
      if (window.jQuery) {
        setJqueryLoaded(true);
      }
      if (window.Seatics) {
        setSeaticsLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    if (jqueryLoaded && seaticsLoaded && onLoad) {
      onLoad();
    }
  }, [jqueryLoaded, seaticsLoaded, onLoad]);

  const handleJQueryLoad = () => {
    console.log('[Seatics] jQuery loaded');
    setJqueryLoaded(true);

    // Set jQuery to noConflict mode to avoid conflicts
    if (window.jQuery && !window.$) {
      window.$ = window.jQuery;
    }
  };

  const handleSeaticsLoad = () => {
    console.log('[Seatics] Framework loaded');
    setSeaticsLoaded(true);
  };

  const handleError = (error: any) => {
    console.error('[Seatics] Script load error:', error);
    if (onError) {
      onError(error);
    }
  };

  return (
    <>
      {/* jQuery - Required by Seatics */}
      <Script
        src="https://code.jquery.com/jquery-3.6.0.min.js"
        strategy="beforeInteractive"
        onLoad={handleJQueryLoad}
        onError={handleError}
      />

      {/* Seatics Framework - Load after jQuery */}
      {jqueryLoaded && (
        <Script
          src={getSeaticsFrameworkUrl()}
          strategy="afterInteractive"
          onLoad={handleSeaticsLoad}
          onError={handleError}
        />
      )}

      {/* Seatics CSS - Optional but recommended for proper styling */}
      <style jsx global>{`
        /* Seatics Map Overrides */
        .sea-map-container {
          background: transparent;
        }

        .sea-section-hover {
          cursor: pointer;
          opacity: 0.8;
        }

        .sea-section-selected {
          stroke: #3b82f6;
          stroke-width: 3;
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
        }

        .sea-section-available {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sea-section-available:hover {
          filter: brightness(1.2);
        }

        .sea-section-unavailable {
          fill: #6b7280 !important;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .sea-tooltip {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
        }

        .sea-legend {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
          border-radius: 8px !important;
          color: #d1d5db !important;
        }

        /* Hide default Seatics controls we don't need */
        .sea-default-controls {
          display: none;
        }

        /* Zoom controls styling */
        .sea-zoom-controls {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sea-zoom-button {
          width: 36px;
          height: 36px;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 6px;
          color: #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sea-zoom-button:hover {
          background: #4b5563;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .sea-map-container {
            touch-action: pan-x pan-y pinch-zoom;
          }

          .sea-tooltip {
            font-size: 12px !important;
            padding: 8px !important;
          }

          .sea-zoom-controls {
            bottom: 10px;
            left: 10px;
          }

          .sea-zoom-button {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </>
  );
}