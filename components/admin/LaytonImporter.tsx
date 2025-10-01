'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, RefreshCw, Play, Pause } from 'lucide-react';

interface LaytonImporterProps {
  gameId?: string;
  onImportComplete?: (data: any) => void;
}

export default function LaytonImporter({ gameId, onImportComplete }: LaytonImporterProps) {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(300); // 5 minutes default
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const savedUrlsRef = useRef<string>('');

  useEffect(() => {
    if (autoRefresh && gameId && savedUrlsRef.current) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, gameId]); // Don't include refreshInterval here to avoid restart

  // Handle interval changes separately
  useEffect(() => {
    if (autoRefresh && intervalRef.current) {
      // Restart with new interval
      stopAutoRefresh();
      startAutoRefresh();
    }
  }, [refreshInterval]);

  // Update countdown every second
  useEffect(() => {
    if (nextRefresh && autoRefresh) {
      const updateCountdown = () => {
        const now = Date.now();
        const diff = nextRefresh.getTime() - now;

        if (diff <= 0) {
          setTimeUntilNext('Refreshing...');
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeUntilNext(`${minutes}m ${seconds}s`);
        }
      };

      updateCountdown(); // Initial update
      countdownRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    } else {
      setTimeUntilNext('');
    }
  }, [nextRefresh, autoRefresh]);

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Run immediately
    handleImport(true);

    // Set initial next refresh time
    setNextRefresh(new Date(Date.now() + refreshInterval * 1000));

    // Set up interval
    intervalRef.current = setInterval(() => {
      handleImport(true);
      // Reset next refresh time after each run
      setNextRefresh(new Date(Date.now() + refreshInterval * 1000));
    }, refreshInterval * 1000);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setNextRefresh(null);
    setTimeUntilNext('');
  };

  const handleImport = async (isAutoRefresh = false) => {
    const urlsToUse = isAutoRefresh ? savedUrlsRef.current : urls;

    if (!urlsToUse.trim()) {
      if (!isAutoRefresh) {
        setError('Please enter at least one URL');
      }
      return;
    }

    if (!gameId) {
      if (!isAutoRefresh) {
        setError('Please save the game first before importing breaks');
      }
      return;
    }

    setLoading(true);
    setError(null);
    if (!isAutoRefresh) {
      setResult(null);
    }

    try {
      // Parse URLs (one per line)
      const urlList = urlsToUse
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.startsWith('http'));

      // Save URLs for auto-refresh and display
      if (!isAutoRefresh) {
        savedUrlsRef.current = urlsToUse;
        setSavedUrls(urlList);
      }

      if (urlList.length === 0) {
        throw new Error('No valid URLs found');
      }

      // Get break date (day after event)
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 1);
      eventDate.setHours(18, 0, 0, 0);

      const response = await fetch('/api/admin/scrape-breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          urls: urlList,
          breakDateTime: eventDate.toISOString(),
          updateExisting: isAutoRefresh // Flag to update existing breaks
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import breaks');
      }

      setResult(data);
      setLastRefresh(new Date());

      if (onImportComplete) {
        onImportComplete(data);
      }
    } catch (err) {
      console.error('Import error:', err);
      if (!isAutoRefresh) {
        setError(err instanceof Error ? err.message : 'Failed to import breaks');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRefresh = () => {
    if (!autoRefresh && urls) {
      // When starting auto-refresh, save the current URLs
      const urlList = urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.startsWith('http'));
      setSavedUrls(urlList);
      savedUrlsRef.current = urls;
    }
    setAutoRefresh(!autoRefresh);
  };


  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Download className="w-6 h-6" />
          Import from Layton Sports Cards
        </h2>
        {lastRefresh && (
          <div className="text-sm text-gray-400">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-white text-sm mb-2">
            Layton Break URLs (one per line)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400 h-32"
            placeholder="https://laytonsportscards.com/collections/live-breaks/products/..."
            disabled={loading || autoRefresh}
          />
        </div>

        {/* Display saved URLs being monitored */}
        {savedUrls.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-white font-medium mb-2 text-sm">
              Monitoring {savedUrls.length} URL{savedUrls.length > 1 ? 's' : ''}:
            </div>
            <div className="space-y-1">
              {savedUrls.map((url, idx) => (
                <div key={idx} className="text-xs text-gray-300 truncate">
                  {idx + 1}. {url}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-refresh controls */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-white font-medium">Auto-Refresh Inventory</span>
            </div>
            <button
              onClick={toggleAutoRefresh}
              disabled={!urls.trim() || !gameId}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                autoRefresh
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-50`}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop Auto-Refresh
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Auto-Refresh
                </>
              )}
            </button>
          </div>

          {autoRefresh && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Refresh Interval:</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-white/20 rounded px-3 py-1 text-white"
                >
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                  <option value="900">15 minutes</option>
                  <option value="1800">30 minutes</option>
                </select>
              </div>
              {nextRefresh && (
                <div className="text-sm text-gray-400">
                  Next refresh in: <span className="text-white font-medium">{timeUntilNext}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => handleImport(false)}
          disabled={loading || !urls.trim() || autoRefresh}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Import Breaks Now
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-green-300 font-semibold">Import Successful!</p>
            </div>
            <div className="text-white space-y-1 text-sm">
              <p>• Created {result.breaksCreated} break spots</p>
              <p>• Average break value: ${result.inventory?.averageSpotPrice?.toFixed(2)}</p>
              <p>• Total inventory value: ${result.inventory?.totalValue?.toFixed(2)}</p>
              <p>• Customer price per break: ${result.inventory?.customerPrice?.toFixed(2)}</p>
            </div>
            {result.scrapedData && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-gray-300 text-xs mb-2">Imported Breaks:</p>
                {result.scrapedData.map((breakItem: any, idx: number) => (
                  <div key={idx} className="text-xs text-gray-400">
                    • {breakItem.title}: {breakItem.availableTeams} teams @ avg ${breakItem.averagePrice?.toFixed(2)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}