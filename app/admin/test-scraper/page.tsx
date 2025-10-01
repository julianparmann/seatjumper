'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TestScraperPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState('https://www.tickpick.com/buy-las-vegas-raiders-vs-los-angeles-chargers-tickets-allegiant-stadium-9-15-25-7pm/6977841/');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // Redirect if not logged in
  if (!session) {
    router.push('/auth/signin');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <p className="text-white text-xl">Redirecting to login...</p>
      </div>
    );
  }

  // Check admin access
  if (!session.user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Admin access required</p>
          <p className="text-gray-300">Please login as admin@test.com with password: admin123</p>
        </div>
      </div>
    );
  }

  const testScraper = async () => {
    setLoading(true);
    setResult(null);

    try {
      // First create a test game
      const gameResponse = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'Las Vegas Raiders vs Los Angeles Chargers',
          eventDate: '2025-09-15T19:00:00',
          venue: 'Allegiant Stadium',
          city: 'Las Vegas',
          state: 'NV',
          tickpickUrl: url,
          sport: 'NFL',
          cutoffTime: '2025-09-15T18:00:00',
          minPlayers: 10,
          maxPlayers: 100
        })
      });

      const gameData = await gameResponse.json();

      if (!gameResponse.ok) {
        console.error('Game creation failed:', gameData);
        throw new Error(gameData.error || 'Failed to create test game');
      }

      if (!gameData.game) {
        throw new Error('No game returned from API');
      }

      // Now scrape it
      const scrapeResponse = await fetch(`/api/admin/games/${gameData.game.id}/scrape`, {
        method: 'POST'
      });

      const scrapeData = await scrapeResponse.json();

      setResult({
        game: gameData.game,
        scrape: scrapeData
      });

    } catch (error) {
      console.error('Test failed:', error);
      setResult({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Test TickPick Scraper</h1>

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
                <p>Error: {result.error.message || 'Unknown error'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl text-yellow-400 mb-2">Game Created</h3>
                  <p className="text-white">ID: {result.game.id}</p>
                  <p className="text-white">Event: {result.game.eventName}</p>
                </div>

                <div>
                  <h3 className="text-xl text-yellow-400 mb-2">Scrape Results</h3>
                  <p className="text-white">Success: {result.scrape.success ? 'Yes' : 'No'}</p>
                  <p className="text-white">Tickets Found: {result.scrape.ticketCount || 0}</p>

                  {result.scrape.tickets && (
                    <div className="mt-4">
                      <h4 className="text-lg text-gray-300 mb-2">Sample Tickets:</h4>
                      <div className="space-y-2">
                        {result.scrape.tickets.slice(0, 5).map((ticket: any, idx: number) => (
                          <div key={idx} className="bg-black/30 rounded p-2 text-sm text-gray-300">
                            Section {ticket.section}, Row {ticket.row} - ${ticket.price}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}