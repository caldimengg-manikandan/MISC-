// server/src/routes/superadminRoutes.js
// All endpoints require: authMiddleware + requireSuperAdmin
// All mutations are logged to superadmin_activity_log

const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { requireSuperAdmin } = require('../middleware/requireRole');
const EmailService = require('../services/EmailService');
const { generateLicenseSignature } = require('../utils/cryptoUtils');

router.use(requireSuperAdmin);

// Helper: log superadmin actions
async function logAction(actorId, action, targetId = null, targetType = null, detail = null) {
  try {
    await db.query(
      `INSERT INTO superadmin_activity_log (actor_id, action, target_id, target_type, detail, created_at)
       VALUES (?, ?, ?, ?, ?, GETDATE())`,
      [actorId, action, targetId, targetType, detail ? JSON.stringify(detail) : null]
    );
  } catch (e) {
    console.error('Activity log error:', e.message);
  }
}

// ── GET /api/superadmin/dashboard ─────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM licenses WHERE is_active = 1 AND valid_until >= CAST(GETDATE() AS DATE)) as active_licenses,
        (SELECT COUNT(*) FROM licenses WHERE is_active = 0 OR valid_until < CAST(GETDATE() AS DATE)) as expired_licenses,
        (SELECT COUNT(*) FROM licenses WHERE is_active = 1 AND valid_until BETWEEN CAST(GETDATE() AS DATE) AND DATEADD(day, 30, CAST(GETDATE() AS DATE))) as expiring_soon,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM users WHERE role = 'estimator' AND subscriptionStatus = 'active') as total_estimators,
        (SELECT COUNT(*) FROM superadmin_activity_log WHERE created_at >= DATEADD(day, -7, GETDATE())) as activity_last_7d
    `);

    const [recentActivity] = await db.query(`
      SELECT TOP 20 al.*, u.email as actor_email
      FROM superadmin_activity_log al
      JOIN users u ON al.actor_id = u.id
      ORDER BY al.created_at DESC
    `);

    res.json({ success: true, metrics: stats[0], recentActivity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/superadmin/licenses ──────────────────────────────────────────────
router.get('/licenses', async (req, res) => {
  try {
    const [licenses] = await db.query(`
      SELECT l.*,
        u.email as admin_email, u.name as admin_name, u.company as admin_company,
        (SELECT COUNT(*) FROM users e WHERE e.admin_owner_id = l.admin_user_id AND e.role = 'estimator' AND e.subscriptionStatus = 'active') as estimators_used
      FROM licenses l
      LEFT JOIN users u ON l.admin_user_id = u.id
      ORDER BY l.created_at DESC
    `);
    res.json({ success: true, licenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/superadmin/licenses — Create + invite ───────────────────────────
router.post('/licenses', async (req, res) => {
  try {
    const { adminEmail, licenseType = 'standard', maxEstimators = 3, validFrom, validUntil, notes } = req.body;
    if (!adminEmail || !validFrom || !validUntil) {
      return res.status(400).json({ success: false, error: 'adminEmail, validFrom, validUntil are required' });
    }

    // Check if user exists or create a pending user
    let [uRows] = await db.query('SELECT id, email FROM users WHERE email = ?', [adminEmail.toLowerCase()]);
    if (uRows.length === 0) {
      // Create pending admin account (mustChangePassword = 1)
      const pwHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
      const [inserted] = await db.query(
        `INSERT INTO users (email, [password], [role], isPaid, subscriptionStatus, mustChangePassword, createdAt)
         OUTPUT INSERTED.id VALUES (?, ?, 'admin', 1, 'active', 1, GETDATE())`,
        [adminEmail.toLowerCase(), pwHash]
      );
      uRows = [{ id: inserted[0].id }];
    }

    const licenseKey = crypto.randomUUID().replace(/-/g, '').toUpperCase();
    const inviteToken = crypto.randomBytes(48).toString('hex');

    const signature = generateLicenseSignature({
      license_key: licenseKey,
      admin_user_id: null,
      license_type: licenseType,
      max_estimators: maxEstimators,
      valid_until: validUntil,
      is_active: 1
    });

    const [result] = await db.query(
      `INSERT INTO licenses (license_key, license_type, max_estimators, valid_from, valid_until, is_active, created_by, notes, invite_token, invite_email, invite_sent_at, signature)
       OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, GETDATE(), ?)`,
      [licenseKey, licenseType, maxEstimators, validFrom, validUntil, req.userId, notes || null, inviteToken, adminEmail.toLowerCase(), signature]
    );

    const licenseId = result[0].id;
    const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate?token=${inviteToken}`;

    await EmailService.sendAdminInvite(adminEmail, activationLink, licenseType, maxEstimators);
    await logAction(req.userId, 'CREATE_LICENSE', licenseId, 'license', { adminEmail, licenseType, maxEstimators });

    res.status(201).json({ success: true, licenseId, licenseKey, message: 'License created and invite sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/superadmin/licenses/:id ────────────────────────────────────────
router.patch('/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, validUntil, maxEstimators, notes } = req.body;

    const [existing] = await db.query('SELECT * FROM licenses WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, error: 'License not found' });
    const current = existing[0];

    const sets = [];
    const params = [];
    
    const newIsActive = isActive !== undefined ? (isActive ? 1 : 0) : current.is_active;
    const newValidUntil = validUntil || current.valid_until;
    const newMaxEstimators = maxEstimators !== undefined ? maxEstimators : current.max_estimators;

    if (isActive !== undefined)    { sets.push('is_active = ?');      params.push(newIsActive); }
    if (validUntil)                { sets.push('valid_until = ?');    params.push(newValidUntil); }
    if (maxEstimators !== undefined){ sets.push('max_estimators = ?'); params.push(newMaxEstimators); }
    if (notes !== undefined)       { sets.push('notes = ?');          params.push(notes); }

    if (!sets.length) return res.status(400).json({ success: false, error: 'Nothing to update' });

    const newSignature = generateLicenseSignature({
      license_key: current.license_key,
      admin_user_id: current.admin_user_id,
      license_type: current.license_type,
      max_estimators: newMaxEstimators,
      valid_until: newValidUntil,
      is_active: newIsActive
    });
    
    sets.push('signature = ?');
    params.push(newSignature);

    params.push(id);
    await db.query(`UPDATE licenses SET ${sets.join(', ')} WHERE id = ?`, params);
    await logAction(req.userId, 'UPDATE_LICENSE', id, 'license', req.body);

    res.json({ success: true, message: 'License updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/superadmin/users ─────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.email, u.name, u.full_name, u.company, u.role,
             u.subscriptionStatus, u.lastLogin, u.session_at, u.mustChangePassword,
             l.license_type, l.valid_until, l.is_active as license_active,
             (SELECT COUNT(*) FROM users e WHERE e.admin_owner_id = u.id AND e.role = 'estimator') as estimator_count
      FROM users u
      LEFT JOIN licenses l ON l.admin_user_id = u.id
      WHERE u.role IN ('admin','superadmin','estimator')
      ORDER BY u.role, u.email
    `);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/superadmin/users/:id/role ─────────────────────────────────────
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['superadmin', 'admin', 'estimator'];
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, error: 'Invalid role' });

    const [prev] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (!prev[0]) return res.status(404).json({ success: false, error: 'User not found' });

    await db.query('UPDATE users SET [role] = ? WHERE id = ?', [role, id]);
    await logAction(req.userId, 'CHANGE_ROLE', id, 'user', { from: prev[0].role, to: role });

    res.json({ success: true, message: `Role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/superadmin/users/:id/deactivate ───────────────────────────────
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `UPDATE users SET subscriptionStatus = 'inactive', session_token = NULL WHERE id = ?`,
      [id]
    );
    await logAction(req.userId, 'DEACTIVATE_USER', id, 'user');
    res.json({ success: true, message: 'User deactivated and session invalidated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/superadmin/users/:id/force-logout ─────────────────────────────
router.patch('/users/:id/force-logout', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE users SET session_token = NULL WHERE id = ?', [id]);
    await logAction(req.userId, 'FORCE_LOGOUT', id, 'user');
    res.json({ success: true, message: 'User session invalidated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/superadmin/users/:id/reset-password ────────────────────────────
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const [uRows] = await db.query('SELECT email FROM users WHERE id = ?', [id]);
    if (!uRows[0]) return res.status(404).json({ success: false, error: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    // Store token temporarily in otp_code for simplicity
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await db.query('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?', [resetToken, expires, id]);
    await EmailService.sendPasswordReset(uRows[0].email, resetLink);
    await logAction(req.userId, 'RESET_PASSWORD_EMAIL', id, 'user');
    res.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/superadmin/logs ──────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT al.*, u.email as actor_email,
             CASE 
               WHEN al.target_type = 'user' THEN (SELECT email FROM users WHERE id = al.target_id)
               WHEN al.target_type = 'license' THEN (SELECT license_key FROM licenses WHERE id = al.target_id)
             END as target_name
      FROM superadmin_activity_log al
      JOIN users u ON al.actor_id = u.id
      ORDER BY al.created_at DESC
    `);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

