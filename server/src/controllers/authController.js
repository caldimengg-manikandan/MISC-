// server/src/controllers/authController.js
// Handles login (with OTP for new devices), OTP verify, logout, and activation.
// Session token is embedded in JWT — mismatch = kicked.

const db = require('../config/mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateLicenseSignature } = require('../utils/cryptoUtils');
const EmailService = require('../services/EmailService');
const { getLicenseForUser } = require('../middleware/licenseCheck');
const { enforcePasswordPolicy } = require('../utils/passwordPolicy');
const { auditLog } = require('../utils/auditLogger');

// ── JWT generation ──
function generateToken(user, sessionToken) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
      companyId: user.company_id || null,
      admin_owner_id: user.admin_owner_id || null,
      sessionToken,
      licenseValid: true,
      tokenIssuedAt: new Date().toISOString(),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }  // Short-lived access token
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('auth_token', accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function fingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(ua).digest('hex').substring(0, 64);
}

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) {
      await auditLog(req, 'LOGIN_FAIL', 'users', null, null, { email: email.toLowerCase(), reason: 'user_not_found' });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // ── Account lock check ──
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const msLeft = new Date(user.locked_until) - new Date();
      return res.status(403).json({
        success: false,
        locked: true,
        lockedUntil: user.locked_until,
        msRemaining: msLeft,
        error: 'Account temporarily locked. Try again later.'
      });
    }

    // ── Password check ──
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const failedAttempts = (user.failed_attempts || 0) + 1;
      if (failedAttempts >= 5) {
        await db.query(
          'UPDATE users SET failed_attempts = ?, is_locked = 1, locked_at = GETDATE(), locked_until = DATEADD(minute, 30, GETDATE()) WHERE id = ?',
          [failedAttempts, user.id]
        );
        await auditLog(req, 'LOGIN_FAIL', 'users', user.id, null, { email: user.email, reason: 'password_mismatch_locked', attempts: failedAttempts });
        return res.status(403).json({ success: false, locked: true, msRemaining: 30 * 60 * 1000, error: 'Account locked due to too many failed attempts. Try again in 30 minutes.' });
      } else {
        await db.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [failedAttempts, user.id]);
        await auditLog(req, 'LOGIN_FAIL', 'users', user.id, null, { email: user.email, reason: 'password_mismatch', attempts: failedAttempts });
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
    }

    // ── License check (for non-superadmin) ──
    if (user.role !== 'superadmin') {
      const license = await getLicenseForUser(user.id, user.role, user.admin_owner_id);
      if (!license) {
        return res.status(403).json({ licenseInactive: true, error: 'No active license. Contact your administrator.' });
      }
      if (new Date(license.valid_until) < new Date()) {
        return res.status(403).json({ licenseExpired: true, error: 'License expired. Contact your administrator.' });
      }
    }

    // ── Device fingerprint check (W5: IP + User-Agent hash + device_id cookie) ──
    const currentIp = req.ip || '';
    const currentDevice = fingerprint(req);
    const deviceIdCookie = req.cookies?.device_id || null;

    // To allow same-machine/same-network bypass (as requested), 
    // we consider it the "same device" if the IP matches.
    const sameDevice = (user.session_ip === currentIp);

    if (sameDevice || !user.session_ip) {
      // ── Known device — direct login ──
      const sessionToken = crypto.randomBytes(32).toString('hex');

      await db.query(
        `UPDATE users SET
          session_token = ?, session_ip = ?, session_device = ?, session_device_id = ?,
          session_at = GETDATE(), lastLogin = GETDATE(),
          otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0,
          otp_resend_count = 0, otp_resend_window_start = NULL,
          failed_attempts = 0, is_locked = 0, locked_until = NULL
        WHERE id = ?`,
        [sessionToken, currentIp, currentDevice, deviceIdCookie, user.id]
      );

      await auditLog(req, 'LOGIN', 'users', user.id, null, { email: user.email, method: 'direct' });

      // Set device_id cookie if new (W5/C7: httpOnly, secure, sameSite strict)
      if (!deviceIdCookie) {
        const newDeviceId = crypto.randomUUID();
        res.cookie('device_id', newDeviceId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
        });
      }

      /* MFA logic for Admins and Superadmins removed per user request:
         "it should accept the password if they enters correct"
      if (user.role === 'admin' || user.role === 'superadmin') {
        if (user.mfa_enabled) {
          ...
        }
      }
      */

      const token = generateToken(user, sessionToken);
      const refreshToken = generateRefreshToken(user.id);
      setAuthCookies(res, token, refreshToken);
      const daysRemaining = user.trialEnd
        ? Math.max(0, Math.ceil((new Date(user.trialEnd) - new Date()) / 86400000))
        : 0;

      console.log('DEBUG LOGIN: Final response body:', {
        success: true,
        mustChangePassword: !!user.mustChangePassword,
        user_id: user.id,
        role: user.role
      });
      return res.json({
        success: true,
        mustChangePassword: !!user.mustChangePassword,
        // token still sent in body for backward-compat with older clients during migration
        token,
        user: {
          id: user.id,
          email: user.email,                                      
          name: user.name || user.full_name || '',
          role: user.role,
          company: user.company,
          companyId: user.company_id,
          daysRemaining,
          isPaid: !!user.isPaid,
          mfaWarning: (user.role === 'admin' || user.role === 'superadmin') && !user.mfa_enabled
        }
      });
    }

    // ── New device — trigger OTP ──
    // W6: Resend rate limiting (max 3 per 10-min window)
    const now = new Date();
    let resendCount = user.otp_resend_count || 0;
    let windowStart = user.otp_resend_window_start ? new Date(user.otp_resend_window_start) : null;

    if (!windowStart || now - windowStart > 10 * 60 * 1000) {
      // New window — reset count
      resendCount = 0;
      windowStart = now;
    }

    if (resendCount >= 3) {
      return res.status(429).json({
        success: false,
        error: 'Too many OTP requests. Please wait 10 minutes before trying again.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      `UPDATE users SET
        otp_code = ?, otp_expires_at = ?, otp_attempts = 0,
        otp_resend_count = ?, otp_resend_window_start = ?
      WHERE id = ?`,
      [otp, otpExpiry, resendCount + 1, windowStart, user.id]
    );

    await EmailService.sendOTP(user.email, otp);

    return res.json({
      success: true,
      requiresOTP: true,
      userId: user.id,
      message: `A verification code was sent to ${user.email.replace(/(.{2}).+(@.+)/, '$1***$2')}`
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

// ── Verify OTP (new device login) ─────────────────────────────────────────────
const verifyLoginOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, error: 'userId and otp are required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // ── Lock check ──
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const msLeft = new Date(user.locked_until) - new Date();
      return res.status(403).json({ locked: true, msRemaining: msLeft });
    }

    // ── OTP expiry check ──
    if (!user.otp_code || !user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP has expired. Please log in again.' });
    }

    // ── License check (for non-superadmin) ──
    if (user.role !== 'superadmin') {
      const license = await getLicenseForUser(user.id, user.role, user.admin_owner_id);
      if (!license) {
        return res.status(403).json({ licenseInactive: true, error: 'No active license. Contact your administrator.' });
      }
      if (new Date(license.valid_until) < new Date()) {
        return res.status(403).json({ licenseExpired: true, error: 'License expired. Contact your administrator.' });
      }
    }

    // ── OTP match ──
    if (user.otp_code !== otp.trim()) {
      const newAttempts = (user.otp_attempts || 0) + 1;

      if (newAttempts >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await db.query(
          `UPDATE users SET otp_attempts = ?, locked_until = ? WHERE id = ?`,
          [newAttempts, lockedUntil, userId]
        );
        return res.status(403).json({
          success: false,
          locked: true,
          lockedUntil,
          msRemaining: 15 * 60 * 1000,
          error: 'Too many failed attempts. Account locked for 15 minutes.'
        });
      }

      await db.query(`UPDATE users SET otp_attempts = ? WHERE id = ?`, [newAttempts, userId]);
      return res.status(400).json({
        success: false,
        error: `Invalid code. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? 's' : ''} remaining.`,
        attemptsRemaining: 5 - newAttempts
      });
    }

    // ── OTP correct — create session ──
    const currentIp = req.ip || '';
    const currentDevice = fingerprint(req);
    const deviceIdCookie = req.cookies?.device_id;
    const newDeviceId = deviceIdCookie || crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString('hex');

    await db.query(
      `UPDATE users SET
        session_token = ?, session_ip = ?, session_device = ?, session_device_id = ?,
        session_at = GETDATE(), lastLogin = GETDATE(),
        otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0,
        otp_resend_count = 0, otp_resend_window_start = NULL,
        locked_until = NULL, failed_attempts = 0, is_locked = 0
      WHERE id = ?`,
      [sessionToken, currentIp, currentDevice, newDeviceId, userId]
    );

    /* MFA logic for Admins and Superadmins removed per user request
    if (user.role === 'admin' || user.role === 'superadmin') {
      ...
    }
    */

    const token = generateToken(user, sessionToken);
    const refreshToken = generateRefreshToken(user.id);
    setAuthCookies(res, token, refreshToken);

    const daysRemaining = user.trialEnd
      ? Math.max(0, Math.ceil((new Date(user.trialEnd) - new Date()) / 86400000))
      : 0;

    return res.json({
      success: true,
      mustChangePassword: !!user.mustChangePassword,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.full_name || '',
        role: user.role,
        company: user.company,
        companyId: user.company_id,
        daysRemaining,
        isPaid: !!user.isPaid,
        mfaWarning: (user.role === 'admin' || user.role === 'superadmin') && !user.mfa_enabled
      }
    });

  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    await auditLog(req, 'LOGOUT', 'users', req.userId, null, null);
    await db.query('UPDATE users SET session_token = NULL WHERE id = ?', [req.userId]);
    // Clear both auth cookies
    res.clearCookie('auth_token',    { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

// ── Activate account via invite link ─────────────────────────────────────────
const activate = async (req, res) => {
  try {
    const { token: inviteToken, password } = req.body;
    if (!inviteToken || !password) {
      return res.status(400).json({ success: false, error: 'Token and password are required' });
    }

    // 1. Look up the invite token in licenses table (for Admin invitations)
    const [licenseRows] = await db.query(
      `SELECT l.*, u.id as user_id, u.email, u.role FROM licenses l
       LEFT JOIN users u ON u.email = l.invite_email
       WHERE l.invite_token = ? AND l.invite_accepted_at IS NULL`,
      [inviteToken]
    );
    const license = licenseRows[0];

    if (license) {
      if (!enforcePasswordPolicy(password, res)) return;
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user password + link license
      await db.query(
        `UPDATE users SET [password] = ?, mustChangePassword = 0 WHERE email = ?`,
        [hashedPassword, license.invite_email]
      );

      // Get the user's ID after update
      const [uRows] = await db.query('SELECT id FROM users WHERE email = ?', [license.invite_email]);
      const userId = uRows[0]?.id;

      if (userId) {
        const newSignature = generateLicenseSignature({
          license_key: license.license_key,
          admin_user_id: userId,
          license_type: license.license_type,
          max_estimators: license.max_estimators,
          valid_until: license.valid_until,
          is_active: license.is_active
        });

        await db.query(
          `UPDATE licenses SET admin_user_id = ?, invite_accepted_at = GETDATE(), signature = ? WHERE id = ?`,
          [userId, newSignature, license.id]
        );
      }
      return res.json({ success: true, message: 'Account activated. You can now log in.' });
    }

    // 2. Look up the invite token in users table (for Estimator invitations)
    const [userRows] = await db.query(
      'SELECT id, email, otp_expires_at FROM users WHERE otp_code = ?',
      [inviteToken]
    );
    const user = userRows[0];

    if (user) {
      // Check expiry
      if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: 'Activation link has expired.' });
      }

      if (!enforcePasswordPolicy(password, res)) return;
      const hashedPassword = await bcrypt.hash(password, 12);

      await db.query(
        `UPDATE users SET [password] = ?, mustChangePassword = 0, otp_code = NULL, otp_expires_at = NULL WHERE id = ?`,
        [hashedPassword, user.id]
      );

      return res.json({ success: true, message: 'Estimator account activated. You can now log in.' });
    }

    // 3. Fallback: No matching token found
    return res.status(400).json({ success: false, error: 'Invalid or already used activation link' });


  } catch (err) {
    console.error('Activate error:', err);
    res.status(500).json({ success: false, error: 'Activation failed' });
  }
};

// ── Keep existing functions (verify, profile, password reset, etc.) ───────────
const checkTrialStatus = async (req, res) => {
  try {
    const user = req.user;
    const trialEnd = new Date(user.trialEnd);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / 86400000));
    res.json({ success: true, trialStart: user.trialStart, trialEnd, daysRemaining, isActive: now <= trialEnd, isPaid: !!user.isPaid });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check trial status' });
  }
};

const verify = async (req, res) => {
  try {
    const user = req.user;
    const daysRemaining = user.trialEnd
      ? Math.max(0, Math.ceil((new Date(user.trialEnd) - new Date()) / 86400000))
      : 0;
    res.json({ success: true, user: { ...user, daysRemaining } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, region, avatar, company, phone } = req.body;
    await db.query(
      'UPDATE users SET name = ?, bio = ?, region = ?, avatar = ?, company = ?, phone = ? WHERE id = ?',
      [name, bio, region, avatar, company, phone, req.userId]
    );
    const [updated] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const u = updated[0];
    res.json({ success: true, message: 'Profile updated', user: { id: u.id, email: u.email, name: u.name || '', bio: u.bio || '', region: u.region || '', avatar: u.avatar || '', company: u.company, phone: u.phone, role: u.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!enforcePasswordPolicy(newPassword, res)) return;
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.userId]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Current password incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET [password] = ?, mustChangePassword = 0 WHERE id = ?', [hashed, req.userId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Email not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await db.query('UPDATE users SET otp = ?, otpExpires = ? WHERE email = ?', [otp, otpExpires, email.toLowerCase()]);
    const { sendEmail, buildEmailHtml } = require('../services/NotificationService');
    await sendEmail(email.toLowerCase(), 'Reset Your Password - OTP', buildEmailHtml('Password Reset OTP', `<h2 style="color:#10a37f;letter-spacing:5px;text-align:center">${otp}</h2><p>Expires in 5 minutes.</p>`));
    res.json({ success: true, message: 'A 6-digit verification code has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const [rows] = await db.query('SELECT id FROM users WHERE email = ? AND otp = ? AND otpExpires > GETUTCDATE()', [email.toLowerCase(), otp]);
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    res.json({ success: true, message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!enforcePasswordPolicy(newPassword, res)) return;
    const [rows] = await db.query('SELECT id FROM users WHERE email = ? AND otp = ? AND otpExpires > GETUTCDATE()', [email.toLowerCase(), otp]);
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'Link expired. Please start over.' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET [password] = ?, otp = NULL, otpExpires = NULL WHERE id = ?', [hashed, rows[0].id]);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Reset failed' });
  }
};

const sendSignupCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) return res.status(400).json({ success: false, error: 'User already exists' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await db.query('INSERT INTO EmailOtps (Email, OtpCode, ExpiresAt, IsUsed) VALUES (?, ?, ?, 0)', [email.toLowerCase(), otp, expiresAt]);
    const NotificationService = require('../services/NotificationService');
    await NotificationService.sendSignupOTP(email.toLowerCase(), otp);
    res.json({ success: true, message: 'Verification code sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to send code' });
  }
};

const verifySignupCode = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const [rows] = await db.query('SELECT Id FROM EmailOtps WHERE Email = ? AND OtpCode = ? AND ExpiresAt > GETUTCDATE() AND IsUsed = 0', [email.toLowerCase(), otp]);
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'Invalid or expired code.' });
    await db.query('UPDATE EmailOtps SET IsUsed = 1 WHERE Id = ?', [rows[0].Id]);
    res.json({ success: true, message: 'Email verified.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

const registerVerified = async (req, res) => {
  try {
    const { fullName, email, organization, password, phone } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ success: false, error: 'Required fields missing' });
    if (!enforcePasswordPolicy(password, res)) return;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) return res.status(400).json({ success: false, error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    const [rows] = await db.query(
      `INSERT INTO users (full_name, name, email, company, phone, [password], [role], [plan], isPaid, isVerified, trialStart, trialEnd, createdAt)
       OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?, 'estimator', 'trial', 0, 1, ?, ?, GETUTCDATE())`,
      [fullName, fullName, email.toLowerCase(), organization || '', phone || '', hashedPassword, trialStart, trialEnd]
    );
    const userId = rows[0].id;
    const token = generateToken({ id: userId, email: email.toLowerCase(), role: 'estimator', company_id: null, admin_owner_id: null }, null);
    res.status(201).json({ success: true, token, user: { id: userId, email: email.toLowerCase(), fullName, role: 'estimator', trialStart, trialEnd, daysRemaining: 30 } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Signup failed' });
  }
};

// ── Login with MFA (TOTP as primary factor) ───────────────────────────────
const loginWithMfa = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, error: 'Email and MFA code are required' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    if (!user.mfa_enabled || !user.mfa_secret) {
      return res.status(401).json({ success: false, error: 'MFA is not enabled for this account' });
    }

    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 2 // 1 min drift
    });

    if (!verified) {
      return res.status(401).json({ success: false, error: 'Invalid MFA code' });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await db.query(
      `UPDATE users SET session_token = ?, session_at = GETDATE(), lastLogin = GETDATE() WHERE id = ?`,
      [sessionToken, user.id]
    );

    const token = generateToken(user, sessionToken);
    const refreshToken = generateRefreshToken(user.id);
    setAuthCookies(res, token, refreshToken);

    const daysRemaining = user.trialEnd
      ? Math.max(0, Math.ceil((new Date(user.trialEnd) - new Date()) / 86400000))
      : 0;

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.full_name || '',
        role: user.role,
        company: user.company,
        companyId: user.company_id,
        daysRemaining,
        isPaid: !!user.isPaid
      }
    });
  } catch (err) {
    console.error('MFA Direct Login error:', err);
    res.status(500).json({ success: false, error: 'MFA login failed' });
  }
};

module.exports = {
  login,
  loginWithMfa,
  verifyLoginOTP,
  logout,
  activate,
  register: registerVerified,
  checkTrialStatus,
  verify,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  sendSignupCode,
  verifySignupCode,
};