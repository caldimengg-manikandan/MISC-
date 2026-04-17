const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyOTP); // Renamed for reset flow
router.post('/reset-password', authController.resetPassword);

// New Signup flow with OTP
router.post('/send-otp', authController.sendSignupCode);
router.post('/verify-otp', authController.verifySignupCode);
router.post('/signup', authController.register);

// protected
router.get('/verify', authMiddleware, authController.verify);
router.get('/trial/status', authMiddleware, authController.checkTrialStatus);
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
