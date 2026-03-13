const express = require('express');
const router = express.Router();

// Basic admin routes placeholder
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard',
    user: req.user
  });
});

module.exports = router;