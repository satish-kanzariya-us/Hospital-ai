const fetch = require('node-fetch');
const hospitals = require('../data/hospitals.json');
const { calculateWaitTime, getBestVisitTime } = require('./waitTime');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Preferred free instruct models in priority order; OpenRouter picks the first available
const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
];

/**
 * Build a real-time hospital snapshot for the system prompt
 * Includes current wait times so the AI can give accurate answers
 */
function buildHospitalSnapshot(city) {
  const list = city
    ? hospitals.filter((h) => h.city.toLowerCase() === city.toLowerCase())
    : hospitals;

  return list
    .map((h) => {
      const specialtyLines = h.specialties
        .map((s) => {
          const wt = calculateWaitTime(h, s);
          return wt
            ? `    • ${s}: queue=${wt.queueLength}, wait≈${wt.waitTime}min, confidence=${wt.confidence}%`
            : `    • ${s}: data unavailable`;
        })
        .join('\n');

      return `Hospital: ${h.name}
  ID: ${h.id}
  City: ${h.city} | Type: ${h.type} | Rating: ${h.rating}/5
  Address: ${h.address} | Phone: ${h.phone}
  Current wait times:
${specialtyLines}`;
    })
    .join('\n\n');
}

/**
 * Build the system prompt injected with live hospital data
 */
function buildSystemPrompt(context) {
  const city = context.city || null;
  const currentHour = new Date().getHours();
  const isPeak =
    (currentHour >= 9 && currentHour < 12) ||
    (currentHour >= 17 && currentHour < 20);
  const bestTime = getBestVisitTime(currentHour);
  const snapshot = buildHospitalSnapshot(city);

  return `You are HospitalAI, a smart hospital visit assistant for India. Your job is to help patients find the best hospital, understand wait times, and plan their visit wisely.

CURRENT CONTEXT:
- Current time: ${currentHour}:00 hrs
- Peak hours active: ${isPeak ? 'YES (expect longer waits)' : 'NO (good time to visit)'}
- Next best off-peak window: ${bestTime}
${city ? `- User's city: ${city}` : ''}

LIVE HOSPITAL DATA:
${snapshot}

YOUR RULES:
1. Always recommend the hospital with the SHORTEST wait time for the user's need.
2. Mention specific wait times and queue lengths from the data above.
3. If it is peak hour, warn the user and suggest the next off-peak window.
4. For serious symptoms (chest pain, stroke, difficulty breathing), always say "Go to the nearest emergency immediately."
5. Keep responses short, helpful, and friendly — 3 to 5 sentences max.
6. Always end with one actionable tip (e.g., "Bring your Aadhaar card for registration").
7. Never make up hospital names or data not listed above.
8. Format your response in plain text — no markdown, no bullet points, just clear sentences.`;
}

/**
 * Call OpenRouter with the Qwen model
 * @param {string} message - user's message
 * @param {object} context - { city, specialty, hospitalId }
 * @returns {Promise<string>} - AI reply text
 */
async function callLLM(message, context = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Fallback if no API key configured
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return buildFallbackReply(message, context);
  }

  const systemPrompt = buildSystemPrompt(context);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://hospital-ai.app',
      'X-Title': 'Hospital AI Queue Predictor',
    },
    body: JSON.stringify({
      models: MODELS,
      route: 'fallback',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.4,
      max_tokens: 300,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || JSON.stringify(data?.error) || `HTTP ${response.status}`;
    throw new Error(`OpenRouter: ${errMsg}`);
  }

  const msg = data?.choices?.[0]?.message;
  // Some thinking models return content=null with the answer in reasoning
  const reply = (msg?.content || msg?.reasoning || '').trim();

  if (!reply) throw new Error('Empty response from LLM');
  return reply;
}

/**
 * Fallback reply using local logic when no API key is set.
 * Gives a useful answer without any LLM call.
 */
function buildFallbackReply(message, context) {
  const city = context.city || 'Delhi';
  const specialty = context.specialty || 'General';
  const msg = message.toLowerCase();

  // Check for emergency keywords
  const emergencyKeywords = ['chest pain', 'stroke', 'breathe', 'breathing', 'unconscious', 'heart attack', 'emergency'];
  if (emergencyKeywords.some((kw) => msg.includes(kw))) {
    return 'This sounds like a medical emergency. Please call 108 (national ambulance) or go to the nearest hospital emergency immediately. Do not wait.';
  }

  // Get recommendations for the city
  const cityHospitals = hospitals
    .filter(
      (h) =>
        h.city.toLowerCase() === city.toLowerCase() &&
        h.specialties.includes(specialty)
    )
    .map((h) => {
      const wt = calculateWaitTime(h, specialty);
      return { name: h.name, waitTime: wt?.waitTime ?? 999, confidence: wt?.confidence ?? 70 };
    })
    .sort((a, b) => a.waitTime - b.waitTime);

  if (cityHospitals.length === 0) {
    return `I currently have data for Delhi, Mumbai, Chennai, Bangalore, and Chandigarh. Please select one of these cities and I will help you find the best hospital.`;
  }

  const best = cityHospitals[0];
  const currentHour = new Date().getHours();
  const isPeak = (currentHour >= 9 && currentHour < 12) || (currentHour >= 17 && currentHour < 20);
  const bestTime = getBestVisitTime(currentHour);

  return `For ${specialty} in ${city}, I recommend ${best.name} right now with an estimated wait of ~${best.waitTime} minutes (${best.confidence}% confidence). ${isPeak ? `It is currently peak hour — expect slightly longer queues. The next best off-peak window is ${bestTime}.` : 'This is an off-peak time, so queues are shorter than usual.'} Tip: Carry a valid ID (Aadhaar/PAN) for faster registration at the hospital.`;
}

module.exports = { callLLM, buildHospitalSnapshot, buildSystemPrompt };
