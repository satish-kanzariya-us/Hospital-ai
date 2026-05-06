const express = require('express');
const router = express.Router();
const hospitals = require('../data/hospitals.json');
const qs = require('../utils/queueState');
const { sendBookingEmail } = require('../utils/mailer');
const { analyzeSymptoms } = require('../utils/symptoms');

function findHospital(id) {
  return hospitals.find((h) => h.id === id);
}

function initQueue(hospitalId, specialty) {
  const h = findHospital(hospitalId);
  if (!h) return null;
  if (!h.specialties.includes(specialty)) return null;
  qs.getOrCreate(h, specialty);
  return h;
}

// POST /queue/book — patient books a token
router.post('/book', async (req, res) => {
  const { hospitalId, specialty, patientName, email, phone, symptomAnalysis } = req.body;

  if (!hospitalId || !specialty || !patientName?.trim()) {
    return res.status(400).json({ error: 'hospitalId, specialty, and patientName are required' });
  }

  const hospital = initQueue(hospitalId, specialty);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital or specialty not found' });
  }

  const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';

  const appt = qs.book(hospitalId, specialty, patientName.trim(), {
    phone: cleanPhone || null,
    email: cleanEmail || null,
    symptomAnalysis: symptomAnalysis || null,
  });
  const eta = qs.etaForToken(hospitalId, specialty, appt.tokenNumber);
  const snap = qs.snapshot(qs.queues[`${hospitalId}::${specialty}`]);

  const payload = {
    success: true,
    token: appt.tokenNumber,
    patientName: appt.patientName,
    phone: appt.phone,
    hospitalId,
    hospitalName: hospital.name,
    specialty,
    currentToken: snap.currentToken,
    totalWaiting: snap.waitingCount,
    patientsAhead: eta.patientsAhead,
    estimatedWaitMinutes: eta.estimatedWaitMinutes,
    etaTime: eta.etaTime,
    recommendedLeaveTime: eta.recommendedLeaveTime,
    message: eta.message,
    urgency: eta.urgency,
    symptomAnalysis: symptomAnalysis || null,
  };

  // Fire-and-forget email — don't block the booking response
  if (cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    sendBookingEmail(cleanEmail, payload)
      .then((r) => {
        if (!r.sent) console.warn('[mail] not sent:', r.reason);
      })
      .catch((err) => console.error('[mail] failed:', err.message));
    payload.emailQueued = true;
  }

  res.json(payload);
});

// GET /queue/test-mail?email=foo@gmail.com — send a sample booking email
router.get('/test-mail', async (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ sent: false, error: 'Provide a valid ?email=' });
  }

  const samplePayload = {
    patientName: 'Test Patient',
    phone: '+91 111111111111111',
    token: 42,
    hospitalName: 'Hospital AI Demo',
    specialty: 'General Medicine',
    currentToken: 40,
    patientsAhead: 1,
    estimatedWaitMinutes: 10,
    etaTime: '11:30 AM',
    recommendedLeaveTime: '11:15 AM',
    message: 'This is a test email from Hospital AI.',
    symptomAnalysis: null,
  };

  try {
    const result = await sendBookingEmail(email, samplePayload);
    console.log("🚀 ~ result:", result)
    if (!result.sent) {
      return res.status(500).json({ sent: false, to: email, result });
    }
    return res.json({ sent: true, to: email, result, subject: `Token #${samplePayload.token} confirmed — ${samplePayload.hospitalName}` });
  } catch (err) {
    return res.status(500).json({ sent: false, to: email, error: err.message });
  }
});

// POST /queue/analyze-symptoms — AI symptom triage
router.post('/analyze-symptoms', async (req, res) => {
  const { description } = req.body;
  if (!description?.trim()) {
    return res.status(400).json({ error: 'description is required' });
  }
  try {
    const result = await analyzeSymptoms(description.trim());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// GET /queue/:hospitalId/:specialty/status — full queue snapshot
router.get('/:hospitalId/:specialty/status', (req, res) => {
  const { hospitalId, specialty } = req.params;
  const hospital = initQueue(hospitalId, specialty);
  if (!hospital) return res.status(404).json({ error: 'Hospital or specialty not found' });

  const snap = qs.snapshot(qs.queues[`${hospitalId}::${specialty}`]);
  res.json(snap);
});

// GET /queue/:hospitalId/:specialty/:token/eta — patient's live ETA
router.get('/:hospitalId/:specialty/:token/eta', (req, res) => {
  const { hospitalId, specialty } = req.params;
  const tokenNumber = parseInt(req.params.token, 10);

  const hospital = initQueue(hospitalId, specialty);
  if (!hospital) return res.status(404).json({ error: 'Hospital or specialty not found' });

  const eta = qs.etaForToken(hospitalId, specialty, tokenNumber);
  if (!eta) return res.status(404).json({ error: 'Token not found' });

  res.json(eta);
});

// GET /queue/:hospitalId/:specialty/stream — SSE real-time stream
router.get('/:hospitalId/:specialty/stream', (req, res) => {
  const { hospitalId, specialty } = req.params;
  const hospital = initQueue(hospitalId, specialty);
  if (!hospital) return res.status(404).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send current state immediately on connect
  const snap = qs.snapshot(qs.queues[`${hospitalId}::${specialty}`]);
  res.write(`data: ${JSON.stringify({ type: 'init', ...snap })}\n\n`);

  qs.subscribe(hospitalId, specialty, res);

  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(heartbeat); }
  }, 25_000);

  req.on('close', () => clearInterval(heartbeat));
});

// POST /queue/:hospitalId/:specialty/next — receptionist: serve next patient
router.post('/:hospitalId/:specialty/next', (req, res) => {
  const { hospitalId, specialty } = req.params;
  const hospital = initQueue(hospitalId, specialty);
  if (!hospital) return res.status(404).json({ error: 'Hospital or specialty not found' });

  const result = qs.serveNext(hospitalId, specialty);
  res.json({ success: true, ...result });
});

// POST /queue/:hospitalId/:specialty/skip — receptionist: skip current token
router.post('/:hospitalId/:specialty/skip', (req, res) => {
  const { hospitalId, specialty } = req.params;
  const hospital = initQueue(hospitalId, specialty);
  if (!hospital) return res.status(404).json({ error: 'Hospital or specialty not found' });

  const result = qs.skipCurrent(hospitalId, specialty);
  res.json({ success: true, ...result });
});

// POST /queue/:hospitalId/:specialty/delay — receptionist: add or clear delay
router.post('/:hospitalId/:specialty/delay', (req, res) => {
  const { hospitalId, specialty } = req.params;
  const { minutes } = req.body;

  if (minutes === undefined || isNaN(Number(minutes))) {
    return res.status(400).json({ error: 'minutes (number) is required' });
  }

  const hospital = initQueue(hospitalId, specialty);
  if (!hospital) return res.status(404).json({ error: 'Hospital or specialty not found' });

  const result = qs.addDelay(hospitalId, specialty, parseInt(minutes, 10));
  res.json({ success: true, ...result });
});

module.exports = router;
