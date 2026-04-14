const express = require('express');
const router = express.Router();
const hospitals = require('../data/hospitals.json');
const { calculateWaitTime } = require('../utils/waitTime');
const { getLiveQueue, getBestHours } = require('../utils/simulate');

/**
 * POST /predict
 * Body: { hospitalId, specialty, currentTime }
 * Returns wait time prediction for a specific hospital + specialty
 */
router.post('/', (req, res) => {
  const { hospitalId, specialty = 'General', currentTime } = req.body;

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

  // Use simulated live queue unless an explicit currentTime was passed (for testing)
  let liveHospital = hospital;
  if (!currentTime) {
    const simulatedQueue = getLiveQueue(hospital, specialty);
    liveHospital = {
      ...hospital,
      queues: {
        ...hospital.queues,
        [specialty]: { ...hospital.queues[specialty], current: simulatedQueue },
      },
    };
  }

  const result = calculateWaitTime(liveHospital, specialty, currentTime);
  if (!result) {
    return res.status(500).json({ error: 'Could not calculate wait time' });
  }

  const bestTimes = getBestHours(hospital, specialty);

  res.json({
    hospitalId: hospital.id,
    name: hospital.name,
    city: hospital.city,
    specialty,
    address: hospital.address,
    phone: hospital.phone,
    rating: hospital.rating,
    type: hospital.type,
    waitTime: result.waitTime,
    queueLength: result.queueLength,
    capacity: result.capacity,
    occupancyPct: result.occupancyPct,
    peakHour: result.peakHour,
    confidence: result.confidence,
    unit: 'minutes',
    dataSource: 'Based on past visit patterns',
    bestTimesToVisit: bestTimes,
  });
});

module.exports = router;
