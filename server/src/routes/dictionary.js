const express = require('express');
const router = express.Router();
const db = require('../config/mssql');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

// @route   GET /api/dictionary/:category
// @desc    Get all active dictionary entries for a category
router.get('/:category', async (req, res) => {
  try {
    const [entries] = await db.query(
      'SELECT id, category, label, value, description, [order] FROM dictionary WHERE category = ? AND isActive = 1 ORDER BY [order] ASC, label ASC',
      [req.params.category]
    );
    
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/dictionary/all/categories
// @desc    Get all dictionary entries grouped by category (for admin)
router.get('/all/categories', auth, adminOnly, async (req, res) => {
  try {
    const [entries] = await db.query(
      'SELECT id, category, label, value, description, [order], isActive FROM dictionary ORDER BY category ASC, [order] ASC',
      []
    );
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/dictionary
// @desc    Add a new dictionary entry
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { category, label, value, description, order } = req.body;
    
    // Check if exists
    const [existing] = await db.query('SELECT id FROM dictionary WHERE category = ? AND value = ?', [category, value]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Value already exists in this category' });
    }

    const [rows] = await db.query(
      'INSERT INTO dictionary (category, label, value, description, [order]) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?)',
      [category, label, value, description || '', order || 0]
    );
    
    const [newEntry] = await db.query('SELECT * FROM dictionary WHERE id = ?', [rows[0].id]);
    res.status(201).json({ success: true, data: newEntry[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/dictionary/:id
// @desc    Update a dictionary entry
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { category, label, value, description, order, isActive } = req.body;
    
    await db.query(
      'UPDATE dictionary SET category = ?, label = ?, value = ?, description = ?, [order] = ?, isActive = ? WHERE id = ?',
      [category, label, value, description || '', order || 0, isActive !== undefined ? (isActive ? 1 : 0) : 1, req.params.id]
    );
    
    const [updated] = await db.query('SELECT * FROM dictionary WHERE id = ?', [req.params.id]);
    if (updated.length === 0) return res.status(404).json({ success: false, message: 'Entry not found' });
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/dictionary/:id
// @desc    Delete a dictionary entry
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM dictionary WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/dictionary/seed/initial
// @desc    Seed initial dictionary data
router.post('/seed/initial', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM dictionary', []);
    const count = rows[0].count;
    if (count > 0 && !req.body.force) {
      return res.json({ success: true, message: 'Dictionary already seeded', count });
    }

    const initialData = [
      ['stair_type', 'Pan Plate — Concrete Filled', 'pan-concrete', 1],
      ['stair_type', 'Grating Tread', 'grating-tread', 2],
      ['stair_type', 'Non-Metal Stair', 'non-metal', 3],

      ['grating_type', '1 1/4" Bar grating / Welded', '1 1/4" Bar grating / Welded', 1],
      ['grating_type', '1 1/4" Bar grating / Bolted', '1 1/4" Bar grating / Bolted', 2],
      ['grating_type', '1" Bar grating / Welded', '1" Bar grating / Welded', 3],
      ['grating_type', '1" Bar grating / Bolted', '1" Bar grating / Bolted', 4],
      ['grating_type', 'McNichols Treads', 'McNichols Treads', 5],
      ['grating_type', 'Other Pre-fabricated Treads', 'Other Pre-fabricated Treads', 6],

      ['steel_grade_stair', 'A992', 'A992', 1],
      ['steel_grade_stair', 'A572-50', 'A572-50', 2],
      ['steel_grade_stair', 'A36', 'A36', 3],
      ['steel_grade_stair', 'SS316', 'SS316', 4],
      ['steel_grade_stair', 'SS304', 'SS304', 5],

      ['steel_grade_rail', 'A53', 'A53', 1],
      ['steel_grade_rail', 'A500C', 'A500C', 2],
      ['steel_grade_rail', 'A500B', 'A500B', 3],
      ['steel_grade_rail', 'SS316', 'SS316', 4],
      ['steel_grade_rail', 'SS306', 'SS306', 5],

      ['finish_option', 'PRIMER', 'PRIMER', 1],
      ['finish_option', 'PAINTED', 'PAINTED', 2],
      ['finish_option', 'GALVANIZED', 'GALVANIZED', 3],
      ['finish_option', 'GALV+PAINTED', 'GALV+PAINTED', 4],
      ['finish_option', 'POWDER COATED', 'POWDER COATED', 5],

      ['connection_type', 'WELDED', 'WELDED', 1],
      ['connection_type', 'BOLTED', 'BOLTED', 2],

      ['mounting_type', 'Bolted to Stringer', 'Bolted to Stringer', 1],
      ['mounting_type', 'Welded to Stringer', 'Welded to Stringer', 2],
      ['mounting_type', 'Side Mounted Bolted', 'Side Mounted Bolted', 3],
      ['mounting_type', 'Side Mounted Welded', 'Side Mounted Welded', 4],
      ['mounting_type', 'Embedded', 'Embedded', 5],
      ['mounting_type', 'Anchored', 'Anchored', 6],

      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 pipe', 1],
      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 pipe', 2],
      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post', '1-Line Steel Floor Mounted Handrail 1 1/4" SCH. 40 Rail and 1 1/4" SCH. 80 Post', 3],
      ['guardRail_type', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post', '1-Line Steel Floor Mounted Handrail 1 1/2" SCH. 40 Rail and 1 1/2" SCH. 80 Post', 4],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post', 5],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post', 6],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post', '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and SCH. 80 Post', 7],
      ['guardRail_type', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post', '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and SCH. 80 Post', 8],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', 9],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', 10],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH. 80 Posts', '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and SCH. 80 Posts', 11],
      ['guardRail_type', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts', '3-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and SCH. 80 Posts', 12],
      ['guardRail_type', '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', '8-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', 13],
      ['guardRail_type', '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', '8-Line Steel Pipe Guardrail 1 1/2" SCH. 40 Pipe Rails and Posts', 14],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and Post', 15],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and Post', 16],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/4" Pipe Rails and SCH 80 Post', 17],
      ['guardRail_type', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/1/2" pickets - 1 1/2" Pipe Rails and SCH 80 Post', 18],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and Post', 19],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and Post', 20],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/4" Pipe Rails and SCH 80 Post', 21],
      ['guardRail_type', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post', '2-Line Picket Guardrail w/3/4" pickets - 1 1/2" Pipe Rails and SCH 80 Post', 22],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and Post', 23],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and Post', 24],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', 25],
      ['guardRail_type', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/1/2" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', 26],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and Post', 27],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and Post', 28],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/4" SCH 40 Rails and SCH 80 Post', 29],
      ['guardRail_type', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', '3-Line Picket Guardrail w/3/4" pickets - 1 1/2" SCH 40 Rails and SCH 80 Post', 30],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND POST', 31],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND POST', 32],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/4 SCH 40 RAILS AND SCH 80 POST', 33],
      ['guardRail_type', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND SCH 80 POST', '2-LINE STEEL PIPE GUARDRAIL W/ MESH PANEL INFILLS- 1 1/2 SCH 40 RAILS AND SCH 80 POST', 34],

      ['stringer_size', 'W8x31', 'W8x31', 1],
      ['stringer_size', 'W10x33', 'W10x33', 2],
      ['stringer_size', 'W12x35', 'W12x35', 3],
      ['stringer_size', 'W12x40', 'W12x40', 4],
      ['stringer_size', 'W12x50', 'W12x50', 5],
      ['stringer_size', 'W14x43', 'W14x43', 6],
      ['stringer_size', 'MC12x10.6', 'MC12x10.6', 7],
      ['stringer_size', 'C12x20.7', 'C12x20.7', 8],
      ['stringer_size', 'C15x33.9', 'C15x33.9', 9],
    ];

    if (req.body.force) await db.query('DELETE FROM dictionary', []);
    
    for (const item of initialData) {
      await db.query(
        'INSERT INTO dictionary (category, label, value, [order]) VALUES (?, ?, ?, ?)',
        item
      );
    }
    
    const [finalCount] = await db.query('SELECT COUNT(*) as count FROM dictionary', []);
    res.json({ success: true, count: finalCount[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
