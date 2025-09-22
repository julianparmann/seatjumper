'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Users, Play, Pause, Trash2, Edit, Ticket, Package, RefreshCw, Plus, Save, X, ChevronDown, ChevronUp, Copy, Gift } from 'lucide-react';
import UnifiedScraper from '@/components/admin/UnifiedScraper';
import ManualItemEntry from '@/components/admin/ManualItemEntry';
import ImageUpload from '@/components/admin/ImageUpload';

interface TicketGroup {
  id: string;
  section: string;
  row: string;
  quantity: number;
  pricePerSeat: number;
  status: string;
  notes?: string;
  seatViewUrl?: string;
}

interface TicketLevel {
  id: string;
  level: string;
  levelName: string;
  quantity: number;
  pricePerSeat: number;
  viewImageUrl?: string;
  sections: string[];
  isSelectable: boolean;
  availableUnits?: number[];
}

interface SpecialPrize {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl?: string;
  prizeType: string;
  availableUnits?: number[];
}

interface DailyGame {
  id: string;
  eventName: string;
  eventDate: string;
  venue: string;
  city: string;
  state: string;
  sport: string;
  status: string;
  avgTicketPrice: number | null;
  avgBreakValue: number | null;
  spinPricePerBundle: number | null;
  currentEntries: number;
  maxEntries: number;
  ticketGroups: TicketGroup[];
  ticketLevels?: TicketLevel[];
  specialPrizes?: SpecialPrize[];
  cardBreaks: any[];
}

export default function AdminGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<DailyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [editedGames, setEditedGames] = useState<{ [key: string]: DailyGame }>({});
  const [newTicketGroups, setNewTicketGroups] = useState<{ [key: string]: Partial<TicketGroup> }>({});
  const [memorabiliaQuantities, setMemorabiliaQuantities] = useState<{ [key: string]: number }>({});
  const [newMemorabiliaItems, setNewMemorabiliaItems] = useState<{ [gameId: string]: any[] }>({});
  const [showAddMemorabiliaForm, setShowAddMemorabiliaForm] = useState<{ [gameId: string]: boolean }>({});

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/admin/inventory?limit=100');
      if (res.ok) {
        const data = await res.json();
        // Handle both old format (array) and new format (object with games property)
        setGames(Array.isArray(data) ? data : data.games || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGameStatus = async (gameId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchGames();
      }
    } catch (error) {
      console.error('Failed to update game status:', error);
    }
  };

  const saveGameChanges = async (gameId: string) => {
    const editedGame = editedGames[gameId];
    if (!editedGame) return;

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedGame)
      });

      if (res.ok) {
        alert('Game updated successfully');
        setEditingGame(null);
        fetchGames();
      } else {
        const error = await res.json();
        alert('Failed to update game: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to update game:', error);
      alert('Error updating game');
    }
  };

  const addTicketGroup = async (gameId: string) => {
    const newGroup = newTicketGroups[gameId];
    if (!newGroup || !newGroup.section || !newGroup.row) {
      alert('Please fill in section and row');
      return;
    }

    try {
      const res = await fetch('/api/admin/ticket-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGroup,
          gameId,
          quantity: newGroup.quantity || 1,
          pricePerSeat: newGroup.pricePerSeat || 0,
          seatViewUrl: newGroup.seatViewUrl || null,
          status: 'AVAILABLE'
        })
      });

      if (res.ok) {
        setNewTicketGroups({ ...newTicketGroups, [gameId]: {} });
        fetchGames();
      } else {
        alert('Failed to add ticket group');
      }
    } catch (error) {
      console.error('Error adding ticket group:', error);
      alert('Error adding ticket group');
    }
  };

  const deleteTicketGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this ticket group?')) return;

    try {
      const res = await fetch(`/api/admin/ticket-groups/${groupId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchGames();
      } else {
        alert('Failed to delete ticket group');
      }
    } catch (error) {
      console.error('Error deleting ticket group:', error);
      alert('Error deleting ticket group');
    }
  };

  const duplicateBreakItem = async (gameId: string, breakItem: any) => {
    try {
      const res = await fetch('/api/admin/duplicate-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          breakItem
        })
      });

      if (res.ok) {
        fetchGames();
        alert('Item duplicated successfully');
      } else {
        const error = await res.json();
        alert('Failed to duplicate item: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to duplicate item:', error);
      alert('Failed to duplicate item');
    }
  };

  const deleteBreakItem = async (gameId: string, breakItemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/games/${gameId}/breaks/${breakItemId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchGames();
      } else {
        const error = await res.json();
        alert('Failed to delete item: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const updateMemorabiliaQuantity = async (gameId: string, group: any, targetQuantity: number) => {
    if (targetQuantity < 1 || targetQuantity === group.quantity) return;

    try {
      const difference = targetQuantity - group.quantity;

      if (difference > 0) {
        // Need to add items
        const itemToDuplicate = group.items.find((i: any) => i.status === 'AVAILABLE') || group.items[0];

        // Create multiple duplicates at once
        const duplicatePromises = [];
        for (let i = 0; i < difference; i++) {
          duplicatePromises.push(
            fetch('/api/admin/duplicate-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameId,
                breakItem: itemToDuplicate
              })
            })
          );
        }
        await Promise.all(duplicatePromises);
        fetchGames();
      } else {
        // Need to remove items
        const itemsToRemove = Math.abs(difference);
        const availableItems = group.items.filter((i: any) => i.status === 'AVAILABLE');
        const itemsToDelete = availableItems.slice(0, itemsToRemove);

        // Delete multiple items at once
        const deletePromises = itemsToDelete.map((item: any) =>
          fetch(`/api/admin/games/${gameId}/breaks/${item.id}`, {
            method: 'DELETE'
          })
        );
        await Promise.all(deletePromises);
        fetchGames();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const deleteMemorabiliaGroup = async (gameId: string, group: any) => {
    if (!confirm(`Are you sure you want to delete all ${group.quantity} items of "${group.breakName || group.teamName}"?`)) {
      return;
    }

    try {
      // Delete all items in the group without individual confirmations
      const deletePromises = group.items.map((item: any) =>
        fetch(`/api/admin/games/${gameId}/breaks/${item.id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(deletePromises);
      fetchGames();
    } catch (error) {
      console.error('Failed to delete memorabilia group:', error);
    }
  };

  const deleteBreaksBySource = async (gameId: string, sourceUrl: string) => {
    if (!confirm(`Are you sure you want to delete all breaks from this source? This will remove all teams imported from this URL.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-breaks-by-source', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, sourceUrl })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully deleted ${data.deleted} breaks`);
        fetchGames();
      } else {
        const error = await res.json();
        alert('Failed to delete breaks: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to delete breaks:', error);
      alert('Failed to delete breaks');
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This will remove all associated ticket groups, card breaks, entries, and spin results.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Game deleted successfully');
        fetchGames();
        setExpandedGame(null);
        setEditingGame(null);
      } else {
        const error = await res.json();
        alert('Failed to delete game: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert('Failed to delete game');
    }
  };

  const recalculatePrices = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/admin/recalculate-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully updated prices for ${data.gamesUpdated} games`);
        fetchGames(); // Refresh the games list
      } else {
        const error = await res.json();
        alert('Failed to recalculate prices: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to recalculate prices:', error);
      alert('Error recalculating prices');
    } finally {
      setRecalculating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Calculate total available tickets
  const getTotalTickets = (game: DailyGame) => {
    // Sum tickets from levels
    const levelTickets = (game.ticketLevels || []).reduce((sum, level) => sum + level.quantity, 0);
    // Sum tickets from special prizes that are ticket type
    const specialTickets = (game.specialPrizes || []).filter(p => p.prizeType === 'TICKET')
      .reduce((sum, prize) => sum + prize.quantity, 0);
    // Legacy ticketGroups support - check if exists
    const groupTickets = (game.ticketGroups || []).reduce((sum, group) => sum + (group.quantity || 0), 0);
    return levelTickets + specialTickets + groupTickets;
  };

  // Calculate available bundles
  const getAvailableBundles = (game: DailyGame) => {
    const totalTickets = getTotalTickets(game);
    const totalBreaks = (game.cardBreaks || []).filter((cb: any) => cb.status === 'AVAILABLE').length;
    return Math.min(totalTickets, totalBreaks);
  };

  // Helper to get total prizes
  const getTotalPrizes = (game: DailyGame) => {
    return (game.specialPrizes || []).reduce((sum, prize) => sum + prize.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Game Management</h1>
          <div className="flex gap-3">
            <button
              onClick={recalculatePrices}
              disabled={recalculating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculating...' : 'Recalculate All Prices'}
            </button>
            <button
              onClick={() => router.push('/admin/inventory')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create New Game
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-white text-center">Loading games...</div>
        ) : (
          <div className="grid gap-6">
            {games.map((game) => {
              const isExpanded = expandedGame === game.id;
              const isEditing = editingGame === game.id;
              const editedGame = editedGames[game.id] || game;
              const newTicketGroup = newTicketGroups[game.id] || {};

              return (
                <div key={game.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedGame.eventName}
                          onChange={(e) => setEditedGames({
                            ...editedGames,
                            [game.id]: { ...editedGame, eventName: e.target.value }
                          })}
                          className="text-2xl font-bold bg-white/20 rounded px-2 py-1 text-white mb-2 w-full"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-white mb-2">{game.eventName}</h2>
                      )}
                      <div className="flex gap-4 text-gray-300 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(game.eventDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {game.venue}, {game.city}, {game.state}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        game.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                        game.status === 'COMPLETED' ? 'bg-gray-500 text-white' :
                        game.status === 'SOLD_OUT' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-black'
                      }`}>
                        {game.status}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-sm font-semibold">
                        {game.sport}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Avg Ticket Price</p>
                      <p className="text-white text-xl font-bold">
                        ${game.avgTicketPrice?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Avg Break Value</p>
                      <p className="text-white text-xl font-bold">
                        ${game.avgBreakValue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Spin Price</p>
                      <p className="text-yellow-400 text-xl font-bold">
                        ${game.spinPricePerBundle?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Entries</p>
                      <p className="text-white text-xl font-bold">{game.currentEntries}/{game.maxEntries}</p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Available Bundles</p>
                      <p className="text-white text-xl font-bold">{getAvailableBundles(game)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> Inventory
                      </p>
                      <div className="text-white text-sm mt-1">
                        {/* Show ticket levels */}
                        {game.ticketLevels && game.ticketLevels.length > 0 ? (
                          <>
                            <p className="font-semibold">Ticket Levels:</p>
                            {game.ticketLevels.map((level: TicketLevel) => (
                              <p key={level.id} className="text-xs text-gray-300 ml-2">
                                {level.levelName}: {level.quantity} tickets @ ${level.pricePerSeat}
                              </p>
                            ))}
                          </>
                        ) : null}

                        {/* Show special prizes */}
                        {game.specialPrizes && game.specialPrizes.length > 0 ? (
                          <>
                            <p className="font-semibold mt-2">Special Prizes:</p>
                            {game.specialPrizes.slice(0, 3).map((prize: SpecialPrize) => (
                              <p key={prize.id} className="text-xs text-gray-300 ml-2">
                                {prize.name}: {prize.quantity}x @ ${prize.value}
                              </p>
                            ))}
                            {game.specialPrizes.length > 3 && (
                              <p className="text-xs text-gray-400 ml-2">+{game.specialPrizes.length - 3} more</p>
                            )}
                          </>
                        ) : null}

                        {/* Legacy ticket groups */}
                        {game.ticketGroups && game.ticketGroups.length > 0 ? (
                          <>
                            <p className="font-semibold mt-2">Legacy Tickets:</p>
                            <p className="text-xs text-gray-300 ml-2">
                              {game.ticketGroups.length} groups • {game.ticketGroups.reduce((sum, g) => sum + (g.quantity || 0), 0)} tickets
                            </p>
                          </>
                        ) : null}

                        <p className="font-bold mt-2 text-yellow-400">
                          Total: {getTotalTickets(game)} items
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3" /> Memorabilia
                      </p>
                      <div className="text-white text-sm mt-1">
                        <p>{game.cardBreaks.length} total items</p>
                        <p className="text-xs text-gray-300">
                          {game.cardBreaks.filter((cb: any) => cb.status === 'AVAILABLE').length} available
                        </p>
                        {game.avgBreakValue && (
                          <p className="text-xs text-gray-300">
                            Avg: ${game.avgBreakValue.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => deleteGame(game.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 font-semibold"
                      title="Delete this game"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => setExpandedGame(isExpanded ? null : game.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 font-semibold"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Hide' : 'Show'} Details
                    </button>
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setEditingGame(game.id);
                          setEditedGames({ ...editedGames, [game.id]: game });
                          setExpandedGame(game.id);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-semibold"
                      >
                        <Edit className="w-4 h-4" /> Edit Inventory
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => saveGameChanges(game.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 font-semibold"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingGame(null);
                            setEditedGames({ ...editedGames, [game.id]: game });
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 font-semibold"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleGameStatus(game.id, game.status)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                        game.status === 'ACTIVE'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      disabled={game.status === 'COMPLETED' || game.status === 'SOLD_OUT'}
                    >
                      {game.status === 'ACTIVE' ? (
                        <><Pause className="w-4 h-4" /> Deactivate</>
                      ) : (
                        <><Play className="w-4 h-4" /> Activate</>
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 space-y-6">
                      {/* Ticket Levels Section */}
                      {(game.ticketLevels && game.ticketLevels.length > 0) || isEditing ? (
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <Ticket className="w-5 h-5" /> Ticket Levels
                            </h3>
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const newLevel = {
                                    id: `new-${Date.now()}`,
                                    gameId: game.id,
                                    level: '',
                                    levelName: '',
                                    quantity: 0,
                                    pricePerSeat: 0,
                                    viewImageUrl: undefined,
                                    sections: [],
                                    isSelectable: true
                                  };
                                  setEditedGames({
                                    ...editedGames,
                                    [game.id]: {
                                      ...editedGame,
                                      ticketLevels: [...(editedGame.ticketLevels || []), newLevel]
                                    }
                                  });
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                              >
                                + Add Level
                              </button>
                            )}
                          </div>
                          {editedGame.ticketLevels?.map((level: TicketLevel, idx: number) => (
                            <div key={level.id} className="bg-white/5 rounded p-3 mb-2">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-5 gap-2">
                                    <input
                                      type="text"
                                      value={level.levelName}
                                      onChange={(e) => {
                                        const updatedLevels = [...(editedGame.ticketLevels || [])];
                                        updatedLevels[idx] = { ...level, levelName: e.target.value };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Level Name"
                                    />
                                    <input
                                      type="text"
                                      value={level.level}
                                      onChange={(e) => {
                                        const updatedLevels = [...(editedGame.ticketLevels || [])];
                                        updatedLevels[idx] = { ...level, level: e.target.value };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Level"
                                    />
                                    <input
                                      type="number"
                                      value={level.quantity}
                                      onChange={(e) => {
                                        const updatedLevels = [...(editedGame.ticketLevels || [])];
                                        updatedLevels[idx] = { ...level, quantity: parseInt(e.target.value) || 0 };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Quantity"
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={level.pricePerSeat}
                                      onChange={(e) => {
                                        const updatedLevels = [...(editedGame.ticketLevels || [])];
                                        updatedLevels[idx] = { ...level, pricePerSeat: parseFloat(e.target.value) || 0 };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Price/Seat"
                                    />
                                    <ImageUpload
                                      value={level.viewImageUrl || ''}
                                      onChange={(url) => {
                                        const updatedLevels = [...(editedGame.ticketLevels || [])];
                                        updatedLevels[idx] = { ...level, viewImageUrl: url };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                        });
                                      }}
                                      placeholder="Upload"
                                      folder="level-views"
                                    />
                                    <button
                                      onClick={() => {
                                        const updatedLevels = editedGame.ticketLevels?.filter((_, i) => i !== idx) || [];
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                        });
                                      }}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  {/* Bundle Size Availability Checkboxes */}
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-400 mb-1">Available for bundle sizes:</p>
                                    <div className="flex gap-3">
                                      {[1, 2, 3, 4].map(size => (
                                        <label key={size} className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={(level.availableUnits || [1, 2, 3, 4]).includes(size)}
                                            onChange={(e) => {
                                              const updatedLevels = [...(editedGame.ticketLevels || [])];
                                              const currentUnits = level.availableUnits || [1, 2, 3, 4];
                                              const newUnits = e.target.checked
                                                ? [...currentUnits, size].filter((v, i, a) => a.indexOf(v) === i).sort()
                                                : currentUnits.filter(u => u !== size);
                                              updatedLevels[idx] = { ...level, availableUnits: newUnits };
                                              setEditedGames({
                                                ...editedGames,
                                                [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                              });
                                            }}
                                            className="w-3 h-3"
                                          />
                                          <span>{size}x</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                  {level.viewImageUrl && (
                                    <div className="mt-2">
                                      <img src={level.viewImageUrl} alt="Level view" className="h-20 rounded" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-white font-semibold">{level.levelName}</span>
                                      <span className="text-gray-400 ml-2">(Level {level.level})</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-white">{level.quantity} tickets</span>
                                      <span className="text-gray-400 ml-2">@ ${level.pricePerSeat}/ea</span>
                                    </div>
                                  </div>
                                  {level.viewImageUrl && (
                                    <div className="mt-2">
                                      <img src={level.viewImageUrl} alt="Level view" className="h-20 rounded" />
                                    </div>
                                  )}
                                  {level.sections && level.sections.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Sections: {level.sections.slice(0, 5).join(', ')}
                                      {level.sections.length > 5 && ` +${level.sections.length - 5} more`}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                          {(!editedGame.ticketLevels || editedGame.ticketLevels.length === 0) && !isEditing && (
                            <p className="text-gray-400 text-center py-2">No ticket levels</p>
                          )}
                        </div>
                      ) : null}

                      {/* Special Prizes Section */}
                      {(game.specialPrizes && game.specialPrizes.length > 0) || isEditing ? (
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <Gift className="w-5 h-5" /> Special Prizes
                            </h3>
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const newPrize = {
                                    id: `new-${Date.now()}`,
                                    gameId: game.id,
                                    name: '',
                                    description: '',
                                    value: 0,
                                    quantity: 0,
                                    imageUrl: undefined,
                                    prizeType: 'EXPERIENCE',
                                    metadata: undefined
                                  };
                                  setEditedGames({
                                    ...editedGames,
                                    [game.id]: {
                                      ...editedGame,
                                      specialPrizes: [...(editedGame.specialPrizes || []), newPrize]
                                    }
                                  });
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                              >
                                + Add Prize
                              </button>
                            )}
                          </div>
                          {editedGame.specialPrizes?.map((prize: SpecialPrize, idx: number) => (
                            <div key={prize.id} className="bg-white/5 rounded p-3 mb-2">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-5 gap-2">
                                    <input
                                      type="text"
                                      value={prize.name}
                                      onChange={(e) => {
                                        const updatedPrizes = [...(editedGame.specialPrizes || [])];
                                        updatedPrizes[idx] = { ...prize, name: e.target.value };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, specialPrizes: updatedPrizes }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Name"
                                    />
                                    <input
                                      type="text"
                                      value={prize.description}
                                      onChange={(e) => {
                                        const updatedPrizes = [...(editedGame.specialPrizes || [])];
                                        updatedPrizes[idx] = { ...prize, description: e.target.value };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, specialPrizes: updatedPrizes }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Description"
                                    />
                                    <input
                                      type="number"
                                      value={prize.quantity}
                                      onChange={(e) => {
                                        const updatedPrizes = [...(editedGame.specialPrizes || [])];
                                        updatedPrizes[idx] = { ...prize, quantity: parseInt(e.target.value) || 0 };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, specialPrizes: updatedPrizes }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Quantity"
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={prize.value}
                                      onChange={(e) => {
                                        const updatedPrizes = [...(editedGame.specialPrizes || [])];
                                        updatedPrizes[idx] = { ...prize, value: parseFloat(e.target.value) || 0 };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, specialPrizes: updatedPrizes }
                                        });
                                      }}
                                      className="p-2 bg-white/20 rounded text-white text-sm"
                                      placeholder="Value"
                                    />
                                    <ImageUpload
                                      value={prize.imageUrl || ''}
                                      onChange={(url) => {
                                        const updatedPrizes = [...(editedGame.specialPrizes || [])];
                                        updatedPrizes[idx] = { ...prize, imageUrl: url };
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, specialPrizes: updatedPrizes }
                                        });
                                      }}
                                      placeholder="Upload"
                                      folder="special-prizes"
                                    />
                                    <button
                                      onClick={() => {
                                        const updatedPrizes = editedGame.specialPrizes?.filter((_, i) => i !== idx) || [];
                                        setEditedGames({
                                          ...editedGames,
                                          [game.id]: { ...editedGame, specialPrizes: updatedPrizes }
                                        });
                                      }}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  {/* Bundle Size Availability Checkboxes */}
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-400 mb-1">Available for bundle sizes:</p>
                                    <div className="flex gap-3">
                                      {[1, 2, 3, 4].map(size => (
                                        <label key={size} className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={(prize.availableUnits || [1, 2, 3, 4]).includes(size)}
                                            onChange={(e) => {
                                              const updatedPrizes = [...(editedGame.specialPrizes || [])];
                                              const currentUnits = prize.availableUnits || [1, 2, 3, 4];
                                              const newUnits = e.target.checked
                                                ? [...currentUnits, size].filter((v, i, a) => a.indexOf(v) === i).sort()
                                                : currentUnits.filter(u => u !== size);
                                              updatedPrizes[idx] = { ...prize, availableUnits: newUnits };
                                              setEditedGames({
                                                ...editedGames,
                                                [game.id]: { ...editedGame, specialPrizes: updatedPrizes }
                                              });
                                            }}
                                            className="w-3 h-3"
                                          />
                                          <span>{size}x</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                  {prize.imageUrl && (
                                    <div className="mt-2">
                                      <img src={prize.imageUrl} alt={prize.name} className="h-20 rounded" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-white font-semibold">{prize.name}</span>
                                      <div className="text-xs text-gray-400">{prize.description}</div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-white">{prize.quantity}x</span>
                                      <span className="text-yellow-400 ml-2 font-bold">${prize.value}</span>
                                    </div>
                                  </div>
                                  {prize.imageUrl && (
                                    <div className="mt-2">
                                      <img src={prize.imageUrl} alt={prize.name} className="h-20 rounded" />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                          {(!editedGame.specialPrizes || editedGame.specialPrizes.length === 0) && !isEditing && (
                            <p className="text-gray-400 text-center py-2">No special prizes</p>
                          )}
                        </div>
                      ) : null}

                      {/* Legacy Ticket Groups Section */}
                      {game.ticketGroups && game.ticketGroups.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <Ticket className="w-5 h-5" /> Legacy Ticket Groups
                            </h3>
                            {isEditing && (
                              <button
                                onClick={() => setNewTicketGroups({
                                  ...newTicketGroups,
                                  [game.id]: { section: '', row: '', quantity: 1, pricePerSeat: 0 }
                                })}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Add Group
                              </button>
                            )}
                          </div>

                        {/* New Ticket Group Form */}
                        {isEditing && newTicketGroup.section !== undefined && (
                          <div className="bg-white/5 rounded p-3 mb-3">
                            <div className="grid grid-cols-6 gap-2">
                              <input
                                type="text"
                                placeholder="Section"
                                value={newTicketGroup.section || ''}
                                onChange={(e) => setNewTicketGroups({
                                  ...newTicketGroups,
                                  [game.id]: { ...newTicketGroup, section: e.target.value }
                                })}
                                className="p-2 bg-white/20 rounded text-white text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Row"
                                value={newTicketGroup.row || ''}
                                onChange={(e) => setNewTicketGroups({
                                  ...newTicketGroups,
                                  [game.id]: { ...newTicketGroup, row: e.target.value }
                                })}
                                className="p-2 bg-white/20 rounded text-white text-sm"
                              />
                              <input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                max="4"
                                value={newTicketGroup.quantity || 1}
                                onChange={(e) => setNewTicketGroups({
                                  ...newTicketGroups,
                                  [game.id]: { ...newTicketGroup, quantity: parseInt(e.target.value) || 1 }
                                })}
                                className="p-2 bg-white/20 rounded text-white text-sm"
                              />
                              <input
                                type="number"
                                placeholder="Price/seat"
                                value={newTicketGroup.pricePerSeat || ''}
                                onChange={(e) => setNewTicketGroups({
                                  ...newTicketGroups,
                                  [game.id]: { ...newTicketGroup, pricePerSeat: parseFloat(e.target.value) || 0 }
                                })}
                                className="p-2 bg-white/20 rounded text-white text-sm"
                              />
                              <ImageUpload
                                value={newTicketGroup.seatViewUrl || ''}
                                onChange={(url) => setNewTicketGroups({
                                  ...newTicketGroups,
                                  [game.id]: { ...newTicketGroup, seatViewUrl: url }
                                })}
                                placeholder="Upload"
                                folder="seat-views"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => addTicketGroup(game.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm flex-1"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => setNewTicketGroups({ ...newTicketGroups, [game.id]: {} })}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm flex-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Existing Ticket Groups */}
                        {editedGame.ticketGroups.map((group: TicketGroup, idx: number) => (
                          <div key={group.id} className="bg-white/5 rounded p-3 mb-2">
                            {isEditing ? (
                              <div className="grid grid-cols-6 gap-2">
                                <input
                                  type="text"
                                  value={group.section}
                                  onChange={(e) => {
                                    const updatedGroups = [...editedGame.ticketGroups];
                                    updatedGroups[idx] = { ...group, section: e.target.value };
                                    setEditedGames({
                                      ...editedGames,
                                      [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                    });
                                  }}
                                  className="p-2 bg-white/20 rounded text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={group.row}
                                  onChange={(e) => {
                                    const updatedGroups = [...editedGame.ticketGroups];
                                    updatedGroups[idx] = { ...group, row: e.target.value };
                                    setEditedGames({
                                      ...editedGames,
                                      [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                    });
                                  }}
                                  className="p-2 bg-white/20 rounded text-white text-sm"
                                />
                                <input
                                  type="number"
                                  value={group.quantity}
                                  onChange={(e) => {
                                    const updatedGroups = [...editedGame.ticketGroups];
                                    updatedGroups[idx] = { ...group, quantity: parseInt(e.target.value) || 1 };
                                    setEditedGames({
                                      ...editedGames,
                                      [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                    });
                                  }}
                                  className="p-2 bg-white/20 rounded text-white text-sm"
                                />
                                <input
                                  type="number"
                                  value={group.pricePerSeat}
                                  onChange={(e) => {
                                    const updatedGroups = [...editedGame.ticketGroups];
                                    updatedGroups[idx] = { ...group, pricePerSeat: parseFloat(e.target.value) || 0 };
                                    setEditedGames({
                                      ...editedGames,
                                      [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                    });
                                  }}
                                  className="p-2 bg-white/20 rounded text-white text-sm"
                                />
                                <ImageUpload
                                  value={group.seatViewUrl || ''}
                                  onChange={(url) => {
                                    const updatedGroups = [...editedGame.ticketGroups];
                                    updatedGroups[idx] = { ...group, seatViewUrl: url };
                                    setEditedGames({
                                      ...editedGames,
                                      [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                    });
                                  }}
                                  placeholder="Upload"
                                  folder="seat-views"
                                />
                                <button
                                  onClick={() => deleteTicketGroup(group.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-white">
                                <div className="flex justify-between items-center">
                                  <span>Section {group.section}, Row {group.row}</span>
                                  <span>{group.quantity} seats @ ${group.pricePerSeat}/ea</span>
                                  <span className="text-gray-400">Total: ${(group.quantity * group.pricePerSeat).toFixed(2)}</span>
                                </div>
                                {group.seatViewUrl && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Seat View: <a href={group.seatViewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Image</a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {editedGame.ticketGroups.length === 0 && (
                          <p className="text-gray-400 text-center py-2">No ticket groups yet</p>
                        )}
                        </div>
                      )}

                      {/* Memorabilia Section */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Package className="w-5 h-5" /> Memorabilia
                          </h3>
                          {isEditing && (
                            <button
                              onClick={() => {
                                setShowAddMemorabiliaForm({ ...showAddMemorabiliaForm, [game.id]: true });
                                if (!newMemorabiliaItems[game.id]) {
                                  setNewMemorabiliaItems({
                                    ...newMemorabiliaItems,
                                    [game.id]: [{
                                      id: Date.now().toString(),
                                      name: '',
                                      description: '',
                                      value: 0,
                                      quantity: 1,
                                      imageUrl: ''
                                    }]
                                  });
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> Add Items
                            </button>
                          )}
                        </div>

                        {/* Add new memorabilia form */}
                        {isEditing && showAddMemorabiliaForm[game.id] && (
                          <div className="bg-white/10 rounded-lg p-4 mb-4">
                            <h4 className="text-white font-semibold mb-3">Add New Memorabilia</h4>
                            {(newMemorabiliaItems[game.id] || []).map((item, index) => (
                              <div key={item.id} className="bg-white/5 rounded p-3 mb-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    placeholder="Item Name"
                                    value={item.name}
                                    onChange={(e) => {
                                      const updated = [...(newMemorabiliaItems[game.id] || [])];
                                      updated[index] = { ...updated[index], name: e.target.value };
                                      setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                    }}
                                    className="p-2 bg-white/20 rounded text-white text-sm"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) => {
                                      const updated = [...(newMemorabiliaItems[game.id] || [])];
                                      updated[index] = { ...updated[index], description: e.target.value };
                                      setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                    }}
                                    className="p-2 bg-white/20 rounded text-white text-sm"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                  <input
                                    type="number"
                                    placeholder="Value ($)"
                                    value={item.value || ''}
                                    onChange={(e) => {
                                      const updated = [...(newMemorabiliaItems[game.id] || [])];
                                      updated[index] = { ...updated[index], value: parseFloat(e.target.value) || 0 };
                                      setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                    }}
                                    className="p-2 bg-white/20 rounded text-white text-sm"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Quantity"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) => {
                                      const updated = [...(newMemorabiliaItems[game.id] || [])];
                                      updated[index] = { ...updated[index], quantity: parseInt(e.target.value) || 1 };
                                      setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                    }}
                                    className="p-2 bg-white/20 rounded text-white text-sm"
                                  />
                                  <ImageUpload
                                    value={item.imageUrl}
                                    onChange={(url) => {
                                      const updated = [...(newMemorabiliaItems[game.id] || [])];
                                      updated[index] = { ...updated[index], imageUrl: url };
                                      setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                    }}
                                    placeholder="Upload Image"
                                    folder="memorabilia"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = (newMemorabiliaItems[game.id] || []).filter((_, i) => i !== index);
                                    setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm mt-2"
                                >
                                  Remove Item
                                </button>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => {
                                  const items = newMemorabiliaItems[game.id] || [];
                                  setNewMemorabiliaItems({
                                    ...newMemorabiliaItems,
                                    [game.id]: [...items, {
                                      id: Date.now().toString(),
                                      name: '',
                                      description: '',
                                      value: 0,
                                      quantity: 1,
                                      imageUrl: ''
                                    }]
                                  });
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                              >
                                Add Another Item
                              </button>
                              <button
                                onClick={async () => {
                                  const items = newMemorabiliaItems[game.id] || [];
                                  let successCount = 0;
                                  let errorCount = 0;

                                  for (const item of items) {
                                    if (!item.name || item.quantity < 1) continue;

                                    // Create individual card breaks for each quantity
                                    for (let i = 0; i < item.quantity; i++) {
                                      try {
                                        const res = await fetch('/api/admin/add-memorabilia', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            gameId: game.id,
                                            breakName: item.name,
                                            breakValue: item.value,
                                            description: item.description || item.name,
                                            imageUrl: item.imageUrl,
                                            itemType: 'memorabilia',
                                            quantity: 1
                                          })
                                        });
                                        if (res.ok) {
                                          successCount++;
                                        } else {
                                          errorCount++;
                                          console.error('Failed to add memorabilia item');
                                        }
                                      } catch (error) {
                                        errorCount++;
                                        console.error('Failed to add memorabilia:', error);
                                      }
                                    }
                                  }

                                  // Show feedback
                                  if (successCount > 0) {
                                    alert(`Successfully added ${successCount} memorabilia item${successCount > 1 ? 's' : ''}`);
                                  }
                                  if (errorCount > 0) {
                                    alert(`Failed to add ${errorCount} item${errorCount > 1 ? 's' : ''}. Please try again.`);
                                  }

                                  // Clear the form and refresh if any items were added
                                  if (successCount > 0) {
                                    setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: [] });
                                    setShowAddMemorabiliaForm({ ...showAddMemorabiliaForm, [game.id]: false });
                                    fetchGames();
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                              >
                                Save All Items
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddMemorabiliaForm({ ...showAddMemorabiliaForm, [game.id]: false });
                                  setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: [] });
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Group breaks by unique item (name + value) */}
                        {(() => {
                          // Group by unique memorabilia items
                          const breaksToDisplay = isEditing ? editedGame.cardBreaks : game.cardBreaks;
                          const uniqueItems = breaksToDisplay?.reduce((acc: any, breakItem: any) => {
                            // Normalize the name by removing "(copy)" suffix for grouping
                            const normalizedName = (breakItem.breakName || breakItem.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                            const key = `${normalizedName}_${breakItem.breakValue}_${breakItem.imageUrl}`;
                            if (!acc[key]) {
                              acc[key] = {
                                ...breakItem,
                                breakName: normalizedName, // Use normalized name for display
                                items: [],
                                quantity: 0
                              };
                            }
                            acc[key].items.push(breakItem);
                            acc[key].quantity++;
                            return acc;
                          }, {}) || {};

                          const itemGroups = Object.values(uniqueItems);

                          if (itemGroups.length === 0) {
                            return <p className="text-gray-400 text-center py-2">No memorabilia yet</p>;
                          }

                          return (
                            <>
                              <div className="max-h-96 overflow-y-auto space-y-4">
                                {itemGroups.map((group: any) => {
                                  // Use the normalized name for the groupKey to ensure consistency
                                  const normalizedName = (group.breakName || group.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                  const groupKey = `${game.id}_${normalizedName}_${group.breakValue}`;
                                  const currentQuantity = memorabiliaQuantities[groupKey] ?? group.quantity;

                                  return (
                                    <div key={`${group.breakName}_${group.breakValue}`} className="bg-white/5 rounded-lg p-3">
                                      <div className="flex justify-between items-start">
                                        <div className="text-white flex-1">
                                          <div className="text-sm font-medium">{group.teamName || group.breakName}</div>
                                          <div className="text-xs text-gray-400 mt-1">
                                            {group.breaker} • {group.itemType || group.breakType}
                                          </div>
                                          {/* Image display/edit */}
                                          {isEditing ? (
                                            <div className="mt-2">
                                              <ImageUpload
                                                value={group.imageUrl || ''}
                                                onChange={async (newImageUrl) => {
                                                  // Update all items in this group with the new image
                                                  for (const item of group.items) {
                                                    try {
                                                      await fetch(`/api/admin/update-memorabilia-image`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                          breakId: item.id,
                                                          imageUrl: newImageUrl
                                                        })
                                                      });
                                                    } catch (error) {
                                                      console.error('Failed to update image:', error);
                                                    }
                                                  }
                                                  // Refresh to show the update
                                                  fetchGames();
                                                }}
                                                placeholder="Update Image"
                                                folder="memorabilia"
                                              />
                                            </div>
                                          ) : (
                                            group.imageUrl && (
                                              <img
                                                src={group.imageUrl}
                                                alt={group.breakName}
                                                className="w-16 h-16 object-cover rounded mt-2"
                                              />
                                            )
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className="text-white font-bold">${group.breakValue || group.spotPrice}</div>

                                          {/* Quantity controls */}
                                          <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-400">Qty:</span>
                                            <button
                                              onClick={() => {
                                                const newQty = currentQuantity - 1;
                                                if (newQty >= 1) {
                                                  setMemorabiliaQuantities(prev => ({ ...prev, [groupKey]: newQty }));
                                                  updateMemorabiliaQuantity(game.id, group, newQty);
                                                }
                                              }}
                                              className="bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded text-xs font-bold"
                                              disabled={currentQuantity <= 1}
                                            >
                                              -
                                            </button>
                                            <input
                                              type="number"
                                              min="1"
                                              value={currentQuantity}
                                              onChange={(e) => {
                                                const newValue = parseInt(e.target.value) || 1;
                                                setMemorabiliaQuantities(prev => ({ ...prev, [groupKey]: newValue }));
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  const qty = parseInt((e.target as HTMLInputElement).value) || 1;
                                                  if (qty > 0 && qty !== group.quantity) {
                                                    updateMemorabiliaQuantity(game.id, group, qty);
                                                  }
                                                }
                                              }}
                                              className="w-12 text-center bg-white/10 text-white rounded px-1 py-0.5"
                                            />
                                            <button
                                              onClick={() => {
                                                const newQty = currentQuantity + 1;
                                                setMemorabiliaQuantities(prev => ({ ...prev, [groupKey]: newQty }));
                                                updateMemorabiliaQuantity(game.id, group, newQty);
                                              }}
                                              className="bg-green-600 hover:bg-green-700 text-white w-6 h-6 rounded text-xs font-bold"
                                            >
                                              +
                                            </button>
                                            {currentQuantity !== group.quantity && (
                                              <button
                                                onClick={() => {
                                                  if (currentQuantity > 0) {
                                                    updateMemorabiliaQuantity(game.id, group, currentQuantity);
                                                  }
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                              >
                                                Save
                                              </button>
                                            )}
                                          </div>

                                          <div className="text-xs text-gray-400 mt-2">
                                            Available: {group.items.filter((i: any) => i.status === 'AVAILABLE').length}
                                          </div>

                                          <div className="flex gap-1 mt-2 justify-end">
                                            <button
                                              onClick={() => deleteMemorabiliaGroup(game.id, group)}
                                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                              title="Delete all of this item"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              Delete All
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-3 border-t border-white/20 text-sm text-gray-300">
                                <div className="flex justify-between">
                                  <span>Total Items:</span>
                                  <span className="text-white font-medium">{editedGame.cardBreaks?.length || 0}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span>Available:</span>
                                  <span className="text-green-400 font-medium">
                                    {editedGame.cardBreaks?.filter((b: any) => b.status === 'AVAILABLE').length || 0}
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Import Tools */}
                      {isEditing && (
                        <div className="mt-6 grid lg:grid-cols-2 gap-6">
                          {/* Manual Item Entry */}
                          <ManualItemEntry
                            gameId={game.id}
                            onItemAdded={() => fetchGames()}
                          />
                          {/* Unified Memorabilia Scraper */}
                          <UnifiedScraper
                            gameId={game.id}
                            onImportComplete={() => fetchGames()}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl mb-4">No games created yet</p>
            <button
              onClick={() => router.push('/admin/inventory')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Your First Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}