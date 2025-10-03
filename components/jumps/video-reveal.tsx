'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Package, Trophy, Star } from 'lucide-react';

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
  const [currentStage, setCurrentStage] = useState<'ticket' | 'memorabilia' | 'complete'>('ticket');
  const [videoEnded, setVideoEnded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const memorabiliaVideoRef = useRef<HTMLVideoElement>(null);

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
    // Auto-play the ticket video when component mounts
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleTicketVideoEnd = () => {
    setVideoEnded(true);
    setShowResults(true);

    // Wait 3 seconds to show ticket results, then play memorabilia animation
    setTimeout(() => {
      setCurrentStage('memorabilia');
      setVideoEnded(false);
      setShowResults(false);

      // Start memorabilia video
      setTimeout(() => {
        if (memorabiliaVideoRef.current) {
          memorabiliaVideoRef.current.play();
        }
      }, 100);
    }, 3000);
  };

  const handleMemorabiliaVideoEnd = () => {
    setVideoEnded(true);
    setShowResults(true);

    // Wait 3 seconds then complete
    setTimeout(() => {
      setCurrentStage('complete');
      if (onComplete) {
        onComplete();
      }
    }, 3000);
  };

  // Calculate total values
  const totalTicketValue = bundles.reduce((sum, bundle) => sum + (bundle.ticket?.value || 0), 0);
  const totalMemorabiliaValue = bundles.reduce((sum, bundle) => sum + (bundle.memorabilia?.value || 0), 0);
  const totalValue = totalTicketValue + totalMemorabiliaValue;

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Ticket Reveal Stage */}
        {currentStage === 'ticket' && (
          <motion.div
            key="ticket-reveal"
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
                  onEnded={handleTicketVideoEnd}
                  playsInline
                  muted
                >
                  <source src={getVideoPath()} type="video/mp4" />
                </video>

                {/* Show ticket results overlay when video ends */}
                {videoEnded && showResults && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80"
                  >
                    <div className="text-center text-white p-8">
                      <Ticket className="w-20 h-20 mx-auto mb-6 text-yellow-400" />
                      <h2 className="text-4xl font-bold mb-4">Tickets Won!</h2>
                      {bundles.map((bundle, index) => (
                        bundle.ticket && (
                          <div key={index} className="mb-4">
                            {bundle.ticket.level ? (
                              <div>
                                <p className="text-2xl font-bold">Level {bundle.ticket.level}</p>
                                <p className="text-xl text-gray-300">{bundle.ticket.levelName}</p>
                              </div>
                            ) : bundle.ticket.individual ? (
                              <div>
                                <p className="text-2xl font-bold">Section {bundle.ticket.section}</p>
                                <p className="text-xl text-gray-300">Row {bundle.ticket.row}</p>
                              </div>
                            ) : bundle.ticket.special ? (
                              <div>
                                <p className="text-2xl font-bold">{bundle.ticket.name}</p>
                                <p className="text-xl text-gray-300">{bundle.ticket.prizeType}</p>
                              </div>
                            ) : null}
                            <p className="text-3xl font-bold text-yellow-400 mt-2">
                              ${bundle.ticket.value || 0}
                            </p>
                          </div>
                        )
                      ))}
                      <div className="mt-6 pt-4 border-t border-gray-600">
                        <p className="text-lg text-gray-400">Total Ticket Value</p>
                        <p className="text-4xl font-bold text-yellow-400">${totalTicketValue}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Memorabilia Reveal Stage */}
        {currentStage === 'memorabilia' && (
          <motion.div
            key="memorabilia-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl overflow-hidden">
              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                <video
                  ref={memorabiliaVideoRef}
                  className="w-full h-full object-cover"
                  onEnded={handleMemorabiliaVideoEnd}
                  playsInline
                  muted
                >
                  <source src={getVideoPath()} type="video/mp4" />
                </video>

                {/* Show memorabilia results overlay when video ends */}
                {videoEnded && showResults && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80"
                  >
                    <div className="text-center text-white p-8">
                      <Package className="w-20 h-20 mx-auto mb-6 text-purple-400" />
                      <h2 className="text-4xl font-bold mb-4">Memorabilia Won!</h2>
                      {bundles.map((bundle, index) => (
                        bundle.memorabilia && (
                          <div key={index} className="mb-4">
                            <p className="text-2xl font-bold">{bundle.memorabilia.name}</p>
                            <p className="text-3xl font-bold text-purple-400 mt-2">
                              ${bundle.memorabilia.value || 0}
                            </p>
                          </div>
                        )
                      ))}
                      <div className="mt-6 pt-4 border-t border-gray-600">
                        <p className="text-lg text-gray-400">Total Memorabilia Value</p>
                        <p className="text-4xl font-bold text-purple-400">${totalMemorabiliaValue}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
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
                    <p className="text-2xl font-bold text-yellow-300 mt-4">
                      ${totalTicketValue}
                    </p>
                  </div>

                  {/* Memorabilia Summary */}
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6">
                    <Package className="w-12 h-12 text-white mb-3" />
                    <h3 className="text-xl font-bold text-white mb-4">Your Memorabilia</h3>
                    {bundles.map((bundle, index) => (
                      bundle.memorabilia && (
                        <div key={index} className="text-white mb-2">
                          <p>{bundle.memorabilia.name}</p>
                        </div>
                      )
                    ))}
                    <p className="text-2xl font-bold text-yellow-300 mt-4">
                      ${totalMemorabiliaValue}
                    </p>
                  </div>
                </div>

                <div className="text-center border-t border-gray-700 pt-6">
                  <p className="text-gray-400 mb-2">TOTAL BUNDLE VALUE</p>
                  <p className="text-5xl font-bold text-yellow-400">
                    ${totalValue}
                  </p>
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