const fetch = require('node-fetch');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
];

const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', "can't breathe", 'difficulty breathing',
  'unconscious', 'unresponsive', 'heavy bleeding', 'severe bleeding', 'seizure',
  'allergic reaction', 'anaphylaxis', 'poisoning', 'overdose', 'broken bone',
  'head injury', 'paralysis', 'severe burn',
];

const SPECIALIST_KEYWORDS = [
  'chronic', 'diabetes', 'hypertension', 'blood pressure', 'follow-up',
  'skin condition', 'rash', 'joint pain', 'back pain', 'heart', 'neurological',
  'mental health', 'anxiety', 'depression', 'orthopedic', 'eye', 'ear',
];

const SYMPTOM_WORDS = [
  'pain', 'fever', 'cough', 'fatigue', 'nausea', 'vomiting', 'headache',
  'dizziness', 'swelling', 'rash', 'bleeding', 'breathing', 'chest', 'back', 'joint',
];

function heuristicAnalyze(description) {
  const lower = description.toLowerCase();
  const isEmergency = EMERGENCY_KEYWORDS.some((k) => lower.includes(k));
  const isSpecialist = SPECIALIST_KEYWORDS.some((k) => lower.includes(k));

  const severity = isEmergency ? 'CRITICAL' : isSpecialist ? 'MODERATE' : 'MILD';
  const recommended_type = isEmergency ? 'EMERGENCY' : isSpecialist ? 'SPECIALIST' : 'GENERAL';

  const symptoms = SYMPTOM_WORDS.filter((w) => lower.includes(w)).slice(0, 4);

  return {
    severity,
    symptoms: symptoms.length > 0 ? symptoms : ['general complaint'],
    summary: description.length > 80 ? description.slice(0, 77) + '...' : description,
    recommended_type,
    source: 'heuristic',
  };
}

async function aiAnalyze(description) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OpenRouter not configured');
  }

  const prompt = `You are a medical triage assistant. Analyze the patient's symptom description and respond with JSON only.

Patient says: "${description}"

Respond with:
{
  "severity": "MILD" | "MODERATE" | "CRITICAL",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "summary": "One concise clinical sentence (max 80 chars)",
  "recommended_type": "GENERAL" | "SPECIALIST" | "EMERGENCY"
}

Rules:
- CRITICAL = life-threatening (chest pain, stroke, severe bleeding, unconscious)
- MODERATE = needs specialist or monitoring
- MILD = routine consultation
- symptoms: list 2-4 key symptoms as short phrases
- summary: clinical note style, e.g. "38yo with acute chest tightness and dyspnea"
Return only valid JSON.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://hospital-ai.app',
      'X-Title': 'Queue AI Symptom Triage',
    },
    body: JSON.stringify({
      models: MODELS,
      route: 'fallback',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OpenRouter: ${data?.error?.message || response.status}`);
  }

  const msg = data?.choices?.[0]?.message;
  const text = (msg?.content || msg?.reasoning || '').trim();
  if (!text) throw new Error('Empty AI response');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

  const severity = ['MILD', 'MODERATE', 'CRITICAL'].includes(parsed.severity) ? parsed.severity : 'MILD';
  const recommended_type = ['GENERAL', 'SPECIALIST', 'EMERGENCY'].includes(parsed.recommended_type)
    ? parsed.recommended_type
    : 'GENERAL';

  return {
    severity,
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms.slice(0, 4) : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : description.slice(0, 80),
    recommended_type,
    source: 'ai',
  };
}

async function analyzeSymptoms(description) {
  try {
    return await aiAnalyze(description);
  } catch {
    return heuristicAnalyze(description);
  }
}

module.exports = { analyzeSymptoms };
