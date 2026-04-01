// server/src/routes/estimations.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const estimationController = require('../controllers/estimation.controller');

// 📊 GET Dashboard Stats
router.get('/dashboard', auth, (req, res) => estimationController.getDashboardStats(req, res));

// 📋 GET Estimation List
router.get('/', auth, (req, res) => estimationController.getList(req, res));

// ✨ CREATE Estimation
router.post('/', auth, (req, res) => estimationController.create(req, res));

// 👤 STATUS Actions (Assign, Start, Review, Submit)
router.put('/:id/:action(assign|start|review|submit)', auth, (req, res) => estimationController.updateStatus(req, res));

// 💾 SAVE Estimation Data (Modules)
router.put('/:id', auth, (req, res) => estimationController.saveData(req, res));

// 🔍 GET Estimation Detail
router.get('/:id', auth, (req, res) => estimationController.getDetail(req, res));

// 🗑️ DELETE Estimation
router.delete('/:id', auth, (req, res) => estimationController.deleteData(req, res));

// 👯 DUPLICATE Estimation
router.post('/:id/duplicate', auth, (req, res) => estimationController.duplicateData(req, res));

module.exports = router;
