const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  /* ───── Identity ───── */
  name: {
    type: String,
    trim: true,
    default: ''
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },

  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },

  phone: {
    type: String,
    trim: true
  },

  /* ───── Profile & Preferences ───── */
  avatar: {
    type: String,
    default: ''
  },

  jobTitle: {
    type: String,
    trim: true
  },

  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
      billing: { type: Boolean, default: true }
    },
    measurementUnit: {
      type: String,
      enum: ['imperial', 'metric'],
      default: 'imperial'
    }
  },

  /* ───── Role Control ───── */
  role: {
    type: String,
    enum: ['owner', 'admin', 'user'],
    default: 'user'
  },

  permissions: [{
    type: String,
    enum: ['create_project', 'edit_project', 'delete_project', 'view_reports', 
           'manage_users', 'billing_access', 'export_data']
  }],

  isVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: String,
  verificationExpires: Date,

  /* ───── Subscription ───── */
  isPaid: {
    type: Boolean,
    default: false
  },

  subscriptionId: String,
  stripeCustomerId: String,

  subscriptionStart: Date,
  subscriptionEnd: Date,
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },

  /* ───── Usage Tracking ───── */
  lastProjectCreated: Date,
  totalProjects: {
    type: Number,
    default: 0
  },

  /* ───── Security & Activity ───── */
  lastLogin: {
    type: Date,
    default: Date.now
  },

  lastPasswordChange: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: Date,

  /* ───── Audit Trail ───── */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  /* ───── Metadata ───── */
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  isActive: {
    type: Boolean,
    default: true
  },

  deactivatedAt: Date,
  deactivationReason: String
});

/* ───── Indexes for Performance ───── */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ company: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ subscriptionEnd: 1 });

/* ───── Middleware ───── */
userSchema.pre('save', async function (next) {
  // Update timestamps
  this.updatedAt = Date.now();
  
  // Hash password if modified
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    this.lastPasswordChange = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Update last login on login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  this.loginAttempts = 0; // Reset login attempts on successful login
  return this.save();
};

// Check if user account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    // Lock account for 1 hour
    this.lockUntil = Date.now() + 60 * 60 * 1000;
  }
  
  return this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

// Check user permissions
userSchema.methods.hasPermission = function(permission) {
  // Admins and owners have all permissions
  if (this.role === 'admin' || this.role === 'owner') return true;
  
  // Check specific permissions
  return this.permissions.includes(permission);
};

/* ───── Static Methods ───── */
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

/* ───── Virtual Properties ───── */
userSchema.virtual('isSubscribed').get(function() {
  return this.isPaid && this.subscriptionEnd && new Date() < new Date(this.subscriptionEnd);
});

userSchema.virtual('fullName').get(function() {
  return this.name || this.email.split('@')[0];
});

/* ───── Instance Methods ───── */
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// JSON transformation (remove sensitive data)
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  }
});

// Same for toObject
userSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);