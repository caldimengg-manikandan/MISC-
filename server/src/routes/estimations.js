// server/src/routes/estimations.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireRole');
const estimationController = require('../controllers/estimation.controller');

console.log('✅ ESTIMATION ROUTER LOADED');

// 📊 GET Dashboard Stats
router.get('/dashboard', auth, (req, res) => estimationController.getDashboardStats(req, res));

// 📋 GET Estimation List
router.get('/', auth, (req, res) => estimationController.getList(req, res));

// ✨ CREATE Estimation
router.post('/', auth, (req, res) => estimationController.create(req, res));

// 🧺 BULK Delete
router.post('/bulk-delete-test', auth, requireAdmin, (req, res) => {
    console.log('POST /bulk-delete-test hit!');
    return estimationController.bulkDeleteData(req, res);
});

router.get('/ping', (req, res) => {
    console.log('GET /ping hit!');
    res.send('pong');
});

// 👤 STATUS Actions (Assign, Start, Review, Submit)
router.put('/:id/:action(assign|start|review|submit)', auth, (req, res) => estimationController.updateStatus(req, res));

// 💾 SAVE Estimation Data (Modules)
router.put('/:id', auth, (req, res) => estimationController.saveData(req, res));

// 🔍 GET Estimation Detail
router.get('/:id', auth, (req, res) => estimationController.getDetail(req, res));

// 🗑️ DELETE Estimation
router.delete('/:id', auth, requireAdmin, (req, res) => estimationController.deleteData(req, res));

// 👯 DUPLICATE Estimation
router.post('/:id/duplicate', auth, (req, res) => estimationController.duplicateData(req, res));

module.exports = router;
