"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getQueueStatus,
  queueNext,
  queueSkip,
  queueDelay,
  getSSEUrl,
  type QueueSnapshot,
  type Appointment,
} from "@/lib/api";
import SymptomBadge from "@/components/SymptomBadge";

const HOSPITALS: Record<string, { name: string; city: string; specialties: string[] }> = {
  h1:  { name: "AIIMS Delhi",                  city: "Delhi",      specialties: ["General","Cardiology","Neurology","Orthopedics","Pediatrics"] },
  h2:  { name: "Fortis Hospital Gurugram",      city: "Delhi",      specialties: ["General","Cardiology","Oncology","Orthopedics"] },
  h3:  { name: "Max Super Speciality Hospital", city: "Delhi",      specialties: ["General","Neurology","Pediatrics","Gynecology"] },
  h4:  { name: "KEM Hospital Mumbai",           city: "Mumbai",     specialties: ["General","Surgery","Cardiology","Pediatrics","Orthopedics"] },
  h5:  { name: "Lilavati Hospital Mumbai",      city: "Mumbai",     specialties: ["General","Cardiology","Oncology","Neurology","Gynecology"] },
  h6:  { name: "Apollo Hospital Chennai",       city: "Chennai",    specialties: ["General","Cardiology","Neurology","Oncology","Orthopedics"] },
  h7:  { name: "Rajiv Gandhi Govt. Hospital",   city: "Chennai",    specialties: ["General","Surgery","Pediatrics","Orthopedics"] },
  h8:  { name: "Narayana Health Bangalore",     city: "Bangalore",  specialties: ["General","Cardiology","Neurology","Pediatrics","Oncology"] },
  h9:  { name: "Victoria Hospital Bangalore",   city: "Bangalore",  specialties: ["General","Surgery","Orthopedics","Gynecology"] },
  h10: { name: "PGIMER Chandigarh",             city: "Chandigarh", specialties: ["General","Cardiology","Neurology","Oncology","Pediatrics"] },
};

const STATUS_COLORS: Record<string, string> = {
  waiting:  "bg-gray-50 border-gray-200 text-gray-600",
  serving:  "bg-blue-50 border-blue-300 text-blue-700",
  attended: "bg-green-50 border-green-200 text-green-700",
  skipped:  "bg-red-50 border-red-200 text-red-500",
};

const STATUS_ICONS: Record<string, string> = {
  waiting:  "⏳",
  serving:  "🔵",
  attended: "✅",
  skipped:  "⏭️",
};

// ─── Controls row ─────────────────────────────────────────────────────────────

interface ControlsProps {
  hospitalId: string;
  specialty: string;
  snapshot: QueueSnapshot;
  onUpdate: (s: QueueSnapshot) => void;
}

function Controls({ hospitalId, specialty, snapshot, onUpdate }: ControlsProps) {
  const [delayInput, setDelayInput]   = useState("10");
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingSkip, setLoadingSkip] = useState(false);
  const [loadingDely, setLoadingDely] = useState(false);
  const [msg, setMsg]                 = useState<{ text: string; type: "ok" | "err" } | null>(null);

  function flash(text: string, type: "ok" | "err" = "ok") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleNext() {
    setLoadingNext(true);
    try {
      const s = await queueNext(hospitalId, specialty);
      onUpdate(s as QueueSnapshot);
      flash(`Token ${s.currentToken} is now serving.`);
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "Error", "err"); }
    finally { setLoadingNext(false); }
  }

  async function handleSkip() {
    setLoadingSkip(true);
    try {
      const s = await queueSkip(hospitalId, specialty);
      onUpdate(s as QueueSnapshot);
      flash("Token skipped.");
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "Error", "err"); }
    finally { setLoadingSkip(false); }
  }

  async function handleDelay() {
    const mins = parseInt(delayInput, 10);
    if (isNaN(mins)) { flash("Enter a valid number of minutes.", "err"); return; }
    setLoadingDely(true);
    try {
      await queueDelay(hospitalId, specialty, mins);
      flash(`+${mins} min delay added. Total: ${snapshot.delayMinutes + mins} min.`);
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "Error", "err"); }
    finally { setLoadingDely(false); }
  }

  async function handleClearDelay() {
    setLoadingDely(true);
    try {
      await queueDelay(hospitalId, specialty, -snapshot.delayMinutes);
      flash("Delay cleared.");
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "Error", "err"); }
    finally { setLoadingDely(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md space-y-4">
      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Receptionist Actions</h3>

      {/* Next / Skip */}
      <div className="flex gap-3">
        <motion.button
          onClick={handleNext}
          disabled={loadingNext || snapshot.waitingCount === 0}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40"
        >
          {loadingNext ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Marking...
            </span>
          ) : "✅ Mark Attended → Next"}
        </motion.button>

        <motion.button
          onClick={handleSkip}
          disabled={loadingSkip || snapshot.currentToken === 0}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40"
        >
          {loadingSkip ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Skipping...
            </span>
          ) : "⏭️ Skip Patient"}
        </motion.button>
      </div>

      {/* Delay row */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="1"
          max="120"
          value={delayInput}
          onChange={(e) => setDelayInput(e.target.value)}
          className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400"
        />
        <span className="text-sm text-gray-500">min</span>
        <motion.button
          onClick={handleDelay}
          disabled={loadingDely}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-40"
        >
          ⏰ Add Doctor Delay
        </motion.button>
        {snapshot.delayMinutes > 0 && (
          <motion.button
            onClick={handleClearDelay}
            whileHover={{ scale: 1.03 }}
            className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200"
          >
            Clear
          </motion.button>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-sm rounded-xl px-4 py-2.5 font-medium ${
              msg.type === "ok"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {msg.type === "ok" ? "✓ " : "⚠️ "}{msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Appointment row ──────────────────────────────────────────────────────────

function severityDot(severity?: string) {
  switch (severity) {
    case "CRITICAL": return "bg-red-500";
    case "MODERATE": return "bg-orange-500";
    case "MILD":     return "bg-green-500";
    default:         return null;
  }
}

function ApptRow({ appt, isServing }: { appt: Appointment; isServing: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasAnalysis = !!appt.symptomAnalysis;
  const dot = severityDot(appt.symptomAnalysis?.severity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`border rounded-xl px-4 py-3 ${
        isServing
          ? "bg-blue-50 border-blue-300 shadow-md shadow-blue-100"
          : STATUS_COLORS[appt.status] ?? "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl font-black text-gray-700 w-10 shrink-0">{appt.tokenNumber}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-800 text-sm truncate">{appt.patientName}</p>
              {dot && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/70 border border-gray-200 text-gray-700`}
                  title={`Severity: ${appt.symptomAnalysis?.severity}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  {appt.symptomAnalysis?.severity}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Booked {new Date(appt.bookedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              {appt.phone && <> · 📞 {appt.phone}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasAnalysis && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
            >
              {expanded ? "Hide" : "Symptoms"}
            </button>
          )}
          {isServing && (
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
          )}
          <span className="text-xs font-semibold capitalize">
            {STATUS_ICONS[appt.status]} {appt.status}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {hasAnalysis && expanded && appt.symptomAnalysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3"
          >
            <SymptomBadge analysis={appt.symptomAnalysis} compact />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReceptionistPage() {
  const [hospitalId, setHospitalId] = useState("h1");
  const [specialty, setSpecialty]   = useState("General");
  const [snapshot, setSnapshot]     = useState<QueueSnapshot | null>(null);
  const [connected, setConnected]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const availableSpecialties = HOSPITALS[hospitalId]?.specialties ?? [];

  useEffect(() => {
    if (!availableSpecialties.includes(specialty)) setSpecialty(availableSpecialties[0] ?? "General");
  }, [hospitalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getQueueStatus(hospitalId, specialty);
      setSnapshot(s);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [hospitalId, specialty]);

  // Connect to SSE whenever hospital/specialty changes
  useEffect(() => {
    esRef.current?.close();
    loadSnapshot();

    const url = getSSEUrl(hospitalId, specialty);
    const es = new EventSource(url);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as QueueSnapshot;
        setSnapshot(data);
      } catch { /* malformed event */ }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [hospitalId, specialty]); // eslint-disable-line react-hooks/exhaustive-deps

  const waiting  = snapshot?.appointments.filter((a) => a.status === "waiting")  ?? [];
  const serving  = snapshot?.appointments.filter((a) => a.status === "serving")  ?? [];
  const attended = snapshot?.appointments.filter((a) => a.status === "attended") ?? [];
  const skipped  = snapshot?.appointments.filter((a) => a.status === "skipped")  ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-1">
              🏥 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Receptionist</span>
            </h1>
            <p className="text-gray-500 text-sm">Manage the live queue. Every action updates all patient devices instantly.</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            connected ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            {connected ? "Live" : "Connecting..."}
          </div>
        </div>
      </motion.div>

      {/* Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Hospital</label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              {Object.entries(HOSPITALS).map(([id, h]) => (
                <option key={id} value={id}>{h.name} — {h.city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Specialty</label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {availableSpecialties.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && !snapshot && (
        <div className="text-center py-12 text-gray-400 text-sm">Loading queue...</div>
      )}

      {snapshot && (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Now Serving", value: snapshot.currentToken || "—", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
              { label: "Waiting",     value: snapshot.waitingCount,         color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
              { label: "Attended",    value: snapshot.servedCount,          color: "text-green-600",bg: "bg-green-50 border-green-200" },
              { label: "Delay",       value: snapshot.delayMinutes > 0 ? `+${snapshot.delayMinutes}m` : "None", color: snapshot.delayMinutes > 0 ? "text-red-600" : "text-gray-400", bg: "bg-white border-gray-200" },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
                <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <Controls
            hospitalId={hospitalId}
            specialty={specialty}
            snapshot={snapshot}
            onUpdate={setSnapshot}
          />

          {/* Queue list */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              Queue — {snapshot.appointments.length} total
            </h3>

            {snapshot.appointments.length === 0 ? (
              <div className="text-center py-10 text-gray-300 text-sm">No patients yet. Queue is empty.</div>
            ) : (
              <div className="space-y-2">
                {/* Currently serving */}
                {serving.map((a) => <ApptRow key={a.tokenNumber} appt={a} isServing />)}

                {/* Waiting */}
                <AnimatePresence>
                  {waiting.map((a) => <ApptRow key={a.tokenNumber} appt={a} isServing={false} />)}
                </AnimatePresence>

                {/* Attended + skipped (collapsed) */}
                {(attended.length > 0 || skipped.length > 0) && (
                  <details className="mt-3">
                    <summary className="text-xs text-gray-400 cursor-pointer select-none font-medium py-1">
                      Show {attended.length} attended, {skipped.length} skipped
                    </summary>
                    <div className="mt-2 space-y-2">
                      {[...attended, ...skipped]
                        .sort((a, b) => a.tokenNumber - b.tokenNumber)
                        .map((a) => <ApptRow key={a.tokenNumber} appt={a} isServing={false} />)}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
