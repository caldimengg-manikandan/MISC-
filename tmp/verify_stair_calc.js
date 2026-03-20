const { calculateStairEstimate } = require('../server/src/utils/stairEstimation');

const validSample = {
  riseIn: 7,
  runIn: 11,
  totalHeightFt: 10,
  widthFt: 3.5,
  extBotNS: 6,
  extBotFS: 6,
  extTopNS: 6,
  extTopFS: 6
};

const invalidSamples = [
  { riseIn: -1, runIn: 11, totalHeightFt: 10, widthFt: 3.5 }, // Negative rise
  { riseIn: 7, runIn: 0, totalHeightFt: 10, widthFt: 3.5 },  // Zero run
  { riseIn: 7, runIn: 11, totalHeightFt: 10, widthFt: 'abc' }, // NaN
];

console.log('=== PRODUCTION HARDENING VERIFICATION ===');

// 1. VALID CASE
try {
  console.log('\n--- Test 1: Valid Input ---');
  const result = calculateStairEstimate(validSample);
  const expectedWeight = 2216.0558;
  if (Math.abs(result.totalWeight - expectedWeight) < 0.1) {
    console.log('✅ Valid case passed weight check.');
  } else {
    console.log(`❌ Valid case FAILED weight check. Got: ${result.totalWeight}`);
  }
} catch (e) {
  console.error('❌ Valid case crashed:', e.message);
}

// 2. INVALID CASES
console.log('\n--- Test 2: Invalid Inputs ---');
invalidSamples.forEach((sample, i) => {
  try {
    calculateStairEstimate(sample);
    console.log(`❌ Invalid case ${i + 1} failed to throw error.`);
  } catch (e) {
    console.log(`✅ Invalid case ${i + 1} correctly caught error: ${e.message}`);
  }
});

// 3. ZERO EXTENTS
try {
  console.log('\n--- Test 3: Zero Extents ---');
  const result = calculateStairEstimate({ ...validSample, extBotNS: 0, extBotFS: 0, extTopNS: 0, extTopFS: 0 });
  console.log(`✅ Zero extents produced totalWeight: ${result.totalWeight.toFixed(2)}`);
} catch (e) {
  console.error('❌ Zero extents crashed:', e.message);
}

console.log('\n--- VERIFICATION COMPLETED ---');
