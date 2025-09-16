'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { allegiantPreciseSections, getSectionById, getRandomSection } from '@/data/stadiums/allegiant-precise-coordinates';

interface CardBreakData {
  id?: string;
  imageUrl?: string;
  breakName?: string;
  teamName?: string;
  description?: string;
  breakValue?: number;
  value?: number;  // API returns 'value' field
  spotPrice?: number;
  category?: string;
  itemType?: string;
}

interface AllegiantStadiumAnimationProps {
  targetSection: string;
  targetRow: string;
  targetSeats?: string;
  cardBreak?: CardBreakData;
  onComplete?: () => void;
  isAnimating: boolean;
}

export default function AllegiantStadiumAnimation({
  targetSection,
  targetRow,
  targetSeats = '1,2',
  cardBreak,
  onComplete,
  isAnimating
}: AllegiantStadiumAnimationProps) {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [trailSections, setTrailSections] = useState<string[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'jumping' | 'slowing' | 'complete' | 'memorabilia' | 'gif' | 'final'>('jumping');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [showGif, setShowGif] = useState(false);
  const [showMemorabiliaCard, setShowMemorabiliaCard] = useState(false);

  // Debug logging
  useEffect(() => {
    if (cardBreak) {
      console.log('CardBreak data received:', cardBreak);
    }
  }, [cardBreak]);

  // Normalize section ID (remove 'C' prefix if present) - moved outside useEffect
  const normalizedTargetSection = targetSection.replace(/^C/i, '');

  useEffect(() => {
    if (!isAnimating) return;

    let jumpCount = 0;
    const totalJumps = 50; // More jumps for longer animation
    const slowdownStart = 35;
    let jumpSpeed = 120; // Slower initial speed for better visibility

    const targetSectionData = getSectionById(normalizedTargetSection);
    if (!targetSectionData) {
      console.error(`Target section ${targetSection} (normalized: ${normalizedTargetSection}) not found`);
      return;
    }

    const jumpInterval = setInterval(() => {
      jumpCount++;

      if (jumpCount < slowdownStart) {
        // Fast random jumping phase - exclude field sections
        const randomSection = getRandomSection();
        if (randomSection) {
          setCurrentSection(randomSection.id);
          setHighlightedSection(randomSection.id);
          setTrailSections(prev => [...prev.slice(-4), randomSection.id]);
          setAnimationPhase('jumping');
        }
      } else if (jumpCount < totalJumps) {
        // Slowing down phase - get closer to target
        setAnimationPhase('slowing');
        jumpSpeed = 150 + (jumpCount - slowdownStart) * 20; // Even slower at the end

        // Get sections near the target
        const allSections = allegiantPreciseSections;
        const targetIdx = allSections.findIndex(s => s.id === normalizedTargetSection);
        const variance = Math.max(1, totalJumps - jumpCount) * 2;
        const nearbyIdx = targetIdx + Math.floor((Math.random() - 0.5) * variance);
        const boundedIdx = Math.max(0, Math.min(allSections.length - 1, nearbyIdx));

        setCurrentSection(allSections[boundedIdx].id);
        setHighlightedSection(allSections[boundedIdx].id);
        setTrailSections(prev => [...prev.slice(-3), allSections[boundedIdx].id]);
      } else {
        // Land on target
        clearInterval(jumpInterval);
        setCurrentSection(normalizedTargetSection);
        setHighlightedSection(normalizedTargetSection);
        setTrailSections([normalizedTargetSection]);
        setAnimationPhase('complete');

        // Don't call onComplete immediately anymore
      }
    }, jumpSpeed);

    return () => clearInterval(jumpInterval);
  }, [isAnimating, targetSection, normalizedTargetSection]);

  // Countdown timer effect
  useEffect(() => {
    if (animationPhase === 'complete' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      // Auto-reveal after countdown
      if (countdown === 1) {
        handleMemorabiliaReveal();
      }

      return () => clearTimeout(timer);
    }
  }, [animationPhase, countdown]);

  // Handle memorabilia reveal
  const handleMemorabiliaReveal = () => {
    setAnimationPhase('gif');
    setShowGif(true);
    // Video will handle its own duration and call onEnded
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'lower': return 'LOWER BOWL';
      case 'middle': return 'CLUB LEVEL';
      case 'upper': return 'UPPER DECK';
      default: return level.toUpperCase();
    }
  };

  // Create a proper shape for each section based on its position
  const getSectionShape = (section: any) => {
    const size = section.level === 'lower' ? 20 : section.level === 'middle' ? 18 : 16;
    const width = size * 1.5;
    const height = size;

    // Return a trapezoid path that looks like stadium seating
    return `M 0,${height/2} L ${width*0.2},0 L ${width*0.8},0 L ${width},${height/2} L ${width*0.9},${height} L ${width*0.1},${height} Z`;
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto p-4">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative"
        >
          {/* Stadium Container */}
          <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black rounded-3xl p-4 overflow-hidden">

            {/* Stadium Image Container */}
            <div className="relative w-full h-[600px] rounded-2xl overflow-hidden">
              <img
                src="/images/stadiums/allegiant-stadium.png"
                alt="Allegiant Stadium"
                className="w-full h-full object-contain"
              />

              {/* Dark overlay for better visibility */}
              <div className="absolute inset-0 bg-black/30 pointer-events-none" />

              {/* SVG Overlay for section highlighting */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  {/* Glow filter for highlighted sections */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Render all sections */}
                {allegiantPreciseSections.map((section) => {
                  const isActive = section.id === currentSection;
                  const isTrail = trailSections.includes(section.id);
                  const isTarget = section.id === normalizedTargetSection && animationPhase === 'complete';
                  const isHighlighted = section.id === highlightedSection;

                  // Calculate actual pixel position based on percentage
                  const xPos = `${section.x}%`;
                  const yPos = `${section.y}%`;

                  return (
                    <g key={section.id} transform={`translate(${(section.x / 100) * 600}, ${(section.y / 100) * 600})`}>
                      {/* Section highlight circle/shape */}
                      <motion.circle
                        cx="0"
                        cy="0"
                        r={section.level === 'lower' ? '8' : section.level === 'middle' ? '7' : '6'}
                        fill={
                          isTarget
                            ? '#fbbf24' // Yellow for winner
                            : isActive
                              ? '#60a5fa' // Blue for active
                              : isTrail
                                ? '#a78bfa' // Purple for trail
                                : section.isClub
                                  ? 'rgba(239, 68, 68, 0.3)' // Red tint for club sections
                                  : 'rgba(156, 163, 175, 0.2)' // Gray for inactive
                        }
                        stroke={
                          isTarget || isActive
                            ? '#fff'
                            : section.isClub
                              ? '#dc2626'
                              : 'transparent'
                        }
                        strokeWidth={isTarget || isActive ? '2' : '1'}
                        opacity={
                          isTarget ? 1
                            : isActive ? 0.9
                              : isTrail ? 0.6
                                : isHighlighted ? 0.5
                                  : 0.3
                        }
                        filter={isTarget || isActive ? 'url(#glow)' : undefined}
                        animate={{
                          scale: isTarget ? [1, 1.3, 1] : isActive ? [1, 1.1, 1] : 1,
                        }}
                        transition={{
                          duration: isTarget ? 1 : 0.3,
                          repeat: isTarget ? Infinity : 0,
                        }}
                      />

                      {/* Section number label */}
                      {(isActive || isTarget || isHighlighted) && (
                        <motion.text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="8"
                          fontWeight="bold"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {section.id}
                        </motion.text>
                      )}

                      {/* Winner pulse effect */}
                      {isTarget && (
                        <>
                          <motion.circle
                            cx="0"
                            cy="0"
                            r="10"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2"
                            opacity="0.8"
                            animate={{
                              r: [10, 20, 10],
                              opacity: [0.8, 0, 0.8],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          />
                          <motion.circle
                            cx="0"
                            cy="0"
                            r="12"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1"
                            opacity="0.6"
                            animate={{
                              r: [12, 25, 12],
                              opacity: [0.6, 0, 0.6],
                            }}
                            transition={{
                              duration: 2,
                              delay: 0.5,
                              repeat: Infinity,
                            }}
                          />
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Light trail connecting sections */}
                {trailSections.length > 1 && animationPhase !== 'complete' && (
                  <motion.polyline
                    points={trailSections.map(sectionId => {
                      const section = allegiantPreciseSections.find(s => s.id === sectionId);
                      if (!section) return '';
                      return `${(section.x / 100) * 600},${(section.y / 100) * 600}`;
                    }).filter(p => p).join(' ')}
                    fill="none"
                    stroke="url(#trailGradient)"
                    strokeWidth="2"
                    opacity="0.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Stadium Title Overlay */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                <h3 className="text-white font-bold text-lg">Allegiant Stadium</h3>
                <p className="text-gray-300 text-sm">Las Vegas, Nevada</p>
              </div>
            </div>

            {/* Status Text */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              {animationPhase === 'jumping' && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="bg-black/60 backdrop-blur-sm mx-auto px-6 py-3 rounded-lg max-w-fit"
                >
                  <p className="text-2xl font-bold text-yellow-400">
                    SCANNING STADIUM...
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    Finding your perfect seat
                  </p>
                </motion.div>
              )}

              {animationPhase === 'slowing' && (
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="bg-black/60 backdrop-blur-sm mx-auto px-6 py-3 rounded-lg max-w-fit"
                >
                  <p className="text-2xl font-bold text-blue-400">
                    ZEROING IN...
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    Almost there!
                  </p>
                </motion.div>
              )}

              {animationPhase === 'complete' && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-lg px-8 py-6 rounded-2xl border-2 border-yellow-400 shadow-2xl max-w-lg"
                >
                  <p className="text-2xl font-bold text-yellow-400 mb-3 text-center">
                    🎉 Congratulations!
                  </p>
                  <div className="text-white text-center space-y-2 mb-4">
                    <p className="text-xl">
                      You're in <span className="font-bold text-yellow-400">Section {targetSection}</span>
                    </p>
                    <p className="text-lg">
                      Row <span className="font-bold">{targetRow}</span> •
                      Seat{targetSeats.includes(',') ? 's' : ''} <span className="font-bold">{targetSeats}</span>
                    </p>
                    {allegiantPreciseSections.find(s => s.id === normalizedTargetSection)?.isClub && (
                      <p className="text-sm text-yellow-300 mt-2">
                        ⭐ Premium Club Section
                      </p>
                    )}
                  </div>
                  <div className="border-t border-gray-600 pt-4">
                    <p className="text-center text-white mb-3">
                      Ready to see your memorabilia?
                    </p>
                    <button
                      onClick={handleMemorabiliaReveal}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                    >
                      YES! Show Me ({countdown}s)
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Video Overlay */}
          {showGif && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
            >
              {/* Text at the top of the screen */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-20 text-center z-20"
              >
                <h2 className="text-4xl font-bold text-white mb-2">
                  Let's see what you won...
                </h2>
                <p className="text-xl text-yellow-400">
                  Get ready for your exclusive memorabilia reveal!
                </p>
              </motion.div>

              <video
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
                onEnded={() => {
                  // Video finished playing
                  setShowGif(false);
                  setShowMemorabiliaCard(true);
                  setAnimationPhase('final');
                }}
              >
                <source src="/videos/sports_card_football.mp4" type="video/mp4" />
                {/* Fallback if video doesn't load */}
                <div className="text-center p-8">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: 4,
                      ease: "easeInOut"
                    }}
                    className="text-8xl mb-4"
                  >
                    🎴
                  </motion.div>
                  <p className="text-yellow-400 text-2xl font-bold">
                    Revealing Your Memorabilia...
                  </p>
                </div>
              </video>
            </motion.div>
          )}

          {/* Memorabilia Card */}
          {showMemorabiliaCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-gradient-to-br from-purple-950 via-black to-blue-950 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.5, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ type: "spring", duration: 1, bounce: 0.4 }}
                className="relative max-w-2xl w-full"
              >
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-3xl blur-xl opacity-50 animate-pulse" />

                <div className="relative bg-black/90 backdrop-blur-xl p-8 rounded-3xl border-2 border-yellow-400/50 shadow-2xl">
                  {/* Header */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-6"
                  >
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-2">
                      🏆 WINNER! 🏆
                    </h2>
                    <p className="text-white text-lg">You've won exclusive memorabilia!</p>
                  </motion.div>

                  {/* Dancing Card Display */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                    animate={{
                      opacity: 1,
                      rotateY: [180, 0, -5, 5, 0],
                      scale: [0.5, 1.2, 1, 1.1, 1],
                      y: [0, -20, 0, -10, 0],
                      rotate: [0, -5, 5, -3, 0],
                    }}
                    transition={{
                      rotateY: {
                        delay: 0.5,
                        duration: 1.5,
                        times: [0, 0.3, 0.5, 0.7, 1]
                      },
                      scale: {
                        delay: 1,
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      },
                      y: {
                        delay: 1.5,
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      },
                      rotate: {
                        delay: 1.7,
                        duration: 1.8,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }
                    }}
                    className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 p-4 rounded-2xl mb-6 relative"
                  >
                    {/* Pulsing glow effect behind the card */}
                    <motion.div
                      className="absolute -inset-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-3xl blur-3xl opacity-70"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    {cardBreak?.imageUrl ? (
                      <motion.img
                        src={cardBreak.imageUrl}
                        alt={cardBreak.breakName || cardBreak.teamName || cardBreak.description || 'Sports Memorabilia'}
                        className="relative w-full h-96 object-contain rounded-lg"
                        animate={{
                          filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    ) : (
                      <div className="w-full h-96 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <motion.div
                            className="text-6xl mb-4"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            🎴
                          </motion.div>
                          <p className="text-gray-400">Premium Sports Memorabilia</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Card Details */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-white space-y-3 mb-6"
                  >
                    <h3 className="text-2xl font-bold text-yellow-400">
                      {cardBreak?.teamName || cardBreak?.breakName || cardBreak?.description || 'Exclusive Sports Card'}
                    </h3>
                    <p className="text-gray-300 text-lg">
                      {cardBreak?.description || (cardBreak?.category ? `Premium ${cardBreak.category}` : 'Authentic collectible sports memorabilia from your favorite team!')}
                    </p>
                    {(cardBreak?.value || cardBreak?.breakValue || cardBreak?.spotPrice) && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Estimated Value:</span>
                        <span className="text-2xl font-bold text-green-400">
                          ${(cardBreak.value || cardBreak.breakValue || cardBreak.spotPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowMemorabiliaCard(false);
                      if (onComplete) onComplete();
                    }}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg"
                  >
                    Awesome! Continue
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}