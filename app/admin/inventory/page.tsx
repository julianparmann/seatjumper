'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Plus, Trash2, Save, Ticket, Building2, Trophy, Loader2, Star } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

interface TicketLevelInput {
  id: string;
  level: string;
  levelName: string;
  quantity: number;
  pricePerSeat: number;
  viewImageUrl: string;
  sections: string[];
}

interface SpecialPrizeInput {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl: string;
  prizeType: 'TICKET' | 'EXPERIENCE' | 'VIP';
  metadata?: any;
}

interface MemorabiliaItem {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl: string;
}

interface Stadium {
  id: string;
  name: string;
  displayName: string;
  city: string;
  state: string;
  imagePath: string;
  imageWidth?: number;
  imageHeight?: number;
  sectionConfig?: any[];
}

interface GameForm {
  eventName: string;
  eventDate: string;
  venue: string;
  city: string;
  state: string;
  sport: 'NFL' | 'NBA' | 'MLB' | 'NHL';
  stadiumId: string;
  ticketLevels: TicketLevelInput[];
  specialPrizes: SpecialPrizeInput[];
  memorabiliaItems: MemorabiliaItem[];
}

// Predefined level configurations for common stadiums
const STADIUM_LEVELS: { [key: string]: string[] } = {
  '100': ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144'],
  '200': ['201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214', '215', '216', '217', '218', '219', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244'],
  '300': ['301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324', '325', '326', '327', '328', '329', '330', '331', '332', '333', '334', '335', '336', '337', '338', '339', '340', '341', '342', '343', '344'],
  '400': ['401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411', '412', '413', '414', '415', '416', '417', '418', '419', '420', '421', '422', '423', '424', '425', '426', '427', '428', '429', '430', '431', '432', '433', '434', '435', '436', '437', '438', '439', '440', '441', '442', '443', '444'],
  'FLOOR': ['FLOOR A', 'FLOOR B', 'FLOOR C', 'FLOOR D']
};

const LEVEL_NAMES: { [key: string]: string } = {
  '100': 'Lower Bowl',
  '200': 'Club Level',
  '300': 'Upper Deck (Lower)',
  '400': 'Upper Deck (Upper)',
  'FLOOR': 'Floor/Field Level'
};

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
    ticketLevels: [],
    specialPrizes: [],
    memorabiliaItems: []
  });

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

  const addTicketLevel = () => {
    const newLevel: TicketLevelInput = {
      id: Date.now().toString(),
      level: '',
      levelName: '',
      quantity: 0,
      pricePerSeat: 0,
      viewImageUrl: '',
      sections: []
    };
    setForm({
      ...form,
      ticketLevels: [...form.ticketLevels, newLevel]
    });
  };

  const removeTicketLevel = (id: string) => {
    setForm({
      ...form,
      ticketLevels: form.ticketLevels.filter(l => l.id !== id)
    });
  };

  const updateTicketLevel = (id: string, field: keyof TicketLevelInput, value: any) => {
    setForm({
      ...form,
      ticketLevels: form.ticketLevels.map(l => {
        if (l.id === id) {
          const updated = { ...l, [field]: value };
          // Auto-populate level name and sections when level is selected
          if (field === 'level' && LEVEL_NAMES[value]) {
            updated.levelName = LEVEL_NAMES[value];
            updated.sections = STADIUM_LEVELS[value] || [];
          }
          return updated;
        }
        return l;
      })
    });
  };

  const addSpecialPrize = () => {
    const newPrize: SpecialPrizeInput = {
      id: Date.now().toString(),
      name: '',
      description: '',
      value: 0,
      quantity: 1,
      imageUrl: '',
      prizeType: 'TICKET'
    };
    setForm({
      ...form,
      specialPrizes: [...form.specialPrizes, newPrize]
    });
  };

  const removeSpecialPrize = (id: string) => {
    setForm({
      ...form,
      specialPrizes: form.specialPrizes.filter(p => p.id !== id)
    });
  };

  const updateSpecialPrize = (id: string, field: keyof SpecialPrizeInput, value: any) => {
    setForm({
      ...form,
      specialPrizes: form.specialPrizes.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    });
  };

  const addMemorabiliaItem = () => {
    const newItem: MemorabiliaItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      value: 0,
      quantity: 1,
      imageUrl: ''
    };
    setForm({
      ...form,
      memorabiliaItems: [...form.memorabiliaItems, newItem]
    });
  };

  const removeMemorabiliaItem = (id: string) => {
    setForm({
      ...form,
      memorabiliaItems: form.memorabiliaItems.filter(item => item.id !== id)
    });
  };

  const updateMemorabiliaItem = (id: string, field: keyof MemorabiliaItem, value: any) => {
    setForm({
      ...form,
      memorabiliaItems: form.memorabiliaItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const totalInventory = () => {
    const ticketTotal = form.ticketLevels.reduce((sum, level) => sum + level.quantity, 0);
    const prizeTotal = form.specialPrizes.reduce((sum, prize) => sum + prize.quantity, 0);
    const memorabiliaTotal = form.memorabiliaItems.reduce((sum, item) => sum + item.quantity, 0);
    return ticketTotal + prizeTotal + memorabiliaTotal;
  };

  const averagePoolValue = () => {
    let totalValue = 0;
    let totalItems = 0;

    // Add ticket levels
    form.ticketLevels.forEach(level => {
      totalValue += level.pricePerSeat * level.quantity;
      totalItems += level.quantity;
    });

    // Add special prizes
    form.specialPrizes.forEach(prize => {
      totalValue += prize.value * prize.quantity;
      totalItems += prize.quantity;
    });

    // Add memorabilia
    form.memorabiliaItems.forEach(item => {
      totalValue += item.value * item.quantity;
      totalItems += item.quantity;
    });

    return totalItems > 0 ? totalValue / totalItems : 0;
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
          avgTicketPrice: averagePoolValue(),
          spinPricePerBundle: averagePoolValue() * 2 * 1.35 // 2 items per bundle, 35% margin
        })
      });

      if (res.ok) {
        router.push('/admin/games');
      } else {
        const error = await res.json();
        alert(`Error: ${error.message || 'Failed to create game'}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Add New Game Inventory</h1>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-5 h-5" /> Save Game</>
            )}
          </button>
        </div>

        {/* Basic Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6" />
            Event Details
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-white text-sm mb-2">Event Name</label>
              <input
                type="text"
                value={form.eventName}
                onChange={(e) => setForm({...form, eventName: e.target.value})}
                className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                placeholder="Lakers vs Warriors"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm mb-2">Event Date & Time</label>
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={(e) => setForm({...form, eventDate: e.target.value})}
                className="w-full p-3 bg-white/20 rounded-lg text-white"
                required
              />
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
              <label className="block text-white text-sm mb-2">Stadium</label>
              <select
                value={form.stadiumId}
                onChange={(e) => handleStadiumChange(e.target.value)}
                className="w-full p-3 bg-white/20 rounded-lg text-white"
                required
              >
                <option value="">Select Stadium...</option>
                {stadiums.map(stadium => (
                  <option key={stadium.id} value={stadium.id}>
                    {stadium.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm mb-2">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({...form, city: e.target.value})}
                className="w-full p-3 bg-white/20 rounded-lg text-white"
                placeholder="Las Vegas"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm mb-2">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({...form, state: e.target.value})}
                className="w-full p-3 bg-white/20 rounded-lg text-white"
                placeholder="NV"
                required
              />
            </div>
          </div>
        </div>

        {/* Ticket Levels */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Ticket className="w-6 h-6" />
              Ticket Levels
            </h2>
            <button
              type="button"
              onClick={addTicketLevel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Level
            </button>
          </div>

          {form.ticketLevels.map((level) => (
            <div key={level.id} className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-6 gap-3">
                <div>
                  <label className="block text-white text-xs mb-1">Level</label>
                  <select
                    value={level.level}
                    onChange={(e) => updateTicketLevel(level.id, 'level', e.target.value)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="100">100s</option>
                    <option value="200">200s</option>
                    <option value="300">300s</option>
                    <option value="400">400s</option>
                    <option value="FLOOR">Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Level Name</label>
                  <input
                    type="text"
                    value={level.levelName}
                    onChange={(e) => updateTicketLevel(level.id, 'levelName', e.target.value)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="Lower Bowl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={level.quantity}
                    onChange={(e) => updateTicketLevel(level.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Price/Seat</label>
                  <input
                    type="number"
                    step="0.01"
                    value={level.pricePerSeat}
                    onChange={(e) => updateTicketLevel(level.id, 'pricePerSeat', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="150.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">View Image</label>
                  <ImageUpload
                    value={level.viewImageUrl}
                    onChange={(url) => updateTicketLevel(level.id, 'viewImageUrl', url)}
                    placeholder="Upload"
                    folder="level-views"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeTicketLevel(level.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm w-full"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>

              {level.sections.length > 0 && (
                <div className="mt-2 text-xs text-gray-300">
                  Sections: {level.sections.slice(0, 5).join(', ')}
                  {level.sections.length > 5 && ` +${level.sections.length - 5} more`}
                </div>
              )}
            </div>
          ))}

          {form.ticketLevels.length === 0 && (
            <p className="text-gray-400 text-center py-4">No ticket levels added yet</p>
          )}
        </div>

        {/* Special Prizes */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Star className="w-6 h-6" />
              Special Prizes (Optional)
            </h2>
            <button
              type="button"
              onClick={addSpecialPrize}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Prize
            </button>
          </div>

          {form.specialPrizes.map((prize) => (
            <div key={prize.id} className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-6 gap-3">
                <div>
                  <label className="block text-white text-xs mb-1">Name</label>
                  <input
                    type="text"
                    value={prize.name}
                    onChange={(e) => updateSpecialPrize(prize.id, 'name', e.target.value)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="Front Row Seats"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Type</label>
                  <select
                    value={prize.prizeType}
                    onChange={(e) => updateSpecialPrize(prize.id, 'prizeType', e.target.value)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                  >
                    <option value="TICKET">Special Ticket</option>
                    <option value="EXPERIENCE">Experience</option>
                    <option value="VIP">VIP Package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prize.value}
                    onChange={(e) => updateSpecialPrize(prize.id, 'value', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="2000.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={prize.quantity}
                    onChange={(e) => updateSpecialPrize(prize.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Image</label>
                  <ImageUpload
                    value={prize.imageUrl}
                    onChange={(url) => updateSpecialPrize(prize.id, 'imageUrl', url)}
                    placeholder="Upload"
                    folder="special-prizes"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeSpecialPrize(prize.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm w-full"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-white text-xs mb-1">Description</label>
                <input
                  type="text"
                  value={prize.description}
                  onChange={(e) => updateSpecialPrize(prize.id, 'description', e.target.value)}
                  className="w-full p-2 bg-white/20 rounded text-white text-sm"
                  placeholder="Front row center court seats with VIP parking"
                  required
                />
              </div>
            </div>
          ))}

          {form.specialPrizes.length === 0 && (
            <p className="text-gray-400 text-center py-4">No special prizes added yet</p>
          )}
        </div>

        {/* Memorabilia Items */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Memorabilia Items
            </h2>
            <button
              type="button"
              onClick={addMemorabiliaItem}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {form.memorabiliaItems.map((item) => (
            <div key={item.id} className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="block text-white text-xs mb-1">Name</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateMemorabiliaItem(item.id, 'name', e.target.value)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="Autographed Jersey"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.value}
                    onChange={(e) => updateMemorabiliaItem(item.id, 'value', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="150.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateMemorabiliaItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Image</label>
                  <ImageUpload
                    value={item.imageUrl}
                    onChange={(url) => updateMemorabiliaItem(item.id, 'imageUrl', url)}
                    placeholder="Upload"
                    folder="memorabilia"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeMemorabiliaItem(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm w-full"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-white text-xs mb-1">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateMemorabiliaItem(item.id, 'description', e.target.value)}
                  className="w-full p-2 bg-white/20 rounded text-white text-sm"
                  placeholder="Game-worn jersey signed by the player"
                />
              </div>
            </div>
          ))}

          {form.memorabiliaItems.length === 0 && (
            <p className="text-gray-400 text-center py-4">No memorabilia items added yet</p>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-purple-600/20 rounded-lg p-6 border-2 border-yellow-400/50">
          <h3 className="text-2xl font-semibold text-white mb-4">Pricing Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-white">
            <div>
              <p className="text-sm text-gray-300">Total Inventory</p>
              <p className="text-3xl font-bold">{totalInventory()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Avg Item Value</p>
              <p className="text-3xl font-bold">${averagePoolValue().toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Bundle Price (2 items)</p>
              <p className="text-3xl font-bold">${(averagePoolValue() * 2).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Customer Price (+35%)</p>
              <p className="text-3xl font-bold text-yellow-400">
                ${(averagePoolValue() * 2 * 1.35).toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-4">
            With equal probability, each item has a {((1 / totalInventory()) * 100).toFixed(2)}% chance of being selected.
          </p>
        </div>
      </form>
    </div>
  );
}