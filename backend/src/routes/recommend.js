const express = require('express');
const router = express.Router();
const hospitals = require('../data/hospitals.json');
const { calculateWaitTime, getBestVisitTime } = require('../utils/waitTime');

/**
 * GET /recommend
 * Query: city, specialty
 * Returns ranked list of hospitals sorted by wait time (lowest first)
 */
router.get('/', (req, res) => {
  const { city, specialty = 'General' } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'city query param is required' });
  }

  // Filter hospitals by city (case-insensitive) and specialty
  const matches = hospitals.filter(
    (h) =>
      h.city.toLowerCase() === city.toLowerCase() &&
      h.specialties.includes(specialty)
  );

  if (matches.length === 0) {
    return res.status(404).json({
      error: `No hospitals found in '${city}' for specialty '${specialty}'`,
    });
  }

  const currentHour = new Date().getHours();

  // Score each hospital: lower wait = higher score
  const scored = matches
    .map((h) => {
      const wt = calculateWaitTime(h, specialty);
      if (!wt) return null;

      // Score formula: 100 - normalized wait (capped at 100)
      // Bonus for rating, penalty for high occupancy
      const waitScore = Math.max(0, 100 - wt.waitTime);
      const ratingBonus = (h.rating - 3) * 5; // 0 to 9 pts
      const occupancyPenalty = Math.floor(wt.occupancyPct / 20) * 3;
      const score = Math.round(
        Math.min(99, Math.max(30, waitScore + ratingBonus - occupancyPenalty))
      );

      return {
        hospitalId: h.id,
        name: h.name,
        city: h.city,
        address: h.address,
        phone: h.phone,
        rating: h.rating,
        type: h.type,
        specialty,
        waitTime: wt.waitTime,
        queueLength: wt.queueLength,
        occupancyPct: wt.occupancyPct,
        peakHour: wt.peakHour,
        confidence: wt.confidence,
        score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.waitTime - b.waitTime); // sort by shortest wait

  const best = scored[0];
  const bestVisitTime = getBestVisitTime(currentHour);

  res.json({
    city,
    specialty,
    recommended: scored,
    bestHospital: best.name,
    bestWaitTime: best.waitTime,
    bestTime: bestVisitTime,
    message: `Visit ${best.name} now for shortest wait (~${best.waitTime} min). Best off-peak window: ${bestVisitTime}.`,
    totalHospitals: scored.length,
  });
});

module.exports = router;
