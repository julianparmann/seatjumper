'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Plus, Trash2, Save, Ticket, Building2, ChevronDown, Check, Trophy, Loader2 } from 'lucide-react';
import { allegiantPreciseSections } from '@/data/stadiums/allegiant-precise-coordinates';

interface TicketGroupInput {
  id: string;
  section: string;
  row: string;
  seats: string; // Comma separated: "1,2,3,4"
  pricePerSeat: number;
  notes: string;
}

interface Stadium {
  id: string;
  name: string;
  displayName: string;
  city: string;
  state: string;
  imagePath: string;
}

interface GameForm {
  eventName: string;
  eventDate: string;
  venue: string;
  city: string;
  state: string;
  sport: 'NFL' | 'NBA' | 'MLB' | 'NHL';
  stadiumId: string;
  ticketGroups: TicketGroupInput[];
  memorabiliaUrl?: string;
  memorabiliaImage?: string;
  memorabiliaName?: string;
  memorabiliaPrice?: number;
}

// Section Dropdown Component
interface SectionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  stadiumSections: any[];
}

function SectionDropdown({ value, onChange, stadiumSections }: SectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter sections based on search
  const filteredSections = stadiumSections.filter(section =>
    section.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sections by level for better organization
  const groupedSections = filteredSections.reduce((acc, section) => {
    const level = section.level === 'lower' ? 'Lower Bowl (100s)' :
                  section.level === 'middle' ? 'Club Level (200s)' :
                  'Upper Deck (300s-400s)';
    if (!acc[level]) acc[level] = [];
    acc[level].push(section);
    return acc;
  }, {} as Record<string, typeof stadiumSections>);

  // Check if current value is valid
  const isValidSection = stadiumSections.some(s => s.id === value);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setSearchTerm('');
            }, 200);
          }}
          className={`w-full p-2 pr-8 bg-white/20 rounded text-white text-sm ${
            value && !isValidSection ? 'border-2 border-red-500' : ''
          }`}
          placeholder="Type to search sections..."
          required
        />
        <ChevronDown className={`absolute right-2 top-2.5 w-4 h-4 text-gray-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </div>

      {/* Warning for invalid section */}
      {value && !isValidSection && (
        <p className="text-red-400 text-xs mt-1">⚠️ Section "{value}" not found in stadium</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {Object.keys(groupedSections).length === 0 ? (
            <div className="p-3 text-gray-400 text-sm">
              No sections found matching "{searchTerm}"
            </div>
          ) : (
            Object.entries(groupedSections).map(([level, sections]) => (
              <div key={level}>
                <div className="px-3 py-1 text-xs text-gray-500 font-semibold bg-gray-900/50">
                  {level}
                </div>
                {(sections as any[]).map((section: any) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      onChange(section.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center justify-between ${
                      value === section.id ? 'bg-gray-700/50' : ''
                    }`}
                  >
                    <span className="text-white text-sm">
                      Section {section.id}
                      {section.isClub && (
                        <span className="ml-2 text-xs text-yellow-400">★ Club</span>
                      )}
                    </span>
                    {value === section.id && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);

  const [form, setForm] = useState<GameForm>({
    eventName: '',
    eventDate: '',
    venue: '',
    city: '',
    state: '',
    sport: 'NFL',
    stadiumId: '',
    ticketGroups: [],
    memorabiliaUrl: '',
    memorabiliaImage: '',
    memorabiliaName: '',
    memorabiliaPrice: 0
  });
  const [scrapingMemorabilia, setScrapingMemorabilia] = useState(false);

  useEffect(() => {
    fetchStadiums();
  }, []);

  const fetchStadiums = async () => {
    try {
      const res = await fetch('/api/admin/stadiums');
      if (res.ok) {
        const data = await res.json();
        setStadiums(data);
      }
    } catch (error) {
      console.error('Failed to fetch stadiums:', error);
    }
  };

  const handleStadiumChange = (stadiumId: string) => {
    const stadium = stadiums.find(s => s.id === stadiumId);
    if (stadium) {
      setForm({
        ...form,
        stadiumId,
        venue: stadium.displayName,
        city: stadium.city,
        state: stadium.state
      });
    }
  };

  const handleScrapeMemorabilia = async () => {
    if (!form.memorabiliaUrl) {
      alert('Please enter a sportsmemorabilia.com URL');
      return;
    }

    setScrapingMemorabilia(true);
    try {
      const res = await fetch('/api/scrape-memorabilia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.memorabiliaUrl })
      });

      const data = await res.json();

      if (data.success) {
        setForm({
          ...form,
          memorabiliaImage: data.data.imageUrl || '',
          memorabiliaName: data.data.name || '',
          memorabiliaPrice: data.data.price || 0
        });
        alert('Memorabilia details fetched successfully!');
      } else {
        alert('Failed to fetch memorabilia: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error scraping:', error);
      alert('Error fetching memorabilia details');
    } finally {
      setScrapingMemorabilia(false);
    }
  };

  // Calculate average ticket price
  const calculateAvgTicketPrice = () => {
    if (form.ticketGroups.length === 0) return 0;
    const totalValue = form.ticketGroups.reduce((sum, group) => {
      const quantity = parseInt(group.seats) || 0;
      return sum + (group.pricePerSeat * quantity);
    }, 0);
    const totalSeats = form.ticketGroups.reduce((sum, group) => {
      return sum + (parseInt(group.seats) || 0);
    }, 0);
    return totalSeats > 0 ? totalValue / totalSeats : 0;
  };

  // Calculate spin price with 35% margin
  const calculateSpinPrice = () => {
    const avgTicket = calculateAvgTicketPrice();
    return avgTicket * 1.35; // 35% margin markup
  };

  const addTicketGroup = () => {
    const newGroup: TicketGroupInput = {
      id: Date.now().toString(),
      section: '',
      row: '',
      seats: '',
      pricePerSeat: 0,
      notes: ''
    };
    setForm({
      ...form,
      ticketGroups: [...form.ticketGroups, newGroup]
    });
  };

  const removeTicketGroup = (id: string) => {
    setForm({
      ...form,
      ticketGroups: form.ticketGroups.filter(t => t.id !== id)
    });
  };

  const updateTicketGroup = (id: string, field: keyof TicketGroupInput, value: any) => {
    setForm({
      ...form,
      ticketGroups: form.ticketGroups.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      )
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          avgTicketPrice: calculateAvgTicketPrice(),
          spinPricePerBundle: calculateSpinPrice(),
          memorabiliaUrl: form.memorabiliaUrl,
          memorabiliaImage: form.memorabiliaImage,
          memorabiliaName: form.memorabiliaName,
          memorabiliaPrice: form.memorabiliaPrice
        })
      });

      if (res.ok) {
        alert('Game created successfully!');
        router.push('/admin/games');
      } else {
        let errorMessage = 'Failed to create game';
        try {
          const errorData = await res.json();
          console.error('API Error:', errorData);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, try to get text
          const errorText = await res.text();
          console.error('API Error (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Error creating game: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Create Event & Inventory</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm mb-2">Event Name</label>
                <input
                  type="text"
                  required
                  value={form.eventName}
                  onChange={(e) => setForm({...form, eventName: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Raiders vs Chiefs"
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Event Date</label>
                <input
                  type="datetime-local"
                  required
                  value={form.eventDate}
                  onChange={(e) => setForm({...form, eventDate: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Venue Name</label>
                <input
                  type="text"
                  required
                  value={form.venue}
                  onChange={(e) => setForm({...form, venue: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Auto-filled from stadium selection"
                  readOnly={!!form.stadiumId}
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Stadium</label>
                <select
                  value={form.stadiumId}
                  onChange={(e) => handleStadiumChange(e.target.value)}
                  className="w-full p-3 bg-white/20 rounded-lg text-white"
                >
                  <option value="">Select a stadium...</option>
                  {stadiums.map(stadium => (
                    <option key={stadium.id} value={stadium.id}>
                      {stadium.displayName} - {stadium.city}, {stadium.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Sport</label>
                <select
                  value={form.sport}
                  onChange={(e) => setForm({...form, sport: e.target.value as any})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white"
                >
                  <option value="NFL">NFL</option>
                  <option value="NBA">NBA</option>
                  <option value="MLB">MLB</option>
                  <option value="NHL">NHL</option>
                </select>
              </div>

              <div>
                <label className="block text-white text-sm mb-2">City</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({...form, city: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Auto-filled from stadium selection"
                  readOnly={!!form.stadiumId}
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">State</label>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => setForm({...form, state: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Auto-filled from stadium selection"
                  maxLength={2}
                  readOnly={!!form.stadiumId}
                />
              </div>
            </div>
          </div>

          {/* Memorabilia Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Memorabilia Prize
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm mb-2">SportsMemorabilia.com URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.memorabiliaUrl}
                    onChange={(e) => setForm({...form, memorabiliaUrl: e.target.value})}
                    className="flex-1 p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                    placeholder="https://www.sportsmemorabilia.com/..."
                  />
                  <button
                    type="button"
                    onClick={handleScrapeMemorabilia}
                    disabled={scrapingMemorabilia || !form.memorabiliaUrl}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    {scrapingMemorabilia ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</>
                    ) : (
                      'Fetch Details'
                    )}
                  </button>
                </div>
              </div>

              {form.memorabiliaImage && (
                <div className="row-span-2">
                  <label className="block text-white text-sm mb-2">Preview</label>
                  <div className="bg-white/10 rounded-lg p-4">
                    <img
                      src={form.memorabiliaImage}
                      alt="Memorabilia"
                      className="w-full h-48 object-contain rounded mb-2"
                    />
                    <p className="text-white font-semibold">{form.memorabiliaName}</p>
                    <p className="text-gray-300 text-sm">Admin Price View: ${form.memorabiliaPrice?.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white text-sm mb-2">Memorabilia Name</label>
                <input
                  type="text"
                  value={form.memorabiliaName}
                  onChange={(e) => setForm({...form, memorabiliaName: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Auto-filled from scraper"
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Image URL</label>
                <input
                  type="url"
                  value={form.memorabiliaImage}
                  onChange={(e) => setForm({...form, memorabiliaImage: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Auto-filled from scraper"
                />
              </div>
            </div>
          </div>

          {/* Ticket Groups */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Ticket className="w-6 h-6" />
                Ticket Groups (Adjacent Seats)
              </h2>
              <button
                type="button"
                onClick={addTicketGroup}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Ticket Group
              </button>
            </div>

            {form.ticketGroups.map((group) => (
              <div key={group.id} className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-5 gap-4">
                  <div className="relative">
                    <label className="block text-white text-xs mb-1">Section</label>
                    <SectionDropdown
                      value={group.section}
                      onChange={(value) => updateTicketGroup(group.id, 'section', value)}
                      stadiumSections={allegiantPreciseSections}
                    />
                  </div>

                  <div>
                    <label className="block text-white text-xs mb-1">Row</label>
                    <input
                      type="text"
                      value={group.row}
                      onChange={(e) => updateTicketGroup(group.id, 'row', e.target.value)}
                      className="w-full p-2 bg-white/20 rounded text-white text-sm"
                      placeholder="G"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-xs mb-1">Quantity (1-4)</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={group.seats}
                      onChange={(e) => updateTicketGroup(group.id, 'seats', e.target.value)}
                      className="w-full p-2 bg-white/20 rounded text-white text-sm"
                      placeholder="2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-xs mb-1">Price Per Seat ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={group.pricePerSeat}
                      onChange={(e) => updateTicketGroup(group.id, 'pricePerSeat', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white/20 rounded text-white text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeTicketGroup(group.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm w-full"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-white text-xs mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={group.notes}
                    onChange={(e) => updateTicketGroup(group.id, 'notes', e.target.value)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="Any special notes about these tickets"
                  />
                </div>
              </div>
            ))}

            {form.ticketGroups.length === 0 && (
              <p className="text-gray-400 text-center py-4">No ticket groups added yet</p>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-purple-600/20 rounded-lg p-6 border-2 border-yellow-400/50">
            <h3 className="text-2xl font-semibold text-white mb-4">Pricing Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-white">
              <div>
                <p className="text-sm text-gray-300">Avg Ticket Price</p>
                <p className="text-3xl font-bold">${calculateAvgTicketPrice().toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-300">Your Cost</p>
                <p className="text-3xl font-bold">
                  ${calculateAvgTicketPrice().toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-300">Spin Price (35% margin)</p>
                <p className="text-3xl font-bold text-yellow-400">
                  ${calculateSpinPrice().toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 text-gray-300 text-sm">
              <p>Total Tickets: {form.ticketGroups.reduce((sum, g) => sum + (parseInt(g.seats) || 0), 0)}</p>
              <p>Formula: Avg Ticket × 1.35 = Spin Price</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || form.ticketGroups.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
          >
            <Save className="w-6 h-6" />
            {loading ? 'Creating Event...' : 'Create Event & Inventory'}
          </button>
        </form>
      </div>
    </div>
  );
}