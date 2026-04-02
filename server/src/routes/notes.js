const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const auth = require('../middleware/auth');

const tryParseJson = (val) => {
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
};

// Get all notes for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    // Fetch general notes + personal notes belonging to this user (ACTIVE ONLY)
    const [notes] = await db.query(
      `SELECT * FROM project_notes 
       WHERE projectId = ? AND is_deleted = 0 
       AND (note_type = 'general' OR (note_type = 'personal' AND userId = ?))
       ORDER BY createdAt ASC`,
      [projectId, userId]
    );

    const parsedNotes = notes.map(n => ({
      ...n,
      mentions: tryParseJson(n.mentions) || []
    }));

    res.json({ success: true, notes: parsedNotes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new note
router.post('/', auth, async (req, res) => {
  try {
    const { projectId, title, content, note_type, pos_x, pos_y, color, mentions, context_type, context_id } = req.body;
    const userId = req.userId;

    const [result] = await db.query(
      `INSERT INTO project_notes (projectId, userId, title, content, note_type, pos_x, pos_y, color, mentions, context_type, context_id)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, userId, title || '', content || '', note_type || 'personal',
        pos_x || 100, pos_y || 100, color || '#e0f7fa', JSON.stringify(mentions || []),
        context_type || 'global', context_id || null
      ]
    );

    const newId = result[0].id;
    const [newNote] = await db.query('SELECT * FROM project_notes WHERE id = ?', [newId]);

    res.json({
      success: true,
      note: {
        ...newNote[0],
        mentions: tryParseJson(newNote[0].mentions)
      }
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update note content/type
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, note_type, color, mentions } = req.body;
    const userId = req.userId;

    // Verify ownership
    const [existing] = await db.query('SELECT userId FROM project_notes WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Note not found' });
    if (existing[0].userId !== userId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    await db.query(
      `UPDATE project_notes SET title = ?, content = ?, note_type = ?, color = ?, mentions = ?, updatedAt = GETDATE()
       WHERE id = ?`,
      [title, content, note_type, color, JSON.stringify(mentions || []), id]
    );

    res.json({ success: true, message: 'Note updated' });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update note position (Efficient for dragging)
router.patch('/:id/position', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { pos_x, pos_y } = req.body;
    const userId = req.userId;

    // Verify ownership
    const [existing] = await db.query('SELECT userId FROM project_notes WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Note not found' });
    if (existing[0].userId !== userId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    await db.query(
      `UPDATE project_notes SET pos_x = ?, pos_y = ?, updatedAt = GETDATE() WHERE id = ?`,
      [pos_x, pos_y, id]
    );

    res.json({ success: true, message: 'Position updated' });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get trash for a project (Deleted items within 7 days)
router.get('/trash/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    // 1. AUTO-PURGE: Hard delete notes older than 7 days
    await db.query(
      `DELETE FROM project_notes 
       WHERE is_deleted = 1 AND deleted_at < DATEADD(day, -7, GETDATE())`
    );

    // 2. Fetch current trash items
    const [trash] = await db.query(
      `SELECT * FROM project_notes 
       WHERE projectId = ? AND is_deleted = 1
       AND (note_type = 'general' OR (note_type = 'personal' AND userId = ?))
       ORDER BY deleted_at DESC`,
      [projectId, userId]
    );

    res.json({ success: true, trash: trash.map(n => ({ ...n, mentions: tryParseJson(n.mentions) })) });
  } catch (error) {
    console.error('Error fetching trash:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Restore note from trash
router.post('/restore/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await db.query(
      `UPDATE project_notes SET is_deleted = 0, deleted_at = NULL, updatedAt = GETDATE() 
       WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Note restored' });
  } catch (error) {
    console.error('Error restoring note:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Soft Delete note (move to trash)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Update note status
    await db.query(
      `UPDATE project_notes SET is_deleted = 1, deleted_at = GETDATE(), updatedAt = GETDATE()
       WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Note moved to trash' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Permanent Delete (bypass trash)
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM project_notes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Note permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
