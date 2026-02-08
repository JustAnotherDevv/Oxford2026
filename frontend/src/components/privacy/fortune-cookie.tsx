import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatUnits } from "viem";
import type { Note } from "@/lib/notes";

interface FortuneCookieProps {
  note: Note;
  decimals: number;
  symbol: string;
  onCrack: (note: Note) => void;
}

function Particle({ index }: { index: number }) {
  const angle = (index / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
  const distance = 40 + Math.random() * 60;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  const size = 3 + Math.random() * 5;

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 rounded-full"
      style={{
        width: size,
        height: size,
        background: `hsl(${35 + Math.random() * 15}, ${70 + Math.random() * 20}%, ${55 + Math.random() * 15}%)`,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x,
        y,
        opacity: 0,
        scale: 0,
        rotate: Math.random() * 360,
      }}
      transition={{ duration: 0.6 + Math.random() * 0.3, ease: "easeOut" }}
    />
  );
}

export function FortuneCookie({
  note,
  decimals,
  symbol,
  onCrack,
}: FortuneCookieProps) {
  const [cracked, setCracked] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const value = formatUnits(BigInt(note.value), decimals);

  const handleClick = useCallback(() => {
    if (cracked) {
      onCrack(note);
      return;
    }
    setCracked(true);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1000);
    setTimeout(() => onCrack(note), 1000);
  }, [cracked, note, onCrack]);

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        className="relative h-24 w-28 cursor-pointer focus:outline-none"
        whileHover={
          cracked
            ? {}
            : {
                scale: 1.08,
                rotate: [0, -3, 3, -2, 0],
                transition: {
                  rotate: { repeat: Infinity, duration: 0.6 },
                },
              }
        }
        whileTap={cracked ? {} : { scale: 0.95 }}
        onClick={handleClick}
        aria-label={`Fortune cookie: ${value} ${symbol}`}
      >
        {/* Glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)",
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Left half */}
        <motion.div
          className="absolute top-2 left-0 h-20 w-16"
          style={{
            clipPath: "ellipse(100% 50% at 100% 50%)",
            background:
              "linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 100%)",
            borderRadius: "50%",
            boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.2)",
          }}
          animate={
            cracked
              ? { x: -12, rotate: -15, scale: 0.75 }
              : { x: 0, rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {/* Right half */}
        <motion.div
          className="absolute top-2 right-0 h-20 w-16"
          style={{
            clipPath: "ellipse(100% 50% at 0% 50%)",
            background:
              "linear-gradient(225deg, #fbbf24 0%, #d97706 40%, #92400e 100%)",
            borderRadius: "50%",
            boxShadow: "inset 2px -2px 6px rgba(0,0,0,0.2)",
          }}
          animate={
            cracked
              ? { x: 12, rotate: 15, scale: 0.75 }
              : { x: 0, rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {/* Crease line */}
        <motion.div
          className="absolute top-2 left-1/2 h-20 w-[2px] -translate-x-1/2"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(120,53,15,0.4), transparent)",
          }}
          animate={{ opacity: cracked ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        />

        {/* Idle floating animation */}
        {!cracked && (
          <motion.div
            className="absolute inset-0"
            animate={{ y: [0, -3, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Paper slip */}
        <AnimatePresence>
          {cracked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
            >
              <div className="rounded-md bg-amber-50 px-3 py-2 shadow-md dark:bg-amber-100">
                <p className="text-xs font-bold text-amber-900 whitespace-nowrap">
                  {value} {symbol}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particles */}
        {showParticles && (
          <div className="absolute inset-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <Particle key={i} index={i} />
            ))}
          </div>
        )}
      </motion.button>

      {/* Value label below cookie */}
      {!cracked && (
        <p className="text-xs font-medium text-muted-foreground">
          {value} {symbol}
        </p>
      )}
    </div>
  );
}
