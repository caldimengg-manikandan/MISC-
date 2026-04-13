const StairCalculationService = require('./src/services/calculation/StairCalculationService');
const db = require('./src/config/mssql');

async function test() {
  const service = new StairCalculationService();
  service.debug = true;

  const labelsToTest = [
    'Std. 4\'-0" wide 14\'-0 - 19\'-0" Long Stringer/MC 12 X 14.3',
    'Std. 5\'-0" wide 14\'-0 - 19\'-0" span grating tread stairs/MC 12 X 14.3'
  ];

  for (const label of labelsToTest) {
    console.log(`\n--- Testing Label: "${label}" ---`);
    const takeoff = {
      stairs: [
        {
          id: 'test-stair',
          stairType: 'grating-tread',
          stringerSize: label,
          totalLFBothStringers: 31,
          risers: 17,
          widthFt: label.includes('5\'-0"') ? 5 : 4,
          totalHeight: { value: '10', unit: 'FT' },
          run: { value: '11', unit: 'IN' }
        }
      ]
    };

    try {
      const result = await service.calculateEstimate(takeoff);
      const stair = result.stairs[0];
      console.log('Result Steel LBS/LF:', stair.systemCalc.steelLbsPerLF);
      
      if (label.includes('5\'-0"')) {
          if (stair.systemCalc.steelLbsPerLF === 30.6) {
              console.log('✅ PASS: Correct weight 30.6 for 5\'-0" version.');
          } else {
              console.log('❌ FAIL: Incorrect weight for 5\'-0" version. Expected 30.6, Got:', stair.systemCalc.steelLbsPerLF);
          }
      } else {
          if (stair.systemCalc.steelLbsPerLF === 71.8) {
              console.log('✅ PASS: Correct weight 71.8 for 4\'-0" version.');
          } else {
              console.log('❌ FAIL: Incorrect weight for 4\'-0" version. Expected 71.8, Got:', stair.systemCalc.steelLbsPerLF);
          }
      }
    } catch (err) {
      console.error('Test error:', err);
    }
  }
  process.exit();
}

test();
