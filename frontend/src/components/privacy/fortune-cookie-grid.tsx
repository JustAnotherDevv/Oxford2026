import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import type { Note } from "@/lib/notes";
import { FortuneCookie } from "./fortune-cookie";

interface FortuneCookieGridProps {
  notes: Note[];
  decimals: number;
  symbol: string;
  onCrack: (note: Note) => void;
}

export function FortuneCookieGrid({
  notes,
  decimals,
  symbol,
  onCrack,
}: FortuneCookieGridProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Cookie className="h-6 w-6 text-amber-500" />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          No fortune cookies yet. Deposit funds to bake your first cookie!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
      <AnimatePresence mode="popLayout">
        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{
              delay: index * 0.08,
              duration: 0.4,
              ease: "backOut",
            }}
            className="flex items-center justify-center"
          >
            <FortuneCookie
              note={note}
              decimals={decimals}
              symbol={symbol}
              onCrack={onCrack}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
