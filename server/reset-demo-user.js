
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    // Use the URI from .env
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in .env');
    }
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    const email = 'demo@steel.com';
    let user = await User.findOne({ email });

    if (!user) {
      console.log('User not found. Creating...');
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30); // 30 days trial
      
      user = new User({
        email,
        password: 'Demo123!',
        name: 'Demo User',
        company: 'Demo Steel Co.',
        role: 'user',
        isActive: true,
        plan: 'trial',
        trialStart,
        trialEnd,
        isPaid: false
      });
    } else {
      console.log(`User found (Role: ${user.role}). Updating password and resetting trial...`);
      user.password = 'Demo123!';
      user.isActive = true;
      
      // Reset trial
      user.trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);
      user.trialEnd = trialEnd;
      user.plan = 'trial';
      user.isPaid = false;
    }

    await user.save();
    console.log(`User ${email} successfully updated with password 'Demo123!'`);

    // Verification step
    const savedUser = await User.findOne({ email });
    const isMatch = await savedUser.comparePassword('Demo123!');
    console.log(`Password verification for 'Demo123!': ${isMatch ? 'SUCCESS' : 'FAILED'}`);

  } catch (err) {
    console.error('Error executing script:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
