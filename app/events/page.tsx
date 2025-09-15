'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, MapPin, Filter, ChevronRight, Loader2 } from 'lucide-react';

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
  sport: Sport | string;
  venue: string;
  city: string;
  state: string;
  datetime: Date;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  inventoryCount: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();

      // Convert datetime strings to Date objects
      const eventsWithDates = data.events.map((event: any) => ({
        ...event,
        datetime: new Date(event.datetime),
      }));

      setEvents(eventsWithDates);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Unable to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = selectedSport === 'ALL' || event.sport === selectedSport;

    return matchesSearch && matchesSport;
  });

  const calculateSpinPrice = (averagePrice: number) => {
    // Simple calculation for display - actual calculation happens on backend
    return Math.round(averagePrice * 0.35);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Browse <span className="text-yellow-400">Events</span>
          </h1>
          <p className="text-xl text-gray-300">
            Find your next game and spin for tickets + breaks!
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events, teams, or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
            </div>

            {/* Sport Filter */}
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value as Sport | 'ALL')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            >
              <option value="ALL">All Sports</option>
              <option value={Sport.NFL}>NFL</option>
              <option value={Sport.NBA}>NBA</option>
              <option value={Sport.MLB}>MLB</option>
              <option value={Sport.NHL}>NHL</option>
              <option value={Sport.SOCCER}>Soccer</option>
              <option value={Sport.UFC}>UFC</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            <span className="ml-3 text-xl text-white">Loading events...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 text-center">
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchEvents}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group bg-white/10 backdrop-blur-md rounded-xl overflow-hidden hover:bg-white/20 transition-all hover:scale-105"
            >
              {/* Sport Badge */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2">
                <span className="text-white font-bold text-sm">{event.sport}</span>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                  {event.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(event.datetime)}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Ticket Range:</span>
                    <span className="text-white font-semibold">
                      ${event.minPrice} - ${event.maxPrice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Spin Price:</span>
                    <span className="text-yellow-400 font-bold text-xl">
                      From ${calculateSpinPrice(event.averagePrice)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {event.inventoryCount}+ tickets available
                  </span>
                  <ChevronRight className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400 mb-4">No events found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}