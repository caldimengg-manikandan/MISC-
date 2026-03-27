const StairCalculationService = require('./server/src/services/StairCalculationService');
const configManager = require('./server/src/utils/configManager');

async function runTest() {
    console.log('--- STARTING CONFIG-DRIVEN RAIL CALCULATION VALIDATION ---');
    
    // Load configs
    await configManager.loadConfigs();
    
    const testInput = {
        stairs: [],
        platforms: [],
        rails: [
            {
                id: 'rail-guard-auto',
                railType: '2-Line Steel Pipe Guardrail 1 1/2" Sch. 40 Pipe Rails and Post',
                length: 10
            },
            {
                id: 'rail-wall-auto',
                railType: '1-Line Wall Railing wall bolted - 1 1/2" SCH 40 pipe',
                length: 10
            },
            {
                id: 'rail-cane-auto',
                railType: 'Standard Cane Rail',
                length: 12
            }
        ]
    };

    const result = await StairCalculationService.calculateFull(testInput, true);
    
    if (!result || !result.breakdown.rails.length) {
        console.error('Calculation failed!');
        return;
    }

    console.log(`\n--- AUTOMATED CONFIG-DRIVEN RESULTS ---`);
    
    result.breakdown.rails.forEach(r => {
        const sc = r.systemCalc || {};
        console.log(`\nType: ${r.railType}`);
        console.log(`Config-Driven Spacing: ${sc.spacing || 'N/A'} ft`);
        console.log(`Config-Driven Intermediate Rails: ${sc.intermediateRails}`);
        console.log(`Config-Driven Posts: ${sc.posts}`);
        console.log(`Final Weight: ${r.totalWeight} lb`);
        
        // Specific checks
        if (r.railType.includes('Cane')) {
            if (sc.spacing !== 6) console.error('❌ Cane Spacing should be 6ft');
            if (sc.posts !== 3) console.error('❌ Cane Posts for 12ft @ 6ft spacing should be 3');
            else console.log('✅ Cane Logic Correct');
        }
        if (r.railType.includes('Wall')) {
            if (sc.posts !== 0) console.error('❌ Wall Rail should have 0 posts');
            else console.log('✅ Wall Logic Correct');
        }
    });

}

runTest().catch(console.error);
