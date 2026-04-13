const { calculateStairGeometry } = require('./src/services/calculation/stairGeometry.service');

const testCase = {
  totalHeight: { value: 10, unit: 'FT' }, // 120"
  tread: { value: 11, unit: 'IN' },       // 11"
  rise: { value: 8, unit: 'IN' }         // 8" -> 120/8 = 15 risers
};

console.log('--- CUSTOM RISE TEST ---');
try {
  const res = calculateStairGeometry(testCase);
  console.log(`Risers expected 15: ${res.risers === 15 ? 'PASS' : `FAIL (${res.risers})`}`);
  console.log(`Angle expected ~36: ${Math.round(res.angle)} (Calculated: ${res.angle})`);
} catch (e) {
  console.error(e);
}
