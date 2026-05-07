/**
 * In-memory queue state engine.
 * Each hospital+specialty pair gets an independent queue with:
 *   - token assignment
 *   - receptionist actions (next / skip / delay)
 *   - SSE broadcasting to all connected clients
 */

const { sendHeadsUpEmail } = require('./mailer');

const queues = {};           // "h1::General" → queue object
const sseClients = {};       // "h1::General" → Set<res>

function key(hospitalId, specialty) {
  return `${hospitalId}::${specialty}`;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

// ─── Queue lifecycle ──────────────────────────────────────────────────────────

function getOrCreate(hospital, specialty) {
  const k = key(hospital.id, specialty);
  if (!queues[k]) {
    queues[k] = {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      specialty,
      avgServiceTime: hospital.avgServiceTime, // minutes per patient
      currentToken: 0,      // token number currently being served (0 = none)
      nextToken: 1,         // next token number to assign
      delayMinutes: 0,      // extra delay added by receptionist
      appointments: [],     // all bookings
    };
  }
  return queues[k];
}

// ─── Patient: book a slot ─────────────────────────────────────────────────────

function book(hospitalId, specialty, patientName, contact = {}) {
  const k = key(hospitalId, specialty);
  const q = queues[k];
  if (!q) return null;

  // Snapshot queue length before adding this patient
  const patientsAheadAtBooking = q.appointments.filter(
    (a) => a.status === 'waiting' || a.status === 'serving'
  ).length;

  const tokenNumber = q.nextToken++;
  const appt = {
    tokenNumber,
    patientName,
    phone: contact.phone || null,
    email: contact.email || null,
    symptomAnalysis: contact.symptomAnalysis || null,
    status: 'waiting',   // 'waiting' | 'serving' | 'attended' | 'skipped'
    bookedAt: new Date().toISOString(),
    patientsAheadAtBooking,
  };
  q.appointments.push(appt);

  broadcast(k);
  return appt;
}

// ─── Patient: compute live ETA for their token ────────────────────────────────

function etaForToken(hospitalId, specialty, tokenNumber) {
  const k = key(hospitalId, specialty);
  const q = queues[k];
  if (!q) return null;

  const appt = q.appointments.find((a) => a.tokenNumber === tokenNumber);
  if (!appt) return null;
  if (appt.status === 'attended') return { status: 'attended', message: 'You have been attended. Thank you!' };
  if (appt.status === 'skipped')  return { status: 'skipped',  message: 'Your token was skipped. Please check with the receptionist.' };

  // Active queue (waiting + serving), sorted by token number
  const active = q.appointments
    .filter((a) => a.status === 'waiting' || a.status === 'serving')
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const idx = active.findIndex((a) => a.tokenNumber === tokenNumber);
  if (idx === -1) return null;

  // idx 0 = currently serving, idx 1 = next, etc.
  const minutesAhead = idx * q.avgServiceTime + q.delayMinutes;
  const etaDate = new Date(Date.now() + minutesAhead * 60_000);
  // Recommended leave = arrive ~5 min before turn → leave 25 min before (adjustable)
  const leaveDate = new Date(Date.now() + Math.max(0, minutesAhead - 25) * 60_000);

  let urgency, message;
  if (idx === 0) {
    urgency = 'serving';
    message = "You're being seen right now!";
  } else if (idx === 1) {
    urgency = 'next';
    message = 'Get ready — you are next in line!';
  } else if (minutesAhead <= 15) {
    urgency = 'leave-now';
    message = `Leave now! Your turn is in ~${minutesAhead} min (around ${formatTime(etaDate)}).`;
  } else if (q.delayMinutes > 0) {
    urgency = 'delayed';
    message = `Doctor delayed by ${q.delayMinutes} min. New expected turn: ${formatTime(etaDate)}. Leave by ${formatTime(leaveDate)}.`;
  } else {
    urgency = 'waiting';
    message = `Your turn is expected around ${formatTime(etaDate)}. Leave by ${formatTime(leaveDate)}.`;
  }

  return {
    status: appt.status,
    tokenNumber,
    patientName: appt.patientName,
    patientsAhead: idx,         // 0 = you're up
    estimatedWaitMinutes: minutesAhead,
    etaTime: formatTime(etaDate),
    recommendedLeaveTime: formatTime(leaveDate),
    currentToken: q.currentToken,
    delayMinutes: q.delayMinutes,
    urgency,
    message,
  };
}

// ─── Heads-up email: notify the patient who now has 1 ahead ──────────────────

function notifyOnDeck(q) {
  // After advancing the queue, the active list is [serving, next-in-line, ...]
  // We email the patient at index 1 — they have exactly 1 patient ahead.
  const active = q.appointments
    .filter((a) => a.status === 'waiting' || a.status === 'serving')
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const onDeck = active[1];
  if (!onDeck || !onDeck.email || onDeck.headsUpSent) return;

  onDeck.headsUpSent = true; // mark first to avoid duplicate sends

  const eta = etaForToken(q.hospitalId, q.specialty, onDeck.tokenNumber);

  sendHeadsUpEmail(onDeck.email, {
    patientName: onDeck.patientName,
    token: onDeck.tokenNumber,
    hospitalName: q.hospitalName,
    specialty: q.specialty,
    currentToken: q.currentToken,
    etaTime: eta?.etaTime || null,
  })
    .then((r) => {
      if (!r.sent) {
        console.warn('[heads-up] not sent:', r.reason);
        onDeck.headsUpSent = false; // allow retry next time
      }
    })
    .catch((err) => {
      console.error('[heads-up] failed:', err.message);
      onDeck.headsUpSent = false;
    });
}

// ─── Receptionist actions ─────────────────────────────────────────────────────

function serveNext(hospitalId, specialty) {
  const k = key(hospitalId, specialty);
  const q = queues[k];
  if (!q) return null;

  // Mark currently serving → attended
  const serving = q.appointments.find((a) => a.status === 'serving');
  if (serving) {
    serving.status = 'attended';
    serving.attendedAt = new Date().toISOString();
  }

  // Promote next waiting → serving
  const next = q.appointments
    .filter((a) => a.status === 'waiting')
    .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

  if (next) {
    next.status = 'serving';
    q.currentToken = next.tokenNumber;
  }

  notifyOnDeck(q);
  broadcast(k);
  return snapshot(q);
}

function skipCurrent(hospitalId, specialty) {
  const k = key(hospitalId, specialty);
  const q = queues[k];
  if (!q) return null;

  const serving = q.appointments.find((a) => a.status === 'serving');
  if (serving) {
    serving.status = 'skipped';
    serving.skippedAt = new Date().toISOString();
  }

  // Promote next waiting
  const next = q.appointments
    .filter((a) => a.status === 'waiting')
    .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

  if (next) {
    next.status = 'serving';
    q.currentToken = next.tokenNumber;
  }

  notifyOnDeck(q);
  broadcast(k);
  return snapshot(q);
}

function addDelay(hospitalId, specialty, minutes) {
  const k = key(hospitalId, specialty);
  const q = queues[k];
  if (!q) return null;

  q.delayMinutes = Math.max(0, q.delayMinutes + minutes);
  broadcast(k);
  return { delayMinutes: q.delayMinutes };
}

// ─── SSE pub/sub ──────────────────────────────────────────────────────────────

function subscribe(hospitalId, specialty, res) {
  const k = key(hospitalId, specialty);
  if (!sseClients[k]) sseClients[k] = new Set();
  sseClients[k].add(res);
  res.on('close', () => sseClients[k]?.delete(res));
}

function broadcast(k) {
  const clients = sseClients[k];
  if (!clients?.size) return;

  const q = queues[k];
  const payload = snapshot(q);

  clients.forEach((res) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      clients.delete(res);
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snapshot(q) {
  return {
    hospitalId: q.hospitalId,
    hospitalName: q.hospitalName,
    specialty: q.specialty,
    currentToken: q.currentToken,
    delayMinutes: q.delayMinutes,
    avgServiceTime: q.avgServiceTime,
    appointments: q.appointments,
    waitingCount: q.appointments.filter((a) => a.status === 'waiting').length,
    servedCount: q.appointments.filter((a) => a.status === 'attended').length,
  };
}

module.exports = { getOrCreate, book, etaForToken, serveNext, skipCurrent, addDelay, subscribe, snapshot, queues };
