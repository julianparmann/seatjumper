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

interface DailyGame {
  id: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  city: string;
  state: string;
  sport: Sport | string;
  totalValue: number;
  entryPrice: number;
  cardPackName: string;
  cardPackValue: number;
  status: string;
  currentEntries: number;
  maxEntries: number;
  tickets: any[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [dailyGames, setDailyGames] = useState<DailyGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchDailyGames();
  }, []);

  const fetchDailyGames = async () => {
    try {
      const response = await fetch('/api/public/games');
      if (response.ok) {
        const games = await response.json();
        if (Array.isArray(games)) {
          const gamesWithDates = games
            .map((game: any) => ({
              ...game,
              eventDate: new Date(game.eventDate),
              // Map the data to expected fields with dynamic pricing
              entryPrice: game.bluePricePerBundle || game.spinPrice1x || game.spinPricePerBundle || 0,
              totalValue: game.avgTicketPrice || 0,
              inventoryCount: game.ticketGroupsCount || 0,
              // cardBreaksCount: game.cardBreaksCount || 0, // Commented out - tickets only
              jumpPrice: game.bluePricePerBundle || game.spinPrice1x || game.spinPricePerBundle || 0,
              bluePrice: game.bluePricePerBundle,
              redPrice: game.redPricePerBundle,
              goldPrice: game.goldPricePerBundle
            }));
          setDailyGames(gamesWithDates);
        }
      }
    } catch (err) {
      console.error('Error fetching daily games:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/events');


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Events API error:', errorText);
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();

      // Convert datetime strings to Date objects
      const eventsWithDates = data.events?.map((event: any) => ({
        ...event,
        datetime: new Date(event.datetime),
      })) || [];

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

  const getJumpPrice = (event: any) => {
    // For daily games, use the pre-calculated spinPricePerBundle
    if ('jumpPrice' in event && event.jumpPrice > 0) {
      return event.jumpPrice;
    }
    // For API events, use spinPrice if available
    if ('spinPrice' in event && event.spinPrice > 0) {
      return event.spinPrice;
    }
    // Fallback estimate (shouldn't be used in production)
    return Math.round((event.averagePrice || 0) * 0.35);
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
            Find your next game and jump for event tickets!
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

        {/* Error State - Show as warning instead of blocking everything */}
        {error && !loading && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 mb-6">
            <p className="text-yellow-300 text-sm">{error}</p>
          </div>
        )}

        {/* Daily Games Section */}
        {dailyGames.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              Today's <span className="text-yellow-400">Featured Games</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/play/${game.id}`}
                  className="group bg-gradient-to-br from-yellow-500/20 to-purple-600/20 backdrop-blur-md rounded-xl overflow-hidden hover:from-yellow-500/30 hover:to-purple-600/30 transition-all hover:scale-105 border-2 border-yellow-400/50"
                >
                  {/* Sport Badge */}
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{game.sport}</span>
                      <span className="text-white text-xs bg-black/20 px-2 py-1 rounded">
                        {game.currentEntries}/{game.maxEntries} Entries
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                      {game.eventName}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{game.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(game.eventDate)}</span>
                      </div>
                    </div>

                    {/* Tickets Info */}
                    <div className="bg-black/20 rounded-lg p-3 mb-4">
                      <p className="text-yellow-400 text-sm font-semibold mb-1">Tickets Include:</p>
                      <p className="text-white text-xs">{('inventoryCount' in game ? (game as any).inventoryCount : 0) || 0} Ticket{(('inventoryCount' in game ? (game as any).inventoryCount : 0) !== 1) ? 's' : ''} Available</p>
                      {/* <p className="text-white text-xs">{('cardBreaksCount' in game ? (game as any).cardBreaksCount : 0) || 0} Memorabilia Items</p> */}
                      <p className="text-gray-400 text-xs mt-1">Jump Price: ${Math.round(('jumpPrice' in game ? (game as any).jumpPrice : (game as any).spinPricePerBundle) || 0)}</p>
                    </div>

                    {/* Entry Price */}
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Jump Price:</span>
                        <span className="text-yellow-400 font-bold text-2xl">
                          From ${Math.round(game.entryPrice)}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-center">
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg group-hover:scale-105 transition-transform">
                        PLAY NOW
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Upcoming <span className="text-blue-400">Events</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/play/${event.id}`}
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
                    <span className="text-gray-400 text-sm">Jump Price:</span>
                    <span className="text-yellow-400 font-bold text-xl">
                      From ${Math.round(getJumpPrice(event))}
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
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && dailyGames.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400 mb-4">No events found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}