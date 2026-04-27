const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// ── Public Auth ──────────────────────────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-login-otp', authController.verifyLoginOTP); // new device OTP
router.post('/activate', authController.activate);              // invite link activation
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Signup flow with email OTP
router.post('/send-otp', authController.sendSignupCode);
router.post('/verify-otp', authController.verifySignupCode);
router.post('/signup', authController.register);

// ── Protected ────────────────────────────────────────────────────────────────
router.post('/logout', authMiddleware, authController.logout);  // invalidate session token
router.get('/verify', authMiddleware, authController.verify);
router.get('/trial/status', authMiddleware, authController.checkTrialStatus);
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
