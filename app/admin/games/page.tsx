'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Users, Play, Pause, Trash2, Edit, Ticket, Package, RefreshCw, Plus, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import LaytonImporter from '@/components/admin/LaytonImporter';
import MemorabiliaScraper from '@/components/admin/MemorabiliaScraper';

interface TicketGroup {
  id: string;
  section: string;
  row: string;
  quantity: number;
  pricePerSeat: number;
  status: string;
  notes?: string;
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

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/admin/inventory');
      if (res.ok) {
        const data = await res.json();
        setGames(data);
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
    return game.ticketGroups.reduce((sum, group) => {
      return sum + (group.quantity || 0);
    }, 0);
  };

  // Calculate available bundles
  const getAvailableBundles = (game: DailyGame) => {
    const totalTickets = getTotalTickets(game);
    const totalBreaks = game.cardBreaks.filter((cb: any) => cb.status === 'AVAILABLE').length;
    return Math.min(totalTickets, totalBreaks);
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
                        <Ticket className="w-3 h-3" /> Ticket Groups
                      </p>
                      <div className="text-white text-sm mt-1">
                        <p>{game.ticketGroups.length} groups • {getTotalTickets(game)} total tickets</p>
                        {game.ticketGroups.slice(0, 2).map((group: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-300">
                            Sec {group.section}, Row {group.row}: {group.quantity || 0} seats @ ${group.pricePerSeat}
                          </p>
                        ))}
                        {game.ticketGroups.length > 2 && (
                          <p className="text-xs text-gray-400">+{game.ticketGroups.length - 2} more groups</p>
                        )}
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
                      {/* Ticket Groups Section */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Ticket className="w-5 h-5" /> Ticket Groups
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
                            <div className="grid grid-cols-5 gap-2">
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
                              <div className="grid grid-cols-5 gap-2">
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
                                <button
                                  onClick={() => deleteTicketGroup(group.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center text-white">
                                <span>Section {group.section}, Row {group.row}</span>
                                <span>{group.quantity} seats @ ${group.pricePerSeat}/ea</span>
                                <span className="text-gray-400">Total: ${(group.quantity * group.pricePerSeat).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {editedGame.ticketGroups.length === 0 && (
                          <p className="text-gray-400 text-center py-2">No ticket groups yet</p>
                        )}
                      </div>

                      {/* Memorabilia Section */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Package className="w-5 h-5" /> Memorabilia
                        </h3>

                        {/* Group breaks by source URL */}
                        {(() => {
                          const breaksByUrl = editedGame.cardBreaks?.reduce((acc: any, breakItem: any) => {
                            const url = breakItem.sourceUrl || 'Unknown Source';
                            if (!acc[url]) acc[url] = [];
                            acc[url].push(breakItem);
                            return acc;
                          }, {}) || {};

                          const urlGroups = Object.entries(breaksByUrl);

                          if (urlGroups.length === 0) {
                            return <p className="text-gray-400 text-center py-2">No memorabilia yet</p>;
                          }

                          return (
                            <>
                              <div className="max-h-96 overflow-y-auto space-y-4">
                                {urlGroups.map(([url, breaks]: [string, any]) => (
                                  <div key={url} className="bg-white/5 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="text-xs text-gray-400 truncate flex-1" title={url}>
                                        Source: {url.split('/').pop() || url}
                                      </div>
                                      <button
                                        onClick={() => deleteBreaksBySource(game.id, url)}
                                        className="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                        title="Delete all items from this source"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Delete Source
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      {breaks.map((breakItem: any) => (
                                        <div key={breakItem.id} className="bg-black/20 rounded p-2">
                                          <div className="flex justify-between items-center">
                                            <div className="text-white flex-1">
                                              <div className="text-sm font-medium">{breakItem.teamName || breakItem.breakName}</div>
                                              <div className="text-xs text-gray-400 mt-1">
                                                {breakItem.breaker} • {breakItem.breakType}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-white font-bold">${breakItem.breakValue || breakItem.spotPrice}</div>
                                              <div className={`text-xs px-2 py-1 rounded mt-1 ${
                                                breakItem.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                              }`}>
                                                {breakItem.status}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="text-xs text-gray-400 mt-2 flex justify-between">
                                        <span>Teams: {breaks.length}</span>
                                        <span>Available: {breaks.filter((b: any) => b.status === 'AVAILABLE').length}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
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
                        <div className="grid lg:grid-cols-2 gap-6">
                          {/* Layton Importer */}
                          <LaytonImporter
                            gameId={game.id}
                            onImportComplete={() => fetchGames()}
                          />

                          {/* Memorabilia Scraper */}
                          <MemorabiliaScraper
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