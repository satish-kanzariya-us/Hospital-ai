/**
 * Queue AI — Integration Test Suite
 * Run with: node src/tests/run-tests.js
 * (Server must be running on port 4000)
 */

const BASE = 'http://localhost:4000';
let passed = 0;
let failed = 0;

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ─── Test suites ──────────────────────────────────────────────────────────────

async function testHealth() {
  console.log('\n── Health Check ──');
  const { status, data } = await req('GET', '/');
  assert('Returns 200', status === 200);
  assert('Has status:ok', data.status === 'ok');
}

async function testPredict() {
  console.log('\n── POST /predict ──');

  // Valid request
  const { status, data } = await req('POST', '/predict', {
    hospitalId: 'h1',
    specialty: 'General',
  });
  assert('Returns 200', status === 200);
  assert('Has name field', typeof data.name === 'string', data.name);
  assert('waitTime is a number', typeof data.waitTime === 'number');
  assert('waitTime > 0', data.waitTime > 0, `got ${data.waitTime}`);
  assert('confidence 55–95', data.confidence >= 55 && data.confidence <= 95, `got ${data.confidence}`);
  assert('Has peakHour bool', typeof data.peakHour === 'boolean');
  assert('Has occupancyPct', typeof data.occupancyPct === 'number');
  assert('Has dataSource', typeof data.dataSource === 'string');
  assert('Has bestTimesToVisit array', Array.isArray(data.bestTimesToVisit));

  // Peak hour simulation (10 AM)
  const { data: peakData } = await req('POST', '/predict', {
    hospitalId: 'h1', specialty: 'General', currentTime: '10:00',
  });
  assert('Peak hour flag set at 10AM', peakData.peakHour === true);

  // Off-peak (2 PM)
  const { data: offData } = await req('POST', '/predict', {
    hospitalId: 'h3', specialty: 'General', currentTime: '14:00',
  });
  assert('Off-peak flag at 2PM', offData.peakHour === false);
  assert('Off-peak wait < peak wait (same hospital)', offData.waitTime < peakData.waitTime);

  // Error: missing hospitalId
  const { status: s2 } = await req('POST', '/predict', { specialty: 'General' });
  assert('400 if hospitalId missing', s2 === 400);

  // Error: unknown hospital
  const { status: s3 } = await req('POST', '/predict', { hospitalId: 'zzz', specialty: 'General' });
  assert('404 for unknown hospital', s3 === 404);

  // Error: specialty unavailable
  const { status: s4 } = await req('POST', '/predict', { hospitalId: 'h2', specialty: 'Gynecology' });
  assert('400 for unavailable specialty', s4 === 400);
}

async function testRecommend() {
  console.log('\n── GET /recommend ──');

  const { status, data } = await req('GET', '/recommend?city=Delhi&specialty=General');
  assert('Returns 200', status === 200);
  assert('Has recommended array', Array.isArray(data.recommended));
  assert('At least 1 result', data.recommended.length >= 1);
  assert('Sorted by waitTime asc', (() => {
    const waits = data.recommended.map((h) => h.waitTime);
    return waits.every((w, i) => i === 0 || w >= waits[i - 1]);
  })());
  assert('Has bestHospital string', typeof data.bestHospital === 'string');
  assert('Has bestTime string', typeof data.bestTime === 'string');
  assert('Has message string', typeof data.message === 'string');
  assert('Each hospital has confidence', data.recommended.every((h) => h.confidence >= 55));
  assert('Each hospital has score', data.recommended.every((h) => typeof h.score === 'number'));

  // Mumbai
  const { data: mum } = await req('GET', '/recommend?city=Mumbai&specialty=General');
  assert('Mumbai returns results', mum.recommended.length >= 1);

  // Unknown city
  const { status: s2 } = await req('GET', '/recommend?city=Pune&specialty=General');
  assert('404 for unknown city', s2 === 404);

  // Missing city
  const { status: s3 } = await req('GET', '/recommend?specialty=General');
  assert('400 if city missing', s3 === 400);
}

async function testChat() {
  console.log('\n── POST /chat ──');

  const { status, data } = await req('POST', '/chat', {
    message: 'Which hospital in Delhi has least wait?',
    context: { city: 'Delhi', specialty: 'General' },
  });
  assert('Returns 200', status === 200);
  assert('Has reply string', typeof data.reply === 'string');
  assert('Reply is non-empty', data.reply.length > 10);

  // Emergency keyword
  const { data: emg } = await req('POST', '/chat', {
    message: 'I have chest pain',
    context: { city: 'Mumbai' },
  });
  assert('Emergency reply mentions 108', emg.reply.includes('108'));

  // Missing message
  const { status: s2 } = await req('POST', '/chat', { message: '' });
  assert('400 for empty message', s2 === 400);
}

async function testSimulate() {
  console.log('\n── GET /simulate ──');

  const { status, data } = await req('GET', '/simulate?hospitalId=h1&specialty=General');
  assert('Returns 200', status === 200);
  assert('Has 24-entry timeline', Array.isArray(data.timeline) && data.timeline.length === 24);
  assert('Timeline has hour 0–23', data.timeline[0].hour === 0 && data.timeline[23].hour === 23);
  assert('Has summary.peakTime', typeof data.summary.peakTime === 'string');
  assert('Has summary.quietestTime', typeof data.summary.quietestTime === 'string');
  assert('Has bestTimesToVisit', Array.isArray(data.bestTimesToVisit));
  assert('Has dataSource field', typeof data.dataSource === 'string');
  assert('Peak hour slots have higher waits', (() => {
    const peak = data.timeline.find((t) => t.peakHour && t.hour >= 9 && t.hour < 12);
    const offPeak = data.timeline.find((t) => !t.peakHour && t.hour === 14);
    return peak && offPeak && peak.waitTime > offPeak.waitTime;
  })(), 'peak slots should have higher wait than off-peak');

  // Error: missing hospitalId
  const { status: s2 } = await req('GET', '/simulate?specialty=General');
  assert('400 if hospitalId missing', s2 === 400);
}

async function testSimulationLogic() {
  console.log('\n── Simulation Logic ──');

  const { buildDayTimeline } = require('../utils/simulate');
  const hospitals = require('../data/hospitals.json');

  const hospital = hospitals.find((h) => h.id === 'h4'); // KEM Mumbai (Government, high load)
  const timeline = buildDayTimeline(hospital, 'General');

  const slot9am = timeline[9];
  const slot3am = timeline[3];
  const slot18pm = timeline[18];

  assert('3 AM has low queue', slot3am.queueLength < 10, `got ${slot3am.queueLength}`);
  assert('9 AM is peak hour', slot9am.peakHour === true);
  assert('6 PM is peak hour', slot18pm.peakHour === true);
  assert('9 AM wait > 3 AM wait', slot9am.waitTime > slot3am.waitTime,
    `9am=${slot9am.waitTime} vs 3am=${slot3am.waitTime}`);
  assert('All 24 hours covered', timeline.length === 24);
  assert('No negative queues', timeline.every((t) => t.queueLength >= 0));
  assert('No zero confidence', timeline.every((t) => t.confidence >= 50));
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   Queue AI — Integration Tests    ║');
  console.log('╚══════════════════════════════════════╝');

  try {
    await testHealth();
    await testPredict();
    await testRecommend();
    await testChat();
    await testSimulate();
    await testSimulationLogic();
  } catch (err) {
    console.error('\n💥 Test runner crashed:', err.message);
    console.error('   Is the server running? → node src/index.js');
    process.exit(1);
  }

  console.log('\n══════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════');

  if (failed > 0) process.exit(1);
}

run();
