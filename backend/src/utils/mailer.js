const nodemailer = require('nodemailer');

// Demo-only hardcoded fallbacks (move back to .env before pushing!)
const FALLBACK = {
  host: 'smtp.gmail.com',
  port: 587,
  user: 'aakash.rathod@logicwind.com',
  pass: 'vmtwkltveopytbpn',
};

function smtpUser() {
  return process.env.SMTP_USER || FALLBACK.user;
}

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || FALLBACK.host;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : FALLBACK.port;
  const user = smtpUser();
  const pass = process.env.SMTP_PASS || FALLBACK.pass;

  if (!user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

function severityChip(severity) {
  switch (severity) {
    case 'CRITICAL':
      return { color: '#b91c1c', bg: '#fee2e2', label: '🚨 Critical' };
    case 'MODERATE':
      return { color: '#c2410c', bg: '#ffedd5', label: '⚠️ Moderate' };
    default:
      return { color: '#15803d', bg: '#dcfce7', label: '✓ Mild' };
  }
}

function buildBookingHtml(payload) {
  const {
    patientName,
    phone,
    token,
    hospitalName,
    specialty,
    currentToken,
    patientsAhead,
    estimatedWaitMinutes,
    etaTime,
    recommendedLeaveTime,
    message,
    symptomAnalysis,
  } = payload;

  const symptomBlock = symptomAnalysis
    ? (() => {
      const chip = severityChip(symptomAnalysis.severity);
      const symptomTags = (symptomAnalysis.symptoms || [])
        .map(
          (s) =>
            `<span style="display:inline-block;background:#ffffff;border:1px solid #e5e7eb;color:#4b5563;font-size:12px;padding:3px 10px;border-radius:999px;margin:2px 4px 2px 0;">${s}</span>`
        )
        .join('');
      return `
        <div style="margin-top:20px;padding:16px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;color:#374151;">AI Symptom Analysis</span>
            <span style="background:${chip.bg};color:${chip.color};font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;">${chip.label}</span>
          </div>
          <p style="font-style:italic;color:#374151;font-size:13px;margin:6px 0 10px;">"${symptomAnalysis.summary || ''}"</p>
          <div>${symptomTags}</div>
          <p style="margin-top:10px;font-size:12px;color:#6b7280;">Recommended type: <strong>${symptomAnalysis.recommended_type || 'GENERAL'}</strong></p>
        </div>`;
    })()
    : '';

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:24px;color:#ffffff;">
        <p style="margin:0;font-size:13px;letter-spacing:1px;opacity:.85;">HOSPITAL AI · BOOKING CONFIRMED</p>
        <h1 style="margin:6px 0 0;font-size:22px;">Hi ${patientName}, your token is ready 🎫</h1>
      </div>

      <div style="padding:24px;">
        <div style="text-align:center;margin-bottom:20px;">
          <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">Your Token Number</p>
          <p style="margin:4px 0 0;font-size:64px;font-weight:900;color:#2563eb;line-height:1;">${token}</p>
        </div>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;margin-bottom:16px;">
          <p style="margin:0;font-size:14px;color:#1e3a8a;font-weight:600;">${message || 'Your booking is confirmed.'}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;">Patient</td><td style="padding:8px 0;text-align:right;font-weight:600;">${patientName}</td></tr>
          ${phone ? `<tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;text-align:right;font-weight:600;">${phone}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#6b7280;">Hospital</td><td style="padding:8px 0;text-align:right;font-weight:600;">${hospitalName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Specialty</td><td style="padding:8px 0;text-align:right;font-weight:600;">${specialty}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Now Serving</td><td style="padding:8px 0;text-align:right;font-weight:600;">${currentToken || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Patients Ahead</td><td style="padding:8px 0;text-align:right;font-weight:600;">${patientsAhead}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Estimated Wait</td><td style="padding:8px 0;text-align:right;font-weight:600;">${estimatedWaitMinutes} min</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Your Turn At</td><td style="padding:8px 0;text-align:right;font-weight:600;">${etaTime}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Leave Home By</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#2563eb;">${recommendedLeaveTime}</td></tr>
        </table>

        ${symptomBlock}

        <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">Carry a valid ID (Aadhaar/PAN) and arrive a few minutes before your turn.</p>
      </div>
    </div>
  </body>
</html>`;
}

async function sendBookingEmail(to, payload) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  const from = process.env.MAIL_FROM || "aakash.rathod@logicwind.com" || `Hospital AI <${process.env.SMTP_USER || "aakash.rathod@logicwind.com"}>`;
  const subject = `Token #${payload.token} confirmed — ${payload.hospitalName}`;

  await transporter.sendMail({
    from,
    to,
    subject,
    html: buildBookingHtml(payload),
    text: `Hi ${payload.patientName},

Your token #${payload.token} is confirmed at ${payload.hospitalName} (${payload.specialty}).

Now serving: ${payload.currentToken || '—'}
Patients ahead: ${payload.patientsAhead}
Estimated wait: ${payload.estimatedWaitMinutes} min
Your turn at: ${payload.etaTime}
Leave home by: ${payload.recommendedLeaveTime}

${payload.message || ''}`,
  });

  return { sent: true };
}

function buildHeadsUpHtml(payload) {
  const { patientName, token, hospitalName, specialty, currentToken, etaTime } = payload;
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px;color:#ffffff;">
        <p style="margin:0;font-size:13px;letter-spacing:1px;opacity:.9;">HOSPITAL AI · YOU'RE UP NEXT</p>
        <h1 style="margin:6px 0 0;font-size:22px;">Hi ${patientName}, head to the hospital now 🏥</h1>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 14px;font-size:15px;color:#111827;line-height:1.5;">
          Only <strong>1 patient</strong> is ahead of you. Please reach <strong>${hospitalName}</strong> right away so you don't miss your turn.
        </p>

        <div style="display:flex;gap:12px;margin:16px 0;">
          <div style="flex:1;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9a3412;text-transform:uppercase;letter-spacing:1.5px;">Your Token</p>
            <p style="margin:4px 0 0;font-size:36px;font-weight:900;color:#ea580c;line-height:1;">${token}</p>
          </div>
          <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;">Now Serving</p>
            <p style="margin:4px 0 0;font-size:36px;font-weight:900;color:#111827;line-height:1;">${currentToken || '—'}</p>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#6b7280;">Hospital</td><td style="padding:6px 0;text-align:right;font-weight:600;">${hospitalName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Specialty</td><td style="padding:6px 0;text-align:right;font-weight:600;">${specialty}</td></tr>
          ${etaTime ? `<tr><td style="padding:6px 0;color:#6b7280;">Expected Turn</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#ea580c;">${etaTime}</td></tr>` : ''}
        </table>

        <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">Carry your ID. We'll see you shortly.</p>
      </div>
    </div>
  </body>
</html>`;
}

async function sendHeadsUpEmail(to, payload) {
  const transporter = getTransporter();
  if (!transporter) return { sent: false, reason: 'SMTP not configured' };

  const from = process.env.MAIL_FROM || "aakash.rathod@logicwind.com" || `Hospital AI <${process.env.SMTP_USER || "aakash.rathod@logicwind.com"}>`;
  const subject = `🏥 You're next — head to ${payload.hospitalName} now`;

  await transporter.sendMail({
    from,
    to,
    subject,
    html: buildHeadsUpHtml(payload),
    text: `Hi ${payload.patientName},

Only 1 patient is ahead of you at ${payload.hospitalName} (${payload.specialty}).
Your token: ${payload.token}
Now serving: ${payload.currentToken || '—'}
${payload.etaTime ? `Expected turn: ${payload.etaTime}` : ''}

Please head to the hospital right away so you don't miss your turn.`,
  });

  return { sent: true };
}

module.exports = { sendBookingEmail, sendHeadsUpEmail };
