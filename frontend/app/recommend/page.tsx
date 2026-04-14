"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import HospitalCard from "@/components/HospitalCard";
import { getRecommendations } from "@/lib/api";
import type { RecommendResponse } from "@/lib/api";

const CITIES      = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md space-y-3 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded-full w-32" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-3 bg-gray-200 rounded-full w-full" />
    </div>
  );
}

function RecommendContent() {
  const params   = useSearchParams();
  const [city, setCity]         = useState(params.get("city") || "Delhi");
  const [specialty, setSpecialty] = useState("General");
  const [result, setResult]     = useState<RecommendResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (params.get("city")) handleRecommend(params.get("city")!, specialty);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecommend(c = city, s = specialty) {
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await getRecommendations(c, s);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-1">
          🏆 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Recommendations</span>
        </h1>
        <p className="text-gray-500 mb-8">Find the least crowded hospital in your city, ranked by AI.</p>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    city === c
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <motion.button
          onClick={() => handleRecommend()}
          disabled={loading}
          whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(99,102,241,0.3)" }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Ranking hospitals...
            </span>
          ) : "🔍 Get Recommendations"}
        </motion.button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-6 text-sm"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1,2].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl px-5 py-4 mb-6"
            >
              <p className="text-indigo-900 font-bold text-sm flex items-center gap-2">
                <span className="text-xl">🏆</span> {result.message}
              </p>
              <p className="text-indigo-500 text-xs mt-1">
                Best off-peak window: <strong>{result.bestTime}</strong>
                &nbsp;·&nbsp;{result.totalHospitals} hospitals compared
              </p>
            </motion.div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {result.recommended.map((h, i) => (
                <HospitalCard key={h.hospitalId} hospital={h} rank={i + 1} highlight={i === 0} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty */}
      {!result && !loading && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">🔍</motion.div>
          <p className="text-gray-400 font-medium">Select a city and specialty to compare hospitals</p>
          <p className="text-gray-300 text-sm mt-1">AI ranks them by shortest wait time</p>
        </motion.div>
      )}
    </div>
  );
}

export default function RecommendPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading...</div>}>
      <RecommendContent />
    </Suspense>
  );
}
