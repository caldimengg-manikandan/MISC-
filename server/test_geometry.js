const { calculateStairGeometry } = require('./src/services/calculation/stairGeometry.service');

const testCase = {
  totalHeight: { value: 10, unit: 'FT' }, // 120"
  tread: { value: 11, unit: 'IN' }        // 11"
};

console.log('--- STAIR GEOMETRY ENGINE TEST (TEKLA STRICT) ---');
console.log('Input:', JSON.stringify(testCase, null, 2));

try {
  const results = calculateStairGeometry(testCase);
  
  console.log('\n--- VERIFICATION ---');
  console.log(`Risers: ${results.risers === 17 ? 'PASS' : `FAIL (${results.risers})`}`);
  console.log(`Treads: ${results.treads === 16 ? 'PASS' : `FAIL (${results.treads})`}`);
  
  // Angle expected to be ~34
  const expectedAngle = 33.69; // exact atan(10 / (16*11/12)) = atan(10 / 14.666) -> actually wait, 
  // Let's rely on the engine's precision logic and just check approximate values based on user's ≈ markers
  console.log(`Angle (~34°): ${Math.round(results.angle) === 34 ? 'PASS' : `FAIL (${results.angle})`}`);
  console.log(`Length (~17.7ft): ${Math.abs(results.stringerLength - 17.7) < 0.1 ? 'PASS' : `FAIL (${results.stringerLength})`}`);
  
} catch (e) {
  console.error('Calculation failed manually with error:', e.message);
}

