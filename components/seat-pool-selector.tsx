'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, MapPin, DollarSign, AlertCircle } from 'lucide-react';

interface SeatOption {
  id: string;
  section: string;
  row: string;
  seats: string;
  quantity: number;
  price: number;
  priceCategory: 'low' | 'medium' | 'high' | 'premium';
  available: boolean;
}

interface SeatPoolSelectorProps {
  eventId: string;
  quantity: number;
  onContinue: (selectedSeats: string[]) => void;
  onBack: () => void;
}

export default function SeatPoolSelector({
  eventId,
  quantity,
  onContinue,
  onBack
}: SeatPoolSelectorProps) {
  const [seatOptions, setSeatOptions] = useState<SeatOption[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);

  useEffect(() => {
    fetchSeatOptions();
  }, [eventId, quantity]);

  const fetchSeatOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/seat-options?quantity=${quantity}`);

      if (!response.ok) {
        throw new Error('Failed to fetch seat options');
      }

      const data = await response.json();
      setSeatOptions(data.seatOptions);
      setEventDetails({
        eventName: data.eventName,
        eventDate: data.eventDate,
        venue: data.venue,
        priceRange: data.priceRange
      });

      // Auto-select all seats initially
      const allIds = data.seatOptions.map((opt: SeatOption) => opt.id);
      setSelectedSeats(new Set(allIds));
    } catch (err) {
      console.error('Error fetching seat options:', err);
      setError('Failed to load seat options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatId: string) => {
    const newSelected = new Set(selectedSeats);
    if (newSelected.has(seatId)) {
      newSelected.delete(seatId);
    } else {
      newSelected.add(seatId);
    }
    setSelectedSeats(newSelected);
  };

  const handleContinue = () => {
    if (selectedSeats.size === 0) {
      setError('Please select at least one seat option for your jump pool');
      return;
    }
    onContinue(Array.from(selectedSeats));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'low':
        return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'medium':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'high':
        return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'premium':
        return 'text-purple-400 bg-purple-400/20 border-purple-400/30';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'low':
        return 'Value';
      case 'medium':
        return 'Standard';
      case 'high':
        return 'Premium';
      case 'premium':
        return 'VIP';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading available seats...</p>
        </div>
      </div>
    );
  }

  if (error && seatOptions.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Customize Your Jump Pool</h2>
        <p className="text-gray-300 mb-4">
          Select which seats you want in your jump pool. The more options you include,
          the better your chances of getting great seats!
        </p>
        {eventDetails && (
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{eventDetails.eventName}</span>
            <span>•</span>
            <span>{eventDetails.venue}</span>
            <span>•</span>
            <span>{quantity} seats</span>
          </div>
        )}
      </div>

      {/* Selection Stats */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">
            {selectedSeats.size} of {seatOptions.length} options selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSeats(new Set(seatOptions.map(s => s.id)))}
              className="text-sm text-yellow-400 hover:text-yellow-300"
            >
              Select All
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => setSelectedSeats(new Set())}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Seat Options Grid */}
      <div className="grid md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {seatOptions.map((seat) => (
          <div
            key={seat.id}
            className={`bg-white/10 backdrop-blur-md rounded-lg p-4 border-2 cursor-pointer transition-all ${
              selectedSeats.has(seat.id)
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-white/20 hover:border-white/40'
            }`}
            onClick={() => toggleSeat(seat.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-semibold">
                    Section {seat.section}
                  </span>
                  {seat.row && (
                    <span className="text-gray-400">Row {seat.row}</span>
                  )}
                </div>
                <p className="text-sm text-gray-300">
                  Seats: {seat.seats}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(seat.priceCategory)}`}>
                  {getCategoryLabel(seat.priceCategory)}
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedSeats.has(seat.id)
                    ? 'border-yellow-400 bg-yellow-400'
                    : 'border-gray-400'
                }`}>
                  {selectedSeats.has(seat.id) && (
                    <Check className="w-4 h-4 text-gray-900" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between">
        <button
          onClick={onBack}
          className="bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedSeats.size === 0}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            selectedSeats.size > 0
              ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Jump ({selectedSeats.size} options)
        </button>
      </div>
    </div>
  );
}