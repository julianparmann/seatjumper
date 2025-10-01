'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Plus, Trash2, Save, Ticket, Building2, Trophy, Loader2, Star, Upload, X, Crown, Sparkles } from 'lucide-react';
import TierBadge from '@/components/tickets/TierBadge';
import ImageUpload from '@/components/admin/ImageUpload';
import BulkTicketUploadWithImages from '@/components/admin/BulkTicketUploadWithImages';
import { classifyTicketTier } from '@/lib/utils/ticket-classifier';
import { TierLevel } from '@prisma/client';
import BulkMemorabiliaUploadWithImages from '@/components/admin/BulkMemorabiliaUploadWithImages';

interface TicketLevelInput {
  id: string;
  level: string;
  levelName: string;
  quantity: number;
  pricePerSeat: number;
  viewImageUrl: string;
  sections: string[];
  availableUnits: number[];
  tierLevel?: TierLevel;
  tierPriority?: number;
}


interface MemorabiliaItem {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl: string;
  tierLevel?: TierLevel;
  tierPriority?: number;
  availableUnits?: number[];
  availablePacks?: string[];
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

interface TicketGroupInput {
  id: string;
  section: string;
  row: string;
  quantity: number;
  pricePerSeat: number;
  seatViewUrl?: string;
  notes?: string;
  tierLevel?: TierLevel;
  tierPriority?: number;
  availableUnits?: number[];
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
  ticketGroups: TicketGroupInput[];
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
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkMemorabiliaImport, setShowBulkMemorabiliaImport] = useState(false);
  const [form, setForm] = useState<GameForm>({
    eventName: '',
    eventDate: '',
    venue: '',
    city: '',
    state: '',
    sport: 'NFL',
    stadiumId: '',
    ticketLevels: [],
    ticketGroups: [],
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
      sections: [],
      availableUnits: [1, 2, 3, 4],
      tierLevel: undefined,
      tierPriority: undefined
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
          // Auto-classify tier when price changes
          if (field === 'pricePerSeat') {
            const classification = classifyTicketTier(value);
            updated.tierLevel = classification.tierLevel;
            updated.tierPriority = classification.tierPriority;
          }
          return updated;
        }
        return l;
      })
    });
  };


  // Memorabilia functions
  const addMemorabiliaItem = () => {
    const newItem: MemorabiliaItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      value: 0,
      quantity: 1,
      imageUrl: '',
      tierLevel: undefined,
      tierPriority: undefined,
      availableUnits: [1, 2, 3, 4],
      availablePacks: ['blue', 'red', 'gold']
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
    const memorabiliaTotal = form.memorabiliaItems.reduce((sum, item) => sum + item.quantity, 0);
    return { tickets: ticketTotal, memorabilia: memorabiliaTotal, total: ticketTotal + memorabiliaTotal };
  };

  const averagePoolValue = () => {
    let totalValue = 0;
    let totalItems = 0;

    // Add ticket levels
    form.ticketLevels.forEach(level => {
      totalValue += level.pricePerSeat * level.quantity;
      totalItems += level.quantity;
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
          spinPricePerBundle: averagePoolValue() * 1.3 // Tickets only with 30% margin
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkImport(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Bulk Upload (HTML/Images)
              </button>
              <button
                type="button"
                onClick={addTicketLevel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Level
              </button>
            </div>
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

              {/* Bundle Size Availability and Tier Selection */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                {/* Bundle Sizes */}
                <div className="p-3 bg-white/10 rounded">
                  <label className="block text-white text-sm mb-2 font-semibold">Available for Bundle Sizes:</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4].map(size => (
                      <label key={size} className="flex items-center gap-2 text-white text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={level.availableUnits.includes(size)}
                          onChange={(e) => {
                            const newUnits = e.target.checked
                              ? [...level.availableUnits, size].sort()
                              : level.availableUnits.filter(u => u !== size);
                            updateTicketLevel(level.id, 'availableUnits', newUnits);
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span>{size}x</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Select which bundle sizes can win these tickets
                  </p>
                </div>

                {/* Tier Selection */}
                <div className="p-3 bg-white/10 rounded">
                  <label className="block text-white text-sm mb-2 font-semibold">Ticket Tier:</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`tier-${level.id}`}
                        checked={level.tierLevel === 'VIP_ITEM'}
                        onChange={() => {
                          // Find the highest existing VIP priority
                          const existingVipItems = form.ticketLevels.filter(
                            l => l.tierLevel === 'VIP_ITEM' && l.id !== level.id
                          );
                          const highestPriority = existingVipItems.reduce(
                            (max, item) => Math.max(max, item.tierPriority || 1),
                            0
                          );
                          const newPriority = existingVipItems.length === 0 ? 1 : highestPriority + 1;

                          updateTicketLevel(level.id, 'tierLevel', 'VIP_ITEM' as TierLevel);
                          updateTicketLevel(level.id, 'tierPriority', newPriority);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="flex items-center gap-1">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        VIP
                        {level.tierLevel === 'VIP_ITEM' && level.tierPriority && (
                          <span className="text-xs bg-yellow-500/30 px-1 rounded">
                            #{level.tierPriority}
                          </span>
                        )}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`tier-${level.id}`}
                        checked={level.tierLevel === 'GOLD_LEVEL'}
                        onChange={() => {
                          updateTicketLevel(level.id, 'tierLevel', 'GOLD_LEVEL' as TierLevel);
                          updateTicketLevel(level.id, 'tierPriority', undefined);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-gray-300" />
                        Gold
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`tier-${level.id}`}
                        checked={level.tierLevel === 'UPPER_DECK'}
                        onChange={() => {
                          updateTicketLevel(level.id, 'tierLevel', 'UPPER_DECK' as TierLevel);
                          updateTicketLevel(level.id, 'tierPriority', undefined);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="flex items-center gap-1">
                        <Ticket className="w-4 h-4 text-blue-400" />
                        Upper
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Auto-set by price: VIP $500+, Gold $200+, Upper &lt;$200
                  </p>
                </div>

                {/* Priority Field for VIP Items */}
                {level.tierLevel === 'VIP_ITEM' && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <label className="block text-white text-sm mb-2 font-semibold">
                      🎯 VIP Item Configuration:
                    </label>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-yellow-400 text-xs mb-1">Priority Level</label>
                        <input
                          type="number"
                          min="1"
                          value={level.tierPriority || 1}
                          onChange={(e) => updateTicketLevel(level.id, 'tierPriority', parseInt(e.target.value) || 1)}
                          className="w-20 p-2 bg-white/20 rounded text-white text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs p-2 rounded ${level.tierPriority === 1 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {level.tierPriority === 1 ? (
                            <>✅ MAIN VIP PRIZE - Will appear in prize pools</>
                          ) : (
                            <>🔄 BACKUP VIP PRIZE (Priority {level.tierPriority}) - Auto-activates when Priority {(level.tierPriority || 2) - 1} depletes</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      {(() => {
                        const vipLevels = form.ticketLevels.filter(l => l.tierLevel === 'VIP_ITEM');
                        const vipGroups = form.ticketGroups.filter(g => g.tierLevel === 'VIP_ITEM');
                        const allVipItems = [...vipLevels, ...vipGroups];
                        const mainVipCount = allVipItems.filter(item => item.tierPriority === 1).length;

                        if (mainVipCount === 0 && allVipItems.length > 0) {
                          return <p className="text-orange-400 text-xs">⚠️ No main VIP item (priority 1) configured</p>;
                        } else if (mainVipCount > 1) {
                          return <p className="text-red-400 text-xs font-semibold">⚠️ Multiple items with priority 1! Only one should be main.</p>;
                        } else if (mainVipCount === 1) {
                          const backupCount = allVipItems.length - 1;
                          return <p className="text-green-400 text-xs">✅ 1 main VIP + {backupCount} backup{backupCount !== 1 ? 's' : ''}</p>;
                        } else {
                          return <p className="text-gray-400 text-xs">No VIP items configured</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {form.ticketLevels.length === 0 && (
            <p className="text-gray-400 text-center py-4">No ticket levels added yet</p>
          )}
        </div>

        {/* Individual Tickets (Imported) */}
        {form.ticketGroups.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Ticket className="w-6 h-6" />
                Individual Tickets ({form.ticketGroups.length})
              </h2>
              <button
                type="button"
                onClick={() => setForm({ ...form, ticketGroups: [] })}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" /> Clear All
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {form.ticketGroups.map((ticket, idx) => (
                <div key={`${ticket.id}-${idx}`} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm flex-1">
                      <div className="text-white font-medium flex items-center gap-2">
                        <span>Section {ticket.section}, Row {ticket.row}</span>
                        {ticket.tierLevel && (
                          <TierBadge tierLevel={ticket.tierLevel} size="sm" showLabel={false} />
                        )}
                        {ticket.tierLevel === 'VIP_ITEM' && ticket.tierPriority && (
                          <span className="text-[10px] bg-yellow-500/30 px-1 rounded">
                            #{ticket.tierPriority}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        {ticket.quantity} seat{ticket.quantity !== 1 ? 's' : ''} • ${ticket.pricePerSeat}
                      </div>
                      {ticket.availableUnits && ticket.availableUnits.length < 4 && (
                        <div className="text-yellow-400 text-xs mt-1">
                          Bundles: {ticket.availableUnits.map(u => `${u}x`).join(', ')}
                        </div>
                      )}
                      {ticket.notes && (
                        <div className="text-purple-400 text-xs mt-1">{ticket.notes}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedGroups = form.ticketGroups.filter((_, i) => i !== idx);
                        setForm({ ...form, ticketGroups: updatedGroups });
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Tier Selection for Ticket Groups */}
                  <div className="mt-3 p-2 bg-white/10 rounded">
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-white text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`tier-group-${ticket.id}`}
                          checked={ticket.tierLevel === 'VIP_ITEM'}
                          onChange={() => {
                            // Find the highest existing VIP priority across both groups and levels
                            const existingVipGroups = form.ticketGroups.filter(
                              (g, i) => g.tierLevel === 'VIP_ITEM' && i !== idx
                            );
                            const existingVipLevels = form.ticketLevels.filter(
                              l => l.tierLevel === 'VIP_ITEM'
                            );
                            const allVipItems = [...existingVipGroups, ...existingVipLevels];
                            const highestPriority = allVipItems.reduce(
                              (max, item) => Math.max(max, item.tierPriority || 1),
                              0
                            );
                            const newPriority = allVipItems.length === 0 ? 1 : highestPriority + 1;

                            const updatedGroups = [...form.ticketGroups];
                            updatedGroups[idx] = {
                              ...ticket,
                              tierLevel: 'VIP_ITEM' as TierLevel,
                              tierPriority: newPriority
                            };
                            setForm({ ...form, ticketGroups: updatedGroups });
                          }}
                          className="w-3 h-3"
                        />
                        <Crown className="w-3 h-3 text-yellow-400" />
                        <span>VIP</span>
                      </label>
                      <label className="flex items-center gap-1 text-white text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`tier-group-${ticket.id}`}
                          checked={ticket.tierLevel === 'GOLD_LEVEL'}
                          onChange={() => {
                            const updatedGroups = [...form.ticketGroups];
                            updatedGroups[idx] = {
                              ...ticket,
                              tierLevel: 'GOLD_LEVEL' as TierLevel,
                              tierPriority: undefined
                            };
                            setForm({ ...form, ticketGroups: updatedGroups });
                          }}
                          className="w-3 h-3"
                        />
                        <Star className="w-3 h-3 text-gray-300" />
                        <span>Gold</span>
                      </label>
                      <label className="flex items-center gap-1 text-white text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`tier-group-${ticket.id}`}
                          checked={ticket.tierLevel === 'UPPER_DECK'}
                          onChange={() => {
                            const updatedGroups = [...form.ticketGroups];
                            updatedGroups[idx] = {
                              ...ticket,
                              tierLevel: 'UPPER_DECK' as TierLevel,
                              tierPriority: undefined
                            };
                            setForm({ ...form, ticketGroups: updatedGroups });
                          }}
                          className="w-3 h-3"
                        />
                        <Ticket className="w-3 h-3 text-blue-400" />
                        <span>Upper</span>
                      </label>
                    </div>
                  </div>

                  {/* VIP Priority Field for Ticket Groups */}
                  {ticket.tierLevel === 'VIP_ITEM' && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                      <div className="flex items-center gap-2">
                        <label className="text-yellow-400 text-xs">Priority:</label>
                        <input
                          type="number"
                          min="1"
                          value={ticket.tierPriority || 1}
                          onChange={(e) => {
                            const updatedGroups = [...form.ticketGroups];
                            updatedGroups[idx] = {
                              ...ticket,
                              tierPriority: parseInt(e.target.value) || 1
                            };
                            setForm({ ...form, ticketGroups: updatedGroups });
                          }}
                          className="w-12 px-1 py-0.5 bg-gray-800 text-white rounded text-xs"
                        />
                        <span className="text-xs text-gray-400">
                          {ticket.tierPriority === 1 ?
                            '✅ Main VIP' :
                            `🔄 Backup #${ticket.tierPriority}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
              Total Seats: {form.ticketGroups.reduce((sum, t) => sum + t.quantity, 0)} •
              Avg Price: ${Math.round(form.ticketGroups.reduce((sum, t) => sum + t.pricePerSeat * t.quantity, 0) / form.ticketGroups.reduce((sum, t) => sum + t.quantity, 0) || 0)}
            </div>
          </div>
        )}


        {/* Memorabilia Items */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Memorabilia Items
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkMemorabiliaImport(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Bulk Import (HTML/Images)
              </button>
              <button
                type="button"
                onClick={addMemorabiliaItem}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
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
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      updateMemorabiliaItem(item.id, 'value', value);
                      // Auto-classify tier based on value
                      if (value >= 500) {
                        updateMemorabiliaItem(item.id, 'tierLevel', TierLevel.VIP_ITEM);
                        updateMemorabiliaItem(item.id, 'availablePacks', ['gold']);
                      } else if (value >= 200) {
                        updateMemorabiliaItem(item.id, 'tierLevel', TierLevel.GOLD_LEVEL);
                        updateMemorabiliaItem(item.id, 'availablePacks', ['red', 'gold']);
                      } else {
                        updateMemorabiliaItem(item.id, 'tierLevel', TierLevel.UPPER_DECK);
                        updateMemorabiliaItem(item.id, 'availablePacks', ['blue', 'red', 'gold']);
                      }
                    }}
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

              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white text-xs mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateMemorabiliaItem(item.id, 'description', e.target.value)}
                    className="w-full p-2 bg-white/20 rounded text-white text-sm"
                    placeholder="Game-worn jersey signed by the player"
                  />
                </div>

                <div>
                  <label className="block text-white text-xs mb-1">Tier & Packs</label>
                  <div className="flex items-center gap-2">
                    {item.tierLevel && <TierBadge tierLevel={item.tierLevel} size="sm" />}
                    {item.availablePacks && (
                      <div className="flex gap-1">
                        {item.availablePacks.includes('blue') && (
                          <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded">B</span>
                        )}
                        {item.availablePacks.includes('red') && (
                          <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">R</span>
                        )}
                        {item.availablePacks.includes('gold') && (
                          <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded">G</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
              <p className="text-3xl font-bold">
                {totalInventory().tickets} 🎟️ + {totalInventory().memorabilia} 🏆
              </p>
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
            With equal probability, each item has a {((1 / totalInventory().total) * 100).toFixed(2)}% chance of being selected.
          </p>
        </div>
      </form>

      {/* Bulk Ticket Import Modal with Images */}
      {showBulkImport && (
        <BulkTicketUploadWithImages
          onImport={(importedTicketGroups) => {
            // Add imported individual tickets to form
            setForm({
              ...form,
              ticketGroups: [...form.ticketGroups, ...importedTicketGroups]
            });
            setShowBulkImport(false);
          }}
          onCancel={() => setShowBulkImport(false)}
        />
      )}

      {/* Bulk Memorabilia Import Modal with Images - COMMENTED OUT (tickets only) */}
      {showBulkMemorabiliaImport && (
        <BulkMemorabiliaUploadWithImages
          onImport={(importedMemorabiliaItems) => {
            console.log('Imported memorabilia items:', importedMemorabiliaItems);
            // Add imported memorabilia items to form - they already have tier info from parser
            const mappedItems = importedMemorabiliaItems.map(item => ({
              id: Date.now() + Math.random().toString(36),
              name: item.name,
              description: item.description || '',
              value: item.value,
              quantity: item.quantity,
              imageUrl: item.imageUrl || '',
              tierLevel: item.tierLevel,
              tierPriority: item.tierPriority,
              availableUnits: item.availableUnits || [1, 2, 3, 4],
              availablePacks: item.availablePacks || ['blue', 'red', 'gold']
            }));
            console.log('Mapped items for form:', mappedItems);
            setForm({
              ...form,
              memorabiliaItems: [...form.memorabiliaItems, ...mappedItems]
            });
            setShowBulkMemorabiliaImport(false);
          }}
          onCancel={() => setShowBulkMemorabiliaImport(false)}
        />
      )}
    </div>
  );
}