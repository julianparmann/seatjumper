'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Ticket, Package, DollarSign, Sparkles, Shield, TrendingUp, Loader2 } from 'lucide-react';

// Define Sport enum locally to avoid import issues
enum Sport {
  NFL = 'NFL',
  NBA = 'NBA',
  MLB = 'MLB',
  NHL = 'NHL',
  SOCCER = 'SOCCER',
  UFC = 'UFC',
  F1 = 'F1',
  OTHER = 'OTHER'
}

interface Event {
  id: string;
  name: string;
  sport: string;
  venue: string;
  city: string;
  state: string;
  datetime: Date;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  inventoryCount: number;
  ticketGroups?: any[];
}

// Mock breaks data (will be replaced with API call later)
const mockBreaks = [
  { id: '1', name: '2024 Panini Prizm Football Hobby Box', price: 299 },
  { id: '2', name: '2024 Topps Chrome Baseball Hobby Box', price: 249 },
  { id: '3', name: '2024 Panini Select Football Blaster Box', price: 89 },
];

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(2);
  const [breakQuantity, setBreakQuantity] = useState(1);
  const [riskProfile, setRiskProfile] = useState({
    capBreakWin: 0,
    uncapTickets: false,
    minSeatQuality: '',
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  useEffect(() => {
    if (event) {
      calculatePrice();
    }
  }, [ticketQuantity, breakQuantity, riskProfile, event]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/events/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      setEvent({
        ...data,
        datetime: new Date(data.datetime),
      });
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Unable to load event details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!event) return;

    setIsCalculating(true);
    // Simulate API call
    setTimeout(() => {
      const basePrice = event.averagePrice * ticketQuantity;
      const breakPrice = mockBreaks[0].price * breakQuantity;
      const total = (basePrice + breakPrice) * 0.35; // 35% of average
      setCalculatedPrice(Math.round(total));
      setIsCalculating(false);
    }, 500);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const handleSpin = () => {
    if (!event) return;
    // Navigate to spin page with event ID and sport type
    router.push(`/spin/${params.id}?tickets=${ticketQuantity}&breaks=${breakQuantity}&price=${calculatedPrice}&sport=${event.sport}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-white">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <Link href="/events" className="text-white hover:text-yellow-400 mb-6 inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </Link>
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 text-center">
            <p className="text-red-300 mb-4">{error || 'Event not found'}</p>
            <Link
              href="/events"
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors inline-block"
            >
              Return to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/events" className="text-white hover:text-yellow-400 mb-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </Link>

        {/* Event Info */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-lg text-white font-bold">
              {event.sport}
            </span>
            <span className="text-gray-400">
              {event.inventoryCount}+ tickets available
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">{event.name}</h1>

          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-yellow-400" />
              <span>{event.venue}, {event.city}, {event.state}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <span>{formatDate(event.datetime)}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 mb-1">Ticket Price Range</p>
                <p className="text-2xl font-bold text-white">${event.minPrice} - ${event.maxPrice}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Average Ticket Price</p>
                <p className="text-2xl font-bold text-white">${event.averagePrice}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Available Breaks</p>
                <p className="text-2xl font-bold text-white">{mockBreaks.length} Options</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Configure Your Spin</h2>

            {/* Ticket Quantity */}
            <div className="mb-6">
              <label className="text-white font-semibold mb-3 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-yellow-400" />
                Number of Tickets
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setTicketQuantity(num)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      ticketQuantity === num
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Break Quantity */}
            <div className="mb-6">
              <label className="text-white font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-400" />
                Number of Breaks
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setBreakQuantity(num)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      breakQuantity === num
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Options */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                Risk Preferences (Optional)
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={riskProfile.uncapTickets}
                    onChange={(e) => setRiskProfile({ ...riskProfile, uncapTickets: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-400"
                  />
                  <span>Uncap ticket wins (chance at premium seats)</span>
                </label>
                <div>
                  <label className="text-gray-300 text-sm">Cap break wins at:</label>
                  <select
                    value={riskProfile.capBreakWin}
                    onChange={(e) => setRiskProfile({ ...riskProfile, capBreakWin: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                  >
                    <option value={0}>No cap</option>
                    <option value={50}>$50</option>
                    <option value={100}>$100</option>
                    <option value={200}>$200</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Available Breaks Preview */}
            <div>
              <h3 className="text-white font-semibold mb-3">Available Breaks (Next Day)</h3>
              <div className="space-y-2 text-sm">
                {mockBreaks.map((breakItem) => (
                  <div key={breakItem.id} className="bg-white/10 rounded-lg p-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>{breakItem.name}</span>
                      <span className="font-semibold">${breakItem.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Panel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Spin Pricing</h2>

            {/* Price Breakdown */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Estimated Ticket Value:</span>
                <span className="font-semibold">${event.averagePrice * ticketQuantity}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Estimated Break Value:</span>
                <span className="font-semibold">${Math.round(mockBreaks[0].price * breakQuantity)}</span>
              </div>
              <div className="border-t border-white/20 pt-4 flex justify-between text-white">
                <span className="font-semibold">Total Bundle Value:</span>
                <span className="font-bold text-xl">
                  ${event.averagePrice * ticketQuantity + Math.round(mockBreaks[0].price * breakQuantity)}
                </span>
              </div>
            </div>

            {/* Spin Price */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-900 font-semibold">Your Spin Price:</span>
                <Sparkles className="w-6 h-6 text-gray-900" />
              </div>
              <div className="text-4xl font-bold text-gray-900">
                ${isCalculating ? '...' : calculatedPrice}
              </div>
              <p className="text-gray-800 text-sm mt-2">
                Save up to ${Math.round((event.averagePrice * ticketQuantity + mockBreaks[0].price * breakQuantity) - calculatedPrice)}!
              </p>
            </div>

            {/* Win Probabilities */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Win Probabilities
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Break even or better:</span>
                  <span className="font-semibold text-green-400">45%</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>2x value or better:</span>
                  <span className="font-semibold text-blue-400">15%</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Premium package:</span>
                  <span className="font-semibold text-purple-400">5%</span>
                </div>
              </div>
            </div>

            {/* Spin Button */}
            <button
              onClick={handleSpin}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold text-xl py-4 rounded-xl hover:from-yellow-300 hover:to-orange-300 transition-colors flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Spin Now for ${calculatedPrice}
            </button>

            <p className="text-gray-400 text-xs text-center mt-4">
              Every spin wins! Secure checkout with Stripe.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}