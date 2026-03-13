// server/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
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

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // 🔹 TRIAL SETUP (CRITICAL)
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const user = new User({
      email: email.toLowerCase(),
      password,
      company,
      phone: phone || '',

      // ✅ required trial fields
      isPaid: false,
      plan: 'trial',
      trialStart,
      trialEnd,
      usageCount: 0
    });

    await user.save();

    const token = generateToken(user);


    const daysRemaining = Math.ceil(
      (user.trialEnd - Date.now()) / (1000 * 60 * 60 * 24)
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully! 30-day free trial started.',
     user: {
  id: user._id,
  email: user.email,
  company: user.company,
  role: user.role,          // ✅ ADD THIS
  trialStart: user.trialStart,
  trialEnd: user.trialEnd,
  isPaid: user.isPaid,
  daysRemaining
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
    console.log('Login attempt for:', email, 'Password length:', password?.length);
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`Login failed: User ${email} not found`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // ⚡ AUTO-FIX: Ensure admin@steel.com is always owner
    if (user.email === 'admin@steel.com' && user.role !== 'owner') {
      console.log('⚡ Auto-fixing admin role for admin@steel.com');
      user.role = 'owner';
      await user.save();
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);


    // Calculate days remaining
    const daysRemaining = Math.ceil((user.trialEnd - Date.now()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      message: 'Login successful',
      user: {
  id: user._id,
  email: user.email,
  company: user.company,
  phone: user.phone,
  role: user.role,         
  plan: user.plan,
  isPaid: user.isPaid,
  trialStart: user.trialStart,
  trialEnd: user.trialEnd,
  usageCount: user.usageCount,
  daysRemaining: daysRemaining > 0 ? daysRemaining : 0
},
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
};

const checkTrialStatus = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    const daysRemaining = Math.ceil((user.trialEnd - now) / (1000 * 60 * 60 * 24));
    const daysUsed = 30 - daysRemaining;

    res.json({
      success: true,
      trialStart: user.trialStart,
      trialEnd: user.trialEnd,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      daysUsed,
      isActive: now <= user.trialEnd,
      isPaid: user.isPaid,
      usageCount: user.usageCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check trial status'
    });
  }
};

const verify = async (req, res) => {
  try {
    const user = req.user; // Set by auth middleware
    const daysRemaining = Math.ceil((user.trialEnd - Date.now()) / (1000 * 60 * 60 * 24));
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        company: user.company,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        isPaid: user.isPaid,
        trialStart: user.trialStart,
        trialEnd: user.trialEnd,
        usageCount: user.usageCount,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isTrialActive: user.isTrialActive, // Ensure these fields exist
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

const registerOwner = async (req, res) => {
  try {
    const { email, password, company, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if owner exists (optional, maybe limit to 1)
    // const existingOwner = await User.findOne({ role: 'owner' });
    // if (existingOwner) { ... }

    const owner = new User({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      company,
      phone,
      role: 'owner',
      subscriptionStatus: 'active',
      isTrialActive: false, // Owners don't have trials
      plan: 'owner',
      isPaid: true
    });

    await owner.save();
    const token = generateToken(owner);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: owner._id,
        email: owner.email,
        company: owner.company,
        role: owner.role,
        subscriptionStatus: owner.subscriptionStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ownerLogin = async (req, res) => {
  // Owner login can be same as regular login, but maybe we want to enforce role check?
  // reusing login logic for now but ensuring role is owner
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner privileges required.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
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
    const userId = req.user._id;
    const updates = req.body;
    
    // Filter allowed updates
    const allowedUpdates = ['company', 'phone', 'specialty'];
    const actualUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        actualUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(userId, actualUpdates, { new: true });
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        company: user.company,
        phone: user.phone,
        role: user.role,
        // ... include other fields as needed
      }
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