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
