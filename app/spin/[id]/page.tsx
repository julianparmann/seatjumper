'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
// import MultiStageSpin from '@/components/spins/multi-stage-spin'; // TODO: Implement component
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';

// Mock data for demo
const mockSpinData = {
  event: 'Las Vegas Raiders vs Chicago Bears',
  venue: 'Allegiant Stadium',
  date: 'October 15, 2024',
  sport: 'NFL' as const,
  ticketQuantity: 2,
  breakQuantity: 1,
  totalCost: 350,
};

export default function SpinPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleStartSpin = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // In production, this would process payment first
    setPaymentProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setPaymentProcessing(false);

      // Generate mock result with stadium tiers
      const tierRandom = Math.random();
      const tier = tierRandom > 0.8 ? 'field' :
                   tierRandom > 0.6 ? 'lower' :
                   tierRandom > 0.4 ? 'club' :
                   tierRandom > 0.2 ? 'upper' : 'nosebleed';

      // Generate mock breaks array for the wheel
      const mockBreaks = [
        { id: '1', name: '2024 Panini Prizm Football Hobby Box', value: 299, image: '/breaks/prizm-football.jpg' },
        { id: '2', name: '2024 Topps Chrome Baseball Hobby Box', value: 249, image: '/breaks/topps-chrome.jpg' },
        { id: '3', name: '2024 Panini Select Football Blaster', value: 89, image: '/breaks/select-football.jpg' },
        { id: '4', name: '2024 Bowman Chrome Baseball Mega Box', value: 149, image: '/breaks/bowman-chrome.jpg' },
        { id: '5', name: '2023 Panini Mosaic Basketball Hobby Box', value: 399, image: '/breaks/mosaic-basketball.jpg' },
        { id: '6', name: '2024 Upper Deck Series 1 Hockey Hobby Box', value: 179, image: '/breaks/upper-deck.jpg' },
      ];

      // Pick a random break to win
      const wonBreak = mockBreaks[Math.floor(Math.random() * mockBreaks.length)];

      const mockResult = {
        tickets: {
          section: tier === 'field' ? '1' : tier === 'lower' ? '102' : tier === 'club' ? '205' : tier === 'upper' ? '305' : '405',
          row: tier === 'field' ? 'A' : tier === 'lower' ? 'F' : tier === 'club' ? 'B' : tier === 'upper' ? 'M' : 'Z',
          seats: ['14', '15'],
          value: tier === 'field' ? Math.floor(800 + Math.random() * 500) :
                 tier === 'lower' ? Math.floor(400 + Math.random() * 300) :
                 tier === 'club' ? Math.floor(600 + Math.random() * 400) :
                 tier === 'upper' ? Math.floor(200 + Math.random() * 200) :
                 Math.floor(100 + Math.random() * 100),
        },
        breaks: {
          name: wonBreak.name,
          value: wonBreak.value,
        },
        availableBreaks: mockBreaks,
        totalValue: 0,
        tier: tier as any,
      };
      mockResult.totalValue = mockResult.tickets.value + mockResult.breaks.value;

      setResult(mockResult);
      setIsSpinning(true);
      // Auto-complete since we don't have the animation component yet
      setTimeout(() => {
        setSpinComplete(true);
      }, 1000);
    }, 2000);
  };

  const handleSpinComplete = () => {
    setSpinComplete(true);
  };

  const handleContinue = () => {
    router.push('/dashboard/orders');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        {!isSpinning && (
          <Link href="/events" className="text-white hover:text-yellow-400 mb-6 inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </Link>
        )}

        {/* Spin Container */}
        <div className="max-w-4xl mx-auto">
          {!isSpinning && !spinComplete ? (
            // Pre-spin state
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">Ready to Spin!</h1>
                <p className="text-xl text-gray-300">Your tickets are locked in and ready</p>
              </div>

              {/* Spin Details */}
              <div className="bg-black/30 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Your Selection</h2>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between">
                    <span>Event:</span>
                    <span className="text-white font-semibold">{mockSpinData.event}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Venue:</span>
                    <span className="text-white">{mockSpinData.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-white">{mockSpinData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tickets:</span>
                    <span className="text-white">{mockSpinData.ticketQuantity} tickets</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Breaks:</span>
                    <span className="text-white">{mockSpinData.breakQuantity} break spot</span>
                  </div>
                  <div className="border-t border-gray-600 pt-3 mt-3 flex justify-between">
                    <span className="text-lg">Total Cost:</span>
                    <span className="text-2xl font-bold text-yellow-400">${mockSpinData.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center">
                {paymentProcessing ? (
                  <button
                    disabled
                    className="px-8 py-4 bg-gray-600 text-gray-400 font-bold text-xl rounded-xl cursor-not-allowed flex items-center gap-3 mx-auto"
                  >
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing Payment...
                  </button>
                ) : (
                  <button
                    onClick={handleStartSpin}
                    className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold text-xl rounded-xl hover:from-yellow-300 hover:to-orange-300 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                  >
                    <CreditCard className="w-6 h-6" />
                    Pay ${mockSpinData.totalCost} & Spin
                  </button>
                )}

                {!session && (
                  <p className="text-yellow-400 mt-4">Please sign in to continue</p>
                )}
              </div>
            </div>
          ) : (
            // Spinning/Result state with multi-stage animation
            <div className="py-8">
              {/* TODO: Implement MultiStageSpin component
              <MultiStageSpin
                isSpinning={isSpinning}
                result={result}
                sport={mockSpinData.sport}
                onComplete={handleSpinComplete}
              /> */}
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">Spin in Progress!</h2>
                <p className="text-xl">Animation component coming soon...</p>
                {result && (
                  <div className="mt-8 p-6 bg-white/10 rounded-xl">
                    <h3 className="text-2xl font-bold mb-4">Your Results:</h3>
                    <p>Tickets: Section {result.tickets.section}, Row {result.tickets.row}</p>
                    <p>Memorabilia: {result.breaks.name}</p>
                    <p>Total Value: ${result.totalValue}</p>
                  </div>
                )}
              </div>

              {/* Continue button after spin */}
              {spinComplete && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleContinue}
                    className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors"
                  >
                    Continue to Order Details
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}