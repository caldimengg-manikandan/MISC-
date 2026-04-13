const { calculateStairGeometry } = require('./src/services/calculation/stairGeometry.service');

const testCase = {
  totalHeight: { value: 10, unit: 'FT' }, // 120"
  tread: { value: 11, unit: 'IN' },        // 11"
  rise: { value: 7, unit: 'IN' },         // 7" -> 120/7 = 17.14 -> 17 risers
  risers: 2                               // STALE INPUT: Should be ignored because target rise is provided
};

console.log('--- STALE RISERS OVERRIDE TEST ---');
try {
  const res = calculateStairGeometry(testCase);
  console.log(`Risers expected 17: ${res.risers === 17 ? 'PASS' : `FAIL (${res.risers})`}`);
  console.log(`Angle expected ~32.7: ${res.angle} (Angle: ${res.angle})`);
} catch (e) {
  console.error(e);
}
