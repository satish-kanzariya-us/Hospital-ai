const express = require('express');
const router = express.Router();
const hospitals = require('../data/hospitals.json');
const { calculateWaitTime } = require('../utils/waitTime');
const { getLiveQueue, getBestHours } = require('../utils/simulate');
const qs = require('../utils/queueState');

function isPeakHour(hour) {
  return (hour >= 9 && hour < 12) || (hour >= 17 && hour < 20);
}

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

  const bestTimes = getBestHours(hospital, specialty);
  const capacity = hospital.queues[specialty]?.capacity || 60;

  // Use real queue data if it exists, otherwise fall back to simulation
  const realQueue = qs.queues[`${hospitalId}::${specialty}`];

  let waitTime, queueLength, occupancyPct, peakHour, confidence, dataSource;

  if (realQueue) {
    queueLength = realQueue.appointments.filter(
      (a) => a.status === 'waiting' || a.status === 'serving'
    ).length;
    occupancyPct = Math.round((queueLength / capacity) * 100);
    peakHour = isPeakHour(new Date().getHours());
    waitTime = Math.max(0, queueLength * 30 + realQueue.delayMinutes);
    confidence = Math.min(95, Math.max(55, 90 - Math.floor(occupancyPct / 10) * 3 - (peakHour ? 5 : 0)));
    dataSource = 'Live queue data';
  } else {
    const simulatedQueue = currentTime ? hospital.queues[specialty]?.current : getLiveQueue(hospital, specialty);
    const liveHospital = {
      ...hospital,
      queues: {
        ...hospital.queues,
        [specialty]: { ...hospital.queues[specialty], current: simulatedQueue },
      },
    };
    const result = calculateWaitTime(liveHospital, specialty, currentTime);
    if (!result) return res.status(500).json({ error: 'Could not calculate wait time' });
    ({ waitTime, queueLength, occupancyPct, peakHour, confidence } = result);
    dataSource = 'Based on past visit patterns';
  }

  res.json({
    hospitalId: hospital.id,
    name: hospital.name,
    city: hospital.city,
    specialty,
    address: hospital.address,
    phone: hospital.phone,
    rating: hospital.rating,
    type: hospital.type,
    waitTime,
    queueLength,
    capacity,
    occupancyPct,
    peakHour,
    confidence,
    unit: 'minutes',
    dataSource,
    bestTimesToVisit: bestTimes,
  });
});

module.exports = router;
