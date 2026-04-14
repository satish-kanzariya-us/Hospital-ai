"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import HospitalCard from "@/components/HospitalCard";
import { getRecommendations } from "@/lib/api";
import type { RecommendResponse } from "@/lib/api";

const CITIES = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];

function RecommendContent() {
  const params = useSearchParams();
  const [city, setCity] = useState(params.get("city") || "Delhi");
  const [specialty, setSpecialty] = useState("General");
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.get("city")) {
      handleRecommend(params.get("city")!, specialty);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecommend(c = city, s = specialty) {
    setLoading(true);
    setError("");
    setResult(null);
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
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Hospital Recommendations</h1>
      <p className="text-gray-500 mb-8">Find the least crowded hospital in your city.</p>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={() => handleRecommend()}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Finding best hospitals..." : "Get Recommendations"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Summary banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-6">
            <p className="text-blue-800 font-semibold text-sm">🏆 {result.message}</p>
            <p className="text-blue-600 text-xs mt-1">
              Best off-peak window: <strong>{result.bestTime}</strong> &middot; {result.totalHospitals} hospitals compared
            </p>
          </div>

          {/* Hospital cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {result.recommended.map((h, i) => (
              <HospitalCard key={h.hospitalId} hospital={h} rank={i + 1} highlight={i === 0} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-sm">Select your city and specialty to get recommendations</p>
        </div>
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
