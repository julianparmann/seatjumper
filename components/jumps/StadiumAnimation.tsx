'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface SectionCoordinate {
  id: string;
  x: number;
  y: number;
  level: 'lower' | 'middle' | 'upper';
  isClub?: boolean;
  rows?: string[];
  priceRange?: { min: number; max: number };
}

interface StadiumConfig {
  id: string;
  name: string;
  displayName: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  sectionConfig: SectionCoordinate[];
}

interface CardBreakData {
  id?: string;
  imageUrl?: string;
  breakName?: string;
  teamName?: string;
  description?: string;
  breakValue?: number;
  value?: number;
  spotPrice?: number;
  category?: string;
  itemType?: string;
}

interface StadiumAnimationProps {
  stadiumConfig: StadiumConfig;
  targetSection: string;
  targetRow: string;
  targetSeats?: string;
  cardBreak?: CardBreakData;
  seatViewUrl?: string;
  onComplete?: () => void;
  isAnimating: boolean;
}

export default function StadiumAnimation({
  stadiumConfig,
  targetSection,
  targetRow,
  targetSeats = '1,2',
  cardBreak,
  seatViewUrl,
  onComplete,
  isAnimating
}: StadiumAnimationProps) {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [trailSections, setTrailSections] = useState<string[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'jumping' | 'slowing' | 'complete' | 'memorabilia' | 'gif' | 'final'>('jumping');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [showGif, setShowGif] = useState(false);
  const [showMemorabiliaCard, setShowMemorabiliaCard] = useState(false);

  const sections = stadiumConfig.sectionConfig || [];

  // Helper functions using stadium config
  const getSectionById = (id: string): SectionCoordinate | undefined => {
    return sections.find(s => s.id === id);
  };

  const getRandomSection = (): SectionCoordinate => {
    const randomIndex = Math.floor(Math.random() * sections.length);
    return sections[randomIndex];
  };

  // Normalize section ID (remove 'C' prefix if present)
  const normalizedTargetSection = targetSection.replace(/^C/i, '');

  useEffect(() => {
    if (!isAnimating) return;

    let jumpCount = 0;
    const totalJumps = 50;
    const slowdownStart = 35;
    let jumpSpeed = 120;

    const targetSectionData = getSectionById(normalizedTargetSection);
    if (!targetSectionData) {
      console.error(`Target section ${targetSection} (normalized: ${normalizedTargetSection}) not found`);
      return;
    }

    const jumpInterval = setInterval(() => {
      jumpCount++;

      if (jumpCount < slowdownStart) {
        // Fast random jumping phase
        const randomSection = getRandomSection();
        if (randomSection) {
          setCurrentSection(randomSection.id);
          setHighlightedSection(randomSection.id);
          setTrailSections(prev => [...prev.slice(-4), randomSection.id]);
          setAnimationPhase('jumping');
        }
      } else if (jumpCount < totalJumps) {
        // Slowing down phase
        setAnimationPhase('slowing');
        jumpSpeed = 150 + (jumpCount - slowdownStart) * 20;

        // Get sections near the target
        const targetIdx = sections.findIndex(s => s.id === normalizedTargetSection);
        const variance = Math.max(1, totalJumps - jumpCount) * 2;
        const nearbyIdx = targetIdx + Math.floor((Math.random() - 0.5) * variance);
        const boundedIdx = Math.max(0, Math.min(sections.length - 1, nearbyIdx));

        setCurrentSection(sections[boundedIdx].id);
        setHighlightedSection(sections[boundedIdx].id);
        setTrailSections(prev => [...prev.slice(-3), sections[boundedIdx].id]);
      } else {
        // Land on target
        clearInterval(jumpInterval);
        setCurrentSection(normalizedTargetSection);
        setHighlightedSection(normalizedTargetSection);
        setTrailSections([]);
        setAnimationPhase('complete');

        // Show memorabilia card if present
        if (cardBreak && (cardBreak.imageUrl || cardBreak.category === 'memorabilia')) {
          setTimeout(() => {
            setShowMemorabiliaCard(true);
            setAnimationPhase('memorabilia');

            // Hide memorabilia and show gif after 3 seconds
            setTimeout(() => {
              setShowMemorabiliaCard(false);
              setShowGif(true);
              setAnimationPhase('gif');

              // Start countdown
              const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                  if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setAnimationPhase('final');
                    if (onComplete) {
                      setTimeout(onComplete, 500);
                    }
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            }, 3000);
          }, 1500);
        } else if (seatViewUrl) {
          // Show seat view if no memorabilia
          setTimeout(() => {
            setShowGif(true);
            setAnimationPhase('gif');

            // Start countdown
            const countdownInterval = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  setAnimationPhase('final');
                  if (onComplete) {
                    setTimeout(onComplete, 500);
                  }
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }, 1500);
        } else {
          // No memorabilia or seat view, just complete
          setTimeout(() => {
            setAnimationPhase('final');
            if (onComplete) {
              setTimeout(onComplete, 500);
            }
          }, 2000);
        }
      }

      clearInterval(jumpInterval);
      const newInterval = setInterval(() => {}, jumpSpeed);
      return () => clearInterval(newInterval);
    }, jumpSpeed);

    return () => clearInterval(jumpInterval);
  }, [isAnimating, normalizedTargetSection, cardBreak, seatViewUrl, onComplete, sections]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Stadium Image */}
      <div className="relative">
        <Image
          src={stadiumConfig.imagePath}
          alt={stadiumConfig.displayName}
          width={stadiumConfig.imageWidth}
          height={stadiumConfig.imageHeight}
          className="w-full h-auto rounded-lg"
        />

        {/* Section Dots */}
        {sections.map(section => {
          const isHighlighted = section.id === highlightedSection;
          const isTrail = trailSections.includes(section.id);
          const isTarget = section.id === normalizedTargetSection;

          return (
            <motion.div
              key={section.id}
              className="absolute"
              style={{
                left: `${section.x}%`,
                top: `${section.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: isHighlighted ? 2 : isTrail ? 1.2 : 1,
                opacity: isHighlighted ? 1 : isTrail ? 0.5 : 0.3,
              }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`
                  ${isHighlighted ? 'w-4 h-4' : isTrail ? 'w-2 h-2' : 'w-1 h-1'}
                  ${isTarget ? 'bg-green-500' : isHighlighted ? 'bg-red-500' : 'bg-yellow-400'}
                  rounded-full shadow-lg
                  ${isHighlighted ? 'ring-4 ring-red-300 ring-opacity-50' : ''}
                `}
              />
              {isHighlighted && (
                <motion.div
                  className="absolute inset-0 bg-red-400 rounded-full"
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Section Info Display */}
      <AnimatePresence>
        {currentSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-white rounded-lg shadow-lg"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800">
                Section {currentSection}
              </h3>
              {animationPhase === 'complete' && (
                <div className="mt-2">
                  <p className="text-green-600 font-semibold">🎯 Winner!</p>
                  <p className="text-gray-600">Row {targetRow}, Seat{targetSeats.includes(',') ? 's' : ''} {targetSeats}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memorabilia Card Display */}
      <AnimatePresence>
        {showMemorabiliaCard && cardBreak && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
          >
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md">
              {cardBreak.imageUrl && (
                <img
                  src={cardBreak.imageUrl}
                  alt={cardBreak.teamName || 'Memorabilia'}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-2xl font-bold mb-2">Bonus Memorabilia!</h3>
              <p className="text-gray-600">{cardBreak.description || cardBreak.teamName}</p>
              {cardBreak.value && (
                <p className="text-green-600 font-semibold mt-2">
                  Value: ${cardBreak.value.toFixed(2)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seat View or GIF Display */}
      <AnimatePresence>
        {showGif && seatViewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg"
          >
            <div className="relative">
              <img
                src={seatViewUrl}
                alt="View from your seat"
                className="max-w-full max-h-[600px] rounded-lg shadow-2xl"
              />
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                <p className="text-2xl font-bold">{countdown}s</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}