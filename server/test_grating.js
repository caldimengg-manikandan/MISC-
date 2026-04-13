const StairCalculationService = require('./src/services/calculation/StairCalculationService');

async function test() {
  const service = new StairCalculationService();
  
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
    const gratingCost = stair.systemCalc.gratingTotalCost;
    const panCost = stair.systemCalc.stairPansTotalPrice;

    console.log('\n--- Grating Parity Test ---');
    console.log('Risers:', stair.systemCalc.risers);
    console.log('Width:', payload.stairs[0].widthFt);
    console.log('Grating Cost:', gratingCost);
    console.log('Pan Cost (Expected 0):', panCost);

    if (gratingCost === 1362.55) {
      console.log('✅ PASS: Grating Cost (17 * 80.15) = 1,362.55');
    } else {
      console.log('❌ FAIL: Grating Cost Expected 1,362.55, Got:', gratingCost);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
  process.exit();
}

test();
