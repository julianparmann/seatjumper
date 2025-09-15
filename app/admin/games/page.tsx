'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Link, Users, DollarSign, RefreshCw, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';

interface DailyGame {
  id: string;
  eventName: string;
  eventDate: string;
  venue: string;
  city: string;
  state: string;
  tickpickUrl: string;
  sport: string;
  isActive: boolean;
  cutoffTime: string;
  minPlayers: number;
  maxPlayers: number;
  _count?: {
    participants: number;
    scrapedTickets: number;
  };
}

export default function AdminGamesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<DailyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState<DailyGame | null>(null);
  const [scraping, setScraping] = useState<string | null>(null);

  useEffect(() => {
    if (session && !session.user?.isAdmin) {
      router.push('/');
    } else if (session?.user?.isAdmin) {
      fetchGames();
    }
  }, [session]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/admin/games');
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async (gameId: string) => {
    setScraping(gameId);
    try {
      const response = await fetch(`/api/admin/games/${gameId}/scrape`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Scraped ${data.ticketCount} tickets successfully!`);
        fetchGames(); // Refresh to show new ticket count
      } else {
        alert('Scraping failed. Check console for details.');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      alert('Error scraping tickets');
    } finally {
      setScraping(null);
    }
  };

  const handleToggleActive = async (gameId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchGames();
      }
    } catch (error) {
      console.error('Error toggling game status:', error);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchGames();
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <p className="text-white text-xl">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">Daily Game Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Game
          </button>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.id}
              className={`bg-white/10 backdrop-blur-md rounded-xl p-6 ${
                game.isActive ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{game.eventName}</h3>
                  <div className="flex items-center gap-4 text-gray-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(game.eventDate)}
                    </span>
                    <span>{game.venue}</span>
                    <span>{game.city}, {game.state}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(game.id, game.isActive)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      game.isActive
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {game.isActive ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Inactive
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingGame(game)}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(game.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-gray-400 text-sm mb-1">Sport</p>
                  <p className="text-white font-semibold">{game.sport}</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-gray-400 text-sm mb-1">Participants</p>
                  <p className="text-white font-semibold flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {game._count?.participants || 0} / {game.maxPlayers}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-gray-400 text-sm mb-1">Scraped Tickets</p>
                  <p className="text-white font-semibold">{game._count?.scrapedTickets || 0}</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-gray-400 text-sm mb-1">Cutoff Time</p>
                  <p className="text-white font-semibold">{formatDate(game.cutoffTime)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <a
                  href={game.tickpickUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Link className="w-4 h-4" />
                  View on TickPick
                </a>
                <button
                  onClick={() => handleScrape(game.id)}
                  disabled={scraping === game.id}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${scraping === game.id ? 'animate-spin' : ''}`} />
                  {scraping === game.id ? 'Scraping...' : 'Scrape Tickets'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {games.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400 mb-4">No games configured</p>
            <p className="text-gray-500">Add your first game to get started</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingGame) && (
          <GameModal
            game={editingGame}
            onClose={() => {
              setShowAddModal(false);
              setEditingGame(null);
            }}
            onSave={() => {
              fetchGames();
              setShowAddModal(false);
              setEditingGame(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Game Add/Edit Modal Component
function GameModal({
  game,
  onClose,
  onSave
}: {
  game?: DailyGame | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    eventName: game?.eventName || '',
    eventDate: game?.eventDate ? new Date(game.eventDate).toISOString().slice(0, 16) : '',
    venue: game?.venue || '',
    city: game?.city || '',
    state: game?.state || '',
    tickpickUrl: game?.tickpickUrl || '',
    sport: game?.sport || 'NFL',
    cutoffTime: game?.cutoffTime ? new Date(game.cutoffTime).toISOString().slice(0, 16) : '',
    minPlayers: game?.minPlayers || 10,
    maxPlayers: game?.maxPlayers || 100
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = game ? `/api/admin/games/${game.id}` : '/api/admin/games';
    const method = game ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
      } else {
        alert('Error saving game');
      }
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Error saving game');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {game ? 'Edit Game' : 'Add New Game'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Event Name</label>
            <input
              type="text"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Event Date</label>
              <input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Cutoff Time</label>
              <input
                type="datetime-local"
                value={formData.cutoffTime}
                onChange={(e) => setFormData({ ...formData, cutoffTime: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-300 mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">TickPick URL</label>
            <input
              type="url"
              value={formData.tickpickUrl}
              onChange={(e) => setFormData({ ...formData, tickpickUrl: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
              placeholder="https://www.tickpick.com/..."
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Sport</label>
            <select
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
            >
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
              <option value="NHL">NHL</option>
              <option value="SOCCER">Soccer</option>
              <option value="UFC">UFC</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Min Players</label>
              <input
                type="number"
                value={formData.minPlayers}
                onChange={(e) => setFormData({ ...formData, minPlayers: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Max Players</label>
              <input
                type="number"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
                min={1}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300"
            >
              {game ? 'Update' : 'Create'} Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}