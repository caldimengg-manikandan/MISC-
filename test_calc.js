const StairCalculationService = require('./server/src/services/StairCalculationService');
const configManager = require('./server/src/utils/configManager');

async function runTest() {
    console.log('--- STARTING TEKLA GEOMETRY VALIDATION ---');
    
    // Load configs first
    await configManager.loadConfigs();
    
    const testInput = {
        stairs: [{
            id: 'stair-validation',
            stairType: 'pan-concrete',
            width: 63/12, // Needs to be in Feet per frontend normalization
            run: 11, // inches
            rise: 7, // inches
            risers: 14,
            totalHeight: 97.625, // inches
            stringerType: 'W8x31',
            nsStringerBot: 1,  // 1ft extent
            fsStringerBot: 1,  // 1ft extent
            nsStringerTop: 1,  // 1ft extent
            fsStringerTop: 1   // 1ft extent
        }],
        rails: [],
        platforms: []
    };

    console.log('Input Parameters:');
    console.log('Total Height: 97.625", Run: 11", Risers: 14, Width: 63"');
    console.log('Stringer: W8x31 (31 lb/ft) + 4ft of extents');
    console.log('-----------------------------------');

    const result = await StairCalculationService.calculateFull(testInput, true);
    
    if (!result) {
        console.error('Calculation failed!');
        return;
    }

    const s = result.breakdown.stairs[0];
    const details = s.weightDetails || {};

    console.log('\n--- GEOMETRY RESULTS ---');
    console.log(`Angle: ${s.angle}° (Expected ≈ 32.37°)`);
    console.log(`Stringer Length: ${s.stringerLength} ft (Expected ≈ 15.19 ft)`);
    console.log(`Pan Area: ${s.panArea} sqft (Expected ≈ 67.4 sqft)`);

    console.log('\n--- WEIGHT RESULTS ---');
    console.log(`Base Weight (Pure Geometry): ${details.baseWeight} lb`);
    console.log(`Fab Allowance (8% Adds):     ${details.fabricationAddedWeight} lb`);
    console.log(`Scrap Added (11% on Adj):    ${details.scrapAddedWeight} lb`);
    console.log(`Final Total Estimated:       ${s.totalWeight} lb`);
    
    // Validation check
    const expectedFinal = details.baseWeight * 1.08 * 1.11;
    console.log(`\nVerification: (Base x 1.08 x 1.11) = ${expectedFinal.toFixed(2)} lb`);
    if (Math.abs(s.totalWeight - expectedFinal) < 10) {
        console.log("✅ Weight Calculation matches Industry Standard (1.08 x 1.11)");
    } else {
        console.log(`❌ Weight Calculation Discrepancy! Expected ${expectedFinal.toFixed(2)}, got ${s.totalWeight}`);
    }
    
    console.log('\n--- FORMULA TRACE ---');
    result.formulaTrace.forEach(t => {
        console.log(`[${t.component}] ${t.formula} = ${t.output}`);
    });
}

runTest().catch(console.error);
