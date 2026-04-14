"use client";
import { motion } from "framer-motion";
import WaitTimeBadge from "./WaitTimeBadge";
import ConfidenceBar from "./ConfidenceBar";
import { PredictResponse, HospitalSummary } from "@/lib/api";

export type HospitalData = PredictResponse | HospitalSummary;

interface HospitalCardProps {
  hospital: HospitalData;
  rank?: number;
  highlight?: boolean;
  index?: number;
}

export default function HospitalCard({ hospital, rank, highlight, index = 0 }: HospitalCardProps) {
  const occupancyColor =
    hospital.occupancyPct < 40 ? "text-green-600" :
    hospital.occupancyPct < 70 ? "text-yellow-600" : "text-red-500";

  const occupancyBg =
    hospital.occupancyPct < 40 ? "bg-green-50" :
    hospital.occupancyPct < 70 ? "bg-yellow-50" : "bg-red-50";

  const rankColors = ["from-blue-600 to-indigo-600", "from-gray-400 to-gray-500", "from-orange-400 to-amber-500"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={`relative bg-white rounded-2xl border p-5 card-hover ${
        highlight
          ? "border-blue-300 shadow-xl shadow-blue-100 ring-2 ring-blue-100"
          : "border-gray-100 shadow-md"
      }`}
    >
      {/* Best pick ribbon */}
      {rank === 1 && (
        <div className="absolute -top-3 left-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
          >
            ✨ Best Pick
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4 mt-1">
        <div className="flex items-center gap-2">
          {rank && (
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${rankColors[rank - 1] || rankColors[2]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {rank}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{hospital.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              📍 {hospital.city} &nbsp;·&nbsp;
              <span className={`font-medium ${hospital.type === "Government" ? "text-blue-500" : "text-purple-500"}`}>
                {hospital.type}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg shrink-0">
          <span className="text-yellow-400 text-sm">★</span>
          <span className="text-sm font-bold text-gray-700">{hospital.rating}</span>
        </div>
      </div>

      {/* Wait time */}
      <div className="mb-4">
        <WaitTimeBadge minutes={hospital.waitTime} peakHour={hospital.peakHour} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Queue", value: hospital.queueLength, unit: "people" },
          { label: "Occupancy", value: `${hospital.occupancyPct}%`, className: occupancyColor, bg: occupancyBg },
          { label: "Specialty", value: hospital.specialty, small: true },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg || "bg-gray-50"} rounded-xl p-2.5 text-center`}>
            <p className="text-xs text-gray-400 mb-0.5">{stat.label}</p>
            <p className={`font-bold ${stat.small ? "text-xs leading-tight pt-0.5" : "text-lg"} ${stat.className || "text-gray-800"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={hospital.confidence} />

      {/* Best times */}
      {"bestTimesToVisit" in hospital && hospital.bestTimesToVisit && hospital.bestTimesToVisit.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">🕐 Best times to visit</p>
          <div className="flex gap-2 flex-wrap">
            {hospital.bestTimesToVisit.map((slot) => (
              <motion.span
                key={slot.time}
                whileHover={{ scale: 1.05 }}
                className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium"
              >
                {slot.time} · ~{slot.waitTime}min
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
        <p className="text-xs text-gray-400">📍 {hospital.address}</p>
        <p className="text-xs text-gray-400">📞 {hospital.phone}</p>
        {"dataSource" in hospital && hospital.dataSource && (
          <p className="text-xs text-blue-400 italic">{hospital.dataSource}</p>
        )}
      </div>
    </motion.div>
  );
}
