const engine = require('./src/services/calculation/StairCalculationService');
const configManager = require('./src/utils/configManager');

const payload = {
  project: { projectId: 'TEST' },
  rails: [],
  platforms: [],
  stairs: [
    {
      id: 'stair1',
      stairWidth: { value: 4, unit: 'FT' },
      run: { value: 11, unit: 'IN' },
      rise: { value: 7, unit: 'IN' },
      totalHeight: { value: 17 * 7, unit: 'IN' },
      numRisers: 17,
      finish: 'Primer',
      stairType: 'PAN PLATE CONC. FILLED',
      stringerType: 'Rolled',
      stringerSize: 'MC 12 X 10.6', // Make sure it hits strLbs=10.6
      mountingType: 'Anchored',
      nsStringerBot: { value: 0, unit: 'IN' },
      fsStringerBot: { value: 0, unit: 'IN' },
      nsStringerTop: { value: 0, unit: 'IN' },
      fsStringerTop: { value: 0, unit: 'IN' },
      nsConnBot: 'Welded',
      fsConnBot: 'Bolted',
      nsConnTop: 'Welded',
      fsConnTop: 'Bolted'
    }
  ],
  config: {
    tax_rate: 0.06 // ensure it matches specific test metrics if any, assume global is fine. test case defaults to standard globals.
  }
};

async function runTest() {
  await configManager.loadConfigs();
  const res = await engine.calculateFull(payload, false);
  console.log('--- OUTPUT ---');
  if (!res) {
    console.log("No response."); return;
  }
  
  const stair = res.breakdown.stairs[0].systemCalc;
  const sum = res.summary;

  console.log(`Steel Scrap lbs: ${stair.scrapLbs}`);
  console.log(`Shop Hours:      ${sum.totalShopHours}`);
  console.log(`Field Hours:     ${sum.totalFieldHours}`);
  console.log(`Steel lbs base:  ${stair.baseSteelLbs}`);
  console.log(`Steel $:         ${stair.steelPriceBase}`);
  console.log(`Stair Pans $:    ${stair.stairPansTotalPrice}`);
  console.log(`Anchor Bolts:    ${stair.mountingCharge}`);
  console.log(`Total Material:  ${sum.baseSteelCost + sum.scrapWeightCost + sum.pansMaterialPrice + sum.anchorBoltsCost}`); // rough proxy
  console.log(`Total Estimate:  ${sum.grandTotal}`);
  
  console.log(JSON.stringify(sum, null, 2));
}

runTest().catch(console.error);
