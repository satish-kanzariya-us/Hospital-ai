// Central API client — all backend calls go through here
// Change BASE_URL in .env.local and it propagates everywhere

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Shared helper ───────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Server error ${res.status}`);
  }
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BestTimeSlot {
  time: string;
  waitTime: number;
  confidence: number;
}

export interface PredictResponse {
  hospitalId: string;
  name: string;
  city: string;
  specialty: string;
  address: string;
  phone: string;
  rating: number;
  type: string;
  waitTime: number;
  queueLength: number;
  capacity: number;
  occupancyPct: number;
  peakHour: boolean;
  confidence: number;
  unit: string;
  dataSource?: string;
  bestTimesToVisit?: BestTimeSlot[];
}

export interface HospitalSummary {
  hospitalId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  rating: number;
  type: string;
  specialty: string;
  waitTime: number;
  queueLength: number;
  occupancyPct: number;
  peakHour: boolean;
  confidence: number;
  score: number;
}

export interface RecommendResponse {
  city: string;
  specialty: string;
  recommended: HospitalSummary[];
  bestHospital: string;
  bestWaitTime: number;
  bestTime: string;
  message: string;
  totalHospitals: number;
}

export interface ChatResponse {
  reply: string;
  context: Record<string, string>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export function predictWaitTime(
  hospitalId: string,
  specialty: string
): Promise<PredictResponse> {
  return request<PredictResponse>("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hospitalId, specialty }),
  });
}

export function getRecommendations(
  city: string,
  specialty: string
): Promise<RecommendResponse> {
  return request<RecommendResponse>(
    `/recommend?city=${encodeURIComponent(city)}&specialty=${encodeURIComponent(specialty)}`
  );
}

export function sendChatMessage(
  message: string,
  context: { city?: string; specialty?: string; hospitalId?: string }
): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
}

// ─── Queue types ──────────────────────────────────────────────────────────────

export type AppointmentStatus = "waiting" | "serving" | "attended" | "skipped";
export type UrgencyLevel = "serving" | "next" | "leave-now" | "get-ready" | "delayed" | "waiting" | "attended" | "skipped";

export interface Appointment {
  tokenNumber: number;
  patientName: string;
  status: AppointmentStatus;
  bookedAt: string;
  attendedAt?: string;
  skippedAt?: string;
}

export interface BookResponse {
  success: boolean;
  token: number;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  currentToken: number;
  totalWaiting: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  etaTime: string;
  recommendedLeaveTime: string;
  message: string;
  urgency: UrgencyLevel;
}

export interface ETAResponse {
  status: AppointmentStatus;
  tokenNumber: number;
  patientName: string;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  etaTime: string;
  recommendedLeaveTime: string;
  currentToken: number;
  delayMinutes: number;
  urgency: UrgencyLevel;
  message: string;
}

export interface QueueSnapshot {
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  currentToken: number;
  delayMinutes: number;
  avgServiceTime: number;
  appointments: Appointment[];
  waitingCount: number;
  servedCount: number;
}

// ─── Queue API functions ──────────────────────────────────────────────────────

export function bookToken(hospitalId: string, specialty: string, patientName: string): Promise<BookResponse> {
  return request<BookResponse>("/queue/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hospitalId, specialty, patientName }),
  });
}

export function getQueueStatus(hospitalId: string, specialty: string): Promise<QueueSnapshot> {
  return request<QueueSnapshot>(`/queue/${hospitalId}/${encodeURIComponent(specialty)}/status`);
}

export function getPatientETA(hospitalId: string, specialty: string, token: number): Promise<ETAResponse> {
  return request<ETAResponse>(`/queue/${hospitalId}/${encodeURIComponent(specialty)}/${token}/eta`);
}

export function queueNext(hospitalId: string, specialty: string): Promise<QueueSnapshot> {
  return request<QueueSnapshot>(`/queue/${hospitalId}/${encodeURIComponent(specialty)}/next`, { method: "POST" });
}

export function queueSkip(hospitalId: string, specialty: string): Promise<QueueSnapshot> {
  return request<QueueSnapshot>(`/queue/${hospitalId}/${encodeURIComponent(specialty)}/skip`, { method: "POST" });
}

export function queueDelay(hospitalId: string, specialty: string, minutes: number): Promise<{ delayMinutes: number }> {
  return request<{ delayMinutes: number }>(`/queue/${hospitalId}/${encodeURIComponent(specialty)}/delay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutes }),
  });
}

export function getSSEUrl(hospitalId: string, specialty: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${base}/queue/${hospitalId}/${encodeURIComponent(specialty)}/stream`;
}
