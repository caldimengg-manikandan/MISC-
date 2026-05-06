require('dotenv').config();
const StairCalculationService = require('./src/services/calculation/StairCalculationService');

async function test() {
  const service = StairCalculationService;
  
  const payload = {
    stairs: [
      {
        id: 'stair-grating-test',
        stairType: 'grating-tread',
        widthFt: 5.0,
        risers: 17,
        totalLFBothStringers: 31,
        stringerSize: 'MC 12 X 14.3'
      }
    ]
  };

  try {
    const result = await service.calculateEstimate(payload);
    const stair = result.stairs[0];
    const calcResult = stair.systemCalc;
    const panCost = stair.systemCalc.stairPansTotalPrice;

    console.log('\n--- Grating Parity Test ---');
    console.log('Risers:', stair.systemCalc.risers);
    console.log('Width:', payload.stairs[0].widthFt);
    console.log('Grating Cost:', calcResult.gratingTotalCost);
    console.log('Pan Cost (Expected 0):', panCost);

    // Parity Check (Width: 5 -> Base Rate $95.30, Treads: 17 - 1 = 16)
    const EXPECTED_GRATING_COST = 16 * 95.30;
    if (Math.abs(calcResult.gratingTotalCost - EXPECTED_GRATING_COST) < 0.1) {
      console.log(`✅ PASS: Grating Cost (16 * 95.30) = ${EXPECTED_GRATING_COST.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
    } else {
      console.log(`❌ FAIL: Grating Cost Expected ${EXPECTED_GRATING_COST.toLocaleString('en-US', {minimumFractionDigits: 2})}, Got: ${calcResult.gratingTotalCost}`);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
  process.exit();
}

test();
