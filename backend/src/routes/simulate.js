const express = require('express');
const router = express.Router();
const hospitals = require('../data/hospitals.json');
const { buildDayTimeline, getBestHours } = require('../utils/simulate');

/**
 * GET /simulate
 * Query: hospitalId, specialty
 * Returns full 24-hour queue simulation + best times to visit
 *
 * Demo-friendly endpoint — great for showing AI predictions on stage.
 */
router.get('/', (req, res) => {
  const { hospitalId, specialty = 'General' } = req.query;

  if (!hospitalId) {
    return res.status(400).json({ error: 'hospitalId is required' });
  }

  const hospital = hospitals.find((h) => h.id === hospitalId);
  if (!hospital) {
    return res.status(404).json({ error: `Hospital '${hospitalId}' not found` });
  }

  if (!hospital.specialties.includes(specialty)) {
    return res.status(400).json({
      error: `Specialty '${specialty}' not available at ${hospital.name}`,
      available: hospital.specialties,
    });
  }

  const timeline = buildDayTimeline(hospital, specialty);
  const bestHours = getBestHours(hospital, specialty);
  const now = new Date().getHours();
  const currentSlot = timeline[now];

  // Summary stats
  const peakSlot   = timeline.reduce((a, b) => (a.waitTime > b.waitTime ? a : b));
  const lowestSlot = timeline.reduce((a, b) => (a.waitTime < b.waitTime ? a : b));
  const avgWait    = Math.round(timeline.reduce((s, t) => s + t.waitTime, 0) / 24);

  res.json({
    hospitalId: hospital.id,
    name: hospital.name,
    city: hospital.city,
    specialty,
    dataSource: 'Simulated from historical visit patterns',
    currentHour: now,
    current: currentSlot,
    bestTimesToVisit: bestHours,
    summary: {
      avgWaitTime: avgWait,
      peakTime: peakSlot.timeLabel,
      peakWait: peakSlot.waitTime,
      quietestTime: lowestSlot.timeLabel,
      quietestWait: lowestSlot.waitTime,
    },
    timeline,
  });
});

module.exports = router;
