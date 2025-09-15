'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Ticket, Package, Star, Zap, User } from 'lucide-react';

interface StadiumJumperProps {
  onComplete?: (result: SpinResult) => void;
  isSpinning: boolean;
  result?: SpinResult | null;
  sport?: 'NFL' | 'NBA' | 'MLB' | 'NHL';
}

interface SpinResult {
  tickets: {
    section: string;
    row: string;
    seats: string[];
    value: number;
  };
  breaks: {
    name: string;
    value: number;
  };
  totalValue: number;
  tier: 'nosebleed' | 'upper' | 'club' | 'lower' | 'field';
}

// Stadium sections by sport
const stadiumLayouts = {
  NFL: {
    sections: [
      { id: 'field', label: 'Field Level', tier: 'field', color: 'from-purple-600 to-purple-500', y: 75, seats: ['1-10'] },
      { id: 'lower', label: 'Lower Bowl', tier: 'lower', color: 'from-yellow-500 to-yellow-400', y: 60, seats: ['100-150'] },
      { id: 'club', label: 'Club Level', tier: 'club', color: 'from-blue-500 to-blue-400', y: 45, seats: ['200-250'] },
      { id: 'upper', label: 'Upper Deck', tier: 'upper', color: 'from-gray-500 to-gray-400', y: 30, seats: ['300-350'] },
      { id: 'nosebleed', label: 'Nosebleeds', tier: 'nosebleed', color: 'from-gray-600 to-gray-500', y: 15, seats: ['400-450'] },
    ]
  },
  NBA: {
    sections: [
      { id: 'court', label: 'Courtside', tier: 'field', color: 'from-purple-600 to-purple-500', y: 75, seats: ['AA-DD'] },
      { id: 'lower', label: 'Lower Level', tier: 'lower', color: 'from-yellow-500 to-yellow-400', y: 60, seats: ['1-20'] },
      { id: 'club', label: 'Club Seats', tier: 'club', color: 'from-blue-500 to-blue-400', y: 45, seats: ['101-120'] },
      { id: 'mezzanine', label: 'Mezzanine', tier: 'upper', color: 'from-gray-500 to-gray-400', y: 30, seats: ['201-220'] },
      { id: 'balcony', label: 'Balcony', tier: 'nosebleed', color: 'from-gray-600 to-gray-500', y: 15, seats: ['301-320'] },
    ]
  },
  MLB: {
    sections: [
      { id: 'diamond', label: 'Diamond Box', tier: 'field', color: 'from-purple-600 to-purple-500', y: 75, seats: ['1-50'] },
      { id: 'field', label: 'Field Box', tier: 'lower', color: 'from-yellow-500 to-yellow-400', y: 60, seats: ['100-150'] },
      { id: 'loge', label: 'Loge Box', tier: 'club', color: 'from-blue-500 to-blue-400', y: 45, seats: ['200-250'] },
      { id: 'pavilion', label: 'Pavilion', tier: 'upper', color: 'from-gray-500 to-gray-400', y: 30, seats: ['300-350'] },
      { id: 'bleachers', label: 'Bleachers', tier: 'nosebleed', color: 'from-gray-600 to-gray-500', y: 15, seats: ['400-450'] },
    ]
  },
  NHL: {
    sections: [
      { id: 'glass', label: 'Glass Seats', tier: 'field', color: 'from-purple-600 to-purple-500', y: 75, seats: ['1-10'] },
      { id: 'lower', label: 'Lower Bowl', tier: 'lower', color: 'from-yellow-500 to-yellow-400', y: 60, seats: ['100-130'] },
      { id: 'club', label: 'Club Level', tier: 'club', color: 'from-blue-500 to-blue-400', y: 45, seats: ['200-230'] },
      { id: 'upper', label: 'Upper Bowl', tier: 'upper', color: 'from-gray-500 to-gray-400', y: 30, seats: ['300-330'] },
      { id: 'nosebleed', label: 'Nosebleeds', tier: 'nosebleed', color: 'from-gray-600 to-gray-500', y: 15, seats: ['400-430'] },
    ]
  }
};

export default function StadiumJumper({ onComplete, isSpinning, result, sport = 'NFL' }: StadiumJumperProps) {
  const [jumperPosition, setJumperPosition] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [finalSection, setFinalSection] = useState<any>(null);

  const layout = stadiumLayouts[sport];
  const sections = layout.sections;

  useEffect(() => {
    if (isSpinning && !showResult) {
      // Start jumping animation
      const totalJumps = 15 + Math.floor(Math.random() * 10); // 15-25 jumps
      let currentJump = 0;

      const jumpInterval = setInterval(() => {
        currentJump++;
        const nextSection = currentJump < totalJumps - 5
          ? Math.floor(Math.random() * sections.length) // Random jumps
          : Math.floor(Math.random() * 3) + (result?.tier === 'field' ? 0 : result?.tier === 'lower' ? 1 : 2); // Slow down near result

        setCurrentSection(nextSection);
        setJumpCount(currentJump);

        if (currentJump >= totalJumps) {
          clearInterval(jumpInterval);

          // Set final position based on result
          const finalIdx = sections.findIndex(s => s.tier === result?.tier) || 0;
          setFinalSection(sections[finalIdx]);
          setCurrentSection(finalIdx);

          setTimeout(() => {
            setShowResult(true);
            if (onComplete && result) {
              onComplete(result);
            }
          }, 1000);
        }
      }, 200); // Jump every 200ms

      return () => clearInterval(jumpInterval);
    }
  }, [isSpinning, result, sections]);

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'field': return 'FIELD LEVEL WIN!';
      case 'lower': return 'LOWER BOWL WIN!';
      case 'club': return 'CLUB LEVEL WIN!';
      case 'upper': return 'UPPER DECK WIN!';
      case 'nosebleed': return 'NOSEBLEED WIN!';
      default: return 'WINNER!';
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {!showResult ? (
          // Stadium Animation
          <motion.div
            key="stadium"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative"
          >
            {/* Stadium Container */}
            <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8 overflow-hidden">
              {/* Stadium lights effect */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-0 right-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-3xl animate-pulse delay-75" />
              </div>

              {/* Stadium Field/Court */}
              <div className="relative h-96 bg-gradient-to-b from-green-800 to-green-600 rounded-2xl overflow-hidden">
                {/* Field markings */}
                {sport === 'NFL' && (
                  <>
                    <div className="absolute inset-x-0 top-1/4 h-0.5 bg-white/50" />
                    <div className="absolute inset-x-0 top-2/4 h-0.5 bg-white/50" />
                    <div className="absolute inset-x-0 top-3/4 h-0.5 bg-white/50" />
                  </>
                )}
                {sport === 'NBA' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-white/50 rounded-full" />
                  </div>
                )}

                {/* Stadium Sections */}
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    className={`absolute inset-x-8 h-12 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center shadow-lg`}
                    style={{ top: `${section.y}%` }}
                    animate={{
                      scale: currentSection === index && isSpinning ? 1.05 : 1,
                      boxShadow: currentSection === index && isSpinning
                        ? '0 0 30px rgba(250, 204, 21, 0.8)'
                        : '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-white font-bold text-sm">
                      {section.label}
                    </span>
                    {currentSection === index && isSpinning && (
                      <motion.div
                        className="absolute inset-0 bg-yellow-400/30 rounded-lg"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                ))}

                {/* Jumping Character */}
                {isSpinning && (
                  <motion.div
                    className="absolute z-20"
                    animate={{
                      left: `${20 + (currentSection * 15)}%`,
                      top: `${sections[currentSection].y - 5}%`,
                    }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 300,
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -20, 0],
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: Infinity,
                      }}
                      className="relative"
                    >
                      {/* Character */}
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-xl">
                        <User className="w-8 h-8 text-gray-900" />
                      </div>
                      {/* Trail effect */}
                      <motion.div
                        className="absolute inset-0 bg-yellow-400 rounded-full"
                        animate={{
                          scale: [1, 1.5],
                          opacity: [0.5, 0],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Status Text */}
              <div className="text-center mt-6">
                {isSpinning ? (
                  <div>
                    <motion.p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-2xl font-bold text-yellow-400"
                    >
                      JUMPING TO YOUR SEAT...
                    </motion.p>
                    <p className="text-gray-400 mt-2">
                      Jump #{jumpCount}
                    </p>
                  </div>
                ) : (
                  <p className="text-xl text-gray-400">Click to Start Jumping!</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          // Result Display
          <motion.div
            key="result"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative"
          >
            {/* Celebration effects */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-96 h-96 bg-gradient-to-r ${finalSection?.color || 'from-yellow-400 to-orange-400'} rounded-full blur-3xl`}
              />
            </div>

            {/* Result card */}
            <div className={`relative bg-gradient-to-br ${finalSection?.color || 'from-yellow-400 to-orange-400'} p-1 rounded-2xl`}>
              <div className="bg-gray-900 rounded-2xl p-8">
                {/* Section badge */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <h2 className="text-4xl font-bold text-yellow-400 mb-2">
                    {getTierLabel(result?.tier)}
                  </h2>
                  <p className="text-xl text-gray-300">
                    You landed in {finalSection?.label}!
                  </p>
                </motion.div>

                {/* Ticket Result */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Ticket className="w-8 h-8 text-white" />
                      <h3 className="text-xl font-bold text-white">YOUR SEATS</h3>
                    </div>
                    {result && (
                      <div className="text-white">
                        <p className="font-semibold text-lg">
                          Section {result.tickets.section}, Row {result.tickets.row}
                        </p>
                        <p className="text-blue-100">
                          Seats: {result.tickets.seats.join(', ')}
                        </p>
                        <p className="text-2xl font-bold mt-2">
                          Value: ${result.tickets.value}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Break Result */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Package className="w-8 h-8 text-white" />
                      <h3 className="text-xl font-bold text-white">CARD BREAK</h3>
                    </div>
                    {result && (
                      <div className="text-white">
                        <p className="font-semibold text-lg">
                          {result.breaks.name}
                        </p>
                        <p className="text-2xl font-bold mt-2">
                          Value: ${result.breaks.value}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Total Value */}
                {result && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-center border-t border-gray-700 pt-6"
                  >
                    <p className="text-gray-400 mb-2">TOTAL BUNDLE VALUE</p>
                    <p className="text-5xl font-bold text-yellow-400">
                      ${result.totalValue}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}