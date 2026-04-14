"use client";
import { useState } from "react";
import HospitalCard from "@/components/HospitalCard";
import { predictWaitTime } from "@/lib/api";
import type { PredictResponse } from "@/lib/api";

const CITIES = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];
const HOSPITALS: Record<string, string> = {
  h1: "AIIMS Delhi",
  h2: "Fortis Hospital Gurugram",
  h3: "Max Super Speciality Hospital",
  h4: "KEM Hospital Mumbai",
  h5: "Lilavati Hospital Mumbai",
  h6: "Apollo Hospital Chennai",
  h7: "Rajiv Gandhi Govt. Hospital Chennai",
  h8: "Narayana Health Bangalore",
  h9: "Victoria Hospital Bangalore",
  h10: "PGIMER Chandigarh",
};

export default function DashboardPage() {
  const [hospitalId, setHospitalId] = useState("h1");
  const [specialty, setSpecialty] = useState("General");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePredict() {
    setLoading(true);
    setError("");
    setResult(null);
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
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Hospital Dashboard</h1>
      <p className="text-gray-500 mb-8">Select a hospital and specialty to predict wait time.</p>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              {Object.entries(HOSPITALS).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Predicting..." : "Predict Wait Time"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Prediction Result</h2>
          <HospitalCard hospital={result} highlight />
          {result.peakHour && (
            <div className="mt-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm">
              🔶 It&apos;s peak hour right now. Consider visiting after 8:00 PM for shorter queues.
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🏥</div>
          <p className="text-sm">Select a hospital and click &quot;Predict Wait Time&quot;</p>
        </div>
      )}
    </div>
  );
}
