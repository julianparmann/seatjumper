'use client';

import { useState } from 'react';

export default function SimpleTestScraperPage() {
  const [url, setUrl] = useState('https://www.tickpick.com/buy-las-vegas-raiders-vs-los-angeles-chargers-tickets-allegiant-stadium-9-15-25-7pm/6977841/');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testScraper = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Try the internal API first
      const response = await fetch('/api/tickpick-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResult(data);

    } catch (error: any) {
      console.error('Test failed:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Simple Scraper Test (No Auth Required)</h1>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
          <div className="mb-4">
            <label className="block text-white mb-2">TickPick Event URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg"
              placeholder="https://www.tickpick.com/..."
            />
          </div>

          <button
            onClick={testScraper}
            disabled={loading}
            className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Scraper'}
          </button>
        </div>

        {result && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Results</h2>

            {result.error ? (
              <div className="text-red-400">
                <p>Error: {result.error}</p>
                {result.details && (
                  <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-auto">
                    {result.details}
                  </pre>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-green-400 font-bold text-xl mb-2">✓ {result.message}</p>
                  <p className="text-white">Tickets Found: {result.ticketCount}</p>
                  {result.eventId && (
                    <p className="text-gray-300">Event ID: {result.eventId}</p>
                  )}
                  {result.priceRange && (
                    <div className="mt-2 p-3 bg-black/30 rounded">
                      <p className="text-yellow-400 font-semibold">Price Range:</p>
                      <p className="text-white">
                        ${result.priceRange.min} - ${result.priceRange.max}
                        <span className="text-gray-400 ml-2">(Avg: ${result.priceRange.avg})</span>
                      </p>
                    </div>
                  )}
                  {result.note && (
                    <p className="text-yellow-400 text-sm mt-2">{result.note}</p>
                  )}
                </div>

                {result.tickets && (
                  <div className="mt-4">
                    <h3 className="text-lg text-yellow-400 mb-2">Sample Tickets:</h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {result.tickets.map((ticket: any, idx: number) => (
                        <div key={idx} className="bg-black/30 rounded p-3 text-sm">
                          <div className="text-white font-semibold">
                            Section {ticket.section}, Row {ticket.row}
                          </div>
                          <div className="text-gray-300">
                            {ticket.quantity} tickets - ${ticket.price} each
                          </div>
                          <div className="text-yellow-400 text-xs mt-1">
                            Tier: {ticket.tier}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}