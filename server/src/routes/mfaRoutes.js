// server/src/routes/mfaRoutes.js
const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../config/mssql');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// ── GET /api/v1/auth/mfa/setup ──────────────────────────────────────────────
// Generates a TOTP secret and returns a QR code data URL.
router.get('/setup', authMiddleware, async (req, res) => {
  try {
    const [userRows] = await db.query('SELECT email, mfa_enabled FROM users WHERE id = ?', [req.userId]);
    const user = userRows[0];

    if (user.mfa_enabled) {
      return res.status(400).json({ success: false, error: 'MFA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `CALMISC (${user.email})`,
      issuer: 'CALMISC'
    });

    // Store the secret temporarily (or in a dedicated field)
    // For now, we'll store it in mfa_secret but it won't be "enabled" yet.
    await db.query('UPDATE users SET mfa_secret = ? WHERE id = ?', [secret.base32, req.userId]);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ success: true, qrCodeUrl, secret: secret.base32 });
  } catch (err) {
    console.error('MFA Setup error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate MFA setup' });
  }
});

// ── POST /api/v1/auth/mfa/disable ────────────────────────────────────────────
// Disables MFA for the authenticated user.
router.post('/disable', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'MFA code is required to disable' });

    const [userRows] = await db.query('SELECT mfa_secret, mfa_enabled FROM users WHERE id = ?', [req.userId]);
    const user = userRows[0];

    if (!user.mfa_enabled) {
      return res.status(400).json({ success: false, error: 'MFA is not enabled' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 2 // Slight drift allowance
    });

    if (verified) {
      await db.query('UPDATE users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?', [req.userId]);
      const [updated] = await db.query('SELECT id, email, role, mfa_enabled FROM users WHERE id = ?', [req.userId]);
      res.json({
        success: true,
        message: 'MFA disabled successfully',
        user: updated[0]
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid MFA code' });
    }
  } catch (err) {
    console.error('MFA Disable error:', err);
    res.status(500).json({ success: false, error: 'Failed to disable MFA' });
  }
});

// ── POST /api/v1/auth/mfa/verify ─────────────────────────────────────────────
// Validates the first TOTP code and enables MFA.
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

    const [userRows] = await db.query('SELECT mfa_secret FROM users WHERE id = ?', [req.userId]);
    const user = userRows[0];

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      await db.query('UPDATE users SET mfa_enabled = 1 WHERE id = ?', [req.userId]);
      const [updated] = await db.query('SELECT id, email, role, mfa_enabled FROM users WHERE id = ?', [req.userId]);
      res.json({
        success: true,
        message: 'MFA enabled successfully',
        user: updated[0]
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid MFA token' });
    }
  } catch (err) {
    console.error('MFA Verify error:', err);
    res.status(500).json({ success: false, error: 'Failed to verify MFA token' });
  }
});

// ── POST /api/v1/auth/mfa/login ──────────────────────────────────────────────
// Step 2 of login: Exchange temp token + TOTP code for full access.
router.post('/login', async (req, res) => {
  try {
    const { mfaToken, token: totpCode } = req.body;
    if (!mfaToken || !totpCode) return res.status(400).json({ success: false, error: 'MFA token and code required' });

    // Verify the temporary MFA token
    let decoded;
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired MFA session' });
    }

    if (decoded.type !== 'mfa_pending') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    const user = userRows[0];

    const logger = require('../utils/logger');
    logger.debug(`DEBUG MFA: Verifying for user ${user.id}, email ${user.email}`);
    logger.debug(`DEBUG MFA: Token provided: ${totpCode}, Secret length: ${user.mfa_secret?.length}`);

    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: totpCode,
      window: 10 // Allow 5 mins drift (temporary fix for server clock drift)
    });

    logger.debug(`DEBUG MFA: Verification result: ${verified}`);

    if (verified) {
      // Create full session
      const authToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          email: user.email,
          companyId: user.company_id
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.cookie('auth_token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        token: authToken,
        user: { id: user.id, email: user.email, role: user.role, name: user.name }
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid MFA code' });
    }
  } catch (err) {
    console.error('MFA Login error:', err);
    res.status(500).json({ success: false, error: 'MFA login failed' });
  }
});

module.exports = router;
