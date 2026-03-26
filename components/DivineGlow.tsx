import React from 'react';
import { motion } from 'motion/react';

interface DivineGlowProps {
  children?: React.ReactNode;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const DivineGlow: React.FC<DivineGlowProps> = ({ children, color = 'rgba(59, 130, 246, 0.5)', intensity = 'medium' }) => {
  const blurValue = intensity === 'low' ? 'blur-[40px]' : intensity === 'medium' ? 'blur-[80px]' : 'blur-[120px]';
  
  return (
    <div className="relative group/glow">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute inset-0 rounded-full ${blurValue} pointer-events-none z-0`}
        style={{ backgroundColor: color }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DivineGlow;
