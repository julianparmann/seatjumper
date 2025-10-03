'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Package, Trophy, Star, ChevronRight } from 'lucide-react';

interface VideoRevealProps {
  onComplete?: () => void;
  bundles: Array<{
    ticket?: {
      level?: string;
      levelName?: string;
      section?: string;
      row?: string;
      name?: string;
      prizeType?: string;
      value?: number;
      individual?: boolean;
      special?: boolean;
    };
    memorabilia?: {
      name?: string;
      value?: number;
      imageUrl?: string;
    };
  }>;
  selectedPack?: 'blue' | 'red' | 'gold';
}

export default function VideoReveal({ onComplete, bundles, selectedPack = 'blue' }: VideoRevealProps) {
  const [currentStage, setCurrentStage] = useState<'video' | 'results' | 'complete'>('video');
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get the correct video path based on selected pack
  const getVideoPath = () => {
    switch (selectedPack) {
      case 'red':
        return '/videos/revealred.mp4';
      case 'gold':
        return '/videos/revealgold.mp4';
      case 'blue':
      default:
        return '/videos/revealblue.mp4';
    }
  };

  useEffect(() => {
    // Auto-play the video when component mounts
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Show results after video ends
    setTimeout(() => {
      setCurrentStage('results');
    }, 500);
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setCurrentStage('complete');
    if (onComplete) {
      onComplete();
    }
  };

  const handleContinue = () => {
    setCurrentStage('complete');
    if (onComplete) {
      onComplete();
    }
  };

  // Calculate total values
  const totalTicketValue = bundles.reduce((sum, bundle) => sum + (bundle.ticket?.value || 0), 0);
  const totalMemorabiliaValue = bundles.reduce((sum, bundle) => sum + (bundle.memorabilia?.value || 0), 0);
  const totalValue = totalTicketValue + totalMemorabiliaValue;

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Video Stage */}
        {currentStage === 'video' && (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl overflow-hidden">
              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  onEnded={handleVideoEnd}
                  playsInline
                  muted
                >
                  <source src={getVideoPath()} type="video/mp4" />
                </video>
              </div>

              {/* Skip Button */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={handleSkip}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  Skip Animation
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Stage - Shows both tickets and memorabilia */}
        {currentStage === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8">
              <h2 className="text-4xl font-bold text-yellow-400 text-center mb-8">Your Jump Results!</h2>

              {/* Tickets Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Ticket className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-2xl font-bold text-white">Tickets Won</h3>
                </div>
                <div className="bg-black/30 rounded-xl p-6">
                  {bundles.map((bundle, index) => (
                    bundle.ticket && (
                      <div key={index} className="mb-4 last:mb-0">
                        {bundle.ticket.level ? (
                          <div>
                            <p className="text-xl font-bold text-white">Level {bundle.ticket.level}</p>
                            <p className="text-lg text-gray-300">{bundle.ticket.levelName}</p>
                          </div>
                        ) : bundle.ticket.individual ? (
                          <div>
                            <p className="text-xl font-bold text-white">Section {bundle.ticket.section}</p>
                            <p className="text-lg text-gray-300">Row {bundle.ticket.row}</p>
                          </div>
                        ) : bundle.ticket.special ? (
                          <div>
                            <p className="text-xl font-bold text-white">{bundle.ticket.name}</p>
                            <p className="text-lg text-gray-300">{bundle.ticket.prizeType}</p>
                          </div>
                        ) : null}
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Memorabilia Section */}
              {totalMemorabiliaValue > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-8 h-8 text-purple-400" />
                    <h3 className="text-2xl font-bold text-white">Memorabilia Won</h3>
                  </div>
                  <div className="bg-black/30 rounded-xl p-6">
                    <div className="grid gap-4">
                      {bundles.map((bundle, index) => (
                        bundle.memorabilia && (
                          <div key={index} className="flex items-start gap-4">
                            {bundle.memorabilia.imageUrl && (
                              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                <img
                                  src={bundle.memorabilia.imageUrl}
                                  alt={bundle.memorabilia.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-xl font-bold text-white">{bundle.memorabilia.name}</p>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* Continue Button */}
              <div className="text-center mt-8">
                <button
                  onClick={handleContinue}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold text-lg transition-colors"
                >
                  Continue
                </button>
              </div>

              {/* Skip Button */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={handleSkip}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm"
                >
                  Skip to Summary
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Complete Stage */}
        {currentStage === 'complete' && (
          <motion.div
            key="complete"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-1 rounded-2xl">
              <div className="bg-gray-900 rounded-2xl p-8">
                <h2 className="text-4xl font-bold text-yellow-400 text-center mb-8">
                  🎉 CONGRATULATIONS! 🎉
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Tickets Summary */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6">
                    <Ticket className="w-12 h-12 text-white mb-3" />
                    <h3 className="text-xl font-bold text-white mb-4">Your Tickets</h3>
                    {bundles.map((bundle, index) => (
                      bundle.ticket && (
                        <div key={index} className="text-white mb-2">
                          {bundle.ticket.level ? (
                            <p>Level {bundle.ticket.level} - {bundle.ticket.levelName}</p>
                          ) : bundle.ticket.individual ? (
                            <p>Section {bundle.ticket.section}, Row {bundle.ticket.row}</p>
                          ) : bundle.ticket.special ? (
                            <p>{bundle.ticket.name}</p>
                          ) : null}
                        </div>
                      )
                    ))}
                  </div>

                  {/* Memorabilia Summary */}
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6">
                    <Package className="w-12 h-12 text-white mb-3" />
                    <h3 className="text-xl font-bold text-white mb-4">Your Memorabilia</h3>
                    <div className="space-y-3">
                      {bundles.map((bundle, index) => (
                        bundle.memorabilia && (
                          <div key={index} className="flex items-start gap-3">
                            {bundle.memorabilia.imageUrl && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                <img
                                  src={bundle.memorabilia.imageUrl}
                                  alt={bundle.memorabilia.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <p className="text-white flex-1">{bundle.memorabilia.name}</p>
                          </div>
                        )
                      ))}
                      {totalMemorabiliaValue === 0 && (
                        <p className="text-white/70">No memorabilia in this bundle</p>
                      )}
                    </div>
                  </div>
                </div>


                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}