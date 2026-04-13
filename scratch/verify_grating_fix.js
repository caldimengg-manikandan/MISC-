const StairCalculationService = require('../server/src/services/calculation/StairCalculationService');

async function testFix() {
    const mockInput = {
        stairs: [
            {
                id: 'test-stair',
                stairType: 'GRATING TREAD',
                stairWidth: { value: '4.0', unit: 'FT' },
                numRisers: 17,
                finish: 'Galvanized',
                stringerSize: 'Std. 4\'-0" wide 14\'-0 - 19\'-0" Long Stringer/MC 12 X 14.3', // This should match a standard recipe or profile
                totalLFBothStringers: 0, // Not used in recipe mode
                nsStringerBot: { value: '0', unit: 'FT' },
                fsStringerBot: { value: '0', unit: 'FT' },
                nsStringerTop: { value: '0', unit: 'FT' },
                fsStringerTop: { value: '0', unit: 'FT' },
                rise: { value: '7', unit: 'IN' },
                run: { value: '11', unit: 'IN' },
                totalHeight: { value: '119', unit: 'IN' } // 17 risers * 7in = 119in
            }
        ],
        rails: [],
        platforms: [],
        config: {
            galvanize_charge: 0.75,
            powder_coat_rate: 1.7587,
            steel_price_per_lb: 0.75,
            shop_hourly_rate: 70,
            field_hourly_rate: 70
        }
    };

    console.log('Running calculation for Grating + Galvanized...');
    const result = await StairCalculationService.calculateFull(mockInput);
    const stair = result.breakdown.stairs[0].systemCalc;

    console.log('--- Results ---');
    console.log('Stringer Base Weight:', stair.baseSteelLbs);
    console.log('Pans Total Steel Lbs:', stair.pansTotalSteelLbs);
    console.log('Galvanize Total Cost:', stair.galvanizeTotalCost);
    
    const expectedStringerLbs = 1220.6; // Based on user report
    const expectedPanLbs = 680;
    const expectedGalvCost = 1425.45;

    console.log('\n--- Verification ---');
    console.log(`Stringer Lbs Match: ${stair.baseSteelLbs === expectedStringerLbs ? 'PASS' : 'FAIL (Expected ' + expectedStringerLbs + ')'}`);
    console.log(`Pan Lbs Match: ${stair.pansTotalSteelLbs === expectedPanLbs ? 'PASS' : 'FAIL (Expected ' + expectedPanLbs + ')'}`);
    console.log(`Galv Cost Match: ${stair.galvanizeTotalCost === expectedGalvCost ? 'PASS' : 'FAIL (Expected ' + expectedGalvCost + ')'}`);

    // Test Powder Coat
    console.log('\nRunning calculation for Grating + Powder Coat...');
    mockInput.stairs[0].finish = 'Powder Coat';
    const resultPowder = await StairCalculationService.calculateFull(mockInput);
    const stairPowder = resultPowder.breakdown.stairs[0].systemCalc;
    const expectedPowderCost = 3342.59;

    console.log('Powder Total Cost:', stairPowder.finishTotalCost);
    console.log(`Powder Cost Match: ${stairPowder.finishTotalCost === expectedPowderCost ? 'PASS' : 'FAIL (Expected ' + expectedPowderCost + ')'}`);
}

testFix().catch(console.error);
