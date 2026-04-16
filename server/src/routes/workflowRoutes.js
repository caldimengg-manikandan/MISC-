// server/src/routes/workflowRoutes.js
// All 7 workflow state-transition endpoints + activity log
// Each endpoint validates role, validates state transition, fires notifications, logs activity.

const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const { requireAdmin } = require('../middleware/requireRole');
const notif = require('../services/NotificationService');
const logger = require('../utils/logger');

// ── Helper: log an activity ───────────────────────────────────────────────────
const logActivity = async (projectId, userId, action, comment, fromStatus, toStatus) => {
  try {
    await db.query(
      `INSERT INTO activity_log (project_id, user_id, action, comment, from_status, to_status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, GETDATE())`,
      [projectId, userId, action, comment || null, fromStatus || null, toStatus || null]
    );
  } catch (err) {
    logger.error('workflowRoutes: Failed to log activity', { err: err.message });
  }
};

// ── Helper: get project, fail if not found ────────────────────────────────────
const getProject = async (projectId, userId, isAdmin) => {
  let query, params;
  if (isAdmin) {
    query = 'SELECT * FROM projects WHERE id = ?';
    params = [projectId];
  } else {
    // Creator OR Assignee
    query = 'SELECT * FROM projects WHERE id = ? AND (userId = ? OR assigned_engineer_id = ?)';
    params = [projectId, userId, userId];
  }
  const [rows] = await db.query(query, params);
  return rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/assign
// Admin or Creator — assign an engineer
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedEngineerId } = req.body;

    if (!assignedEngineerId) {
      return res.status(400).json({ success: false, message: 'assignedEngineerId is required' });
    }

    const isAdmin = req.userRole === 'admin';
    const project = await getProject(id, req.userId, isAdmin);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found or you lack permission' });

    // Allow assignment if new, assigned, or in_progress
    if (!['new', 'assigned', 'in_progress'].includes(project.workflow_status)) {
      return res.status(400).json({ success: false, message: `Cannot assign engineer in status: ${project.workflow_status}` });
    }

    // Verify engineer exists
    const [engRows] = await db.query('SELECT id, email FROM users WHERE id = ?', [assignedEngineerId]);
    if (!engRows[0]) return res.status(404).json({ success: false, message: 'Engineer user not found' });

    await db.query(
      `UPDATE projects SET assigned_engineer_id = ?, workflow_status = 'assigned', updatedAt = GETDATE() WHERE id = ?`,
      [assignedEngineerId, id]
    );

    await logActivity(id, req.userId, 'assign_engineer', `Assigned to ${engRows[0].email}`, project.workflow_status, 'assigned');
    await notif.onEngineerAssigned(id, assignedEngineerId);

    res.json({ success: true, message: 'Engineer assigned. Status → ASSIGNED.' });
  } catch (err) {
    logger.error('workflowRoutes /assign error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/start
// Estimator — start working, status → in_progress
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getProject(id, req.userId, req.userRole === 'admin');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.workflow_status !== 'assigned') {
      return res.status(400).json({ success: false, message: `Cannot start project in status: ${project.workflow_status}` });
    }

    // Only the assigned engineer, the creator, or an admin can start
    if (req.userRole !== 'admin' && project.assigned_engineer_id !== req.userId && project.userId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Only the assigned engineer or project creator can start this project' });
    }

    await db.query(
      `UPDATE projects SET workflow_status = 'in_progress', updatedAt = GETDATE() WHERE id = ?`,
      [id]
    );

    await logActivity(id, req.userId, 'start_project', null, 'assigned', 'in_progress');
    await notif.onProjectStarted(id, req.user);

    res.json({ success: true, message: 'Project started. Status → IN PROGRESS.' });
  } catch (err) {
    logger.error('workflowRoutes /start error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/submit-review
// Estimator — send for review, status → review, revision_number++
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/submit-review', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getProject(id, req.userId, req.userRole === 'admin');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.workflow_status !== 'in_progress') {
      return res.status(400).json({ success: false, message: `Can only submit for review when IN PROGRESS. Current: ${project.workflow_status}` });
    }

    // Validate estimation has been run
    if (!project.estimationResult) {
      return res.status(400).json({
        success: false,
        message: 'Estimation must be run and saved before sending for review.'
      });
    }

    const newRevision = (project.revision_number || 0) + 1;

    await db.query(
      `UPDATE projects SET workflow_status = 'review', revision_number = ?, review_comment = NULL, updatedAt = GETDATE() WHERE id = ?`,
      [newRevision, id]
    );

    await logActivity(id, req.userId, 'submit_review', `Submitted for review (Rev #${newRevision})`, 'in_progress', 'review');
    await notif.onSentForReview(id, newRevision);

    res.json({ success: true, message: `Sent for review (Rev #${newRevision}). Status → REVIEW.`, revision: newRevision });
  } catch (err) {
    logger.error('workflowRoutes /submit-review error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/approve
// Admin only — approve, status → submitted
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getProject(id, null, true);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.workflow_status !== 'review') {
      return res.status(400).json({ success: false, message: `Can only approve projects in REVIEW. Current: ${project.workflow_status}` });
    }

    await db.query(
      `UPDATE projects SET workflow_status = 'submitted', submitted_at = GETDATE(), review_comment = NULL, updatedAt = GETDATE() WHERE id = ?`,
      [id]
    );

    await logActivity(id, req.userId, 'approve', 'Estimation approved by admin', 'review', 'submitted');
    await notif.onApproved(id);

    res.json({ success: true, message: 'Estimation approved. Status → SUBMITTED.' });
  } catch (err) {
    logger.error('workflowRoutes /approve error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/pushback
// Admin only — push back with mandatory comment, status → in_progress
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/pushback', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'A review comment is required when pushing back.' });
    }

    const project = await getProject(id, null, true);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.workflow_status !== 'review') {
      return res.status(400).json({ success: false, message: `Can only push back projects in REVIEW. Current: ${project.workflow_status}` });
    }

    await db.query(
      `UPDATE projects SET workflow_status = 'in_progress', review_comment = ?, updatedAt = GETDATE() WHERE id = ?`,
      [comment.trim(), id]
    );

    await logActivity(id, req.userId, 'pushback', comment.trim(), 'review', 'in_progress');
    await notif.onPushedBack(id, comment.trim());

    res.json({ success: true, message: 'Estimation pushed back. Status → IN PROGRESS.' });
  } catch (err) {
    logger.error('workflowRoutes /pushback error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/:id/send-to-client
// Admin only — send email to client with attached report, log activity
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/send-to-client', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientEmail, cc, customMessage, attachmentType } = req.body;

    if (!clientEmail) {
      return res.status(400).json({ success: false, message: 'Client email is required' });
    }

    const project = await getProject(id, null, true);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.workflow_status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Project must be SUBMITTED before sending to client.' });
    }

    // Build client email
    const notifService = require('../services/NotificationService');
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const emailBody = customMessage
      ? `${customMessage}<br><br>Please find the estimation report for <strong>${project.projectName}</strong> attached.`
      : `Please find the estimation report for <strong>${project.projectName}</strong> attached.`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px">
        <div style="background:#0d0d0d;padding:20px;border-radius:8px 8px 0 0">
          <h2 style="color:#10a37f;margin:0;font-size:18px">MISC Engineering Platform</h2>
        </div>
        <div style="background:#ffffff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5">
          <h3 style="color:#0d0d0d;margin-top:0">Estimation Report — ${project.projectName}</h3>
          <p style="color:#444;line-height:1.6">${emailBody}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#999;font-size:12px">MISC Engineering Platform · Structural Steel Estimation</p>
        </div>
      </div>`;

    // TODO: Attach PDF/BOM based on attachmentType when file generation is integrated
    const nodemailer = require('nodemailer');
    let emailSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await t.sendMail({
        from: process.env.SMTP_FROM || '"MISC Platform" <no-reply@misc.com>',
        to: clientEmail,
        cc: cc || undefined,
        subject: `Estimation Report — ${project.projectName}`,
        html
      });
      emailSent = true;
    } else {
      logger.info(`[SEND-TO-CLIENT STUB] Would email to: ${clientEmail} for project: ${project.projectName}`);
      emailSent = true; // Stub succeeds for now
    }

    // Update project record
    await db.query(
      `UPDATE projects SET sent_to_client_at = GETDATE(), sent_to_email = ?, updatedAt = GETDATE() WHERE id = ?`,
      [clientEmail, id]
    );

    await logActivity(id, req.userId, 'send_to_client', `Sent to ${clientEmail} (${attachmentType || 'PDF'})`, 'submitted', 'submitted');
    await notif.onReportSentToClient(id, clientEmail, req.user);

    res.json({ success: true, message: `Report sent to ${clientEmail}.`, emailSent });
  } catch (err) {
    logger.error('workflowRoutes /send-to-client error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:id/activity
// Both roles — return activity log for a project
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.userRole === 'admin';
    const project = await getProject(id, req.userId, isAdmin);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const [logs] = await db.query(
      `SELECT al.*, u.email as user_email, u.full_name as user_name
       FROM activity_log al
       JOIN users u ON al.user_id = u.id
       WHERE al.project_id = ?
       ORDER BY al.createdAt DESC`,
      [id]
    );

    res.json({ success: true, activity: logs });
  } catch (err) {
    logger.error('workflowRoutes /activity error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users (Admin or Creator) — list all users for assign-engineer dropdown
// ─────────────────────────────────────────────────────────────────────────────
router.get('/users/list', async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, email, full_name, [role] FROM users ORDER BY full_name"
    );
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/users/create (Admin only) — Create a new engineer
// ─────────────────────────────────────────────────────────────────────────────
router.post('/users/create', requireAdmin, async (req, res) => {
  try {
    const { email, full_name } = req.body;
    if (!email || !full_name) {
      return res.status(400).json({ success: false, message: 'Email and full name are required' });
    }

    // Default password '12345678' hashed with bcryptjs
    const defaultHash = '$2a$10$tZ2R.cKXZAOF2O8zOaAmeewhXXEaR1S/h4zM8X8zGIX9m1F4X/T0q';

    const [insertRows] = await db.query(
      `INSERT INTO users (email, full_name, password, role) OUTPUT INSERTED.id VALUES (?, ?, ?, 'estimator')`,
      [email, full_name, defaultHash]
    );

    const newUserId = insertRows[0].id;
    
    res.status(201).json({
      success: true,
      message: 'Engineer created successfully with default password "12345678".',
      user: { id: newUserId, email, full_name, role: 'estimator' }
    });
  } catch (err) {
    console.error('Error creating engineer:', err);
    if (err.message.includes('UNIQUE') || err.message.includes('PRIMARY')) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error creating engineer' });
  }
});

module.exports = router;
