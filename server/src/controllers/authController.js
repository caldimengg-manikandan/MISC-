const db = require('../config/mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      companyId: user.company_id || null,
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
      mustChangePassword: !!user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.full_name || '',
        bio: user.bio || '',
        region: user.region || '',
        avatar: user.avatar || '',
        company: user.company,
        phone: user.phone,
        role: user.role,
        companyId: user.company_id || null,
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
    const { name, bio, region, avatar, company, phone } = req.body;
    
    await db.query(`
      UPDATE users 
      SET name = ?, bio = ?, region = ?, avatar = ?, company = ?, phone = ? 
      WHERE id = ?`, 
      [name, bio, region, avatar, company, phone, userId]
    );

    const [updated] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = updated[0];
    
    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        bio: user.bio || '',
        region: user.region || '',
        avatar: user.avatar || '',
        company: user.company,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // 1. Verify email exists in DB
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email not found in our system' });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // 3. Save OTP to DB (using UTC for consistency)
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await db.query('UPDATE users SET otp = ?, otpExpires = ? WHERE email = ?', [otp, otpExpires, email.toLowerCase()]);

    // 4. Send Email
    const { sendEmail, buildEmailHtml } = require('../services/NotificationService');
    const emailHtml = buildEmailHtml(
      'Password Reset OTP',
      `Your verification code is: <h2 style="color:#10a37f;letter-spacing:5px;text-align:center">${otp}</h2><p>This code will expire in 5 minutes.</p>`
    );
    
    await sendEmail(email.toLowerCase(), 'Reset Your Password - OTP', emailHtml);

    res.json({ 
      success: true, 
      message: 'A 6-digit verification code has been sent to your email.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process forgot password request' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const [rows] = await db.query(
      'SELECT id FROM users WHERE email = ? AND otp = ? AND otpExpires > GETUTCDATE()',
      [email.toLowerCase(), otp]
    );

    if (rows.length === 0) {
      // For better UX, let's check if user exists at all or if it's just wrong code/expired
      const [userCheck] = await db.query('SELECT otp, otpExpires, GETUTCDATE() as now FROM users WHERE email = ?', [email.toLowerCase()]);
      console.log('OTP Verification Failed:', { 
        inputOtp: otp, 
        dbOtp: userCheck[0]?.otp, 
        dbExpires: userCheck[0]?.otpExpires, 
        serverNow: userCheck[0]?.now 
      });
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    res.json({ 
      success: true, 
      message: 'OTP verified successfully. You can now reset your password.' 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
    }

    // Double check OTP hasn't expired since last step
    const [rows] = await db.query(
      'SELECT id FROM users WHERE email = ? AND otp = ? AND otpExpires > GETUTCDATE()',
      [email.toLowerCase(), otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Link expired. Please start over.' });
    }

    const userId = rows[0].id;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear OTP
    await db.query(
      'UPDATE users SET [password] = ?, otp = NULL, otpExpires = NULL WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Reset failed' });
  }
};

// ── Signup with OTP Flow ───────────────────────────────────────────────────

const sendSignupCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Save to EmailOtps table
    await db.query(
      'INSERT INTO EmailOtps (Email, OtpCode, ExpiresAt, IsUsed) VALUES (?, ?, ?, 0)',
      [email.toLowerCase(), otp, expiresAt]
    );

    const NotificationService = require('../services/NotificationService');
    await NotificationService.sendSignupOTP(email.toLowerCase(), otp);

    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Send signup OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification code' });
  }
};

const verifySignupCode = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const [rows] = await db.query(
      'SELECT Id FROM EmailOtps WHERE Email = ? AND OtpCode = ? AND ExpiresAt > GETUTCDATE() AND IsUsed = 0',
      [email.toLowerCase(), otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired code.' });
    }

    // Mark as used
    await db.query('UPDATE EmailOtps SET IsUsed = 1 WHERE Id = ?', [rows[0].Id]);

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

const registerVerified = async (req, res) => {
  try {
    const { fullName, email, organization, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    // Final check for existing
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Option B+C: auto-link by email domain
    const normalizedEmail = email.toLowerCase().trim();
    const isCalDimUser = normalizedEmail.endsWith('@caldimengg.in');
    const companyId = isCalDimUser ? 1 : null;
    const role = isCalDimUser ? 'estimator' : 'user';

    const hashedPassword = await bcrypt.hash(password, 12);
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const [rows] = await db.query(
      `INSERT INTO users
        (full_name, name, email, company, phone, [password], [role], [plan], isPaid, isVerified, company_id, trialStart, trialEnd, createdAt)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, GETUTCDATE())`,
      [fullName, fullName, normalizedEmail, organization || '', phone || '', hashedPassword, role, 'trial', companyId, trialStart, trialEnd]
    );

    const userId = rows[0].id;

    const NotificationService = require('../services/NotificationService');
    await NotificationService.sendWelcomeEmail(fullName, normalizedEmail);

    const token = generateToken({ id: userId, email: normalizedEmail, role, company_id: companyId });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        fullName,
        role,
        companyId,
        trialStart,
        trialEnd,
        daysRemaining: 30
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Signup failed. Please try again later.' });
  }
};


module.exports = {
  login,
  register: registerVerified, // Use the OTP-verified registration
  registerStandard: register, // Keep standard just in case
  checkTrialStatus,
  verify,
  registerOwner,
  ownerLogin,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  sendSignupCode,
  verifySignupCode
};