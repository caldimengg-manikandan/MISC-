const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/register-owner', authController.registerOwner);
router.post('/owner-login', authController.ownerLogin);

// protected
router.get('/verify', authMiddleware, authController.verify);
router.get('/trial/status', authMiddleware, authController.checkTrialStatus);
router.put('/update-profile', authMiddleware, authController.updateProfile);

module.exports = router;
