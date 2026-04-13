// Simplified verification of the fix in StairCalculationService logic
const risers = 17;
const resolvedWidth = 4.0;
const strLbs = 10.600; // Expected from Std. recipe for 4ft wide stringer
const stairTypeLabel = 'GRATING TREAD';

// Logic from StairCalculationService (after fix)
let currentStrLbs = 0;
let panLbs = 0;

if (stairTypeLabel.includes('PAN')) {
    currentStrLbs = 10.600;
    panLbs = resolvedWidth * 10.0;
} else if (stairTypeLabel.includes('GRATING')) {
    currentStrLbs = 10.600;
    // FIX APPLIED HERE:
    panLbs = resolvedWidth * 10.0; 
}

const stringerBaseWeight = risers * currentStrLbs;
const panTotalWeight = risers * panLbs;
const finishBaseLbs = stringerBaseWeight + panTotalWeight;

const isGalv = true;
const finishRate = 0.75;
const finishTotalCost = finishBaseLbs * finishRate;

console.log('--- Verification Summary ---');
console.log('Stringer Base Weight:', stringerBaseWeight);
console.log('Pans Total Steel Lbs:', panTotalWeight);
console.log('Finish Base Lbs:', finishBaseLbs);
console.log('Galvanize Total Cost:', finishTotalCost.toFixed(2));

const expectedGalvCost = 1425.45;
console.log(`\nMatch Expected ($1425.45): ${finishTotalCost.toFixed(2) == expectedGalvCost ? 'PASS' : 'FAIL'}`);

// Powder Coat test
const finishRatePowder = 1.7587;
const finishTotalCostPowder = finishBaseLbs * finishRatePowder;
console.log('\nPowder Coat Total Cost:', finishTotalCostPowder.toFixed(2));
const expectedPowderCost = 3342.59;
console.log(`Match Expected ($3342.59): ${finishTotalCostPowder.toFixed(2) == expectedPowderCost ? 'PASS' : 'FAIL'}`);
