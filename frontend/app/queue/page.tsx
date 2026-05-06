"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  bookToken,
  getPatientETA,
  getSSEUrl,
  analyzeSymptoms,
  type BookResponse,
  type ETAResponse,
  type UrgencyLevel,
  type SymptomAnalysis,
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

const URGENCY_CONFIG: Record<UrgencyLevel, { bg: string; border: string; icon: string; pulse: boolean }> = {
  serving:   { bg: "from-green-500 to-emerald-500",    border: "border-green-400", icon: "🟢", pulse: true  },
  next:      { bg: "from-blue-500 to-indigo-500",      border: "border-blue-400",  icon: "🔵", pulse: true  },
  "leave-now": { bg: "from-orange-500 to-amber-500",   border: "border-orange-400",icon: "🟠", pulse: true  },
  "get-ready": { bg: "from-yellow-500 to-orange-400",  border: "border-yellow-400",icon: "🟡", pulse: false },
  delayed:   { bg: "from-red-500 to-rose-500",         border: "border-red-400",   icon: "🔴", pulse: false },
  waiting:   { bg: "from-slate-500 to-gray-500",       border: "border-gray-300",  icon: "⚪", pulse: false },
  attended:  { bg: "from-emerald-500 to-teal-500",     border: "border-emerald-400",icon: "✅", pulse: false },
  skipped:   { bg: "from-gray-400 to-gray-500",        border: "border-gray-300",  icon: "⏭️", pulse: false },
};

// ─── Step 1: Booking form ─────────────────────────────────────────────────────

function BookingForm({ onBooked }: { onBooked: (b: BookResponse) => void }) {
  const [hospitalId, setHospitalId] = useState("h1");
  const [specialty, setSpecialty]   = useState("General");
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [problem, setProblem]       = useState("");
  const [analysis, setAnalysis]     = useState<SymptomAnalysis | null>(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const availableSpecialties = HOSPITALS[hospitalId]?.specialties ?? [];

  // Reset specialty when hospital changes if not available
  useEffect(() => {
    if (!availableSpecialties.includes(specialty)) setSpecialty(availableSpecialties[0] ?? "General");
  }, [hospitalId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced symptom analysis: API fires 1s after the user stops typing.
  // The spinner only appears once the timer fires, not on every keystroke.
  // A reqId guards against stale results overwriting a newer one.
  const reqIdRef = useRef(0);
  useEffect(() => {
    const desc = problem.trim();
    if (desc.length < 4) {
      setAnalysis(null);
      setAnalyzing(false);
      return;
    }

    const timer = setTimeout(async () => {
      const myReqId = ++reqIdRef.current;
      setAnalyzing(true);
      try {
        const result = await analyzeSymptoms(desc);
        if (reqIdRef.current !== myReqId) return; // stale
        setAnalysis(result);
        if (result.recommended_type === "EMERGENCY" && availableSpecialties.includes("General")) {
          setSpecialty("General");
        }
      } catch {
        /* ignore — analysis is optional */
      } finally {
        if (reqIdRef.current === myReqId) setAnalyzing(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [problem]); // eslint-disable-line react-hooks/exhaustive-deps

  function isValidEmail(value: string) {
    if (!value) return true; // email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value: string) {
    if (!value) return true; // phone is optional
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

  async function handleBook() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!isValidEmail(email.trim())) { setError("Please enter a valid email address."); return; }
    if (!isValidPhone(phone.trim())) { setError("Please enter a valid phone number."); return; }
    setLoading(true); setError("");
    try {
      const res = await bookToken(hospitalId, specialty, name.trim(), {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        symptomAnalysis: analysis,
      });
      onBooked(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl max-w-lg mx-auto"
    >
      <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Book Your Spot</h2>
      <p className="text-gray-500 text-sm mb-6">Get a token number and know exactly when to arrive.</p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g. Rajesh Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email <span className="text-gray-400 font-normal text-xs">(for confirmation)</span>
            </label>
            <input
              type="email"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone <span className="text-gray-400 font-normal text-xs">(for record)</span>
            </label>
            <input
              type="tel"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Hospital */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hospital</label>
          <select
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            {Object.entries(HOSPITALS).map(([id, h]) => (
              <option key={id} value={id}>{h.name} — {h.city}</option>
            ))}
          </select>
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specialty</label>
          <select
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            {availableSpecialties.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Problem description + AI symptom analysis */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Describe your problem{" "}
            <span className="text-gray-400 font-normal">(AI will triage your symptoms)</span>
          </label>
          <textarea
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            placeholder="e.g. I have severe chest pain and difficulty breathing..."
            rows={3}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />
          {analyzing && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              AI analyzing your symptoms...
            </div>
          )}
          {analysis && !analyzing && (
            <div className="mt-3">
              <SymptomBadge analysis={analysis} />
              {analysis.severity === "CRITICAL" && (
                <p className="mt-2 text-xs text-red-700 font-semibold">
                  ⚠️ This may be an emergency. Please call 108 or go to the nearest emergency room.
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-sm">
            ⚠️ {error}
          </motion.p>
        )}

        <motion.button
          onClick={handleBook}
          disabled={loading}
          whileHover={{ scale: 1.02, boxShadow: "0 15px 35px rgba(37,99,235,0.3)" }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-2xl disabled:opacity-50 text-base mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Booking your spot...
            </span>
          ) : "🎫 Get My Token"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Token card + live status ─────────────────────────────────────────

function TokenCard({ booking }: { booking: BookResponse }) {
  const [eta, setEta] = useState<ETAResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const refreshETA = useCallback(async () => {
    try {
      const data = await getPatientETA(booking.hospitalId, booking.specialty, booking.token);
      setEta(data);
    } catch { /* silently ignore transient errors */ }
  }, [booking.hospitalId, booking.specialty, booking.token]);

  useEffect(() => {
    refreshETA();

    const url = getSSEUrl(booking.hospitalId, booking.specialty);
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onmessage = () => refreshETA(); // re-fetch ETA on any queue change
    es.onerror = () => setConnected(false);

    return () => { es.close(); };
  }, [booking.hospitalId, booking.specialty, booking.token, refreshETA]);

  const urgency = eta?.urgency ?? "waiting";
  const cfg = URGENCY_CONFIG[urgency];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto space-y-4"
    >
      {/* Token card */}
      <div className={`relative bg-gradient-to-br ${cfg.bg} rounded-3xl p-1 shadow-2xl`}>
        <div className="bg-white/10 rounded-[22px] p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Token Number</p>
              <motion.p
                key={booking.token}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl font-black text-white leading-none mt-1"
              >
                {booking.token}
              </motion.p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Now Serving</p>
              <p className="text-4xl font-black text-white">{(eta?.currentToken ?? booking.currentToken) || "—"}</p>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 space-y-1">
            <p className="text-white font-semibold text-sm">{booking.patientName}</p>
            {booking.phone && <p className="text-white/70 text-xs">📞 {booking.phone}</p>}
            <p className="text-white/70 text-xs">{booking.hospitalName} · {booking.specialty}</p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 mt-3">
            {cfg.pulse ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            ) : <span className="h-2 w-2 rounded-full bg-white/40" />}
            <span className="text-white/80 text-xs">{connected ? "Live updates active" : "Connecting..."}</span>
          </div>
        </div>
      </div>

      {/* Status message card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={eta?.message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`bg-white rounded-2xl border-2 ${cfg.border} p-5 shadow-md`}
        >
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>{cfg.icon}</span>
            <span>{eta?.message ?? booking.message}</span>
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Email confirmation hint */}
      {booking.emailQueued && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <span className="text-2xl">📧</span>
          <div>
            <p className="text-blue-700 font-bold text-sm">Confirmation sent</p>
            <p className="text-blue-600 text-xs">Check your inbox for full token details.</p>
          </div>
        </motion.div>
      )}

      {/* AI symptom analysis from booking */}
      {booking.symptomAnalysis && (
        <SymptomBadge analysis={booking.symptomAnalysis} />
      )}

      {/* Stats grid */}
      {eta && eta.status !== "attended" && eta.status !== "skipped" && (
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Patients Ahead" value={String(eta.patientsAhead)} sub="in queue" />
          <StatBox label="Est. Wait" value={`${eta.estimatedWaitMinutes} min`} sub="from now" />
          <StatBox label="Your Turn At" value={eta.etaTime} sub="expected" />
          <StatBox label="Leave Home By" value={eta.recommendedLeaveTime} sub="recommended" highlight />
        </div>
      )}

      {/* Delay banner */}
      {eta && eta.delayMinutes > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <span className="text-2xl">⏰</span>
          <div>
            <p className="text-red-700 font-bold text-sm">Doctor Delayed</p>
            <p className="text-red-600 text-xs">+{eta.delayMinutes} minutes added to all wait times</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatBox({ label, value, sub, highlight = false }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-black ${highlight ? "text-blue-600" : "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QueuePage() {
  const [booking, setBooking] = useState<BookResponse | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-1">
          🎫 <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Smart Queue</span>
        </h1>
        <p className="text-gray-500">Book a token. Arrive exactly when it's your turn — not a minute earlier.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!booking ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BookingForm onBooked={setBooking} />
          </motion.div>
        ) : (
          <motion.div key="token" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TokenCard booking={booking} />
            <div className="mt-6 text-center">
              <button
                onClick={() => setBooking(null)}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                ← Book another token
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
