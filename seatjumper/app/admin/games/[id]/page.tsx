'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LaytonImporter from '@/components/admin/LaytonImporter';
import UnifiedScraper from '@/components/admin/UnifiedScraper';
import ManualItemEntry from '@/components/admin/ManualItemEntry';
import BulkTicketUploadWithImages from '@/components/admin/BulkTicketUploadWithImages';
import { Calendar, MapPin, Ticket, Package, ArrowLeft, RefreshCw, Upload } from 'lucide-react';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const gameId = params.id as string;

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId]);

  const fetchGameDetails = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    }
    try {
      const res = await fetch('/api/admin/inventory', {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        const games = data.games || data;
        const currentGame = games.find((g: any) => g.id === gameId);
        setGame(currentGame);
      }
    } catch (error) {
      console.error('Failed to fetch game:', error);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  const handleImportComplete = () => {
    // Refresh game details after import with indicator
    fetchGameDetails(true);
  };

  const handleBulkTicketsImport = async (tickets: any[]) => {
    try {
      const res = await fetch('/api/admin/ticket-groups/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          ticketGroups: tickets
        })
      });

      if (res.ok) {
        setShowBulkUpload(false);
        fetchGameDetails(true);
      } else {
        const error = await res.json();
        alert(`Failed to import tickets: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to import tickets:', error);
      alert('Failed to import tickets');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="text-white text-center">Loading game details...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="text-white text-center">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/admin/games')}
          className="text-white mb-6 flex items-center gap-2 hover:text-yellow-400"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{game.eventName}</h1>
          <div className="flex gap-4 text-gray-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(game.eventDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {game.venue}, {game.city}, {game.state}
            </span>
          </div>
        </div>

        {refreshing && (
          <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Updating inventory...
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Ticket Inventory */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 relative">
            {refreshing && (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Ticket Inventory
            </h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                Total Groups: <span className="text-white font-semibold">{game.ticketGroups?.length || 0}</span>
              </p>
              <p className="text-gray-300">
                Average Price: <span className="text-white font-semibold">
                  ${game.avgTicketPrice?.toFixed(2) || '0.00'}
                </span>
              </p>
              <div className="mt-4 space-y-2">
                {game.ticketGroups?.slice(0, 5).map((group: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded p-2 text-sm">
                    <p className="text-white">
                      Section {group.section}, Row {group.row}
                    </p>
                    <p className="text-gray-400">
                      Quantity: {group.quantity || group.seats}
                      {' • '}
                      ${group.pricePerSeat}/seat
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Break Inventory */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 relative">
            {refreshing && (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Card Break Inventory
            </h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                Total Breaks: <span className="text-white font-semibold">{game.cardBreaks?.length || 0}</span>
              </p>
              <p className="text-gray-300">
                Average Value: <span className="text-white font-semibold">
                  ${game.avgBreakValue?.toFixed(2) || '0.00'}
                </span>
              </p>
              <div className="mt-4 space-y-2">
                {game.cardBreaks?.slice(0, 5).map((cb: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded p-2 text-sm">
                    <p className="text-white">{cb.breakName}</p>
                    <p className="text-gray-400">
                      {cb.teamName ? `Team: ${cb.teamName} • ` : ''}
                      ${cb.breakValue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-purple-600/20 rounded-lg p-6 border-2 border-yellow-400/50 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Current Pricing</h3>
          <div className="grid grid-cols-4 gap-4 text-white">
            <div>
              <p className="text-sm text-gray-300">Avg Ticket</p>
              <p className="text-2xl font-bold">${game.avgTicketPrice?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Avg Break</p>
              <p className="text-2xl font-bold">${game.avgBreakValue?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Your Cost</p>
              <p className="text-2xl font-bold">
                ${((game.avgTicketPrice || 0) + (game.avgBreakValue || 0)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Spin Price</p>
              <p className="text-2xl font-bold text-yellow-400">
                ${game.spinPricePerBundle?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Import Tools */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Layton Importer with Auto Refresh */}
          <LaytonImporter
            gameId={gameId}
            onImportComplete={handleImportComplete}
          />

          {/* Bulk Ticket Upload */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Bulk Ticket Upload
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Import multiple tickets at once with images from clipboard or HTML folder
            </p>
            <button
              onClick={() => setShowBulkUpload(true)}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Open Bulk Uploader
            </button>
          </div>

          {/* Unified Memorabilia Scraper */}
          <UnifiedScraper
            gameId={gameId}
            onImportComplete={handleImportComplete}
          />
        </div>

        {/* Manual Entry Tools */}
        <div className="grid lg:grid-cols-1 gap-6">
          {/* Manual Item Entry for Memorabilia */}
          <ManualItemEntry
            gameId={gameId}
            onItemAdded={handleImportComplete}
          />
        </div>

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <BulkTicketUploadWithImages
            onImport={handleBulkTicketsImport}
            onCancel={() => setShowBulkUpload(false)}
          />
        )}
      </div>
    </div>
  );
}