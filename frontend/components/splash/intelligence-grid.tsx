'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * Faint financial intelligence grid background.
 * Shows transaction nodes, risk signals, network connections, and data points.
 * Must remain extremely subtle — never overpower the foreground.
 */
export function IntelligenceGrid({ visible }: { visible: boolean }) {
  const nodes = useMemo(() => {
    const arr: { x: number; y: number; size: number; delay: number }[] = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 2,
      });
    }
    return arr;
  }, []);

  const connections = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
    for (let i = 0; i < 15; i++) {
      const a = nodes[i];
      const b = nodes[(i + 3) % nodes.length];
      arr.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, delay: Math.random() * 2 });
    }
    return arr;
  }, [nodes]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 1s ease' }}
    >
      {/* Fine grid */}
      <div className="absolute inset-0 lg-grid-bg-fine lg-radial-mask" />

      {/* SVG layer for nodes and connections */}
      <svg
        className="absolute inset-0 w-full h-full lg-radial-mask"
        preserveAspectRatio="none"
      >
        {connections.map((c, i) => (
          <motion.line
            key={`conn-${i}`}
            x1={`${c.x1}%`}
            y1={`${c.y1}%`}
            x2={`${c.x2}%`}
            y2={`${c.y2}%`}
            stroke="#2b8eff"
            strokeWidth="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0.04] }}
            transition={{ duration: 3, delay: c.delay, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}
        {nodes.map((n, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={`${n.x}%`}
            cy={`${n.y}%`}
            r={n.size}
            fill="#2b8eff"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2 + Math.random() * 2, delay: n.delay, repeat: Infinity }}
          />
        ))}
      </svg>

      {/* Geographic data pattern arcs */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <motion.path
          d="M 0 60% Q 25% 40% 50% 55% T 100% 50%"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 0.06 : 0 }}
          transition={{ duration: 1 }}
        />
        <motion.path
          d="M 0 30% Q 30% 50% 60% 35% T 100% 40%"
          fill="none"
          stroke="#2b8eff"
          strokeWidth="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 0.05 : 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </svg>
    </div>
  );
}
