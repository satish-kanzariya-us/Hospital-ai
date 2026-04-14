/**
 * Wait Time Formula:
 *   wait_time = (queue × avg_service_time) + base_delay + peak_factor
 *
 *   peak_factor = +15 min during peak hours (9–12, 17–20)
 *   confidence is reduced when queue is near capacity
 */

const PEAK_HOURS = [
  { start: 9, end: 12 },
  { start: 17, end: 20 },
];

/**
 * Returns true if given hour is a peak hour
 * @param {number} hour - 0-23
 */
function isPeakHour(hour) {
  return PEAK_HOURS.some((p) => hour >= p.start && hour < p.end);
}

/**
 * Calculate wait time for a hospital + specialty
 * @param {object} hospital - hospital object from data
 * @param {string} specialty - specialty name
 * @param {string} currentTime - "HH:MM" format (24h), defaults to now
 * @returns {{ waitTime, queueLength, confidence, peakHour, occupancyPct }}
 */
function calculateWaitTime(hospital, specialty, currentTime) {
  const queue = hospital.queues[specialty];
  if (!queue) {
    return null;
  }

  // Parse time
  let hour;
  if (currentTime) {
    const [h] = currentTime.split(':').map(Number);
    hour = h;
  } else {
    hour = new Date().getHours();
  }

  const peak = isPeakHour(hour);
  const peakFactor = peak ? 15 : 0;

  // Core formula
  const rawWait =
    queue.current * hospital.avgServiceTime + hospital.baseDelay + peakFactor;

  // Round to nearest minute, minimum 2 min
  const waitTime = Math.max(2, Math.round(rawWait));

  // Occupancy %
  const occupancyPct = Math.round((queue.current / queue.capacity) * 100);

  // Confidence: starts at 90, drops as occupancy rises (unpredictable when full)
  let confidence = 90 - Math.floor(occupancyPct / 10) * 3;
  if (peak) confidence -= 5; // slightly less confident during peak
  confidence = Math.min(95, Math.max(55, confidence));

  return {
    waitTime,
    queueLength: queue.current,
    capacity: queue.capacity,
    occupancyPct,
    peakHour: peak,
    confidence,
  };
}

/**
 * Get the next best time to visit (lowest wait window)
 * Simple heuristic: off-peak hours 8-9, 12-14, 20-22
 */
function getBestVisitTime(currentHour) {
  const offPeakWindows = [
    { label: '8:00 AM', hour: 8 },
    { label: '12:30 PM', hour: 12 },
    { label: '2:00 PM', hour: 14 },
    { label: '8:00 PM', hour: 20 },
  ];

  // Find the next upcoming off-peak window
  const next = offPeakWindows.find((w) => w.hour > currentHour);
  return next ? next.label : '8:00 AM tomorrow';
}

module.exports = { calculateWaitTime, isPeakHour, getBestVisitTime };
