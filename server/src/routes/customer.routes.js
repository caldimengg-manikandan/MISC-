// server/src/routes/customer.routes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const auth = require('../middleware/auth');

// All customer routes require authentication
router.use(auth);

router.get('/', customerController.getAll);
router.get('/search', customerController.search);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.patch('/:id/status', customerController.updateStatus);

module.exports = router;
