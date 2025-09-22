'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardBreakData {
  id?: string;
  imageUrl?: string;
  name?: string;
  breakName?: string;
  teamName?: string;
  description?: string;
  breakValue?: number;
  value?: number;
  spotPrice?: number;
  category?: string;
  itemType?: string;
}

interface BundleData {
  ticket: {
    level?: string;
    levelName?: string;
    viewImageUrl?: string;
    special?: boolean;
    name?: string;
    imageUrl?: string;
  };
  memorabilia: CardBreakData;
}

interface AllegiantStadiumAnimationProps {
  targetSection: string;
  targetRow: string;
  targetSeats?: string[];
  cardBreak?: CardBreakData;
  seatViewUrl?: string;
  bundles?: BundleData[];  // New prop for multiple bundles
  onComplete?: () => void;
  isAnimating: boolean;
  stadium?: {
    id: string;
    name: string;
    displayName?: string;
    footballImage?: string;
    concertImage?: string;
    basketballImage?: string;
    sectionConfig?: any[];
    imagePath?: string;
  };
  venueName?: string;
}

export default function AllegiantStadiumAnimation({
  targetSection,
  targetRow,
  targetSeats = [],
  cardBreak,
  seatViewUrl,
  bundles,
  onComplete,
  isAnimating,
  stadium,
  venueName
}: AllegiantStadiumAnimationProps) {
  const [currentPhase, setCurrentPhase] = useState<'waiting' | 'video' | 'seat' | 'cardvideo' | 'memorabilia'>('waiting');
  const [videoError, setVideoError] = useState(false);
  const [currentBundleIndex, setCurrentBundleIndex] = useState(0);

  // Use bundles if provided, otherwise fall back to legacy single item
  const allBundles = bundles || (cardBreak ? [{
    ticket: { level: targetSection, levelName: targetRow, viewImageUrl: seatViewUrl },
    memorabilia: cardBreak
  }] : []);

  // Start animation sequence when isAnimating becomes true
  useEffect(() => {
    if (isAnimating) {
      console.log('Starting animation sequence');
      // Start with video phase immediately
      setCurrentPhase('video');
      setVideoError(false);
    } else {
      setCurrentPhase('waiting');
    }
  }, [isAnimating]);

  // Handle video error or if video doesn't exist
  const handleVideoError = () => {
    console.log('Video error or not found, skipping to seat reveal');
    setVideoError(true);
    // Skip directly to seat reveal if video fails
    setCurrentPhase('seat');

    // After 3 seconds, move to sports card video
    setTimeout(() => {
      setCurrentPhase('cardvideo');
    }, 3000);
  };

  // Handle stadium video end - show seat result
  const handleStadiumVideoEnd = () => {
    console.log('Stadium video ended, showing seat result');
    setCurrentPhase('seat');

    // After showing seat result for 3 seconds, move to sports card video
    setTimeout(() => {
      setCurrentPhase('cardvideo');
    }, 3000);
  };

  // Handle sports card video end - show memorabilia
  const handleSportsCardVideoEnd = () => {
    console.log('Sports card video ended, showing memorabilia');
    setCurrentPhase('memorabilia');
  };

  // Navigate to next bundle
  const handleNextBundle = () => {
    if (currentBundleIndex < allBundles.length - 1) {
      setCurrentBundleIndex(currentBundleIndex + 1);
      setCurrentPhase('memorabilia');
    } else {
      handleContinue();
    }
  };

  // Navigate to previous bundle
  const handlePrevBundle = () => {
    if (currentBundleIndex > 0) {
      setCurrentBundleIndex(currentBundleIndex - 1);
      setCurrentPhase('memorabilia');
    }
  };

  // Handle final continue
  const handleContinue = () => {
    setCurrentPhase('waiting');
    if (onComplete) onComplete();
  };

  if (!isAnimating) return null;

  return (
    <div className="fixed inset-0 z-50">
      <AnimatePresence mode="wait">
        {/* Stadium Video Animation - Try to play, skip if not available */}
        {currentPhase === 'video' && !videoError && (
          <motion.div
            key="stadium-video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex items-center justify-center"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
                onEnded={handleStadiumVideoEnd}
                onError={handleVideoError}
                onLoadedData={() => console.log('Video loaded successfully')}
              >
                <source src="/videos/allegiant_animation.mp4" type="video/mp4" />
              </video>

              {/* Fallback button if video doesn't autoplay */}
              <button
                onClick={handleVideoError}
                className="absolute bottom-10 px-6 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 rounded-lg font-bold backdrop-blur-sm"
              >
                Skip Video
              </button>
            </div>
          </motion.div>
        )}

        {/* Seat/Ticket Result - Flash in immediately after video */}
        {currentPhase === 'seat' && (
          <motion.div
            key="seat-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-gradient-to-br from-purple-950 via-black to-blue-950 flex items-center justify-center p-8"
          >
            {/* White flash effect */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-white pointer-events-none z-10"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.05,
                duration: 0.3,
                type: "spring",
                damping: 15,
                stiffness: 300
              }}
              className="relative max-w-3xl w-full"
            >
              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-3xl blur-2xl opacity-60 animate-pulse" />

              <div className="relative bg-black/90 backdrop-blur-xl p-8 rounded-3xl border-2 border-yellow-400 shadow-2xl">
                <motion.h2
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent"
                >
                  🎉 WINNER! 🎉
                </motion.h2>

                {/* Seat View Image - Show immediately */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="relative rounded-2xl overflow-hidden mb-6"
                >
                  {seatViewUrl ? (
                    <img
                      src={seatViewUrl}
                      alt="Your Winning Seats"
                      className="w-full h-96 object-cover"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-8xl mb-4">🎫</div>
                        <p className="text-3xl font-bold text-white">{targetRow}</p>
                        <p className="text-xl text-gray-300">Section {targetSection}</p>
                      </div>
                    </div>
                  )}

                  {/* Sparkle effects */}
                  <motion.div
                    className="absolute top-4 left-4 text-4xl"
                    animate={{
                      scale: [1, 1.5, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    className="absolute bottom-4 right-4 text-4xl"
                    animate={{
                      scale: [1, 1.5, 1],
                      rotate: [360, 180, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    ⭐
                  </motion.div>
                </motion.div>

                {/* Seat Details - Show immediately */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-white"
                >
                  <p className="text-2xl font-bold mb-2">{targetRow}</p>
                  <p className="text-xl">Section {targetSection}</p>
                  {targetSeats.length > 0 && (
                    <p className="text-lg text-gray-300 mt-2">
                      Seat{targetSeats.length > 1 ? 's' : ''}: {targetSeats.join(', ')}
                    </p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Sports Card Video with Zoom Effect */}
        {currentPhase === 'cardvideo' && (
          <motion.div
            key="card-video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex flex-col items-center justify-center"
          >
            {/* Title with surprise zoom */}
            <motion.div
              initial={{ scale: 10, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 1,
                type: "spring",
                damping: 15
              }}
              className="absolute top-20 text-center z-20"
            >
              <h2 className="text-4xl font-bold text-white mb-2">
                Let's see what memorabilia you won...
              </h2>
              <motion.p
                className="text-xl text-yellow-400"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
              >
                Get ready for something special!
              </motion.p>
            </motion.div>

            {/* Video with zoom in from far */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 1.5,
                type: "spring",
                damping: 10
              }}
              className="relative"
            >
              <video
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
                onEnded={handleSportsCardVideoEnd}
              >
                <source src="/videos/sports_card_football.mp4" type="video/mp4" />
              </video>
            </motion.div>

            {/* Skip button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={handleSportsCardVideoEnd}
              className="absolute bottom-10 px-6 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 rounded-lg font-bold backdrop-blur-sm"
            >
              Skip
            </motion.button>
          </motion.div>
        )}

        {/* Final Memorabilia Card with Flash and Zoom */}
        {currentPhase === 'memorabilia' && (
          <motion.div
            key="memorabilia"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-gradient-to-br from-purple-950 via-black to-blue-950 flex items-center justify-center p-4"
          >
            {/* White flash overlay */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-white pointer-events-none z-50"
            />

            <motion.div
              initial={{ scale: 0, rotateY: 180, rotateZ: -180 }}
              animate={{ scale: 1, rotateY: 0, rotateZ: 0 }}
              transition={{
                type: "spring",
                duration: 1.5,
                bounce: 0.4,
                delay: 0.1
              }}
              className="relative max-w-2xl w-full"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-3xl blur-xl opacity-50 animate-pulse" />

              <div className="relative bg-black/90 backdrop-blur-xl p-8 rounded-3xl border-2 border-yellow-400/50 shadow-2xl">
                <motion.div
                  initial={{ y: -20, opacity: 0, scale: 2 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-center mb-6"
                >
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-2">
                    🏆 YOUR MEMORABILIA! 🏆
                  </h2>
                </motion.div>

                {/* Memorabilia Display with dramatic zoom in */}
                <motion.div
                  initial={{ scale: 5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.6,
                    duration: 0.8,
                    type: "spring",
                    damping: 15
                  }}
                  className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 p-4 rounded-2xl mb-6 relative"
                >
                  {/* Sparkle animations */}
                  <motion.div
                    className="absolute -top-4 -left-4 text-3xl"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.5, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    className="absolute -top-4 -right-4 text-3xl"
                    animate={{
                      rotate: [360, 0],
                      scale: [1, 1.5, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    💫
                  </motion.div>

                  {allBundles[currentBundleIndex]?.memorabilia?.imageUrl ? (
                    <motion.img
                      src={allBundles[currentBundleIndex].memorabilia.imageUrl}
                      alt={allBundles[currentBundleIndex].memorabilia.name || allBundles[currentBundleIndex].memorabilia.breakName || 'Sports Memorabilia'}
                      className="w-full h-96 object-contain rounded-lg"
                      initial={{ filter: "blur(20px)" }}
                      animate={{ filter: "blur(0px)" }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    />
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <motion.div
                          className="text-6xl mb-4"
                          animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          🎴
                        </motion.div>
                        <p className="text-gray-400">Premium Sports Memorabilia</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Memorabilia Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="text-white space-y-3 mb-6"
                >
                  <h3 className="text-2xl font-bold text-yellow-400">
                    {allBundles[currentBundleIndex]?.memorabilia?.name || allBundles[currentBundleIndex]?.memorabilia?.breakName || 'Exclusive Sports Card'}
                  </h3>
                  <p className="text-gray-300">
                    {allBundles[currentBundleIndex]?.memorabilia?.description || 'Authentic collectible sports memorabilia'}
                  </p>
                  {allBundles[currentBundleIndex]?.memorabilia?.value && (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring", damping: 10 }}
                    >
                      <span className="text-gray-400">Estimated Value:</span>
                      <span className="text-2xl font-bold text-green-400">
                        ${(allBundles[currentBundleIndex].memorabilia.value || 0).toFixed(2)}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Navigation */}
                {allBundles.length > 1 && (
                  <div className="text-center mb-4">
                    <p className="text-lg text-gray-300">
                      Bundle {currentBundleIndex + 1} of {allBundles.length}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  {allBundles.length > 1 && currentBundleIndex > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrevBundle}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg"
                    >
                      Previous Bundle
                    </motion.button>
                  )}

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={allBundles.length > 1 && currentBundleIndex < allBundles.length - 1 ? handleNextBundle : handleContinue}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg"
                  >
                    {allBundles.length > 1 && currentBundleIndex < allBundles.length - 1 ? 'Next Bundle' : 'Awesome! Continue'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}