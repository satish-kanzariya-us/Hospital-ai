/**
 * Simulation engine — generates realistic dynamic queue states
 * using historical hourly patterns + day-of-week + hospital type factors.
 *
 * Used by:
 *   - GET /simulate  → full-day timeline for a hospital
 *   - POST /predict   → "live" queue adjusted to current time
 */

const patterns = require('../data/patterns.json');
const { calculateWaitTime, isPeakHour } = require('./waitTime');

/**
 * Seed-based pseudo-random to keep results stable within a minute
 * (so the UI doesn't flicker on refresh).
 */
function stableRand(seed, min, max) {
  const x = Math.sin(seed + 9301) * 49297;
  const r = x - Math.floor(x);
  return Math.floor(r * (max - min + 1)) + min;
}

/**
 * Get the simulated queue length for a hospital+specialty at a given hour.
 * Applies: base × hourly load × specialty demand × day-of-week × type multiplier ± noise
 *
 * @param {object} hospital
 * @param {string} specialty
 * @param {number} hour - 0-23
 * @param {number} [dayOfWeek] - 0=Sun … 6=Sat, defaults to today
 * @returns {number} simulated queue length (capped at capacity)
 */
function simulateQueueAtHour(hospital, specialty, hour, dayOfWeek) {
  const queue = hospital.queues[specialty];
  if (!queue) return 0;

  const dow = dayOfWeek !== undefined ? dayOfWeek : new Date().getDay();

  const hourlyMult   = patterns.hourlyLoad[hour] ?? 1.0;
  const specialtyMult = patterns.specialtyDemand[specialty] ?? 0.5;
  const dowMult      = patterns.dayOfWeekLoad[dow] ?? 1.0;
  const typeMult     = patterns.typeMultiplier[hospital.type] ?? 1.0;

  // Base: use the "average" queue from the static data as the 1.0 reference
  const base = queue.current;

  // Compute load-adjusted queue
  const rawQueue = base * hourlyMult * specialtyMult * dowMult * typeMult;

  // Add ±15% noise seeded on (hospitalId + specialty + hour) so it's stable
  const seed = hospital.id.charCodeAt(1) + specialty.charCodeAt(0) + hour;
  const noise = stableRand(seed, -Math.floor(rawQueue * 0.15), Math.floor(rawQueue * 0.15));

  const simulated = Math.max(0, Math.min(queue.capacity, Math.round(rawQueue + noise)));
  return simulated;
}

/**
 * Build a 24-hour timeline for a hospital + specialty.
 * Each entry shows queue length, wait time, and confidence for that hour.
 *
 * @param {object} hospital
 * @param {string} specialty
 * @returns {Array} 24 entries, one per hour
 */
function buildDayTimeline(hospital, specialty) {
  const dow = new Date().getDay();
  return Array.from({ length: 24 }, (_, hour) => {
    const queueLength = simulateQueueAtHour(hospital, specialty, hour, dow);

    // Temporarily override the hospital queue for calculation
    const tempHospital = {
      ...hospital,
      queues: {
        ...hospital.queues,
        [specialty]: {
          ...hospital.queues[specialty],
          current: queueLength,
        },
      },
    };

    const wt = calculateWaitTime(tempHospital, specialty, `${String(hour).padStart(2, '0')}:00`);

    // Confidence boost/penalty from rating
    let ratingBonus = 0;
    if (hospital.rating >= 4.5) ratingBonus = patterns.ratingConfidenceBonus['gte4.5'];
    else if (hospital.rating >= 4.0) ratingBonus = patterns.ratingConfidenceBonus['gte4.0'];
    else ratingBonus = patterns.ratingConfidenceBonus['below4.0'];

    const confidence = Math.min(95, Math.max(50, (wt?.confidence ?? 70) + ratingBonus));

    return {
      hour,
      timeLabel: `${String(hour).padStart(2, '0')}:00`,
      queueLength,
      waitTime: wt?.waitTime ?? 0,
      peakHour: isPeakHour(hour),
      confidence,
      occupancyPct: Math.round((queueLength / hospital.queues[specialty].capacity) * 100),
    };
  });
}

/**
 * Find the top 3 best hours to visit (lowest wait time) in the next 12 hours.
 *
 * @param {object} hospital
 * @param {string} specialty
 * @returns {Array} up to 3 best time slots
 */
function getBestHours(hospital, specialty) {
  const now = new Date().getHours();
  const timeline = buildDayTimeline(hospital, specialty);

  return timeline
    .filter((t) => t.hour > now && t.hour <= now + 12)
    .sort((a, b) => a.waitTime - b.waitTime)
    .slice(0, 3)
    .map((t) => ({
      time: t.timeLabel,
      waitTime: t.waitTime,
      confidence: t.confidence,
    }));
}

/**
 * Get the "live" simulated queue for a hospital right now.
 * Uses current hour + realistic noise.
 */
function getLiveQueue(hospital, specialty) {
  const hour = new Date().getHours();
  return simulateQueueAtHour(hospital, specialty, hour);
}

module.exports = { simulateQueueAtHour, buildDayTimeline, getBestHours, getLiveQueue };
