"use client";
import { motion } from "framer-motion";

interface WaitTimeBadgeProps {
  minutes: number;
  peakHour?: boolean;
}

export default function WaitTimeBadge({ minutes, peakHour }: WaitTimeBadgeProps) {
  const isLow    = minutes <= 20;
  const isMed    = minutes <= 45;

  const config = isLow
    ? { bg: "bg-gradient-to-r from-green-400 to-emerald-500", text: "text-white", glow: "shadow-green-200" }
    : isMed
    ? { bg: "bg-gradient-to-r from-yellow-400 to-orange-400", text: "text-white", glow: "shadow-yellow-200" }
    : { bg: "bg-gradient-to-r from-red-500 to-rose-500",    text: "text-white", glow: "shadow-red-200" };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm shadow-lg ${config.bg} ${config.text} ${config.glow}`}
    >
      <motion.span
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
      >
        ⏱
      </motion.span>
      <span>{minutes} min wait</span>
      {peakHour && (
        <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping inline-block" />
          Peak
        </span>
      )}
    </motion.div>
  );
}
