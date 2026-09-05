'use client';

import { motion } from 'framer-motion';

/**
 * Shield wireframe SVG that assembles line-by-line.
 * Uses stroke-dashoffset animation for a "drawing" effect.
 */
export function ShieldWireframe({ progress }: { progress: number }) {
  // progress: 0-1 controls overall assembly
  const lines = [
    // Shield outline segments (top-left to right, clockwise)
    { d: 'M50 8 L50 8', dash: 0 }, // top center
    { d: 'M50 8 L82 22 L82 50 C82 75 68 90 50 96', dash: 180 },
    { d: 'M50 8 L18 22 L18 50 C18 75 32 90 50 96', dash: 180 },
    // Internal geometric lines
    { d: 'M50 20 L50 84', dash: 64 },
    { d: 'M30 35 L50 50 L70 35', dash: 50 },
    { d: 'M30 65 L50 50 L70 65', dash: 50 },
    // Horizontal cross
    { d: 'M25 50 L75 50', dash: 50 },
  ];

  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 100 100"
      fill="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b8eff" stopOpacity="1" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.6" />
        </linearGradient>
        <filter id="glowSoft">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {lines.map((line, i) => {
        const lineProgress = Math.max(0, Math.min(1, (progress - i * 0.12) / 0.4));
        const dashLen = line.dash || 200;
        return (
          <motion.path
            key={i}
            d={line.d}
            stroke="url(#shieldGrad)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glowSoft)"
            initial={{ strokeDasharray: dashLen, strokeDashoffset: dashLen, opacity: 0 }}
            animate={{
              strokeDashoffset: dashLen * (1 - lineProgress),
              opacity: lineProgress > 0 ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        );
      })}

      {/* Central L symbol — appears in Scene 3 */}
      {progress > 0.55 && (
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: Math.min(1, (progress - 0.55) / 0.15), scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.path
            d="M44 38 L44 66 L58 66"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ strokeDasharray: 50, strokeDashoffset: 50 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.g>
      )}

      {/* Scanning ring — passes once in Scene 3 */}
      {progress > 0.45 && progress < 0.65 && (
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#2b8eff"
          strokeWidth="0.3"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.3], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: 'center' }}
        />
      )}

      {/* Technical indicators around shield */}
      {progress > 0.5 &&
        progress < 0.72 &&
        [
          { text: 'RISK ENGINE', x: 50, y: -2 },
          { text: 'AI INTELLIGENCE', x: 104, y: 50 },
          { text: 'REVENUE PROTECTION', x: 50, y: 104 },
          { text: 'SECURE', x: -4, y: 50 },
        ].map((ind, i) => (
          <motion.text
            key={i}
            x={ind.x}
            y={ind.y}
            fill="#2b8eff"
            fontSize="2.2"
            fontFamily="var(--font-mono), monospace"
            textAnchor={ind.x === 50 ? 'middle' : ind.x > 50 ? 'start' : 'end'}
            dominantBaseline="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8, delay: i * 0.05 }}
          >
            {ind.text}
          </motion.text>
        ))}
    </svg>
  );
}
