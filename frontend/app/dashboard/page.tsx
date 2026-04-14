"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HospitalCard from "@/components/HospitalCard";
import { predictWaitTime } from "@/lib/api";
import type { PredictResponse } from "@/lib/api";

const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];
const HOSPITALS: Record<string, { name: string; city: string }> = {
  h1:  { name: "AIIMS Delhi",                   city: "Delhi" },
  h2:  { name: "Fortis Hospital Gurugram",       city: "Delhi" },
  h3:  { name: "Max Super Speciality Hospital",  city: "Delhi" },
  h4:  { name: "KEM Hospital Mumbai",            city: "Mumbai" },
  h5:  { name: "Lilavati Hospital Mumbai",       city: "Mumbai" },
  h6:  { name: "Apollo Hospital Chennai",        city: "Chennai" },
  h7:  { name: "Rajiv Gandhi Govt. Hospital",    city: "Chennai" },
  h8:  { name: "Narayana Health Bangalore",      city: "Bangalore" },
  h9:  { name: "Victoria Hospital Bangalore",    city: "Bangalore" },
  h10: { name: "PGIMER Chandigarh",              city: "Chandigarh" },
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-8 w-32 rounded-full" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="skeleton h-3 w-4/5 rounded-full" />
    </div>
  );
}

export default function DashboardPage() {
  const [hospitalId, setHospitalId] = useState("h1");
  const [specialty, setSpecialty]   = useState("General");
  const [result, setResult]         = useState<PredictResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  async function handlePredict() {
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await predictWaitTime(hospitalId, specialty);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-1">
          📊 <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dashboard</span>
        </h1>
        <p className="text-gray-500 mb-8">Select a hospital and specialty — AI predicts your wait time instantly.</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital</label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              {Object.entries(HOSPITALS).map(([id, h]) => (
                <option key={id} value={id}>{h.name} — {h.city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <motion.button
          onClick={handlePredict}
          disabled={loading}
          whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(37,99,235,0.3)" }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-all text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Predicting with AI...
            </span>
          ) : "⚡ Predict Wait Time"}
        </motion.button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-6 text-sm flex items-center gap-2"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeleton */}
      {loading && <SkeletonCard />}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              Live prediction result
            </p>
            <HospitalCard hospital={result} highlight />
            {result.peakHour && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700 rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2"
              >
                🔶 Peak hour active — queues are longer right now. Visit after 8:00 PM for a shorter wait.
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">🏥</motion.div>
          <p className="text-gray-400 font-medium">Select a hospital and hit Predict Wait Time</p>
          <p className="text-gray-300 text-sm mt-1">AI will analyse current queues and patterns</p>
        </motion.div>
      )}
    </div>
  );
}
