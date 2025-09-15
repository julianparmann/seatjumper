'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Plus, Trash2, Save, Ticket } from 'lucide-react';

interface TicketGroupInput {
  id: string;
  section: string;
  row: string;
  seats: string; // Comma separated: "1,2,3,4"
  pricePerSeat: number;
  notes: string;
}

interface GameForm {
  eventName: string;
  eventDate: string;
  venue: string;
  city: string;
  state: string;
  sport: 'NFL' | 'NBA' | 'MLB' | 'NHL';
  ticketGroups: TicketGroupInput[];
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<GameForm>({
    eventName: '',
    eventDate: '',
    venue: '',
    city: '',
    state: '',
    sport: 'NFL',
    ticketGroups: []
  });

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
          spinPricePerBundle: calculateSpinPrice()
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
                <label className="block text-white text-sm mb-2">Venue</label>
                <input
                  type="text"
                  required
                  value={form.venue}
                  onChange={(e) => setForm({...form, venue: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Allegiant Stadium"
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
                <label className="block text-white text-sm mb-2">City</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({...form, city: e.target.value})}
                  className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400"
                  placeholder="Las Vegas"
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
                  placeholder="NV"
                  maxLength={2}
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
                  <div>
                    <label className="block text-white text-xs mb-1">Section</label>
                    <input
                      type="text"
                      value={group.section}
                      onChange={(e) => updateTicketGroup(group.id, 'section', e.target.value)}
                      className="w-full p-2 bg-white/20 rounded text-white text-sm"
                      placeholder="102"
                      required
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