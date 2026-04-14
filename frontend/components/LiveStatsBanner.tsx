"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Stat { label: string; value: string; sub: string; icon: string; }

export default function LiveStatsBanner() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/recommend?city=Delhi&specialty=General`
        );
        const data = await res.json();
        if (!data.recommended) return;
        const best = data.recommended[0];
        const hour = new Date().getHours();
        const isPeak = (hour >= 9 && hour < 12) || (hour >= 17 && hour < 20);
        setStats([
          { icon: "⚡", label: "Shortest wait now",   value: `${best.waitTime} min`,           sub: best.name },
          { icon: "🏥", label: "Hospitals tracked",   value: "10",                             sub: "5 cities across India" },
          { icon: "📡", label: "Live traffic",        value: isPeak ? "Peak Hour" : "Off-Peak", sub: isPeak ? "Expect longer waits" : "Good time to visit" },
          { icon: "🎯", label: "AI confidence",       value: `${best.confidence}%`,             sub: "Based on past patterns" },
        ]);
        setLoaded(true);
      } catch { /* silent */ }
    }
    load();
  }, []);

  return (
    <AnimatePresence>
      {loaded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-3 px-4"
        >
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-lg font-extrabold">{s.value}</span>
                </div>
                <p className="text-xs text-blue-200">{s.label}</p>
                <p className="text-xs text-blue-300 truncate">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
