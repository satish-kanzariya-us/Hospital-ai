"use client";
import { motion } from "framer-motion";

interface ConfidenceBarProps {
  value: number;
}

export default function ConfidenceBar({ value }: ConfidenceBarProps) {
  const color = value >= 80 ? "#10b981" : value >= 65 ? "#f59e0b" : "#ef4444";
  const label = value >= 80 ? "High" : value >= 65 ? "Medium" : "Low";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500 font-medium">AI Confidence</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold" style={{ color }}>{label}</span>
          <span className="text-sm font-extrabold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">📊 Based on past visit patterns</p>
    </div>
  );
}
