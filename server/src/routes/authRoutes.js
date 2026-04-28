const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const db = require('../config/mssql');

// ── Public Auth ──────────────────────────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login-mfa', authController.loginWithMfa);
router.post('/verify-login-otp', authController.verifyLoginOTP);
router.post('/activate', authController.activate);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Signup flow with email OTP
router.post('/send-otp', authController.sendSignupCode);
router.post('/verify-otp', authController.verifySignupCode);
router.post('/signup', authController.register);

// ── Token Refresh ─────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) return res.status(401).json({ success: false, error: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    const user = rows[0];
    if (!user || !user.session_token) return res.status(401).json({ success: false, error: 'Session invalidated' });

    // Issue new access token — embed same session token to maintain single-session enforcement
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, companyId: user.company_id, admin_owner_id: user.admin_owner_id, sessionToken: user.session_token, licenseValid: true, tokenIssuedAt: new Date().toISOString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    res.cookie('auth_token', newAccessToken, { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    return res.json({ success: true, token: newAccessToken });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
});

// ── Protected ─────────────────────────────────────────────────────────────────
router.post('/logout', authMiddleware, authController.logout);
router.get('/verify', authMiddleware, authController.verify);
router.get('/trial/status', authMiddleware, authController.checkTrialStatus);
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
