'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Users, Play, Pause, Trash2, Edit, Ticket, Package, RefreshCw, Plus, Save, X, ChevronDown, ChevronUp, Copy, Gift, Upload, Crown, Star, Image } from 'lucide-react';
import UnifiedScraper from '@/components/admin/UnifiedScraper';
import ManualItemEntry from '@/components/admin/ManualItemEntry';
import ImageUpload from '@/components/admin/ImageUpload';
import TicketImageManager from '@/components/admin/TicketImageManager';
import BulkTicketUploadWithImages from '@/components/admin/BulkTicketUploadWithImages';
import BulkMemorabiliaUploadWithImages from '@/components/admin/BulkMemorabiliaUploadWithImages';
import TierBadge from '@/components/tickets/TierBadge';
import { TierLevel } from '@prisma/client';
import { classifyTicketTier } from '@/lib/utils/ticket-classifier';
import { classifyMemorabiliaier, getMemorabiliaPacksByTier } from '@/lib/utils/memorabilia-parser';

interface TicketGroup {
  id: string;
  section: string;
  row: string;
  quantity: number;
  pricePerSeat: number;
  status: string;
  notes?: string;
  seatViewUrl?: string;
  seatViewUrl2?: string;
  seatViewUrl3?: string;
  primaryImageIndex?: number;
  tierLevel?: TierLevel;
  tierPriority?: number;
  availableUnits?: number[];
  availablePacks?: string[];
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
  availablePacks?: string[];
  tierLevel?: string;
  tierPriority?: number;
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
  const [showBulkUpload, setShowBulkUpload] = useState<{ [gameId: string]: boolean }>({});
  const [showBulkMemorabiliaUpload, setShowBulkMemorabiliaUpload] = useState<{ [gameId: string]: boolean }>({});
  const [showImageManager, setShowImageManager] = useState<{ [ticketId: string]: boolean }>({});

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

  const fetchSingleGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/admin/games/${gameId}`);
      if (res.ok) {
        const freshGame = await res.json();
        // Update the game in the games array
        setGames(prevGames =>
          prevGames.map(g => g.id === gameId ? freshGame : g)
        );
        return freshGame;
      }
    } catch (error) {
      console.error('Failed to fetch game:', error);
    }
    return null;
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

  const updateTicketGroup = async (groupId: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/ticket-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        // Refresh the games list to get updated data
        fetchGames();
        return true;
      } else {
        console.error('Failed to update ticket group');
        return false;
      }
    } catch (error) {
      console.error('Failed to update ticket group:', error);
      return false;
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
    // Legacy ticketGroups support - check if exists
    const groupTickets = (game.ticketGroups || []).reduce((sum, group) => sum + (group.quantity || 0), 0);
    return levelTickets + groupTickets;
  };

  // Calculate available bundles
  const getAvailableBundles = (game: DailyGame) => {
    const totalTickets = getTotalTickets(game);
    const totalBreaks = (game.cardBreaks || []).filter((cb: any) => cb.status === 'AVAILABLE').length;
    return Math.min(totalTickets, totalBreaks);
  };

  const handleBulkMemorabiliaImport = async (gameId: string, items: any[]) => {
    try {
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
                gameId,
                breakName: item.name,
                breakValue: item.value || 0,
                description: item.description || item.name,
                imageUrl: item.imageUrl,
                itemType: 'memorabilia',
                quantity: 1,
                tierLevel: item.tierLevel,
                tierPriority: item.tierPriority,
                availableUnits: item.availableUnits || [1, 2, 3, 4],
                availablePacks: item.availablePacks || ['blue', 'red', 'gold']
              })
            });
            if (res.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        alert(`Successfully added ${successCount} memorabilia items${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
        setShowBulkMemorabiliaUpload({ ...showBulkMemorabiliaUpload, [gameId]: false });
        fetchGames();
      } else {
        alert('Failed to add memorabilia items');
      }
    } catch (error) {
      console.error('Failed to import memorabilia:', error);
      alert('Failed to import memorabilia');
    }
  };

  // Helper to get total prizes
  const getTotalPrizes = (game: DailyGame) => {
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
                      <p className="text-gray-400 text-xs mb-1">Total Tickets / Avg Price</p>
                      <p className="text-white text-xl font-bold">
                        {(() => {
                          const prices: number[] = [];
                          let count = 0;

                          // Calculate from ticket groups
                          editedGame.ticketGroups?.forEach(group => {
                            if (group.status === 'AVAILABLE') {
                              for (let i = 0; i < group.quantity; i++) {
                                prices.push(group.pricePerSeat);
                                count++;
                              }
                            }
                          });

                          // Calculate from ticket levels
                          editedGame.ticketLevels?.forEach(level => {
                            if (level.quantity > 0) {
                              for (let i = 0; i < level.quantity; i++) {
                                prices.push(level.pricePerSeat);
                                count++;
                              }
                            }
                          });

                          const avg = count > 0 ? prices.reduce((a, b) => a + b, 0) / count : 0;
                          return `${count} / $${avg.toFixed(2)}`;
                        })()}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Avg Break Value</p>
                      <p className="text-white text-xl font-bold">
                        ${game.avgBreakValue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Recommended Spin Price</p>
                      <p className="text-yellow-400 text-xl font-bold">
                        ${(() => {
                          const prices: number[] = [];
                          let count = 0;

                          // Calculate from ticket groups
                          editedGame.ticketGroups?.forEach(group => {
                            if (group.status === 'AVAILABLE') {
                              for (let i = 0; i < group.quantity; i++) {
                                prices.push(group.pricePerSeat);
                                count++;
                              }
                            }
                          });

                          // Calculate from ticket levels
                          editedGame.ticketLevels?.forEach(level => {
                            if (level.quantity > 0) {
                              for (let i = 0; i < level.quantity; i++) {
                                prices.push(level.pricePerSeat);
                                count++;
                              }
                            }
                          });

                          const avg = count > 0 ? prices.reduce((a, b) => a + b, 0) / count : 0;
                          // Recommended price is 130% of average value (30% margin)
                          const recommendedPrice = avg * 1.3;
                          return recommendedPrice.toFixed(2);
                        })()}
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
                        onClick={async () => {
                          // Fetch fresh data before entering edit mode
                          const freshGame = await fetchSingleGame(game.id);
                          if (freshGame) {
                            setEditingGame(game.id);
                            setEditedGames({ ...editedGames, [game.id]: freshGame });
                            setExpandedGame(game.id);
                          }
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
                      {/* Pack Pricing Calculations */}
                      {isEditing && (
                        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/30">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" /> Pack Pricing Calculations
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Blue Pack Calculation */}
                            <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/50">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">B</span>
                                </div>
                                <h4 className="text-blue-300 font-semibold">Blue Pack (${(() => {
                                  const allItems = [...(editedGame.ticketLevels || []), ...(editedGame.ticketGroups || [])];
                                  const blueItems = allItems.filter(item => {
                                    const packs = item.availablePacks || ['blue', 'red', 'gold'];
                                    return packs.includes('blue') && item.quantity > 0;
                                  });
                                  const bluePrices = blueItems.map(item => item.pricePerSeat || 0);
                                  const blueQuantities = blueItems.map(item => item.quantity || 0);
                                  const totalValue = bluePrices.reduce((sum, price, i) => sum + price * blueQuantities[i], 0);
                                  const totalQty = blueQuantities.reduce((sum, qty) => sum + qty, 0);
                                  const avgValue = totalQty > 0 ? totalValue / totalQty : 0;
                                  return Math.round(avgValue * 1.3);
                                })()})</h4>
                              </div>
                              {(() => {
                                const bluePrices: number[] = [];
                                let blueCount = 0;

                                // Calculate from ticket groups
                                editedGame.ticketGroups?.forEach(group => {
                                  const packs = group.availablePacks as string[] | undefined;
                                  // If undefined, treat as all packs. Otherwise check if blue is included
                                  if ((!packs || packs.includes('blue')) && group.status === 'AVAILABLE') {
                                    for (let i = 0; i < group.quantity; i++) {
                                      bluePrices.push(group.pricePerSeat);
                                      blueCount++;
                                    }
                                  }
                                });

                                // Calculate from ticket levels
                                editedGame.ticketLevels?.forEach(level => {
                                  const packs = level.availablePacks as string[] | undefined;
                                  // If undefined, treat as all packs. Otherwise check if blue is included
                                  if ((!packs || packs.includes('blue')) && level.quantity > 0) {
                                    for (let i = 0; i < level.quantity; i++) {
                                      bluePrices.push(level.pricePerSeat);
                                      blueCount++;
                                    }
                                  }
                                });

                                const avgValue = blueCount > 0 ? bluePrices.reduce((a, b) => a + b, 0) / blueCount : 0;
                                const recommendedPrice = avgValue * 1.3;
                                const margin = recommendedPrice > 0 ? ((recommendedPrice - avgValue) / recommendedPrice * 100) : 0;

                                return (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-300">
                                      <span>Tickets:</span>
                                      <span className="font-semibold">{blueCount}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                      <span>Avg Value:</span>
                                      <span className="font-semibold">${avgValue.toFixed(0)}</span>
                                    </div>
                                    <div className={`flex justify-between font-semibold ${margin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      <span>Margin:</span>
                                      <span>{margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-blue-300">
                                      <span>Rec. Price:</span>
                                      <span className="font-semibold">${recommendedPrice.toFixed(0)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-blue-500/30">
                                      <p className="text-blue-200 text-xs">All available seats</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Red Pack Calculation */}
                            <div className="bg-red-600/20 rounded-lg p-4 border border-red-500/50">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">R</span>
                                </div>
                                <h4 className="text-red-300 font-semibold">Red Pack (${(() => {
                                  const allItems = [...(editedGame.ticketLevels || []), ...(editedGame.ticketGroups || [])];
                                  const redItems = allItems.filter(item => {
                                    const packs = item.availablePacks || ['blue', 'red', 'gold'];
                                    return packs.includes('red') && item.quantity > 0;
                                  });
                                  const redPrices = redItems.map(item => item.pricePerSeat || 0);
                                  const redQuantities = redItems.map(item => item.quantity || 0);
                                  const totalValue = redPrices.reduce((sum, price, i) => sum + price * redQuantities[i], 0);
                                  const totalQty = redQuantities.reduce((sum, qty) => sum + qty, 0);
                                  const avgValue = totalQty > 0 ? totalValue / totalQty : 0;
                                  return Math.round(avgValue * 1.3);
                                })()})</h4>
                              </div>
                              {(() => {
                                const redPrices: number[] = [];
                                let redCount = 0;

                                // Calculate from ticket groups
                                editedGame.ticketGroups?.forEach(group => {
                                  const packs = group.availablePacks as string[] | undefined;
                                  // If undefined, treat as all packs. Otherwise check if red is included
                                  if ((!packs || packs.includes('red')) && group.status === 'AVAILABLE') {
                                    for (let i = 0; i < group.quantity; i++) {
                                      redPrices.push(group.pricePerSeat);
                                      redCount++;
                                    }
                                  }
                                });

                                // Calculate from ticket levels
                                editedGame.ticketLevels?.forEach(level => {
                                  const packs = level.availablePacks as string[] | undefined;
                                  // If undefined, treat as all packs. Otherwise check if red is included
                                  if ((!packs || packs.includes('red')) && level.quantity > 0) {
                                    for (let i = 0; i < level.quantity; i++) {
                                      redPrices.push(level.pricePerSeat);
                                      redCount++;
                                    }
                                  }
                                });

                                const avgValue = redCount > 0 ? redPrices.reduce((a, b) => a + b, 0) / redCount : 0;
                                const recommendedPrice = avgValue * 1.3;
                                const margin = recommendedPrice > 0 ? ((recommendedPrice - avgValue) / recommendedPrice * 100) : 0;

                                return (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-300">
                                      <span>Tickets:</span>
                                      <span className="font-semibold">{redCount}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                      <span>Avg Value:</span>
                                      <span className="font-semibold">${avgValue.toFixed(0)}</span>
                                    </div>
                                    <div className={`flex justify-between font-semibold ${margin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      <span>Margin:</span>
                                      <span>{margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-red-300">
                                      <span>Rec. Price:</span>
                                      <span className="font-semibold">${recommendedPrice.toFixed(0)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-red-500/30">
                                      <p className="text-red-200 text-xs">300 level and below</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Gold Pack Calculation */}
                            <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-500/50">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded bg-yellow-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">G</span>
                                </div>
                                <h4 className="text-yellow-300 font-semibold">Gold Pack (${(() => {
                                  const allItems = [...(editedGame.ticketLevels || []), ...(editedGame.ticketGroups || [])];
                                  const goldItems = allItems.filter(item => {
                                    const packs = item.availablePacks || ['blue', 'red', 'gold'];
                                    return packs.includes('gold') && item.quantity > 0;
                                  });
                                  const goldPrices = goldItems.map(item => item.pricePerSeat || 0);
                                  const goldQuantities = goldItems.map(item => item.quantity || 0);
                                  const totalValue = goldPrices.reduce((sum, price, i) => sum + price * goldQuantities[i], 0);
                                  const totalQty = goldQuantities.reduce((sum, qty) => sum + qty, 0);
                                  const avgValue = totalQty > 0 ? totalValue / totalQty : 0;
                                  return Math.round(avgValue * 1.3);
                                })()})</h4>
                              </div>
                              {(() => {
                                const goldPrices: number[] = [];
                                let goldCount = 0;

                                // Calculate from ticket groups
                                editedGame.ticketGroups?.forEach(group => {
                                  const packs = group.availablePacks as string[] | undefined;
                                  // If undefined, treat as all packs. Otherwise check if gold is included
                                  if ((!packs || packs.includes('gold')) && group.status === 'AVAILABLE') {
                                    for (let i = 0; i < group.quantity; i++) {
                                      goldPrices.push(group.pricePerSeat);
                                      goldCount++;
                                    }
                                  }
                                });

                                // Calculate from ticket levels
                                editedGame.ticketLevels?.forEach(level => {
                                  const packs = level.availablePacks as string[] | undefined;
                                  // If undefined, treat as all packs. Otherwise check if gold is included
                                  if ((!packs || packs.includes('gold')) && level.quantity > 0) {
                                    for (let i = 0; i < level.quantity; i++) {
                                      goldPrices.push(level.pricePerSeat);
                                      goldCount++;
                                    }
                                  }
                                });

                                const avgValue = goldCount > 0 ? goldPrices.reduce((a, b) => a + b, 0) / goldCount : 0;
                                const recommendedPrice = avgValue * 1.3;
                                const margin = recommendedPrice > 0 ? ((recommendedPrice - avgValue) / recommendedPrice * 100) : 0;

                                return (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-300">
                                      <span>Tickets:</span>
                                      <span className="font-semibold">{goldCount}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                      <span>Avg Value:</span>
                                      <span className="font-semibold">${avgValue.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                      <span>Rec. Price:</span>
                                      <span className="font-semibold">${(avgValue * 1.3).toFixed(0)}</span>
                                    </div>
                                    <div className={`flex justify-between font-semibold ${margin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      <span>Margin:</span>
                                      <span>{margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="pt-2 border-t border-yellow-500/30">
                                      <p className="text-yellow-200 text-xs">Front row guarantee</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-white/5 rounded-lg">
                            <p className="text-gray-400 text-xs">
                              <span className="text-yellow-400 font-semibold">Tip:</span> Assign tickets to packs below. Blue pack should include all seats,
                              Red pack should exclude upper deck (400+ sections), Gold pack should only include front row seats.
                            </p>
                          </div>
                        </div>
                      )}

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
                                                : currentUnits.filter((u: number) => u !== size);
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
                                  {/* Pack Assignment Checkboxes */}
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-400 mb-1">Available in packs:</p>
                                    <div className="flex gap-3">
                                      {[
                                        { id: 'blue', label: 'Blue', color: 'text-blue-400' },
                                        { id: 'red', label: 'Red', color: 'text-red-400' },
                                        { id: 'gold', label: 'Gold', color: 'text-yellow-400' }
                                      ].map(pack => (
                                        <label key={pack.id} className={`flex items-center gap-1 ${pack.color} text-xs cursor-pointer`}>
                                          <input
                                            type="checkbox"
                                            checked={(level.availablePacks || ['blue', 'red', 'gold']).includes(pack.id)}
                                            onChange={(e) => {
                                              const updatedLevels = [...(editedGame.ticketLevels || [])];
                                              const currentPacks = level.availablePacks || ['blue', 'red', 'gold'];
                                              const newPacks = e.target.checked
                                                ? [...currentPacks, pack.id].filter((v, i, a) => a.indexOf(v) === i)
                                                : currentPacks.filter((p: string) => p !== pack.id);
                                              updatedLevels[idx] = { ...level, availablePacks: newPacks };
                                              setEditedGames({
                                                ...editedGames,
                                                [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                              });
                                            }}
                                            className="w-3 h-3"
                                          />
                                          <span>{pack.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Tier Selection for Ticket Levels */}
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-400 mb-1">Tier:</p>
                                    <div className="flex gap-2">
                                      <label className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`tier-level-${level.id}`}
                                          checked={level.tierLevel === 'VIP_ITEM'}
                                          onChange={() => {
                                            // Find the highest existing VIP priority
                                            const existingVipItems = (editedGame.ticketLevels || []).filter(
                                              (l, i) => l.tierLevel === 'VIP_ITEM' && i !== idx
                                            );
                                            const highestPriority = existingVipItems.reduce(
                                              (max, item) => Math.max(max, item.tierPriority || 1),
                                              0
                                            );
                                            const newPriority = existingVipItems.length === 0 ? 1 : highestPriority + 1;

                                            const updatedLevels = [...(editedGame.ticketLevels || [])];
                                            updatedLevels[idx] = {
                                              ...level,
                                              tierLevel: 'VIP_ITEM',
                                              tierPriority: newPriority
                                            };
                                            setEditedGames({
                                              ...editedGames,
                                              [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                            });
                                          }}
                                          className="w-3 h-3"
                                        />
                                        <Crown className="w-3 h-3 text-yellow-400" />
                                        <span>VIP</span>
                                        {level.tierLevel === 'VIP_ITEM' && level.tierPriority && (
                                          <span className="text-[10px] bg-yellow-500/30 px-1 rounded">
                                            #{level.tierPriority}
                                          </span>
                                        )}
                                      </label>
                                      <label className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`tier-level-${level.id}`}
                                          checked={level.tierLevel === 'GOLD_LEVEL'}
                                          onChange={() => {
                                            const updatedLevels = [...(editedGame.ticketLevels || [])];
                                            updatedLevels[idx] = {
                                              ...level,
                                              tierLevel: 'GOLD_LEVEL',
                                              tierPriority: undefined
                                            };
                                            setEditedGames({
                                              ...editedGames,
                                              [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                            });
                                          }}
                                          className="w-3 h-3"
                                        />
                                        <Star className="w-3 h-3 text-gray-300" />
                                        <span>Gold</span>
                                      </label>
                                      <label className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`tier-level-${level.id}`}
                                          checked={level.tierLevel === 'UPPER_DECK'}
                                          onChange={() => {
                                            const updatedLevels = [...(editedGame.ticketLevels || [])];
                                            updatedLevels[idx] = {
                                              ...level,
                                              tierLevel: 'UPPER_DECK',
                                              tierPriority: undefined
                                            };
                                            setEditedGames({
                                              ...editedGames,
                                              [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                            });
                                          }}
                                          className="w-3 h-3"
                                        />
                                        <Ticket className="w-3 h-3 text-blue-400" />
                                        <span>Upper</span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* VIP Priority Field */}
                                  {level.tierLevel === 'VIP_ITEM' && (
                                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                      <p className="text-xs text-yellow-400 mb-1">VIP Priority:</p>
                                      <input
                                        type="number"
                                        min="1"
                                        value={level.tierPriority || 1}
                                        onChange={(e) => {
                                          const updatedLevels = [...(editedGame.ticketLevels || [])];
                                          updatedLevels[idx] = {
                                            ...level,
                                            tierPriority: parseInt(e.target.value) || 1
                                          };
                                          setEditedGames({
                                            ...editedGames,
                                            [game.id]: { ...editedGame, ticketLevels: updatedLevels }
                                          });
                                        }}
                                        className="w-16 px-2 py-1 bg-gray-800 text-white rounded text-xs"
                                      />
                                      <p className="text-xs text-gray-400 mt-1">
                                        {level.tierPriority === 1 ? (
                                          <>✅ Main VIP - Appears in pools</>
                                        ) : (
                                          <>🔄 Backup (Priority {level.tierPriority}) - Activates when priority {(level.tierPriority || 2) - 1} depletes</>
                                        )}
                                      </p>
                                      {/* Warning if multiple priority 1s */}
                                      {(() => {
                                        const vipItems = editedGame.ticketLevels?.filter(l => l.tierLevel === 'VIP_ITEM') || [];
                                        const mainCount = vipItems.filter(l => l.tierPriority === 1).length;
                                        if (mainCount > 1 && level.tierPriority === 1) {
                                          return (
                                            <p className="text-xs text-red-400 mt-1 font-semibold">
                                              ⚠️ Multiple items have priority 1! Only one should be main.
                                            </p>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  )}
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

                      {/* Legacy Ticket Groups Section */}
                      {game.ticketGroups && game.ticketGroups.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <Ticket className="w-5 h-5" /> Legacy Ticket Groups
                            </h3>
                            {isEditing && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setNewTicketGroups({
                                    ...newTicketGroups,
                                    [game.id]: { section: '', row: '', quantity: 1, pricePerSeat: 0 }
                                  })}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" /> Add Group
                                </button>
                                <button
                                  onClick={() => setShowBulkUpload({ ...showBulkUpload, [game.id]: true })}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                >
                                  <Upload className="w-4 h-4" /> Bulk Upload
                                </button>
                              </div>
                            )}
                          </div>

                        {/* New Ticket Group Form */}
                        {isEditing && newTicketGroup.section !== undefined && (
                          <div className="bg-white/5 rounded p-3 mb-3">
                            <div className="space-y-2">
                              {/* Labels for new ticket form */}
                              <div className="grid grid-cols-6 gap-2 text-xs text-gray-400 font-semibold">
                                <div>Section</div>
                                <div>Row</div>
                                <div>Quantity</div>
                                <div>Price</div>
                                <div>Images</div>
                                <div>Actions</div>
                              </div>
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
                                  onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0;
                                    const tierInfo = classifyTicketTier(price);
                                    setNewTicketGroups({
                                      ...newTicketGroups,
                                      [game.id]: {
                                        ...newTicketGroup,
                                        pricePerSeat: price,
                                        tierLevel: tierInfo.tierLevel,
                                        tierPriority: tierInfo.tierPriority
                                      }
                                    });
                                  }}
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

                              {/* Tier and Bundle Controls for New Ticket */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Bundle Size Availability Checkboxes */}
                                <div className="bg-white/5 rounded p-2">
                                  <p className="text-xs text-gray-400 mb-1">Available for bundle sizes:</p>
                                  <div className="flex gap-3">
                                    {[1, 2, 3, 4].map(size => (
                                      <label key={size} className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={(newTicketGroup.availableUnits || [1, 2, 3, 4]).includes(size)}
                                          onChange={(e) => {
                                            const currentUnits = newTicketGroup.availableUnits || [1, 2, 3, 4];
                                            const newUnits = e.target.checked
                                              ? [...currentUnits, size].filter((v, i, a) => a.indexOf(v) === i).sort()
                                              : currentUnits.filter(u => u !== size);
                                            setNewTicketGroups({
                                              ...newTicketGroups,
                                              [game.id]: { ...newTicketGroup, availableUnits: newUnits }
                                            });
                                          }}
                                          className="w-3 h-3"
                                        />
                                        <span>{size}x</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Tier Selection */}
                                <div className="bg-white/5 rounded p-2">
                                  <p className="text-xs text-gray-400 mb-1">Tier Level:</p>
                                  <div className="flex gap-2">
                                    {[
                                      { value: 'VIP_ITEM', label: 'VIP', icon: Crown },
                                      { value: 'GOLD_LEVEL', label: 'Gold', icon: Star },
                                      { value: 'UPPER_DECK', label: 'Upper', icon: Ticket }
                                    ].map(tier => {
                                      const Icon = tier.icon;
                                      return (
                                        <label key={tier.value} className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                          <input
                                            type="radio"
                                            name="new-tier"
                                            checked={newTicketGroup.tierLevel === tier.value}
                                            onChange={() => {
                                              const tierPriority = tier.value === 'VIP_ITEM' ? 1 : tier.value === 'GOLD_LEVEL' ? 2 : 3;
                                              setNewTicketGroups({
                                                ...newTicketGroups,
                                                [game.id]: {
                                                  ...newTicketGroup,
                                                  tierLevel: tier.value as TierLevel,
                                                  tierPriority
                                                }
                                              });
                                            }}
                                            className="w-3 h-3"
                                          />
                                          <Icon className="w-3 h-3" />
                                          <span>{tier.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Labels header for existing tickets - only show once */}
                        {editedGame.ticketGroups.length > 0 && isEditing && (
                          <div className="grid grid-cols-6 gap-2 text-xs text-gray-400 font-semibold mb-2 px-3">
                            <div>Section</div>
                            <div>Row</div>
                            <div>Quantity</div>
                            <div>Price</div>
                            <div>Images</div>
                            <div>Actions</div>
                          </div>
                        )}

                        {/* Existing Ticket Groups */}
                        {editedGame.ticketGroups.map((group: TicketGroup, idx: number) => (
                          <div key={group.id} className="bg-white/5 rounded p-3 mb-2">
                            {isEditing ? (
                              <div className="space-y-2">
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
                                    placeholder="Section"
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
                                    placeholder="Row"
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
                                    placeholder="Qty"
                                  />
                                  <input
                                    type="number"
                                    value={group.pricePerSeat}
                                    onChange={(e) => {
                                      const newPrice = parseFloat(e.target.value) || 0;
                                      const updatedGroups = [...editedGame.ticketGroups];
                                      // Auto-classify tier based on price if not manually set
                                      const tierInfo = classifyTicketTier(newPrice);
                                      updatedGroups[idx] = {
                                        ...group,
                                        pricePerSeat: newPrice,
                                        tierLevel: group.tierLevel || tierInfo.tierLevel,
                                        tierPriority: group.tierPriority || tierInfo.tierPriority
                                      };
                                      setEditedGames({
                                        ...editedGames,
                                        [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                      });
                                    }}
                                    className="p-2 bg-white/20 rounded text-white text-sm"
                                    placeholder="Price"
                                  />
                                  <button
                                    onClick={() => setShowImageManager({ ...showImageManager, [group.id]: !showImageManager[group.id] })}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-sm flex items-center justify-center gap-1"
                                  >
                                    <Image className="w-4 h-4" />
                                    {group.seatViewUrl || group.seatViewUrl2 || group.seatViewUrl3 ? 'Edit' : 'Add'}
                                  </button>
                                  <button
                                    onClick={() => deleteTicketGroup(group.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                  >
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                  </button>
                                </div>

                                {/* Tier and Bundle Controls */}
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Bundle Size Availability Checkboxes */}
                                  <div className="bg-white/5 rounded p-2">
                                    <p className="text-xs text-gray-400 mb-1">Available for bundle sizes:</p>
                                    <div className="flex gap-3">
                                      {[1, 2, 3, 4].map(size => (
                                        <label key={size} className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={(group.availableUnits || [1, 2, 3, 4]).includes(size)}
                                            onChange={(e) => {
                                              const updatedGroups = [...editedGame.ticketGroups];
                                              const currentUnits = group.availableUnits || [1, 2, 3, 4];
                                              const newUnits = e.target.checked
                                                ? [...currentUnits, size].filter((v, i, a) => a.indexOf(v) === i).sort()
                                                : currentUnits.filter((u: number) => u !== size);
                                              updatedGroups[idx] = { ...group, availableUnits: newUnits };
                                              setEditedGames({
                                                ...editedGames,
                                                [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                              });
                                            }}
                                            className="w-3 h-3"
                                          />
                                          <span>{size}x</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Tier Selection */}
                                  <div className="bg-white/5 rounded p-2">
                                    <p className="text-xs text-gray-400 mb-1">Tier Level:</p>
                                    <div className="flex gap-2">
                                      {[
                                        { value: 'VIP_ITEM', label: 'VIP', icon: Crown },
                                        { value: 'GOLD_LEVEL', label: 'Gold', icon: Star },
                                        { value: 'UPPER_DECK', label: 'Upper', icon: Ticket }
                                      ].map(tier => {
                                        const Icon = tier.icon;
                                        return (
                                          <label key={tier.value} className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`tier-${group.id}`}
                                              checked={group.tierLevel === tier.value}
                                              onChange={() => {
                                                const updatedGroups = [...editedGame.ticketGroups];
                                                let tierPriority: number | undefined;

                                                if (tier.value === 'VIP_ITEM') {
                                                  // Find the highest existing VIP priority across both groups and levels
                                                  const existingVipGroups = editedGame.ticketGroups.filter(
                                                    (g, i) => g.tierLevel === 'VIP_ITEM' && i !== idx
                                                  );
                                                  const existingVipLevels = (editedGame.ticketLevels || []).filter(
                                                    l => l.tierLevel === 'VIP_ITEM'
                                                  );
                                                  const allVipItems = [...existingVipGroups, ...existingVipLevels];
                                                  const highestPriority = allVipItems.reduce(
                                                    (max, item) => Math.max(max, item.tierPriority || 1),
                                                    0
                                                  );
                                                  tierPriority = allVipItems.length === 0 ? 1 : highestPriority + 1;
                                                } else {
                                                  tierPriority = undefined;
                                                }

                                                updatedGroups[idx] = {
                                                  ...group,
                                                  tierLevel: tier.value as TierLevel,
                                                  tierPriority
                                                };
                                                setEditedGames({
                                                  ...editedGames,
                                                  [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                                });
                                              }}
                                              className="w-3 h-3"
                                            />
                                            <Icon className="w-3 h-3" />
                                            <span>{tier.label}</span>
                                            {group.tierLevel === 'VIP_ITEM' && tier.value === 'VIP_ITEM' && group.tierPriority && (
                                              <span className="text-[10px] bg-yellow-500/30 px-1 rounded">
                                                #{group.tierPriority}
                                              </span>
                                            )}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* VIP Priority Field for Ticket Groups */}
                                  {group.tierLevel === 'VIP_ITEM' && (
                                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                      <p className="text-xs text-yellow-400 mb-1">VIP Priority:</p>
                                      <input
                                        type="number"
                                        min="1"
                                        value={group.tierPriority || 1}
                                        onChange={(e) => {
                                          const updatedGroups = [...editedGame.ticketGroups];
                                          updatedGroups[idx] = {
                                            ...group,
                                            tierPriority: parseInt(e.target.value) || 1
                                          };
                                          setEditedGames({
                                            ...editedGames,
                                            [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                          });
                                        }}
                                        className="w-16 px-2 py-1 bg-gray-800 text-white rounded text-xs"
                                      />
                                      <p className="text-xs text-gray-400 mt-1">
                                        {group.tierPriority === 1 ? (
                                          <>✅ Main VIP - Appears in pools</>
                                        ) : (
                                          <>🔄 Backup (Priority {group.tierPriority})</>
                                        )}
                                      </p>
                                    </div>
                                  )}

                                  {/* Pack Assignment Checkboxes for Ticket Groups */}
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-400 mb-1">Available in packs:</p>
                                    <div className="flex gap-3">
                                      {[
                                        { id: 'blue', label: 'Blue', color: 'text-blue-400' },
                                        { id: 'red', label: 'Red', color: 'text-red-400' },
                                        { id: 'gold', label: 'Gold', color: 'text-yellow-400' }
                                      ].map(pack => (
                                        <label key={pack.id} className={`flex items-center gap-1 ${pack.color} text-xs cursor-pointer`}>
                                          <input
                                            type="checkbox"
                                            checked={(group.availablePacks || ['blue', 'red', 'gold']).includes(pack.id)}
                                            onChange={(e) => {
                                              const updatedGroups = [...editedGame.ticketGroups];
                                              const currentPacks = group.availablePacks || ['blue', 'red', 'gold'];
                                              const newPacks = e.target.checked
                                                ? [...currentPacks, pack.id].filter((v, i, a) => a.indexOf(v) === i)
                                                : currentPacks.filter((p: string) => p !== pack.id);
                                              updatedGroups[idx] = { ...group, availablePacks: newPacks };
                                              setEditedGames({
                                                ...editedGames,
                                                [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                              });
                                            }}
                                            className="w-3 h-3"
                                          />
                                          <span>{pack.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Image Manager */}
                                {showImageManager[group.id] && (
                                  <div className="mt-3">
                                    <TicketImageManager
                                      ticketId={group.id}
                                      section={group.section}
                                      row={group.row}
                                      seatViewUrl={group.seatViewUrl}
                                      seatViewUrl2={group.seatViewUrl2}
                                      seatViewUrl3={group.seatViewUrl3}
                                      primaryImageIndex={group.primaryImageIndex}
                                      onUpdate={async (updates) => {
                                        if (isEditing) {
                                          // In edit mode, update local state
                                          const updatedGroups = [...editedGame.ticketGroups];
                                          updatedGroups[idx] = { ...group, ...updates };
                                          setEditedGames({
                                            ...editedGames,
                                            [game.id]: { ...editedGame, ticketGroups: updatedGroups }
                                          });
                                        } else {
                                          // Not in edit mode, update via API immediately
                                          await updateTicketGroup(group.id, updates);
                                        }
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Preview current images */}
                                {!showImageManager[group.id] && (group.seatViewUrl || group.seatViewUrl2 || group.seatViewUrl3) && (
                                  <div className="mt-2 flex gap-2">
                                    {group.seatViewUrl && (
                                      <img
                                        src={group.seatViewUrl}
                                        alt="View 1"
                                        className={`h-16 rounded ${group.primaryImageIndex === 1 || (!group.primaryImageIndex && group.seatViewUrl) ? 'border-2 border-yellow-500' : 'border border-gray-600'}`}
                                        title={group.primaryImageIndex === 1 || (!group.primaryImageIndex && group.seatViewUrl) ? 'Primary' : 'View 1'}
                                      />
                                    )}
                                    {group.seatViewUrl2 && (
                                      <img
                                        src={group.seatViewUrl2}
                                        alt="View 2"
                                        className={`h-16 rounded ${group.primaryImageIndex === 2 ? 'border-2 border-yellow-500' : 'border border-gray-600'}`}
                                        title={group.primaryImageIndex === 2 ? 'Primary' : 'View 2'}
                                      />
                                    )}
                                    {group.seatViewUrl3 && (
                                      <img
                                        src={group.seatViewUrl3}
                                        alt="View 3"
                                        className={`h-16 rounded ${group.primaryImageIndex === 3 ? 'border-2 border-yellow-500' : 'border border-gray-600'}`}
                                        title={group.primaryImageIndex === 3 ? 'Primary' : 'View 3'}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-white">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span>Section {group.section}, Row {group.row}</span>
                                    {group.tierLevel && (
                                      <TierBadge tierLevel={group.tierLevel} size="sm" showLabel={false} />
                                    )}
                                  </div>
                                  <span>{group.quantity} seats @ ${group.pricePerSeat}/ea</span>
                                  <span className="text-gray-400">Total: ${(group.quantity * group.pricePerSeat).toFixed(2)}</span>
                                </div>
                                {group.availableUnits && group.availableUnits.length < 4 && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Available for: {group.availableUnits.map((u: number) => `${u}x`).join(', ')}
                                  </div>
                                )}
                                {(group.seatViewUrl || group.seatViewUrl2 || group.seatViewUrl3) && (
                                  <div className="flex gap-2 mt-2">
                                    {group.seatViewUrl && (
                                      <img
                                        src={group.seatViewUrl}
                                        alt="View 1"
                                        className={`h-12 rounded ${group.primaryImageIndex === 1 || (!group.primaryImageIndex && group.seatViewUrl) ? 'border border-yellow-500' : 'border border-gray-600'}`}
                                        title={group.primaryImageIndex === 1 || (!group.primaryImageIndex && group.seatViewUrl) ? 'Primary' : 'View 1'}
                                      />
                                    )}
                                    {group.seatViewUrl2 && (
                                      <img
                                        src={group.seatViewUrl2}
                                        alt="View 2"
                                        className={`h-12 rounded ${group.primaryImageIndex === 2 ? 'border border-yellow-500' : 'border border-gray-600'}`}
                                        title={group.primaryImageIndex === 2 ? 'Primary' : 'View 2'}
                                      />
                                    )}
                                    {group.seatViewUrl3 && (
                                      <img
                                        src={group.seatViewUrl3}
                                        alt="View 3"
                                        className={`h-12 rounded ${group.primaryImageIndex === 3 ? 'border border-yellow-500' : 'border border-gray-600'}`}
                                        title={group.primaryImageIndex === 3 ? 'Primary' : 'View 3'}
                                      />
                                    )}
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
                            <div className="flex gap-2">
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
                                        value: '',
                                        quantity: 1,
                                        imageUrl: '',
                                        tierLevel: null,
                                        tierPriority: 1,
                                        availableUnits: [1, 2, 3, 4],
                                        availablePacks: ['blue', 'red', 'gold']
                                      }]
                                    });
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Add Items
                              </button>
                              <button
                                onClick={() => setShowBulkMemorabiliaUpload({ ...showBulkMemorabiliaUpload, [game.id]: true })}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                              >
                                <Upload className="w-4 h-4" /> Bulk Upload
                              </button>
                            </div>
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
                                      const value = parseFloat(e.target.value) || '';
                                      updated[index] = { ...updated[index], value };

                                      // Auto-classify tier based on value
                                      if (value && typeof value === 'number') {
                                        const classification = classifyMemorabiliaier(value);
                                        updated[index].tierLevel = classification.tierLevel;
                                        updated[index].tierPriority = classification.tierPriority;
                                        updated[index].availablePacks = getMemorabiliaPacksByTier(classification.tierLevel);
                                      }

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

                                {/* Tier and Pack Controls */}
                                <div className="mt-3 p-3 bg-white/5 rounded">
                                  {/* Tier Selection */}
                                  <div className="mb-3">
                                    <label className="text-xs text-gray-400 block mb-1">Tier Level</label>
                                    <div className="flex gap-2">
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="radio"
                                          checked={item.tierLevel === 'VIP_ITEM'}
                                          onChange={() => {
                                            const updated = [...(newMemorabiliaItems[game.id] || [])];
                                            updated[index] = {
                                              ...updated[index],
                                              tierLevel: 'VIP_ITEM',
                                              tierPriority: 1,
                                              availablePacks: ['gold']
                                            };
                                            setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                          }}
                                        />
                                        <Crown className="w-3 h-3 text-yellow-400" /> VIP
                                      </label>
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="radio"
                                          checked={item.tierLevel === 'GOLD_LEVEL'}
                                          onChange={() => {
                                            const updated = [...(newMemorabiliaItems[game.id] || [])];
                                            updated[index] = {
                                              ...updated[index],
                                              tierLevel: 'GOLD_LEVEL',
                                              tierPriority: 1,
                                              availablePacks: ['red', 'gold']
                                            };
                                            setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                          }}
                                        />
                                        <Star className="w-3 h-3 text-amber-400" /> Gold
                                      </label>
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="radio"
                                          checked={item.tierLevel === 'UPPER_DECK'}
                                          onChange={() => {
                                            const updated = [...(newMemorabiliaItems[game.id] || [])];
                                            updated[index] = {
                                              ...updated[index],
                                              tierLevel: 'UPPER_DECK',
                                              tierPriority: 1,
                                              availablePacks: ['blue', 'red', 'gold']
                                            };
                                            setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                          }}
                                        />
                                        <Ticket className="w-3 h-3 text-gray-400" /> Upper
                                      </label>
                                    </div>
                                  </div>

                                  {/* Pack Availability */}
                                  <div className="mb-3">
                                    <label className="text-xs text-gray-400 block mb-1">Available in Packs</label>
                                    <div className="flex gap-2">
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={item.availablePacks?.includes('blue')}
                                          onChange={(e) => {
                                            const updated = [...(newMemorabiliaItems[game.id] || [])];
                                            const packs = updated[index].availablePacks || [];
                                            if (e.target.checked) {
                                              updated[index].availablePacks = [...new Set([...packs, 'blue'])];
                                            } else {
                                              updated[index].availablePacks = packs.filter((p: string) => p !== 'blue');
                                            }
                                            setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                          }}
                                        />
                                        Blue
                                      </label>
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={item.availablePacks?.includes('red')}
                                          onChange={(e) => {
                                            const updated = [...(newMemorabiliaItems[game.id] || [])];
                                            const packs = updated[index].availablePacks || [];
                                            if (e.target.checked) {
                                              updated[index].availablePacks = [...new Set([...packs, 'red'])];
                                            } else {
                                              updated[index].availablePacks = packs.filter((p: string) => p !== 'red');
                                            }
                                            setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                          }}
                                        />
                                        Red
                                      </label>
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={item.availablePacks?.includes('gold')}
                                          onChange={(e) => {
                                            const updated = [...(newMemorabiliaItems[game.id] || [])];
                                            const packs = updated[index].availablePacks || [];
                                            if (e.target.checked) {
                                              updated[index].availablePacks = [...new Set([...packs, 'gold'])];
                                            } else {
                                              updated[index].availablePacks = packs.filter((p: string) => p !== 'gold');
                                            }
                                            setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                          }}
                                        />
                                        Gold
                                      </label>
                                    </div>
                                  </div>

                                  {/* Bundle Size Availability */}
                                  <div>
                                    <label className="text-xs text-gray-400 block mb-1">Available for Bundle Sizes</label>
                                    <div className="flex gap-2">
                                      {[1, 2, 3, 4].map(size => (
                                        <label key={size} className="flex items-center gap-1 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={item.availableUnits?.includes(size)}
                                            onChange={(e) => {
                                              const updated = [...(newMemorabiliaItems[game.id] || [])];
                                              const units = updated[index].availableUnits || [];
                                              if (e.target.checked) {
                                                updated[index].availableUnits = [...new Set([...units, size])];
                                              } else {
                                                updated[index].availableUnits = units.filter((u: number) => u !== size);
                                              }
                                              setNewMemorabiliaItems({ ...newMemorabiliaItems, [game.id]: updated });
                                            }}
                                          />
                                          {size}x
                                        </label>
                                      ))}
                                    </div>
                                  </div>
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
                                            breakValue: item.value || 0,
                                            description: item.description || item.name,
                                            imageUrl: item.imageUrl,
                                            itemType: 'memorabilia',
                                            quantity: 1,
                                            tierLevel: item.tierLevel,
                                            tierPriority: item.tierPriority || 1,
                                            availableUnits: item.availableUnits || [1, 2, 3, 4],
                                            availablePacks: item.availablePacks || ['blue', 'red', 'gold']
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

                        {/* Group breaks by unique item (name + value) and tier */}
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

                          const itemGroups = Object.values(uniqueItems) as any[];

                          if (itemGroups.length === 0) {
                            return <p className="text-gray-400 text-center py-2">No memorabilia yet</p>;
                          }

                          // Group items by tier
                          const vipItems = itemGroups.filter(g => g.tierLevel === 'VIP_ITEM');
                          const goldItems = itemGroups.filter(g => g.tierLevel === 'GOLD_LEVEL');
                          const upperItems = itemGroups.filter(g => g.tierLevel === 'UPPER_DECK');
                          const untieredItems = itemGroups.filter(g => !g.tierLevel);

                          // Sort VIP items by priority
                          vipItems.sort((a: any, b: any) => (a.tierPriority || 1) - (b.tierPriority || 1));

                          // Combine all tier groups for display
                          const tierGroups = [
                            { items: vipItems, title: 'VIP Pool', icon: Crown, color: 'purple', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-900/10', textColor: 'text-purple-400' },
                            { items: goldItems, title: 'Gold Level', icon: Star, color: 'amber', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-900/10', textColor: 'text-amber-400' },
                            { items: upperItems, title: 'Upper Deck', icon: Ticket, color: 'gray', borderColor: 'border-gray-500/30', bgColor: 'bg-gray-900/10', textColor: 'text-gray-400' },
                            { items: untieredItems, title: 'Unassigned', icon: null, color: 'gray', borderColor: 'border-gray-600/30', bgColor: 'bg-gray-800/10', textColor: 'text-gray-500' }
                          ];

                          return (
                            <>
                              <div className="max-h-96 overflow-y-auto space-y-4">
                                {tierGroups.map((tierGroup, tierIndex) => {
                                  if (tierGroup.items.length === 0) return null;
                                  const Icon = tierGroup.icon;

                                  return (
                                    <div key={tierIndex} className={`border ${tierGroup.borderColor} rounded-lg p-3 ${tierGroup.bgColor}`}>
                                      <h4 className={`text-sm font-bold ${tierGroup.textColor} mb-3 flex items-center gap-2`}>
                                        {Icon && <Icon className="w-4 h-4" />}
                                        {tierGroup.title} ({tierGroup.items.length} items)
                                      </h4>
                                      <div className="space-y-2">
                                        {tierGroup.items.map((group: any, groupIndex: number) => {
                                          // Use the normalized name for the groupKey to ensure consistency
                                          const normalizedName = (group.breakName || group.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                          const groupKey = `${game.id}_${normalizedName}_${group.breakValue}`;
                                          const currentQuantity = memorabiliaQuantities[groupKey] ?? group.quantity;

                                          return (
                                            <div key={`${game.id}_memorabilia_${groupIndex}_${normalizedName}_${group.breakValue}`} className="bg-white/5 rounded-lg p-3">
                                      <div className="flex justify-between items-start">
                                        <div className="text-white flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium">{group.teamName || group.breakName}</div>
                                            {group.tierLevel && (
                                              <TierBadge tierLevel={group.tierLevel} size="sm" showLabel={false} />
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-400 mt-1">
                                            {group.breaker} • {group.itemType || group.breakType}
                                          </div>
                                          {group.availablePacks && group.availablePacks.length < 3 && (
                                            <div className="text-xs text-gray-400 mt-1">
                                              Packs: {group.availablePacks.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                                            </div>
                                          )}
                                          {group.availableUnits && group.availableUnits.length < 4 && (
                                            <div className="text-xs text-gray-400">
                                              Bundle sizes: {group.availableUnits.map((u: number) => `${u}x`).join(', ')}
                                            </div>
                                          )}
                                          {/* Edit Mode Controls */}
                                          {isEditing && (
                                            <div className="mt-3 space-y-2">
                                              {/* VIP Priority for VIP items */}
                                              {group.tierLevel === 'VIP_ITEM' && (
                                                <div>
                                                  <p className="text-xs text-gray-400 mb-1">VIP Priority:</p>
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    value={group.tierPriority || 1}
                                                    onChange={(e) => {
                                                      const newPriority = parseInt(e.target.value) || 1;
                                                      // Update local state for all items in this group
                                                      const updatedBreaks = editedGame.cardBreaks.map((breakItem: any) => {
                                                        // Check if this break item belongs to the current group
                                                        const normalizedBreakName = (breakItem.breakName || breakItem.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                                        const normalizedGroupName = (group.breakName || group.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                                        if (normalizedBreakName === normalizedGroupName && breakItem.breakValue === group.breakValue) {
                                                          return { ...breakItem, tierPriority: newPriority };
                                                        }
                                                        return breakItem;
                                                      });
                                                      setEditedGames({
                                                        ...editedGames,
                                                        [game.id]: { ...editedGame, cardBreaks: updatedBreaks }
                                                      });
                                                    }}
                                                    className="w-16 px-2 py-1 bg-gray-800 text-white rounded text-xs"
                                                  />
                                                  <p className="text-xs text-gray-400 mt-1">
                                                    {group.tierPriority === 1 ? (
                                                      <>✅ Main VIP - Appears in pools</>
                                                    ) : (
                                                      <>🔄 Backup (Priority {group.tierPriority})</>
                                                    )}
                                                  </p>
                                                </div>
                                              )}

                                              {/* Pack Assignment Checkboxes */}
                                              <div>
                                                <p className="text-xs text-gray-400 mb-1">Available in packs:</p>
                                                <div className="flex gap-3">
                                                  {[
                                                    { id: 'blue', label: 'Blue', color: 'text-blue-400' },
                                                    { id: 'red', label: 'Red', color: 'text-red-400' },
                                                    { id: 'gold', label: 'Gold', color: 'text-yellow-400' }
                                                  ].map(pack => (
                                                    <label key={pack.id} className={`flex items-center gap-1 ${pack.color} text-xs cursor-pointer`}>
                                                      <input
                                                        type="checkbox"
                                                        checked={(group.availablePacks || ['blue', 'red', 'gold']).includes(pack.id)}
                                                        onChange={(e) => {
                                                          const currentPacks = group.availablePacks || ['blue', 'red', 'gold'];
                                                          const newPacks = e.target.checked
                                                            ? [...currentPacks, pack.id].filter((v, i, a) => a.indexOf(v) === i)
                                                            : currentPacks.filter((p: string) => p !== pack.id);

                                                          // Update local state for all items in this group
                                                          const updatedBreaks = editedGame.cardBreaks.map((breakItem: any) => {
                                                            // Check if this break item belongs to the current group
                                                            const normalizedBreakName = (breakItem.breakName || breakItem.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                                            const normalizedGroupName = (group.breakName || group.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                                            if (normalizedBreakName === normalizedGroupName && breakItem.breakValue === group.breakValue) {
                                                              return { ...breakItem, availablePacks: newPacks };
                                                            }
                                                            return breakItem;
                                                          });
                                                          setEditedGames({
                                                            ...editedGames,
                                                            [game.id]: { ...editedGame, cardBreaks: updatedBreaks }
                                                          });
                                                        }}
                                                        className="w-3 h-3"
                                                      />
                                                      <span>{pack.label}</span>
                                                    </label>
                                                  ))}
                                                </div>
                                              </div>

                                              {/* Bundle Size Checkboxes */}
                                              <div>
                                                <p className="text-xs text-gray-400 mb-1">Available for bundles:</p>
                                                <div className="flex gap-3">
                                                  {[1, 2, 3, 4].map(size => (
                                                    <label key={size} className="flex items-center gap-1 text-white text-xs cursor-pointer">
                                                      <input
                                                        type="checkbox"
                                                        checked={(group.availableUnits || [1, 2, 3, 4]).includes(size)}
                                                        onChange={(e) => {
                                                          const currentUnits = group.availableUnits || [1, 2, 3, 4];
                                                          const newUnits = e.target.checked
                                                            ? [...currentUnits, size].filter((v, i, a) => a.indexOf(v) === i).sort()
                                                            : currentUnits.filter((u: number) => u !== size);

                                                          // Update local state for all items in this group
                                                          const updatedBreaks = editedGame.cardBreaks.map((breakItem: any) => {
                                                            // Check if this break item belongs to the current group
                                                            const normalizedBreakName = (breakItem.breakName || breakItem.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                                            const normalizedGroupName = (group.breakName || group.teamName || '').replace(/\s*\(copy\)\s*/gi, '').trim();
                                                            if (normalizedBreakName === normalizedGroupName && breakItem.breakValue === group.breakValue) {
                                                              return { ...breakItem, availableUnits: newUnits };
                                                            }
                                                            return breakItem;
                                                          });
                                                          setEditedGames({
                                                            ...editedGames,
                                                            [game.id]: { ...editedGame, cardBreaks: updatedBreaks }
                                                          });
                                                        }}
                                                        className="w-3 h-3"
                                                      />
                                                      <span>{size}x</span>
                                                    </label>
                                                  ))}
                                                </div>
                                              </div>

                                              {/* Image Upload */}
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
                                          )}

                                          {/* Display image when not editing */}
                                          {!isEditing && group.imageUrl && (
                                            <img
                                              src={group.imageUrl}
                                              alt={group.breakName}
                                              className="w-16 h-16 object-cover rounded mt-2"
                                            />
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

      {/* Bulk Ticket Upload Modal */}
      {Object.entries(showBulkUpload).map(([gameId, isShowing]) => {
        if (!isShowing) return null;
        const game = games.find(g => g.id === gameId);
        if (!game) return null;

        return (
          <BulkTicketUploadWithImages
            key={gameId}
            onImport={async (ticketGroups) => {
              try {
                // Use bulk API to create all ticket groups at once
                const res = await fetch('/api/admin/ticket-groups/bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gameId,
                    ticketGroups
                  })
                });

                if (res.ok) {
                  // Refresh games to show the new ticket groups
                  await fetchGames();
                  setShowBulkUpload({ ...showBulkUpload, [gameId]: false });
                } else {
                  const error = await res.json();
                  alert('Failed to import tickets: ' + (error.error || 'Unknown error'));
                }
              } catch (error) {
                console.error('Error importing tickets:', error);
                alert('Error importing tickets');
              }
            }}
            onCancel={() => setShowBulkUpload({ ...showBulkUpload, [gameId]: false })}
          />
        );
      })}

      {/* Bulk Memorabilia Upload Modals */}
      {games.map(game => {
        const gameId = game.id;
        if (!showBulkMemorabiliaUpload[gameId]) return null;

        return (
          <BulkMemorabiliaUploadWithImages
            key={`bulk-memorabilia-${gameId}`}
            onImport={(items) => handleBulkMemorabiliaImport(gameId, items)}
            onCancel={() => setShowBulkMemorabiliaUpload({ ...showBulkMemorabiliaUpload, [gameId]: false })}
          />
        );
      })}

    </div>
  );
}