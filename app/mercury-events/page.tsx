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
  venue: string | { id: string; name: string; city: string; state: string };
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
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
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
              entryPrice: game.spinPrice1x || game.bluePricePerBundle || game.spinPricePerBundle || 0,
              totalValue: game.avgTicketPrice || 0,
              inventoryCount: game.ticketGroupsCount || 0,
              // cardBreaksCount: game.cardBreaksCount || 0, // Commented out - tickets only
              jumpPrice: game.spinPrice1x || game.bluePricePerBundle || game.spinPricePerBundle || 0,
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

      const response = await fetch('/api/mercury-events');


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Events API error:', errorText);
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || !Array.isArray(data.events)) {
        console.error('[Mercury Events] Invalid API response:', data);
        throw new Error('Events API returned invalid data structure');
      }

      // Convert datetime strings to Date objects
      // Mercury API returns 'date' field as an object with datetime property
      // Also normalize venue object to string
      const eventsWithDates = data.events.map((event: any) => {
        // Handle Catalog API date object structure
        let dateValue;
        if (event.date && typeof event.date === 'object' && event.date.datetime) {
          dateValue = new Date(event.date.datetime);
        } else if (event.datetime) {
          dateValue = new Date(event.datetime);
        } else if (event.date) {
          dateValue = new Date(event.date);
        } else {
          dateValue = new Date();
        }

        return {
          ...event,
          datetime: dateValue,
          venue: typeof event.venue === 'object' ? event.venue.name : event.venue,
          city: event.city || (typeof event.venue === 'object' ? event.venue.city : ''),
          state: event.state || (typeof event.venue === 'object' ? event.venue.state : ''),
        };
      });

      setEvents(eventsWithDates);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Unable to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter location suggestions
  const filterLocationSuggestions = (query: string): string[] => {
    if (!query || query.length < 2) return [];

    const allCities = events.map(event => {
      const cityName = event.city || (typeof event.venue === 'object' ? event.venue.city : '');
      const stateName = event.state || (typeof event.venue === 'object' ? event.venue.state : '');
      return cityName && stateName ? `${cityName}, ${stateName}` : '';
    }).filter(Boolean);

    const uniqueCities = Array.from(new Set(allCities)).sort();

    // Filter by city name or zip code pattern
    const lowerQuery = query.toLowerCase();
    return uniqueCities.filter(city =>
      city.toLowerCase().includes(lowerQuery)
    ).slice(0, 10); // Limit to 10 suggestions
  };

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setLocationQuery(value);
    if (value.length >= 2) {
      const suggestions = filterLocationSuggestions(value);
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(suggestions.length > 0);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  // Helper function to check if date is in range
  const isDateInRange = (eventDate: Date, startDate: string, endDate: string): boolean => {
    if (!startDate && !endDate) return true;

    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    if (startDate && !endDate) {
      // Single date filter
      const start = new Date(startDate);
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      return eventDay.getTime() === startDay.getTime();
    }

    if (startDate && endDate) {
      // Date range filter
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return eventDay >= startDay && eventDay <= endDay;
    }

    return true;
  };

  // Helper function to categorize events
  const getCategoryGroup = (event: Event): string => {
    const sport = event.sport;

    // Map sports
    if (sport === 'NFL' || sport === 'NBA' || sport === 'MLB' ||
        sport === 'NHL' || sport === 'SOCCER' || sport === 'UFC' || sport === 'F1') {
      return 'SPORTS';
    }

    // Everything else is categorized as OTHER for now
    // Can be enhanced later with Catalog API category mapping
    return 'OTHER';
  };

  const filteredEvents = events.filter(event => {
    // Search filter - matches event name, venue, or city
    const eventName = event.name || '';
    const eventVenue = typeof event.venue === 'string' ? event.venue : (event.venue?.name || '');
    const eventCity = event.city || '';

    const matchesSearch = !searchQuery ||
                         eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         eventVenue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         eventCity.toLowerCase().includes(searchQuery.toLowerCase());

    // Location filter - matches city name (partial match)
    const cityState = event.city && event.state ? `${event.city}, ${event.state}` : '';
    const matchesLocation = !locationQuery ||
                           cityState.toLowerCase().includes(locationQuery.toLowerCase()) ||
                           event.city?.toLowerCase().includes(locationQuery.toLowerCase());

    // Date filter - checks if event date is in date range
    const eventDate = event.datetime instanceof Date ? event.datetime : new Date(event.datetime);
    const matchesDate = isDateInRange(eventDate, dateStart, dateEnd);

    // Category filter - matches event category group
    const matchesCategory = selectedCategory === 'ALL' || getCategoryGroup(event) === selectedCategory;

    return matchesSearch && matchesLocation && matchesDate && matchesCategory;
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

  const formatDate = (dateInput: any) => {
    try {
      // Handle Catalog API date structure: { date, time, datetime, datetimeOffset }
      let dateObj: Date;

      if (dateInput instanceof Date) {
        dateObj = dateInput;
      } else if (typeof dateInput === 'object' && dateInput.datetime) {
        // Catalog API format
        dateObj = new Date(dateInput.datetime);
      } else if (typeof dateInput === 'string') {
        dateObj = new Date(dateInput);
      } else {
        return 'Date TBA';
      }

      if (isNaN(dateObj.getTime())) {
        return 'Date TBA';
      }

      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      return 'Date TBA';
    }
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

        {/* Search and Filters - Ticketmaster Style */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
          {/* Main Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events, artists, or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter - Autocomplete Input */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="City or Zip Code"
                value={locationQuery}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
              {/* Location Suggestions Dropdown */}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationSuggestions.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setLocationQuery(city);
                        setShowLocationSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white text-sm"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filter - Date Inputs */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="flex-1 pl-10 pr-2 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  style={{ colorScheme: 'dark' }}
                />
                {dateStart && (
                  <>
                    <span className="self-center text-gray-400">to</span>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      min={dateStart}
                      className="flex-1 pr-2 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      onClick={() => {
                        setDateStart('');
                        setDateEnd('');
                      }}
                      className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-400 hover:text-white hover:bg-white/30 transition-colors"
                      title="Clear dates"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 appearance-none cursor-pointer"
              >
                <option value="ALL">All Events</option>
                <option value="SPORTS">Sports</option>
                <option value="OTHER">Concerts & Theatre</option>
              </select>
            </div>
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
            <div
              key={event.id}
              className="group bg-white/10 backdrop-blur-md rounded-xl overflow-hidden hover:bg-white/20 transition-all"
            >
              {/* Sport Badge */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2">
                <span className="text-white font-bold text-sm">{event.sport}</span>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                  {event.name || 'Event Details TBA'}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{typeof event.venue === 'string' ? event.venue : (event.venue?.name || 'Venue TBA')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(event.datetime)}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4">
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-center">
                    <p className="text-yellow-300 text-xs">
                      🚧 Mercury Integration - Coming Soon!
                    </p>
                  </div>
                </div>
              </div>
            </div>
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