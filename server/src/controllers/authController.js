const db = require('../config/mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

const register = async (req, res) => {
  try {
    const { email, password, company, phone } = req.body;

    if (!email || !password || !company) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and company are required'
      });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const login = async (req, res) => {
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

    const token = generateToken(user);
    const daysRemaining = Math.max(0, Math.ceil((new Date(user.trialEnd) - new Date()) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        company: user.company,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        isPaid: !!user.isPaid,
        trialStart: user.trialStart,
        trialEnd: user.trialEnd,
        usageCount: user.usageCount,
        daysRemaining
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

const checkTrialStatus = async (req, res) => {
  try {
    const user = req.user;
    const trialEnd = new Date(user.trialEnd);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      trialStart: user.trialStart,
      trialEnd: user.trialEnd,
      daysRemaining,
      isActive: now <= trialEnd,
      isPaid: !!user.isPaid,
      usageCount: user.usageCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check trial status' });
  }
};

const verify = async (req, res) => {
  try {
    const user = req.user;
    const daysRemaining = Math.max(0, Math.ceil((new Date(user.trialEnd) - new Date()) / (1000 * 60 * 60 * 24)));
    
    res.json({
      success: true,
      user: {
        ...user,
        daysRemaining
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

const registerOwner = async (req, res) => {
  try {
    const { email, password, company, phone } = req.body;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

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
    res.status(500).json({ error: error.message });
  }
};

const ownerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND [role] = 'owner'", [email.toLowerCase()]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { company, phone } = req.body;
    
    await db.query('UPDATE users SET company = ?, phone = ? WHERE id = ?', [company, phone, userId]);
    
    res.json({
      success: true,
      message: 'Profile updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  checkTrialStatus,
  verify,
  registerOwner,
  ownerLogin,
  updateProfile
};