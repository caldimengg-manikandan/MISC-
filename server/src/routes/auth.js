// server/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/mssql');
const { enforcePasswordPolicy } = require('../utils/passwordPolicy');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, company, specialty, phone } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    if (!enforcePasswordPolicy(password, res)) return;
    const hashedPassword = await bcrypt.hash(password, 12);
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const [rows] = await db.query(
      'INSERT INTO users (email, [password], company, phone, [role], [plan], isPaid, trialStart, trialEnd) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email.toLowerCase(), hashedPassword, company, phone || '', 'user', 'trial', 0, trialStart, trialEnd]
    );

    const userId = rows[0].id;
    const token = generateToken({ id: userId, email, role: 'user' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! 30-day free trial started.',
      user: {
        id: userId,
        email: email.toLowerCase(),
        company,
        role: 'user',
        trialStart,
        trialEnd,
        isPaid: false,
        daysRemaining: 30
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Update last login
    await db.query('UPDATE users SET lastLogin = GETDATE() WHERE id = ?', [user.id]);

    /* MFA Check removed per user request
    if (user.mfa_enabled) {
      ...
    }
    */

    const token = generateToken(user);
    const daysRemaining = Math.max(0, Math.ceil((new Date(user.trialEnd) - new Date()) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        company: user.company,
        role: user.role,
        daysRemaining,
        isPaid: !!user.isPaid,
        trialEnd: user.trialEnd
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Register Owner
router.post('/register-owner', async (req, res) => {
  try {
    const { email, password, company, phone } = req.body;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    if (!enforcePasswordPolicy(password, res)) return;
    const hashedPassword = await bcrypt.hash(password, 12);
    const [rows] = await db.query(
      'INSERT INTO users (email, [password], company, phone, [role], [plan], isPaid, subscriptionStatus) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email.toLowerCase(), hashedPassword, company, phone || '', 'owner', 'owner', 1, 'active']
    );

    const userId = rows[0].id;
    const token = generateToken({ id: userId, email, role: 'owner' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        company,
        role: 'owner',
        subscriptionStatus: 'active'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
