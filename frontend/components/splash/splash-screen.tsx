'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { ShieldWireframe } from './shield-wireframe';
import { IntelligenceGrid } from './intelligence-grid';

/**
 * LedgerGuard cinematic entry experience.
 * Orchestrates 6 scenes over ~3.2 seconds, then calls onComplete.
 *
 * Scene 1: Black initialization (0.0-0.4s)
 * Scene 2: Shield formation (0.4-1.1s)
 * Scene 3: Intelligence lock (1.1-1.7s)
 * Scene 4: Brand reveal (1.7-2.3s)
 * Scene 5: Intelligence pulse (2.3-2.8s)
 * Scene 6: Transition to application (2.8-3.5s)
 */
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 3200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      if (p >= 1) {
        clearInterval(interval);
        setExiting(true);
        setTimeout(onComplete, 600);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Particles emerging from center
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (i / 20) * Math.PI * 2,
        distance: 40 + Math.random() * 60,
        delay: Math.random() * 0.3,
        size: Math.random() * 2 + 1,
      })),
    []
  );

  return (
    <AnimatePresence>
    {!exiting && (
      <motion.div
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Intelligence grid — fades in during Scene 5 */}
        <IntelligenceGrid visible={progress > 0.72} />

        {/* Center content */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Scene 1: Central point of light */}
          {progress < 0.15 && (
            <motion.div
              className="absolute w-1 h-1 rounded-full bg-blue-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{ boxShadow: '0 0 8px 2px rgba(43,142,255,0.6)' }}
            />
          )}

          {/* Particles emerging from center (Scene 1-2) */}
          {progress > 0.05 &&
            progress < 0.35 &&
            particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-blue-300"
                style={{ width: p.size, height: p.size }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                }}
                transition={{ duration: 0.6, delay: p.delay, ease: 'easeOut' }}
              />
            ))}

          {/* Thin data lines from center (Scene 1-2) */}
          {progress > 0.05 &&
            progress < 0.3 &&
            particles.slice(0, 8).map((p) => (
              <motion.div
                key={`line-${p.id}`}
                className="absolute origin-center"
                style={{
                  width: 1,
                  height: p.distance,
                  background: 'linear-gradient(to top, rgba(43,142,255,0.4), transparent)',
                  transform: `rotate(${(p.angle * 180) / Math.PI}deg)`,
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 0.5, 0], scaleY: [0, 1, 0.8] }}
                transition={{ duration: 0.5, delay: p.delay }}
              />
            ))}

          {/* Scene 1: Init text */}
          {progress > 0.02 && progress < 0.25 && (
            <motion.div
              className="absolute top-[calc(50%+120px)] font-mono-tech text-[9px] tracking-[0.3em] text-blue-400/60 whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.35, times: [0, 0.5, 1] }}
            >
              INITIALIZING FINANCIAL INTELLIGENCE
            </motion.div>
          )}

          {/* Shield — Scenes 2-6 */}
          {progress > 0.12 && (
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: progress > 0.87 ? 0.85 : 1,
                opacity: 1,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <ShieldWireframe progress={progress} />
            </motion.div>
          )}

          {/* Scene 4: LEDGERGUARD wordmark */}
          {progress > 0.53 && (
            <motion.div
              className="absolute top-[calc(50%+100px)] flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                LEDGER<span className="text-lg-blue">GUARD</span>
              </h1>
              <motion.p
                className="mt-2 text-[10px] md:text-xs tracking-[0.25em] text-lg-muted font-mono-tech uppercase"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                Automated Revenue Recovery
              </motion.p>
              <motion.p
                className="text-[10px] md:text-xs tracking-[0.25em] text-lg-dim font-mono-tech uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                & Chargeback Defense
              </motion.p>
            </motion.div>
          )}

          {/* Scene 5: Horizontal blue light sweep */}
          {progress > 0.72 && progress < 0.9 && (
            <motion.div
              className="fixed inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute top-0 bottom-0 w-1/3"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(43,142,255,0.08), transparent)',
                }}
                initial={{ x: '-100%' }}
                animate={{ x: '300%' }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </div>

        {/* Scene 6: Grid expands outward + vignette */}
        {progress > 0.87 && (
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </motion.div>
    )}
    </AnimatePresence>
  );
}
