'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface PackOption {
  id: string;
  name: string;
  price: number;
  image: string;
  color: string;
  description: string;
  shortDesc: string;
}

export const defaultPacks: PackOption[] = [
  {
    id: 'blue',
    name: 'Blue Pack',
    price: 500,
    image: '/images/JumpPackBlue.png',
    color: 'from-blue-600 to-blue-800',
    description: '🎲 TOTAL RANDOMIZATION: Your jump could land anywhere in the stadium! From the highest nosebleeds to courtside/field level seats. Perfect for thrill-seekers who want the full range of possibilities. You still have a chance at the grand prize!',
    shortDesc: 'All Seats Available'
  },
  {
    id: 'red',
    name: 'Red Pack',
    price: 1000,
    image: '/images/JumpPackRed.png',
    color: 'from-red-600 to-red-800',
    description: '🎯 THE SWEET SPOT: Guarantees seats in the 300 level or below - no upper deck! You\'ll be closer to the action with better views. Premium sections like club level and lower bowl are in play. Grand prize still available!',
    shortDesc: 'No Upper Deck'
  },
  {
    id: 'gold',
    name: 'Gold Pack',
    price: 1500,
    image: '/images/JumpPackGold.png',
    color: 'from-yellow-500 to-yellow-700',
    description: '👑 ULTIMATE EXPERIENCE: Guarantees FRONT ROW of any section you land in! Whether it\'s Row 1 of the upper deck or Row A courtside, you\'ll be in the first row with unobstructed views. Plus, you still have a shot at the grand prize!',
    shortDesc: 'Front Row Guarantee'
  }
];

// Export for backwards compatibility
export const packs = defaultPacks;

interface PackSelectionProps {
  selectedPack: string | null;
  onPackSelect: (packId: string) => void;
  dynamicPrices?: {
    blue: number;
    red: number;
    gold: number;
  };
}

export default function PackSelection({ selectedPack, onPackSelect, dynamicPrices }: PackSelectionProps) {
  const [hoveredPack, setHoveredPack] = useState<string | null>(null);

  // Use dynamic prices if provided, otherwise use defaults
  const packs = defaultPacks.map(pack => ({
    ...pack,
    price: dynamicPrices ? dynamicPrices[pack.id as keyof typeof dynamicPrices] : pack.price
  }));

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <p className="text-gray-300 text-xl mb-6">Jump to win random tickets!</p>
        <h2 className="text-4xl font-bold text-white mb-3">
          Choose Your <span className="text-yellow-400">Jump Pack</span>
        </h2>
        <p className="text-gray-300 text-lg">Select your pack tier for different seat guarantees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="relative group cursor-pointer"
            onClick={() => onPackSelect(pack.id)}
            onMouseEnter={() => setHoveredPack(pack.id)}
            onMouseLeave={() => setHoveredPack(null)}
          >
            {/* Card Container */}
            <div
              className={`
                relative rounded-2xl overflow-hidden transition-all duration-300
                ${selectedPack === pack.id
                  ? 'ring-4 ring-yellow-400 transform scale-105'
                  : 'hover:transform hover:scale-105'
                }
              `}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${pack.color} opacity-20`} />

              {/* Content */}
              <div className="relative p-6">
                {/* Pack Image */}
                <div className="relative h-64 mb-6 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-20">
                  <img
                    src={pack.image}
                    alt={pack.name}
                    className="h-full w-auto object-contain drop-shadow-2xl transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110"
                  />

                  {/* Selected Badge */}
                  {selectedPack === pack.id && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                      SELECTED
                    </div>
                  )}
                </div>

                {/* Pack Info - Hidden on hover */}
                <div className="text-center transition-opacity duration-300 group-hover:opacity-0">
                  <h3 className="text-2xl font-bold text-white mb-2">{pack.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{pack.shortDesc}</p>

                  {/* Price */}
                  <div className="bg-white/10 rounded-lg py-3 px-4">
                    <span className="text-3xl font-bold text-yellow-400">${pack.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Hover Description - Shows on card */}
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">{pack.name}</h3>
                    <p className="text-white text-sm leading-relaxed mb-4">{pack.description}</p>
                    <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-lg py-3 px-4">
                      <span className="text-3xl font-bold text-yellow-400">${pack.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Tap Description */}
            {selectedPack === pack.id && (
              <div className="md:hidden mt-3 bg-gray-800/90 rounded-lg p-3">
                <p className="text-sm text-gray-300">{pack.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selection Confirmation */}
      {selectedPack && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500 rounded-lg px-6 py-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold">
              {packs.find(p => p.id === selectedPack)?.name} Selected - ${packs.find(p => p.id === selectedPack)?.price.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}