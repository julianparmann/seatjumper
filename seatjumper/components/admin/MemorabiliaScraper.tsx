'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, Package } from 'lucide-react';

interface MemorabiliaScraperProps {
  gameId?: string;
  onImportComplete?: (data: any) => void;
}

export default function MemorabiliaScraper({ gameId, onImportComplete }: MemorabiliaScraperProps) {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!gameId) {
      setError('No game selected');
      return;
    }

    if (!urls.trim()) {
      setError('Please enter at least one URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse URLs (one per line)
      const urlArray = urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const response = await fetch('/api/admin/scrape-memorabilia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          urls: urlArray,
          updateExisting: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape memorabilia');
      }

      setResult(data);
      if (onImportComplete) {
        onImportComplete(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Package className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Import Memorabilia from Sports Collectibles</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sports Collectibles URLs (one per line)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://www.sportscollectibles.com/autographed_trading_cards_c9931.htm"
            className="w-full h-32 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter URLs from sportscollectibles.com - one URL per line
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={loading || !gameId}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scraping Memorabilia...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Import Memorabilia
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-300 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Successfully imported memorabilia!</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Items Created: {result.itemsCreated}</p>
              {result.inventory && (
                <>
                  <p>• Total Items Found: {result.inventory.totalItems}</p>
                  <p>• Available Items: {result.inventory.availableItems}</p>
                  <p>• Average Price: ${result.inventory.averagePrice?.toFixed(2)}</p>
                </>
              )}
              {result.scrapedData && result.scrapedData.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="font-semibold mb-2">Pages Scraped:</p>
                  {result.scrapedData.map((page: any, idx: number) => (
                    <div key={idx} className="ml-4 text-xs">
                      <p>• {page.title || `Page ${idx + 1}`}</p>
                      <p className="ml-4 text-gray-400">
                        {page.availableItems} available / {page.totalItems} total
                        {page.itemsWithImages > 0 && ` • ${page.itemsWithImages} with images`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}