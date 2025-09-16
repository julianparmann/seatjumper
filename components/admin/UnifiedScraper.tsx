'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, Package, Globe, ChevronDown } from 'lucide-react';

interface UnifiedScraperProps {
  gameId?: string;
  onImportComplete?: (data: any) => void;
}

type ScraperType = 'sportsmemorabilia' | 'laytonsports' | 'sportscollectibles';

interface ScraperConfig {
  id: ScraperType;
  name: string;
  icon: React.ReactNode;
  placeholder: string;
  description: string;
  apiEndpoint: string;
}

const SCRAPERS: ScraperConfig[] = [
  {
    id: 'laytonsports',
    name: 'Layton Sports Cards',
    icon: <Package className="w-4 h-4" />,
    placeholder: 'https://laytonsportscards.com/products/...',
    description: 'Import products from Layton Sports Cards (Recommended)',
    apiEndpoint: '/api/admin/import-layton'
  },
  {
    id: 'sportsmemorabilia',
    name: 'Sports Memorabilia',
    icon: <Globe className="w-4 h-4" />,
    placeholder: 'https://www.sportsmemorabilia.com/product-name',
    description: 'Import single items (May have access restrictions)',
    apiEndpoint: '/api/scrape-memorabilia'
  },
  {
    id: 'sportscollectibles',
    name: 'Sports Collectibles',
    icon: <Package className="w-4 h-4" />,
    placeholder: 'https://www.sportscollectibles.com/category...',
    description: 'Import bulk items (Requires Playwright)',
    apiEndpoint: '/api/admin/scrape-memorabilia'
  }
];

export default function UnifiedScraper({ gameId, onImportComplete }: UnifiedScraperProps) {
  const [selectedScraper, setSelectedScraper] = useState<ScraperType>('laytonsports');
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentScraper = SCRAPERS.find(s => s.id === selectedScraper)!;

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

      let response: Response;
      let requestBody: any = {
        gameId,
        urls: urlArray
      };

      // Handle different API endpoints and request formats
      if (selectedScraper === 'sportsmemorabilia') {
        // Sports Memorabilia expects a single URL
        response = await fetch(currentScraper.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlArray[0],
            gameId
          })
        });
      } else if (selectedScraper === 'laytonsports') {
        // Layton expects URLs array
        response = await fetch(currentScraper.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } else {
        // Sports Collectibles
        response = await fetch(currentScraper.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...requestBody,
            updateExisting: true
          })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error || 'Failed to import items';
        throw new Error(errorMessage);
      }

      setResult(data);
      if (onImportComplete) {
        onImportComplete(data);
      }

      // Clear URLs after successful import
      setUrls('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Import Memorabilia</h2>
        </div>

        {/* Scraper Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 min-w-[200px]"
          >
            {currentScraper.icon}
            <span className="flex-1 text-left">{currentScraper.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
              {SCRAPERS.map((scraper) => (
                <button
                  key={scraper.id}
                  onClick={() => {
                    setSelectedScraper(scraper.id);
                    setDropdownOpen(false);
                    setUrls('');
                    setResult(null);
                    setError(null);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 ${
                    scraper.id === selectedScraper ? 'bg-gray-700/50' : ''
                  }`}
                >
                  {scraper.icon}
                  <div className="flex-1">
                    <div className="text-white font-medium">{scraper.name}</div>
                    <div className="text-gray-400 text-xs">{scraper.description}</div>
                  </div>
                  {scraper.id === selectedScraper && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {selectedScraper === 'sportsmemorabilia' ? 'Product URL' : 'URLs (one per line)'}
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={currentScraper.placeholder}
            className="w-full h-32 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            {currentScraper.description}
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
              Importing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Import Items
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
              <span className="font-semibold">Successfully imported items!</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              {/* Handle different result formats */}
              {result.itemsCreated && <p>• Items Created: {result.itemsCreated}</p>}
              {result.data && (
                <>
                  <p>• Item Name: {result.data.name}</p>
                  {result.data.price && <p>• Price: ${result.data.price}</p>}
                </>
              )}
              {result.inventory && (
                <>
                  <p>• Total Items Found: {result.inventory.totalItems}</p>
                  <p>• Available Items: {result.inventory.availableItems}</p>
                  <p>• Average Price: ${result.inventory.averagePrice?.toFixed(2)}</p>
                </>
              )}
              {result.importedItems && (
                <>
                  <p>• Items Imported: {result.importedItems.length}</p>
                  <p>• Total Value: ${result.importedItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0).toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}