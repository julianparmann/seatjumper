import Link from 'next/link';
import { ArrowRight, Trophy, CreditCard, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6">
            Welcome to <span className="text-yellow-400">SeatJumper</span>
          </h1>
          <p className="text-2xl mb-8 text-gray-200">
            Win Premium Event Tickets + Sports Card Breaks
          </p>
          <p className="text-lg mb-12 max-w-2xl mx-auto text-gray-300">
            Every spin guarantees a prize! Get a chance at front-row seats and exclusive sports card breaks
            for a fraction of the regular price.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-8 py-4 rounded-full text-xl font-semibold hover:bg-yellow-300 transition-colors"
          >
            Start Spinning <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-2xl font-bold mb-4">1. Choose Your Event</h3>
            <p className="text-gray-300">
              Browse upcoming NFL, NBA, MLB, and other sporting events. Select the game you want to attend.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-2xl font-bold mb-4">2. Spin to Win</h3>
            <p className="text-gray-300">
              Pay a fixed price to spin for your bundle. Every spin wins - from nosebleeds to VIP experiences!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-2xl font-bold mb-4">3. Enjoy Your Prize</h3>
            <p className="text-gray-300">
              Receive your event tickets and watch your sports card break live the day after the game!
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-8 text-center">Why SeatJumper?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="text-yellow-400">✓</div>
              <div>
                <h4 className="font-semibold mb-2">Guaranteed Win Every Time</h4>
                <p className="text-gray-300">No losing spins - you always get tickets and breaks!</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-yellow-400">✓</div>
              <div>
                <h4 className="font-semibold mb-2">Massive Savings</h4>
                <p className="text-gray-300">Pay a fraction of retail price for premium experiences</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-yellow-400">✓</div>
              <div>
                <h4 className="font-semibold mb-2">Double the Excitement</h4>
                <p className="text-gray-300">Event tickets PLUS sports card breaks in one bundle</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-yellow-400">✓</div>
              <div>
                <h4 className="font-semibold mb-2">Risk Customization</h4>
                <p className="text-gray-300">Set your preferences for seat quality and break values</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}