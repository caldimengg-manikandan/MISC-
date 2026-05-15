// server/src/routes/adminUserRoutes.js
// Admin manages their own estimators. Scoped strictly to admin's own users.
// C9: Estimators get invite email, never a plaintext password.
// C8: Force-logout is scoped to own estimators only.

const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/requireRole');
const EmailService = require('../services/EmailService');

router.use(requireAdmin);

// ── GET /api/admin/users — list own estimators ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [estimators] = await db.query(`
      SELECT id, email, name, full_name, phone, role, subscriptionStatus, lastLogin, session_at, mustChangePassword
      FROM users
      WHERE admin_owner_id = ? AND role = 'estimator'
      ORDER BY email ASC
    `, [req.userId]);

    // Get license info for slot count
    const [licenseRows] = await db.query(
      `SELECT max_estimators, valid_until, is_active FROM licenses WHERE admin_user_id = ?`,
      [req.userId]
    );
    const license = licenseRows[0] || null;
    const activeCount = estimators.filter(e => e.subscriptionStatus === 'active').length;

    res.json({
      success: true,
      estimators,
      license: license ? {
        maxEstimators: license.max_estimators,
        validUntil: license.valid_until,
        isActive: !!license.is_active,
        usedSlots: activeCount,
        availableSlots: Math.max(0, license.max_estimators - activeCount)
      } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/admin/users — create estimator (C9: invite email flow) ──────────
router.post('/', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    // ── License slot check (I5: active users only) ──
    const [licenseRows] = await db.query(
      `SELECT max_estimators, valid_until, is_active FROM licenses WHERE admin_user_id = ? AND is_active = 1`,
      [req.userId]
    );
    const license = licenseRows[0];
    if (!license) {
      return res.status(403).json({ success: false, error: 'No active license found. Cannot create estimators.' });
    }
    if (new Date(license.valid_until) < new Date()) {
      return res.status(403).json({ success: false, error: 'License expired. Cannot create estimators.' });
    }

    const [countRows] = await db.query(
      `SELECT COUNT(*) as n FROM users
       WHERE admin_owner_id = ? AND role = 'estimator' AND subscriptionStatus = 'active'`,
      [req.userId]
    );
    if (countRows[0].n >= license.max_estimators) {
      return res.status(400).json({
        success: false,
        error: `License limit reached. You can have a maximum of ${license.max_estimators} active estimators.`
      });
    }

    // ── Check duplicate ──
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    // ── Create estimator account (C9: random password, mustChangePassword = 1) ──
    const tempPw = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
    const inviteToken = crypto.randomBytes(48).toString('hex');
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [inserted] = await db.query(
      `INSERT INTO users (email, [password], name, [role], admin_owner_id, isPaid, subscriptionStatus, mustChangePassword, otp_attempts, createdAt)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, 'estimator', ?, 1, 'active', 1, 0, GETDATE())`,
      [email.toLowerCase(), tempPw, name || '', req.userId]
    );

    const newUserId = inserted[0].id;

    // Store invite token temporarily (reuse otp_code column)
    await db.query(
      'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
      [inviteToken, inviteExpiry, newUserId]
    );

    // ── Send invite email (C9: estimator gets same invite email as admin) ──
    const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate?token=${inviteToken}&type=estimator`;

    // Get admin's license type
    const [adminLicRows] = await db.query('SELECT license_type, max_estimators FROM licenses WHERE admin_user_id = ?', [req.userId]);
    const lt = adminLicRows[0]?.license_type || 'standard';

    await EmailService.sendAdminInvite(email, activationLink, lt, 1, name || '');

    res.status(201).json({
      success: true,
      userId: newUserId,
      message: `Estimator account created. Invite email sent to ${email}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/admin/users/:id/force-logout ───────────────────────────────────
// C8: Scoped to own estimators only — cannot affect other admins' users
router.patch('/:id/force-logout', async (req, res) => {
  try {
    const { id } = req.params;

    // C8: Verify this user belongs to this admin AND is an estimator
    const result = await db.query(
      `UPDATE users SET session_token = NULL
       WHERE id = ? AND admin_owner_id = ? AND role = 'estimator'`,
      [id, req.userId]
    );

    if (result[0]?.rowsAffected?.[0] === 0) {
      return res.status(403).json({ success: false, error: 'User not found or not your estimator.' });
    }

    res.json({ success: true, message: 'Estimator session invalidated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/admin/users/:id/deactivate ────────────────────────────────────
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `UPDATE users SET subscriptionStatus = 'inactive', session_token = NULL
       WHERE id = ? AND admin_owner_id = ? AND role = 'estimator'`,
      [id, req.userId]
    );
    res.json({ success: true, message: 'Estimator deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
