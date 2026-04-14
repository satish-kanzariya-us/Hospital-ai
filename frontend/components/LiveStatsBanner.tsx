"use client";
import { useEffect, useState } from "react";

interface Stat {
  label: string;
  value: string;
  sub: string;
}

export default function LiveStatsBanner() {
  const [stats, setStats] = useState<Stat[]>([]);

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
          {
            label: "Shortest wait right now",
            value: `${best.waitTime} min`,
            sub: best.name,
          },
          {
            label: "Hospitals tracked",
            value: "10",
            sub: "Delhi · Mumbai · Chennai · more",
          },
          {
            label: "Current traffic",
            value: isPeak ? "Peak hour" : "Off-peak",
            sub: isPeak ? "Expect longer queues" : "Good time to visit",
          },
          {
            label: "AI confidence",
            value: `${best.confidence}%`,
            sub: "Based on past patterns",
          },
        ]);
      } catch {
        // silently skip — banner is optional
      }
    }
    load();
  }, []);

  if (stats.length === 0) return null;

  return (
    <div className="bg-blue-600 text-white py-3 px-4 mb-0">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-blue-200">{s.label}</p>
            <p className="text-xs text-blue-300 truncate">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
