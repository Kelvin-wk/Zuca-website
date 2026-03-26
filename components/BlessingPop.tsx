import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const BLESSINGS = [
  "May your faith be your shield.",
  "Peace be with you always.",
  "You are a light in this world.",
  "Grace flows through your actions.",
  "The Lord is your shepherd.",
  "Blessed are the peacemakers.",
  "Strength comes to those who wait.",
  "Your journey is sacred.",
  "Faith moves mountains.",
  "Wisdom in every step."
];

const BlessingPop: React.FC = () => {
  const [blessing, setBlessing] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setBlessing(BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)]);
        setTimeout(() => setBlessing(null), 5000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {blessing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-200 dark:border-blue-800 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
            <i className="fa-solid fa-dove"></i>
          </div>
          <span className="font-serif font-bold text-slate-800 dark:text-white text-sm italic">
            {blessing}
          </span>
          <div className="absolute -top-1 -right-1">
            <div className="sparkle" style={{ left: '0', top: '0' }}></div>
            <div className="sparkle" style={{ left: '10px', top: '-5px', animationDelay: '0.5s' }}></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BlessingPop;
