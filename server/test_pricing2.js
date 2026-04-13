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
      stairType: 'GRATING TREAD',
      stairWidth: { value: 48, unit: 'IN' },
      gratingType: 'McNichols treads',
      stringerType: 'Rolled',
      stringerSize: 'MC 12 X 10.6',
      mountingType: 'Anchored',
      nsStringerBot: { value: 1, unit: 'FT' }, // Extent = 1ft
      fsStringerBot: { value: 1, unit: 'FT' },
      nsStringerTop: { value: 1, unit: 'FT' },
      fsStringerTop: { value: 1, unit: 'FT' },
      nsStringerConnBot: 'Welded',
      fsStringerConnBot: 'Welded',
      nsStringerConnTop: 'Welded',
      fsStringerConnTop: 'Welded'
    }
  ]
};

async function runTest() {
  await configManager.loadConfigs();
  // Inject mock grating factor into configManager
  configManager.configs['grating_factor_mcnichols'] = 1.15;

  const res = await engine.calculateFull(payload, false);
  console.log('--- OUTPUT WITH CONNECTIONS ---');
  if (!res) {
    console.log("No response."); return;
  }
  
  const stair = res.breakdown.stairs[0].systemCalc;
  const sum = res.summary;

  console.log(`Steel Scrap lbs: ${stair.scrapLbs}`);
  console.log(`Shop Hours:      ${sum.totalShopHours}`);
  console.log(`Field Hours:     ${sum.totalFieldHours}`);
  console.log(`Steel lbs base:  ${stair.baseSteelLbs}`);
  
  console.log(JSON.stringify(sum, null, 2));
}

runTest().catch(console.error);
