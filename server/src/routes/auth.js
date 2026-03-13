// // server/routes/auth.js
// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

<<<<<<< HEAD
// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, company, specialty, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
=======
// // Register
// // server/routes/auth.js (REGISTER FIX)
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password, company, specialty, phone } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     // 🔹 Trial setup
//     const trialStart = new Date();
//     const trialEnd = new Date();
//     trialEnd.setDate(trialEnd.getDate() + 30);

//     const user = new User({
//       email,
//       password,          // password will be hashed by model
//       company,
//       specialty,
//       phone,

//       // 🔐 Trial fields (MANDATORY)
//       isPaid: false,
//       plan: 'trial',
//       trialStart,
//       trialEnd,
//       usageCount: 0,
//       maxUsage: 50
//     });

//     await user.save();

//     res.status(201).json({
//       success: true,
//       message: 'Account created! 30-day trial started.',
//     });

//   } catch (error) {
//     console.error('Register error:', error.message);
//     res.status(400).json({ error: error.message });
//   }
// });

// // Login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Check password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Update trial status if expired
//     let isTrialActive = user.isTrialActive;
//     if (user.trialEndDate && new Date() > user.trialEndDate) {
//       isTrialActive = false;
//       user.isTrialActive = false;
//       user.subscriptionStatus = user.role === 'owner' ? 'active' : 'restricted';
//       await user.save();
//     }

//     // Create token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         company: user.company,
//         role: user.role,
//         trialEndDate: user.trialEndDate,
//         isTrialActive: isTrialActive,
//         subscriptionStatus: user.subscriptionStatus
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Special Owner Registration (no trial)
// router.post('/register-owner', async (req, res) => {
//   try {
//     const { email, password, company } = req.body;
    
//     // Check if owner exists (you might want to limit to 1 owner)
//     const existingOwner = await User.findOne({ role: 'owner' });
//     if (existingOwner) {
//       return res.status(400).json({ error: 'Owner account already exists' });
//     }
>>>>>>> 1d357fbb47b1eaef81573942b26312c509d0537e

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: 'Email already registered' });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create owner (no trial)
//     const owner = new User({
//       email,
//       password: hashedPassword,
//       company,
//       role: 'owner',
//       subscriptionStatus: 'active', // Owners are always active
//       isTrialActive: false // Owners don't have trials
//     });

//     await owner.save();

//     // Create token
//     const token = jwt.sign(
//       { userId: owner._id, email: owner.email, role: owner.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.status(201).json({
//       token,
//       user: {
//         id: owner._id,
//         email: owner.email,
//         company: owner.company,
//         role: owner.role,
//         subscriptionStatus: owner.subscriptionStatus
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

<<<<<<< HEAD
// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update trial status if expired
    let isTrialActive = user.isTrialActive;
    if (user.trialEndDate && new Date() > user.trialEndDate) {
      isTrialActive = false;
      user.isTrialActive = false;
      user.subscriptionStatus = user.role === 'owner' ? 'active' : 'restricted';
      await user.save();
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        company: user.company,
        role: user.role,
        trialEndDate: user.trialEndDate,
        isTrialActive: isTrialActive,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Special Owner Registration (no trial)
router.post('/register-owner', async (req, res) => {
  try {
    const { email, password, company } = req.body;

    // Check if owner exists (you might want to limit to 1 owner)
    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      return res.status(400).json({ error: 'Owner account already exists' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create owner (no trial)
    const owner = new User({
      email,
      password: hashedPassword,
      company,
      role: 'owner',
      subscriptionStatus: 'active', // Owners are always active
      isTrialActive: false // Owners don't have trials
    });

    await owner.save();

    // Create token
    const token = jwt.sign(
      { userId: owner._id, email: owner.email, role: owner.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
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
});

module.exports = router;
=======
// module.exports = router;
>>>>>>> 1d357fbb47b1eaef81573942b26312c509d0537e
