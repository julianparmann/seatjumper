'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Ticket, Package, Star, Zap, User, MousePointer } from 'lucide-react';

interface MultiStageJumpProps {
  onComplete?: (result: JumpResult) => void;
  isJumping: boolean;
  result?: JumpResult | null;
  sport?: 'NFL' | 'NBA' | 'MLB' | 'NHL';
}

interface JumpResult {
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
  bundles?: Array<{
    ticket: {
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
      name: string;
      value?: number;
    };
  }>;
}

type Stage = 'stadium' | 'wheel' | 'scratch' | 'peel' | 'complete';

export default function MultiStageJump({ onComplete, isJumping, result, sport = 'NFL' }: MultiStageJumpProps) {
  const [stage, setStage] = useState<Stage>('stadium');
  const [jumperPosition, setJumperPosition] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [jumpCount, setJumpCount] = useState(0);
  const [finalSection, setFinalSection] = useState<any>(null);

  // Wheel state
  const [wheelRotation, setWheelRotation] = useState(0);

  // Scratch state
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const [ticketRevealed, setTicketRevealed] = useState(false);

  // Peel state
  const [peelProgress, setPeelProgress] = useState(0);
  const [isPeeling, setIsPeeling] = useState(false);
  const [packRevealed, setPackRevealed] = useState(false);

  // Real stadium layout
  const stadiumSections = {
    NFL: {
      shape: 'oval',
      sections: [
        // Field level (innermost)
        { id: 'field-n', label: 'Field North', tier: 'field', x: 50, y: 35, width: 30, height: 8 },
        { id: 'field-s', label: 'Field South', tier: 'field', x: 50, y: 57, width: 30, height: 8 },
        { id: 'field-e', label: 'Field East', tier: 'field', x: 75, y: 40, width: 8, height: 20 },
        { id: 'field-w', label: 'Field West', tier: 'field', x: 17, y: 40, width: 8, height: 20 },

        // Lower bowl
        { id: 'lower-ne', label: 'Lower 100s', tier: 'lower', x: 65, y: 25, width: 25, height: 15 },
        { id: 'lower-nw', label: 'Lower 100s', tier: 'lower', x: 10, y: 25, width: 25, height: 15 },
        { id: 'lower-se', label: 'Lower 100s', tier: 'lower', x: 65, y: 60, width: 25, height: 15 },
        { id: 'lower-sw', label: 'Lower 100s', tier: 'lower', x: 10, y: 60, width: 25, height: 15 },

        // Club level
        { id: 'club-n', label: 'Club 200s', tier: 'club', x: 50, y: 15, width: 60, height: 10 },
        { id: 'club-s', label: 'Club 200s', tier: 'club', x: 50, y: 75, width: 60, height: 10 },

        // Upper deck
        { id: 'upper-ne', label: 'Upper 300s', tier: 'upper', x: 70, y: 10, width: 25, height: 12 },
        { id: 'upper-nw', label: 'Upper 300s', tier: 'upper', x: 5, y: 10, width: 25, height: 12 },
        { id: 'upper-se', label: 'Upper 300s', tier: 'upper', x: 70, y: 78, width: 25, height: 12 },
        { id: 'upper-sw', label: 'Upper 300s', tier: 'upper', x: 5, y: 78, width: 25, height: 12 },

        // Nosebleeds
        { id: 'nose-n', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 5, width: 70, height: 8 },
        { id: 'nose-s', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 87, width: 70, height: 8 },
      ]
    },
    NBA: {
      shape: 'oval',
      sections: [
        // Court level (innermost)
        { id: 'court-n', label: 'Courtside North', tier: 'field', x: 50, y: 35, width: 30, height: 8 },
        { id: 'court-s', label: 'Courtside South', tier: 'field', x: 50, y: 57, width: 30, height: 8 },
        { id: 'court-e', label: 'Courtside East', tier: 'field', x: 75, y: 40, width: 8, height: 20 },
        { id: 'court-w', label: 'Courtside West', tier: 'field', x: 17, y: 40, width: 8, height: 20 },

        // Lower bowl
        { id: 'lower-ne', label: 'Lower 100s', tier: 'lower', x: 65, y: 25, width: 25, height: 15 },
        { id: 'lower-nw', label: 'Lower 100s', tier: 'lower', x: 10, y: 25, width: 25, height: 15 },
        { id: 'lower-se', label: 'Lower 100s', tier: 'lower', x: 65, y: 60, width: 25, height: 15 },
        { id: 'lower-sw', label: 'Lower 100s', tier: 'lower', x: 10, y: 60, width: 25, height: 15 },

        // Club level
        { id: 'club-n', label: 'Club 200s', tier: 'club', x: 50, y: 15, width: 60, height: 10 },
        { id: 'club-s', label: 'Club 200s', tier: 'club', x: 50, y: 75, width: 60, height: 10 },

        // Upper deck
        { id: 'upper-ne', label: 'Upper 300s', tier: 'upper', x: 70, y: 10, width: 25, height: 12 },
        { id: 'upper-nw', label: 'Upper 300s', tier: 'upper', x: 5, y: 10, width: 25, height: 12 },
        { id: 'upper-se', label: 'Upper 300s', tier: 'upper', x: 70, y: 78, width: 25, height: 12 },
        { id: 'upper-sw', label: 'Upper 300s', tier: 'upper', x: 5, y: 78, width: 25, height: 12 },

        // Nosebleeds
        { id: 'nose-n', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 5, width: 70, height: 8 },
        { id: 'nose-s', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 87, width: 70, height: 8 },
      ]
    },
    MLB: {
      shape: 'oval',
      sections: [
        // Field level (innermost)
        { id: 'field-n', label: 'Field Box', tier: 'field', x: 50, y: 35, width: 30, height: 8 },
        { id: 'field-s', label: 'Field Box', tier: 'field', x: 50, y: 57, width: 30, height: 8 },
        { id: 'field-e', label: 'Field Box', tier: 'field', x: 75, y: 40, width: 8, height: 20 },
        { id: 'field-w', label: 'Field Box', tier: 'field', x: 17, y: 40, width: 8, height: 20 },

        // Lower bowl
        { id: 'lower-ne', label: 'Infield 100s', tier: 'lower', x: 65, y: 25, width: 25, height: 15 },
        { id: 'lower-nw', label: 'Infield 100s', tier: 'lower', x: 10, y: 25, width: 25, height: 15 },
        { id: 'lower-se', label: 'Outfield 100s', tier: 'lower', x: 65, y: 60, width: 25, height: 15 },
        { id: 'lower-sw', label: 'Outfield 100s', tier: 'lower', x: 10, y: 60, width: 25, height: 15 },

        // Club level
        { id: 'club-n', label: 'Club 200s', tier: 'club', x: 50, y: 15, width: 60, height: 10 },
        { id: 'club-s', label: 'Club 200s', tier: 'club', x: 50, y: 75, width: 60, height: 10 },

        // Upper deck
        { id: 'upper-ne', label: 'Upper 300s', tier: 'upper', x: 70, y: 10, width: 25, height: 12 },
        { id: 'upper-nw', label: 'Upper 300s', tier: 'upper', x: 5, y: 10, width: 25, height: 12 },
        { id: 'upper-se', label: 'Upper 300s', tier: 'upper', x: 70, y: 78, width: 25, height: 12 },
        { id: 'upper-sw', label: 'Upper 300s', tier: 'upper', x: 5, y: 78, width: 25, height: 12 },

        // Nosebleeds
        { id: 'nose-n', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 5, width: 70, height: 8 },
        { id: 'nose-s', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 87, width: 70, height: 8 },
      ]
    },
    NHL: {
      shape: 'oval',
      sections: [
        // Ice level (innermost)
        { id: 'glass-n', label: 'Glass Seats', tier: 'field', x: 50, y: 35, width: 30, height: 8 },
        { id: 'glass-s', label: 'Glass Seats', tier: 'field', x: 50, y: 57, width: 30, height: 8 },
        { id: 'glass-e', label: 'Glass Seats', tier: 'field', x: 75, y: 40, width: 8, height: 20 },
        { id: 'glass-w', label: 'Glass Seats', tier: 'field', x: 17, y: 40, width: 8, height: 20 },

        // Lower bowl
        { id: 'lower-ne', label: 'Lower 100s', tier: 'lower', x: 65, y: 25, width: 25, height: 15 },
        { id: 'lower-nw', label: 'Lower 100s', tier: 'lower', x: 10, y: 25, width: 25, height: 15 },
        { id: 'lower-se', label: 'Lower 100s', tier: 'lower', x: 65, y: 60, width: 25, height: 15 },
        { id: 'lower-sw', label: 'Lower 100s', tier: 'lower', x: 10, y: 60, width: 25, height: 15 },

        // Club level
        { id: 'club-n', label: 'Club 200s', tier: 'club', x: 50, y: 15, width: 60, height: 10 },
        { id: 'club-s', label: 'Club 200s', tier: 'club', x: 50, y: 75, width: 60, height: 10 },

        // Upper deck
        { id: 'upper-ne', label: 'Upper 300s', tier: 'upper', x: 70, y: 10, width: 25, height: 12 },
        { id: 'upper-nw', label: 'Upper 300s', tier: 'upper', x: 5, y: 10, width: 25, height: 12 },
        { id: 'upper-se', label: 'Upper 300s', tier: 'upper', x: 70, y: 78, width: 25, height: 12 },
        { id: 'upper-sw', label: 'Upper 300s', tier: 'upper', x: 5, y: 78, width: 25, height: 12 },

        // Nosebleeds
        { id: 'nose-n', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 5, width: 70, height: 8 },
        { id: 'nose-s', label: 'Upper 400s', tier: 'nosebleed', x: 50, y: 87, width: 70, height: 8 },
      ]
    }
  };

  const layout = stadiumSections[sport] || stadiumSections.NFL;

  // Card pack designs for wheel
  const packDesigns = [
    { name: 'Prizm', color: 'from-purple-600 to-pink-500', value: 150 },
    { name: 'Select', color: 'from-blue-600 to-cyan-500', value: 120 },
    { name: 'Mosaic', color: 'from-orange-600 to-red-500', value: 100 },
    { name: 'Optic', color: 'from-green-600 to-emerald-500', value: 90 },
    { name: 'Chronicles', color: 'from-yellow-600 to-amber-500', value: 80 },
    { name: 'Donruss', color: 'from-gray-600 to-slate-500', value: 60 },
  ];

  useEffect(() => {
    if (isJumping && stage === 'stadium') {
      // Stadium jumping animation
      const totalJumps = 20 + Math.floor(Math.random() * 10);
      let currentJump = 0;

      const jumpInterval = setInterval(() => {
        currentJump++;
        const sections = layout.sections;
        const nextSection = currentJump < totalJumps - 5
          ? Math.floor(Math.random() * sections.length)
          : sections.findIndex(s => s.tier === result?.tier) || 0;

        setCurrentSection(nextSection);
        setJumpCount(currentJump);

        if (currentJump >= totalJumps) {
          clearInterval(jumpInterval);
          setFinalSection(sections[nextSection]);

          setTimeout(() => {
            setStage('wheel');
            startWheelSpin();
          }, 2000);
        }
      }, 150);

      return () => clearInterval(jumpInterval);
    }
  }, [isJumping, stage, result]);

  const startWheelSpin = () => {
    const spinDuration = 3000;
    const spins = 5 + Math.random() * 3;
    const finalRotation = wheelRotation + (360 * spins);

    setWheelRotation(finalRotation);

    setTimeout(() => {
      setStage('scratch');
    }, spinDuration + 1000);
  };

  const handleScratch = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScratching) {
      setIsScratching(true);
    }

    const newProgress = Math.min(scratchProgress + 5, 100);
    setScratchProgress(newProgress);

    if (newProgress >= 100 && !ticketRevealed) {
      setTicketRevealed(true);
      setTimeout(() => setStage('peel'), 2000);
    }
  };

  const handlePeel = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPeeling) {
      setIsPeeling(true);
    }

    const newProgress = Math.min(peelProgress + 3, 100);
    setPeelProgress(newProgress);

    if (newProgress >= 100 && !packRevealed) {
      setPackRevealed(true);
      setTimeout(() => {
        setStage('complete');
        if (onComplete && result) {
          onComplete(result);
        }
      }, 2000);
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'field': return 'from-purple-600 to-purple-400';
      case 'lower': return 'from-yellow-500 to-yellow-300';
      case 'club': return 'from-blue-500 to-blue-300';
      case 'upper': return 'from-gray-500 to-gray-400';
      case 'nosebleed': return 'from-gray-600 to-gray-500';
      default: return 'from-gray-600 to-gray-400';
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Stage 1: Stadium Jumper */}
        {stage === 'stadium' && (
          <motion.div
            key="stadium"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 text-center mb-4">
                Finding Your Seats...
              </h2>

              {/* Stadium View */}
              <div className="relative h-[500px] bg-gradient-to-b from-green-900 to-green-700 rounded-2xl overflow-hidden">
                {/* Field */}
                <div className="absolute inset-x-[20%] inset-y-[30%] bg-gradient-to-b from-green-600 to-green-500 rounded-xl">
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/30" />
                  <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-white/30" />
                  <div className="absolute right-1/4 top-0 bottom-0 w-0.5 bg-white/30" />
                </div>

                {/* Stadium Sections */}
                {layout.sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    className={`absolute bg-gradient-to-r ${getTierColor(section.tier)} rounded-lg flex items-center justify-center shadow-lg cursor-pointer`}
                    style={{
                      left: `${section.x - section.width/2}%`,
                      top: `${section.y - section.height/2}%`,
                      width: `${section.width}%`,
                      height: `${section.height}%`,
                    }}
                    animate={{
                      scale: currentSection === index && isJumping ? 1.1 : 1,
                      boxShadow: currentSection === index && isJumping
                        ? '0 0 30px rgba(250, 204, 21, 0.8)'
                        : '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <span className="text-white text-xs font-bold opacity-80">
                      {section.label}
                    </span>
                  </motion.div>
                ))}

                {/* Jumping Character */}
                {isJumping && layout.sections[currentSection] && (
                  <motion.div
                    className="absolute z-20"
                    animate={{
                      left: `${layout.sections[currentSection].x - 3}%`,
                      top: `${layout.sections[currentSection].y - 3}%`,
                    }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 300,
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    >
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-xl">
                        <User className="w-8 h-8 text-gray-900" />
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-yellow-400 rounded-full"
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </div>

              <div className="text-center mt-4">
                <p className="text-yellow-400 text-lg">Jump #{jumpCount}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage 2: Card Pack Wheel */}
        {stage === 'wheel' && (
          <motion.div
            key="wheel"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 text-center mb-4">
                Selecting Your Card Break...
              </h2>

              <div className="relative bg-black/50 rounded-full p-8">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-t-[40px] border-t-yellow-400 border-r-[20px] border-r-transparent" />
                </div>

                {/* Spinning wheel */}
                <motion.div
                  className="relative w-80 h-80 mx-auto"
                  animate={{ rotate: wheelRotation }}
                  transition={{
                    duration: 3,
                    ease: [0.17, 0.55, 0.55, 1],
                  }}
                >
                  {packDesigns.map((pack, index) => {
                    const angle = (360 / packDesigns.length) * index;

                    return (
                      <div
                        key={index}
                        className="absolute inset-0"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-gradient-to-b ${pack.color}
                          clip-path-polygon-[50%_0%,_100%_100%,_0%_100%] rounded-t-full shadow-lg`}>
                          <div className="flex flex-col items-center justify-center h-full text-white">
                            <Package className="w-8 h-8 mb-2" />
                            <span className="font-bold text-xs">{pack.name}</span>
                            <span className="text-xs">${pack.value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-black rounded-full border-4 border-yellow-400 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-yellow-400" />
                    </div>
                  </div>
                </motion.div>

                <div className="text-center mt-8">
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-xl text-yellow-400"
                  >
                    SPINNING...
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage 3: Scratch Ticket */}
        {stage === 'scratch' && (
          <motion.div
            key="scratch"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 text-center mb-4">
                Scratch to Reveal Your Tickets!
              </h2>

              <div className="relative mx-auto w-96 h-64">
                {/* Ticket Base */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6">
                  {ticketRevealed && result && result.bundles && result.bundles[0] && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-white h-full flex flex-col justify-center"
                    >
                      <div className="text-center">
                        <Ticket className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">WINNER!</h3>
                        {result.bundles[0].ticket.level ? (
                          <>
                            <p className="text-3xl font-bold">
                              Level {result.bundles[0].ticket.level}
                            </p>
                            <p className="text-xl">
                              {result.bundles[0].ticket.levelName}
                            </p>
                          </>
                        ) : result.bundles[0].ticket.individual ? (
                          <>
                            <p className="text-3xl font-bold">
                              Section {result.bundles[0].ticket.section}
                            </p>
                            <p className="text-xl">
                              Row {result.bundles[0].ticket.row}
                            </p>
                          </>
                        ) : result.bundles[0].ticket.special ? (
                          <>
                            <p className="text-2xl font-bold">Special Prize!</p>
                            <p className="text-3xl font-bold">
                              {result.bundles[0].ticket.name}
                            </p>
                            <p className="text-xl">
                              {result.bundles[0].ticket.prizeType}
                            </p>
                          </>
                        ) : null}
                        <p className="text-2xl font-bold mt-4 text-yellow-300">
                          Value: ${result.bundles[0].ticket.value || 0}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Scratch Layer */}
                {!ticketRevealed && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl cursor-pointer"
                    onMouseMove={handleScratch}
                    onMouseDown={() => setIsScratching(true)}
                    style={{
                      background: `linear-gradient(135deg,
                        rgba(156, 163, 175, ${1 - scratchProgress / 100}) 0%,
                        rgba(107, 114, 128, ${1 - scratchProgress / 100}) 100%)`,
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MousePointer className="w-12 h-12 text-white mx-auto mb-2 animate-bounce" />
                        <p className="text-white text-xl font-bold">
                          SCRATCH HERE
                        </p>
                        <p className="text-white/80 text-sm mt-2">
                          {scratchProgress}% Revealed
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage 4: Peel Pack */}
        {stage === 'peel' && (
          <motion.div
            key="peel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 text-center mb-4">
                Peel to Open Your Pack!
              </h2>

              <div className="relative mx-auto w-72 h-96">
                {/* Pack Base */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl">
                  {packRevealed && result && result.bundles && result.bundles[0] && (
                    <motion.div
                      initial={{ opacity: 0, rotateY: -180 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-white h-full flex flex-col justify-center p-6"
                    >
                      <div className="text-center">
                        <Package className="w-20 h-20 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">MEMORABILIA WON!</h3>
                        <p className="text-xl font-bold">
                          {result.bundles[0].memorabilia?.name}
                        </p>
                        <p className="text-3xl font-bold mt-4 text-yellow-300">
                          Value: ${result.bundles[0].memorabilia?.value || 0}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Peel Layer */}
                {!packRevealed && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl cursor-pointer overflow-hidden"
                    onMouseMove={handlePeel}
                    onMouseDown={() => setIsPeeling(true)}
                    style={{
                      transform: `rotateY(${peelProgress * 1.8}deg)`,
                      transformOrigin: 'left center',
                      opacity: 1 - (peelProgress / 100) * 0.5,
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-white text-xl font-bold">
                          PEEL TO OPEN
                        </p>
                        <p className="text-white/80 text-sm mt-2">
                          {peelProgress}% Opened
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage 5: Complete */}
        {stage === 'complete' && result && (
          <motion.div
            key="complete"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-1 rounded-2xl">
              <div className="bg-gray-900 rounded-2xl p-8">
                <h2 className="text-4xl font-bold text-yellow-400 text-center mb-6">
                  CONGRATULATIONS!
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6">
                    <Ticket className="w-12 h-12 text-white mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">Your Tickets</h3>
                    <p className="text-white">
                      Section {result.tickets.section}, Row {result.tickets.row}
                    </p>
                    <p className="text-white">
                      Seats: {result.tickets.seats.join(', ')}
                    </p>
                    <p className="text-2xl font-bold text-yellow-300 mt-2">
                      ${result.tickets.value}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6">
                    <Package className="w-12 h-12 text-white mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">Your Break</h3>
                    <p className="text-white">
                      {result.breaks.name}
                    </p>
                    <p className="text-2xl font-bold text-yellow-300 mt-2">
                      ${result.breaks.value}
                    </p>
                  </div>
                </div>

                <div className="text-center border-t border-gray-700 pt-6">
                  <p className="text-gray-400 mb-2">TOTAL BUNDLE VALUE</p>
                  <p className="text-5xl font-bold text-yellow-400">
                    ${result.totalValue}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}