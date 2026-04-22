// server/src/services/NotificationService.js
// Handles all in-app and email notifications per the workflow spec
// All 11 notification triggers are implemented here.

const db = require('../config/mssql');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ── Email transport ───────────────────────────────────────────────────────────
// Credentials are set via .env when ready. Falls back to console logging.
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info('NotificationService: SMTP transporter initialized.');
  } else {
    logger.warn('NotificationService: SMTP not configured. Emails will be logged to console.');
  }
  return transporter;
};

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Insert a notification record into the database.
 */
const createNotification = async (userId, projectId, type, message) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, project_id, type, message, is_read, createdAt) VALUES (?, ?, ?, ?, 0, GETDATE())',
      [userId, projectId || null, type, message]
    );
  } catch (err) {
    logger.error('NotificationService: Failed to create notification', { err: err.message, userId, type });
  }
};

/**
 * Send an email notification. Falls back gracefully if SMTP not configured.
 */
const sendEmail = async (to, subject, html) => {
  const t = getTransporter();
  if (!t) {
    logger.info(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || '"MISC Platform" <no-reply@misc.com>',
      to,
      subject,
      html,
    });
    logger.info(`NotificationService: Email sent to ${to} — ${subject}`);
  } catch (err) {
    logger.error('NotificationService: Email send failed', { err: err.message, to });
  }
};

/**
 * Build a standard HTML email body.
 */
const buildEmailHtml = (title, body, projectName = '', actionUrl = '') => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px">
    <div style="background:#0d0d0d;padding:20px;border-radius:8px 8px 0 0;margin-bottom:0">
      <h2 style="color:#10a37f;margin:0;font-size:18px">MISC Engineering Platform</h2>
    </div>
    <div style="background:#ffffff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5">
      <h3 style="color:#0d0d0d;margin-top:0">${title}</h3>
      <p style="color:#444;line-height:1.6">${body}</p>
      ${projectName ? `<p style="color:#666;font-size:13px"><strong>Project:</strong> ${projectName}</p>` : ''}
      ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#10a37f;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Open in MISC Platform</a>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">This is an automated notification from MISC Engineering Platform. Do not reply to this email.</p>
    </div>
  </div>
`;

/**
 * Get all admin users from the DB.
 */
const getAdmins = async () => {
  const [rows] = await db.query("SELECT id, email, full_name FROM users WHERE [role] = 'admin'");
  return rows;
};

/**
 * Get the assigned estimator for a project.
 */
const getAssignedEstimator = async (projectId) => {
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.full_name 
     FROM users u
     JOIN projects p ON p.assigned_engineer_id = u.id
     WHERE p.id = ?`,
    [projectId]
  );
  return rows[0] || null;
};

/**
 * Get project info.
 */
const getProject = async (projectId) => {
  const [rows] = await db.query('SELECT id, projectName, projectNumber FROM projects WHERE id = ?', [projectId]);
  return rows[0] || { projectName: 'Unknown Project', projectNumber: '' };
};

const appUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Notification Triggers (all 11 from spec) ─────────────────────────────────

/**
 * Trigger 1: New project created → notify all Admins (in-app + email)
 */
const onProjectCreated = async (projectId, createdByUser) => {
  const project = await getProject(projectId);
  const admins = await getAdmins();
  const message = `New estimation #${project.projectNumber || projectId} "${project.projectName}" created by ${createdByUser.email}`;
  for (const admin of admins) {
    await createNotification(admin.id, projectId, 'project_created', message);
    await sendEmail(
      admin.email,
      `New Project: ${project.projectName}`,
      buildEmailHtml('New Estimation Created', message, project.projectName, `${appUrl()}/estimations`)
    );
  }
};

/**
 * Trigger 2: Engineer assigned → notify Estimator (in-app + email)
 */
const onEngineerAssigned = async (projectId, assignedUserId) => {
  const project = await getProject(projectId);
  const [userRows] = await db.query('SELECT id, email, full_name FROM users WHERE id = ?', [assignedUserId]);
  const estimator = userRows[0];
  if (!estimator) return;
  const message = `You have been assigned to "${project.projectName}"`;
  await createNotification(estimator.id, projectId, 'engineer_assigned', message);
  await sendEmail(
    estimator.email,
    `Assigned: ${project.projectName}`,
    buildEmailHtml('Project Assigned to You', message, project.projectName, `${appUrl()}/estimations`)
  );
};

/**
 * Trigger 3: Estimator starts project → notify Admins (in-app only)
 */
const onProjectStarted = async (projectId, estimatorUser) => {
  const project = await getProject(projectId);
  const admins = await getAdmins();
  const message = `${estimatorUser.email} has started "${project.projectName}"`;
  for (const admin of admins) {
    await createNotification(admin.id, projectId, 'project_started', message);
    // No email per spec (in-app only)
  }
};

/**
 * Trigger 4: Sent for review → notify specific Reviewer (in-app + email)
 */
const onSentForReview = async (projectId, revisionNumber, reviewerEmail) => {
  const project = await getProject(projectId);
  
  if (reviewerEmail) {
    const [userRows] = await db.query('SELECT id, email, full_name FROM users WHERE email = ?', [reviewerEmail]);
    const reviewer = userRows[0];
    
    if (reviewer) {
      const message = `"${project.projectName}" is ready for your review (Rev #${revisionNumber})`;
      await createNotification(reviewer.id, projectId, 'sent_for_review', message);
      await sendEmail(
        reviewer.email,
        `Review Ready: ${project.projectName} (Rev #${revisionNumber})`,
        buildEmailHtml('Estimation Ready for Review', message, project.projectName, `${appUrl()}/estimations`)
      );
    }
  } else {
    logger.warn('No reviewer_email provided to onSentForReview. Skipping notifications.');
  }
};

/**
 * Trigger 5: Pushed back → notify Estimator (in-app + email)
 */
const onPushedBack = async (projectId, adminComment) => {
  const project = await getProject(projectId);
  const estimator = await getAssignedEstimator(projectId);
  if (!estimator) return;
  const message = `"${project.projectName}" needs revision — ${adminComment}`;
  
  await createNotification(estimator.id, projectId, 'pushed_back', message);
  
  const emailBody = `
    <strong>Your estimation requires revision.</strong><br><br>
    <strong>Reviewer notes:</strong><br>
    <div style="padding:10px; border-left: 3px solid #f59e0b; background: #fffcf5; margin: 10px 0; color: #555;">
      ${adminComment}
    </div>
  `;
  
  await sendEmail(
    estimator.email,
    `Revision Required: ${project.projectName}`,
    buildEmailHtml('Your Estimation Needs Revision', emailBody, project.projectName, `${appUrl()}/estimations`)
  );
};

/**
 * Trigger 6: Approved → notify Estimator (in-app + email)
 */
const onApproved = async (projectId) => {
  const project = await getProject(projectId);
  const estimator = await getAssignedEstimator(projectId);
  if (!estimator) return;
  const message = `"${project.projectName}" has been approved by admin`;
  await createNotification(estimator.id, projectId, 'approved', message);
  await sendEmail(
    estimator.email,
    `Approved: ${project.projectName}`,
    buildEmailHtml('Estimation Approved', message, project.projectName, `${appUrl()}/estimations`)
  );
};

/**
 * Trigger 7: Report sent to client → notify Estimator (in-app only)
 * Trigger 8: Report sent to client → notify Admin (in-app + email confirmation)
 */
const onReportSentToClient = async (projectId, clientEmail, adminUser) => {
  const project = await getProject(projectId);
  const estimator = await getAssignedEstimator(projectId);
  const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  // Notify estimator (in-app only)
  if (estimator) {
    const estMsg = `Report for "${project.projectName}" sent to ${clientEmail}`;
    await createNotification(estimator.id, projectId, 'report_sent', estMsg);
  }

  // Notify admin (in-app + email confirmation)
  const adminMsg = `Confirmation: report sent to ${clientEmail} at ${time}`;
  await createNotification(adminUser.id, projectId, 'report_sent_confirm', adminMsg);
  await sendEmail(
    adminUser.email,
    `Report Sent: ${project.projectName}`,
    buildEmailHtml('Report Sent to Client', adminMsg, project.projectName)
  );
};

/**
 * Trigger 9 & 10: Deadline approaching (3 days) → notify Estimator (in-app + email)
 * Trigger 11: Deadline approaching (3 days) → notify Admin (in-app only)
 * Called from cron job.
 */
const onDeadlineApproaching = async (project, daysLeft) => {
  const isUrgent = daysLeft <= 1;
  const deadline = new Date(project.submissionDeadline).toLocaleDateString('en-US');

  const estimator = await getAssignedEstimator(project.id);

  // Notify estimator
  if (estimator) {
    const msg = isUrgent
      ? `URGENT: "${project.projectName}" deadline is tomorrow`
      : `"${project.projectName}" deadline in 3 days — ${deadline}`;
    await createNotification(estimator.id, project.id, isUrgent ? 'deadline_urgent' : 'deadline_warning', msg);
    await sendEmail(
      estimator.email,
      isUrgent ? `URGENT: Deadline Tomorrow — ${project.projectName}` : `Deadline Approaching: ${project.projectName}`,
      buildEmailHtml(
        isUrgent ? 'Deadline is Tomorrow!' : 'Deadline Approaching',
        msg,
        project.projectName,
        `${appUrl()}/estimations`
      )
    );
  }

  // Notify admin (in-app only, only for 3-day warning not urgent)
  if (!isUrgent) {
    const admins = await getAdmins();
    const adminMsg = `"${project.projectName}" deadline approaching — ${deadline}`;
    for (const admin of admins) {
      await createNotification(admin.id, project.id, 'deadline_warning_admin', adminMsg);
    }
  }
};

/**
 * Trigger 12: Signup OTP → notify User (email only)
 */
const sendSignupOTP = async (email, otp) => {
  const subject = 'Verify your email';
  const html = buildEmailHtml(
    'Verify your email',
    `Your OTP code is <h2 style="color:#10a37f;letter-spacing:5px;text-align:center">${otp}</h2><p>This code will expire in 5 minutes.</p>`
  );
  await sendEmail(email, subject, html);
};

/**
 * Trigger 13: Welcome Email → notify User (email only)
 */
const sendWelcomeEmail = async (fullName, email) => {
  const subject = 'Welcome to Calmisc 🎉';
  const body = `
    Dear ${fullName},<br/><br/>
    We’re pleased to inform you that your account has been successfully created.<br/><br/>
    Thank you for choosing Calmisc. We’re excited to have you on board and look forward to supporting your journey.<br/><br/>
    If you have any questions or need assistance, feel free to reach out -> <a href="mailto:salesandsupport@caldimengg.com">salesandsupport@caldimengg.com</a>.<br/><br/>
    Warm regards,<br/>
    Caldim Team
  `;
  const html = buildEmailHtml('Welcome to Calmisc', body);
  await sendEmail(email, subject, html);
};

/**
 * Trigger 14: Security Alert -> notify Admin (email only)
 */
const onSecurityAlert = async (companyId, userId, exceedCount) => {
  // get company admins
  const [admins] = await db.query(
    "SELECT id, email, full_name FROM users WHERE role = 'admin' AND company_id = ?",
    [companyId]
  );
  
  const [userRow] = await db.query(
    "SELECT email FROM users WHERE id = ?", [userId]
  );
  const userEmail = userRow && userRow.length > 0 ? userRow[0].email : `User ${userId}`;

  for (const admin of admins) {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const msg = `SECURITY ALERT: User ${userEmail} triggered ${exceedCount} security blocks in the last 24 hours.`;
    await createNotification(admin.id, null, 'security_alert', msg);
    await sendEmail(
      admin.email,
      'URGENT: Security Policy Violation',
      buildEmailHtml('Security Policy Violation', msg)
    );
  }
};

module.exports = {
  createNotification,
  sendEmail,
  buildEmailHtml,
  sendWelcomeEmail,
  sendSignupOTP,
  onProjectCreated,
  onEngineerAssigned,
  onProjectStarted,
  onSentForReview,
  onPushedBack,
  onApproved,
  onReportSentToClient,
  onDeadlineApproaching,
  onSecurityAlert,
};
