import WaitTimeBadge from "./WaitTimeBadge";
import ConfidenceBar from "./ConfidenceBar";
import { PredictResponse, HospitalSummary } from "@/lib/api";

// Accept either a /predict response or a /recommend summary — both have `name`
export type HospitalData = PredictResponse | HospitalSummary;

interface HospitalCardProps {
  hospital: HospitalData;
  rank?: number;
  highlight?: boolean;
}

export default function HospitalCard({ hospital, rank, highlight }: HospitalCardProps) {
  const occupancyColor =
    hospital.occupancyPct < 40
      ? "text-green-600"
      : hospital.occupancyPct < 70
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
        highlight ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {rank && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                rank === 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              #{rank}
            </span>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">
              {hospital.name}
            </h3>
            <p className="text-xs text-gray-500">{hospital.city} &middot; {hospital.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-yellow-500 shrink-0">
          <span>★</span>
          <span className="font-medium text-gray-700">{hospital.rating}</span>
        </div>
      </div>

      {/* Wait time badge */}
      <div className="mb-3">
        <WaitTimeBadge minutes={hospital.waitTime} peakHour={hospital.peakHour} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Queue</p>
          <p className="text-lg font-bold text-gray-800">{hospital.queueLength}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Occupancy</p>
          <p className={`text-lg font-bold ${occupancyColor}`}>{hospital.occupancyPct}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Specialty</p>
          <p className="text-xs font-semibold text-gray-800 leading-tight pt-1">{hospital.specialty}</p>
        </div>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={hospital.confidence} />

      {/* Best times (only on predict response) */}
      {"bestTimesToVisit" in hospital && hospital.bestTimesToVisit && hospital.bestTimesToVisit.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-1.5">Best times to visit today:</p>
          <div className="flex gap-2 flex-wrap">
            {hospital.bestTimesToVisit.map((slot: { time: string; waitTime: number; confidence: number }) => (
              <span key={slot.time} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
                {slot.time} · ~{slot.waitTime}min
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Address + phone */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-0.5">
        <p>📍 {hospital.address}</p>
        <p>📞 {hospital.phone}</p>
      </div>

      {/* Data source tag */}
      {"dataSource" in hospital && hospital.dataSource && (
        <p className="mt-2 text-xs text-gray-400 italic">{hospital.dataSource}</p>
      )}
    </div>
  );
}
