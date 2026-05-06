"use client";
import { motion } from "framer-motion";
import type { SymptomAnalysis, SymptomSeverity } from "@/lib/api";

const SEVERITY_CONFIG: Record<SymptomSeverity, { wrapper: string; badge: string; label: string }> = {
  CRITICAL: {
    wrapper: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "🚨 Critical",
  },
  MODERATE: {
    wrapper: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    label: "⚠️ Moderate",
  },
  MILD: {
    wrapper: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    label: "✓ Mild",
  },
};

export default function SymptomBadge({
  analysis,
  compact = false,
}: {
  analysis: SymptomAnalysis;
  compact?: boolean;
}) {
  const cfg = SEVERITY_CONFIG[analysis.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl ${compact ? "px-3 py-2" : "p-3"} border ${cfg.wrapper}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">AI Symptom Analysis</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>
      <p className="text-xs text-gray-700 mb-2 italic">&quot;{analysis.summary}&quot;</p>
      <div className="flex flex-wrap gap-1">
        {analysis.symptoms.map((s) => (
          <span
            key={s}
            className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full"
          >
            {s}
          </span>
        ))}
      </div>
      {analysis.recommended_type && (
        <p className="mt-2 text-[11px] text-gray-500">
          Recommended type: <strong className="text-gray-700">{analysis.recommended_type}</strong>
          {analysis.source === "ai" && (
            <span className="ml-2 inline-flex items-center gap-1 text-blue-600">
              <span className="w-1 h-1 rounded-full bg-blue-500" /> AI
            </span>
          )}
        </p>
      )}
    </motion.div>
  );
}
