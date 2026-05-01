// server/src/services/EmailService.js
// Nodemailer-based email service using existing .env SMTP config
// Falls back to console.log stub if SMTP not configured

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[EmailService] SMTP not configured — emails will be logged to console only.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { 
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return transporter;
}

async function send(to, subject, html) {
  const t = getTransporter();
  if (!t) {
    console.log(`[EmailService STUB] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: `"MISC Pro" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EmailService] Email sent successfully to ${to}`);
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
    throw err; // Re-throw to be caught by route handler
  }
}

// ── OTP email (device-change detection) ──────────────────────────────────────
async function sendOTP(email, otp) {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;border-radius:12px;color:#e5e5e5">
      <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin-bottom:8px">New Device Login</h2>
      <p style="color:#a0a0a0;font-size:14px;margin-bottom:24px">
        We detected a login attempt from a new device or location. Enter this code to continue.
      </p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#6366f1">${otp}</div>
        <p style="color:#666;font-size:12px;margin-top:10px">Expires in 10 minutes</p>
      </div>
      <p style="color:#666;font-size:12px">
        If you did not attempt to log in, your account may be compromised. Change your password immediately.
      </p>
    </div>`;
  await send(email, 'MISC Pro — Login Verification Code', html);
}

// ── Admin invite / estimator invite email ────────────────────────────────────
async function sendAdminInvite(email, activationLink, licenseType, maxEstimators, recipientName = '') {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;border-radius:12px;color:#e5e5e5">
      <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin-bottom:8px">
        You've been invited to MISC Pro
      </h2>
      ${recipientName ? `<p style="color:#a0a0a0;font-size:14px">Hi ${recipientName},</p>` : ''}
      <p style="color:#a0a0a0;font-size:14px;margin-bottom:24px">
        Your account has been set up with a <strong style="color:#6366f1">${licenseType}</strong> license
        (up to ${maxEstimators} estimator${maxEstimators !== 1 ? 's' : ''}).
        Click below to set your password and activate your account.
      </p>
      <a href="${activationLink}"
         style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px">
        Activate Account
      </a>
      <p style="color:#666;font-size:12px">
        This link expires in 48 hours. If you didn't expect this invitation, please ignore this email.
      </p>
    </div>`;
  await send(email, 'MISC Pro — Activate Your Account', html);
}

// ── Password reset email ─────────────────────────────────────────────────────
async function sendPasswordReset(email, resetLink) {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;border-radius:12px;color:#e5e5e5">
      <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin-bottom:8px">Reset Your Password</h2>
      <p style="color:#a0a0a0;font-size:14px;margin-bottom:24px">
        Click the button below to reset your MISC Pro password. This link expires in 1 hour.
      </p>
      <a href="${resetLink}"
         style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px">
        Reset Password
      </a>
      <p style="color:#666;font-size:12px">
        If you didn't request a password reset, ignore this email — your account is safe.
      </p>
    </div>`;
  await send(email, 'MISC Pro — Password Reset', html);
}

module.exports = { sendOTP, sendAdminInvite, sendPasswordReset };
