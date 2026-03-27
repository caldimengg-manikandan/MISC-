const calcService = require('./server/src/services/StairCalculationService');
const configManager = require('./server/src/utils/configManager');

async function test() {
  await configManager.loadConfigs();
  const payload = {
    stairs: [],
    rails: [
      { id: 'guard-20', railType: '3-Line Steel Pipe Guardrail 1 1/4" SCH. 40 Pipe Rails and Posts', length: 20 },
      { id: 'cane-10', railType: 'Standard Cane Rail', length: 10 },
      { id: 'grab-30', railType: '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe', length: 30 }
    ],
    platforms: []
  };
  
  try {
    const result = await calcService.calculateFull(payload);
    
    // Test 1: Guard Rail 20 ft
    const r1 = result.breakdown.rails.find(r => r.id === 'guard-20');
    console.log(`Test 1 (Guard 20ft): Posts=${r1.systemCalc.posts}, Spacing=${r1.systemCalc.actualSpacing}`);
    
    // Test 2: Cane Rail 10 ft
    const r2 = result.breakdown.rails.find(r => r.id === 'cane-10');
    console.log(`Test 2 (Cane 10ft): Posts=${r2.systemCalc.posts}, Spacing=${r2.systemCalc.actualSpacing}`);

    // Test 3: Grab Rail 30 ft
    const r3 = result.breakdown.rails.find(r => r.id === 'grab-30');
    console.log(`Test 3 (Grab 30ft): Brackets=${r3.systemCalc.bracketQty}, Spacing=${r3.systemCalc.actualSpacing}`);

  } catch (err) {
    console.error(err);
  }
}

test();
