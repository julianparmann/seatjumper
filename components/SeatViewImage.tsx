import React from 'react';
import Image from 'next/image';

interface SeatViewImageProps {
  seatViewUrl?: string | null;
  defaultViewUrl?: string | null;
  section?: string;
  row?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function SeatViewImage({
  seatViewUrl,
  defaultViewUrl,
  section,
  row,
  alt = 'Seat view',
  className = '',
  width = 400,
  height = 300
}: SeatViewImageProps) {
  const imageUrl = seatViewUrl || defaultViewUrl;
  const isDefaultImage = !seatViewUrl && defaultViewUrl;

  if (!imageUrl) {
    return (
      <div
        className={`relative bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">No seat view available</p>
          {section && row && (
            <p className="text-xs mt-1">Section {section}, Row {row}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className="object-cover rounded-lg"
        unoptimized
      />

      {isDefaultImage && (
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="bg-black/70 text-white px-4 py-2 mb-4 rounded-lg backdrop-blur-sm">
            <p className="text-sm font-semibold text-center">
              ⚠️ Stock Image
            </p>
            <p className="text-xs text-center mt-1">
              Your actual seat view will vary
            </p>
            {section && row && (
              <p className="text-xs text-center mt-1 text-yellow-300">
                Section {section}, Row {row}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SeatViewImage;