const express = require('express');
const router = express.Router();
const Dictionary = require('../models/Dictionary');
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
    const entries = await Dictionary.find({ 
      category: req.params.category, 
      isActive: true 
    }).sort({ order: 1, label: 1 });
    
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/dictionary/all/categories
// @desc    Get all dictionary entries grouped by category (for admin)
router.get('/all/categories', auth, adminOnly, async (req, res) => {
  try {
    const entries = await Dictionary.find().sort({ category: 1, order: 1 });
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
    const existing = await Dictionary.findOne({ category, value });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Value already exists in this category' });
    }

    const entry = new Dictionary({ category, label, value, description, order });
    await entry.save();
    
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/dictionary/:id
// @desc    Update a dictionary entry
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const entry = await Dictionary.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/dictionary/:id
// @desc    Delete a dictionary entry
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const entry = await Dictionary.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/dictionary/seed/initial
// @desc    Seed initial dictionary data
router.post('/seed/initial', auth, adminOnly, async (req, res) => {
  try {
    const count = await Dictionary.countDocuments();
    if (count > 0 && !req.body.force) {
      return res.json({ success: true, message: 'Dictionary already seeded', count });
    }

    const initialData = [
      // Stair Types
      { category: 'stair_type', label: 'Pan Plate — Concrete Filled', value: 'pan-concrete', order: 1 },
      { category: 'stair_type', label: 'Grating Tread', value: 'grating-tread', order: 2 },
      { category: 'stair_type', label: 'Non-Metal Stair', value: 'non-metal', order: 3 },
      
      // Stringer Sizes
      { category: 'stringer_size', label: 'W8x31', value: 'W8x31', order: 1 },
      { category: 'stringer_size', label: 'W10x33', value: 'W10x33', order: 2 },
      { category: 'stringer_size', label: 'W12x35', value: 'W12x35', order: 3 },
      { category: 'stringer_size', label: 'MC12x10.6', value: 'MC12x10.6', order: 7 },
      
      // Finishes
      { category: 'finish_option', label: 'Primer', value: 'Primer', order: 1 },
      { category: 'finish_option', label: 'Painted', value: 'Painted', order: 2 },
      { category: 'finish_option', label: 'Galvanized', value: 'Galvanized', order: 3 },
      
      // Grating Types
      { category: 'grating_type', label: '1 1/4" Bar grating / Welded', value: '1-1/4-welded', order: 1 },
      { category: 'grating_type', label: '1-1/4" Bar grating / Bolted', value: '1-1/4-bolted', order: 2 },
      { category: 'grating_type', label: 'McNichols Treads', value: 'mcnichols', order: 5 },
    ];

    if (req.body.force) await Dictionary.deleteMany({});
    const created = await Dictionary.insertMany(initialData);
    
    res.json({ success: true, count: created.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
