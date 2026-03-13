const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/steel_estimation');

const User = mongoose.model(
  'User',
  new mongoose.Schema({}, { strict: false })
);

(async () => {
  await User.updateMany(
    {},
    {
      $set: {
        isPaid: false,
        plan: 'trial',
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      $unset: {
        trialStartDate: "",
        trialEndDate: "",
        isTrialActive: "",
        subscriptionStatus: ""
      }
    }
  );

  console.log('✅ Users migrated');
  process.exit();
})();
