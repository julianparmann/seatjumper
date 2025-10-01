'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Ticket, Package, Star, Zap } from 'lucide-react';

interface SpinWheelProps {
  onComplete?: (result: SpinResult) => void;
  isSpinning: boolean;
  result?: SpinResult | null;
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
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export default function SpinWheel({ onComplete, isSpinning, result }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [ticketRevealed, setTicketRevealed] = useState(false);
  const [breakRevealed, setBreakRevealed] = useState(false);

  // Mock tiers for visual effect during spin
  const wheelSegments = [
    { color: 'from-yellow-600 to-yellow-500', label: 'GOLD', icon: Trophy },
    { color: 'from-gray-500 to-gray-400', label: 'SILVER', icon: Star },
    { color: 'from-yellow-700 to-yellow-600', label: 'BRONZE', icon: Zap },
    { color: 'from-purple-600 to-purple-500', label: 'PLATINUM', icon: Sparkles },
    { color: 'from-gray-500 to-gray-400', label: 'SILVER', icon: Star },
    { color: 'from-yellow-700 to-yellow-600', label: 'BRONZE', icon: Zap },
  ];

  useEffect(() => {
    if (isSpinning && !showResult) {
      // Start spinning
      const spinDuration = 4000; // 4 seconds
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const finalRotation = rotation + (360 * spins);

      setRotation(finalRotation);

      // Show result after spin
      setTimeout(() => {
        setShowResult(true);
        if (onComplete && result) {
          onComplete(result);
        }
      }, spinDuration);
    }
  }, [isSpinning]);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-purple-600 to-purple-400';
      case 'gold':
        return 'from-yellow-500 to-yellow-300';
      case 'silver':
        return 'from-gray-400 to-gray-300';
      case 'bronze':
        return 'from-yellow-700 to-yellow-600';
      default:
        return 'from-blue-600 to-blue-400';
    }
  };

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'platinum':
        return 'PLATINUM WIN!';
      case 'gold':
        return 'GOLD WIN!';
      case 'silver':
        return 'SILVER WIN!';
      case 'bronze':
        return 'BRONZE WIN!';
      default:
        return 'WINNER!';
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!showResult ? (
          // Spinning Wheel
          <motion.div
            key="wheel"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />

            {/* Wheel container */}
            <div className="relative bg-black/50 rounded-full p-8">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-t-[40px] border-t-yellow-400 border-r-[20px] border-r-transparent" />
              </div>

              {/* Spinning wheel */}
              <motion.div
                className="relative w-80 h-80 mx-auto"
                animate={{ rotate: rotation }}
                transition={{
                  duration: isSpinning ? 4 : 0,
                  ease: [0.17, 0.55, 0.55, 1],
                }}
              >
                {/* Wheel segments */}
                {wheelSegments.map((segment, index) => {
                  const angle = (360 / wheelSegments.length) * index;
                  const Icon = segment.icon;

                  return (
                    <div
                      key={index}
                      className="absolute inset-0"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-gradient-to-b ${segment.color}
                        clip-path-polygon-[50%_0%,_100%_100%,_0%_100%] rounded-t-full shadow-lg`}>
                        <div className="flex flex-col items-center justify-center h-full text-white">
                          <Icon className="w-8 h-8 mb-2" />
                          <span className="font-bold text-sm">{segment.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Center circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-black rounded-full border-4 border-yellow-400 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-yellow-400" />
                  </div>
                </div>
              </motion.div>

              {/* Status text */}
              <div className="text-center mt-8">
                {isSpinning ? (
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl font-bold text-yellow-400"
                  >
                    SPINNING...
                  </motion.p>
                ) : (
                  <p className="text-xl text-gray-400">Click Spin to Start!</p>
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
                className={`w-96 h-96 bg-gradient-to-r ${getTierColor(result?.tier)} rounded-full blur-3xl`}
              />
            </div>

            {/* Result card */}
            <div className={`relative bg-gradient-to-br ${getTierColor(result?.tier)} p-1 rounded-2xl`}>
              <div className="bg-gray-900 rounded-2xl p-8">
                {/* Tier badge */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <h2 className="text-4xl font-bold text-yellow-400 mb-2">
                    {getTierLabel(result?.tier)}
                  </h2>
                  <p className="text-gray-400">You've won an amazing bundle!</p>
                </motion.div>

                {/* Ticket Result */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                  onAnimationComplete={() => setTicketRevealed(true)}
                >
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Ticket className="w-8 h-8 text-white" />
                      <h3 className="text-xl font-bold text-white">EVENT TICKETS</h3>
                    </div>
                    {ticketRevealed && result && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-white"
                      >
                        <p className="font-semibold text-lg">
                          Section {result.tickets.section}, Row {result.tickets.row}
                        </p>
                        <p className="text-blue-100">
                          Seats: {result.tickets.seats.join(', ')}
                        </p>
                        <p className="text-2xl font-bold mt-2">
                          Value: ${result.tickets.value}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Break Result */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mb-6"
                  onAnimationComplete={() => setBreakRevealed(true)}
                >
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Package className="w-8 h-8 text-white" />
                      <h3 className="text-xl font-bold text-white">CARD BREAK</h3>
                    </div>
                    {breakRevealed && result && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-white"
                      >
                        <p className="font-semibold text-lg">
                          {result.breaks.name}
                        </p>
                        <p className="text-2xl font-bold mt-2">
                          Value: ${result.breaks.value}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Total Value */}
                {ticketRevealed && breakRevealed && result && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
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