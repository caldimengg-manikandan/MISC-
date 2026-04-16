// server/src/routes/notificationRoutes.js
// In-app notifications: GET, mark-read, mark-all-read

const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// Returns last 50 notifications for the current user (unread first, then read)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT n.*, p.projectName, p.projectNumber
       FROM notifications n
       LEFT JOIN projects p ON n.project_id = p.id
       WHERE n.user_id = ?
       ORDER BY n.is_read ASC, n.createdAt DESC
       OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY`,
      [req.userId]
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    logger.error('notificationRoutes GET / error', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/read', async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/mark-all-read
// Mark all notifications for user as read
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/mark-all-read', async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
