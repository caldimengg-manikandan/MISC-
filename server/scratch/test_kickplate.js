require('dotenv').config();
const StairCalculationService = require('../src/services/calculation/StairCalculationService');
const configManager = require('../src/utils/configManager');

async function test() {
  const service = require('../src/services/calculation/StairCalculationService');
  service.debug = true;

  // Use standard rates as per USER SPEC examples
  configManager.configs['steel_price_per_lb'] = 0.75;
  configManager.configs['shop_hourly_rate'] = 70;
  configManager.configs['field_hourly_rate'] = 70;
  configManager.configs['tax_rate'] = 0.06;
  configManager.configs['scrap_factor_pct'] = 10;
  configManager.configs['galvanize_charge'] = 0.75;

  const testCases = [
    { name: 'Standard 4"', widthIn: 4, label: 'Standard' },
    { name: 'Narrow 3"', widthIn: 3, label: 'Narrow' },
    { name: 'Wide 6"', widthIn: 6, label: 'Wide' },
    { name: 'Galvanized 4"', widthIn: 4, finish: 'Galvanized', label: 'Galvanized' }
  ];

  for (const tc of testCases) {
    console.log(`\n--- Test Case: ${tc.name} ---`);
    const input = {
      rails: [{
        id: 1,
        type: 'kickPlate',
        railLength: { value: '20', unit: 'FT' },
        widthIn: tc.widthIn,
        finish: tc.finish || 'Primer'
      }],
      platforms: [],
      stairs: [],
      config: {}
    };

    const takeoff = await service.calculateTakeoff(input);
    const estimate = await service.calculateEstimate(takeoff);
    const kp = estimate.rails[0];

    console.log(`Steel lbs/LF: ${kp.systemCalc.steelLbsPerLF}`);
    console.log(`Total Steel: ${kp.systemCalc.totalSteel} lbs`);
    console.log(`Shop Hours: ${kp.systemCalc.shopTotalHrs}`);
    console.log(`Field Hours: ${kp.systemCalc.fieldTotalHrs}`);
    console.log(`Finish Cost: $${kp.systemCalc.finishTotalCost}`);
    console.log(`Sub-Material: $${kp.systemCalc.subTotalMaterial}`);
    console.log(`Total Cost: $${kp.totalCost}`);

    if (tc.name === 'Standard 4"') {
       // Verify against user expected $304.67 (or close $304.16 based on my calc)
       if (Math.abs(kp.totalCost - 304.67) < 1.00) {
         console.log("✅ Match user expectations ($304.67)");
       } else {
         console.log(`⚠️ Calculated $${kp.totalCost}, expected near $304.67`);
       }
    }
  }

  process.exit();
}

test();
