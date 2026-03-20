const { calculateStair } = require('../server/src/modules/stairs/stairs.calculator');
const { validateStairInput } = require('../server/src/modules/stairs/stairs.validation');

function runTest(name, input) {
  console.log(`\n--- TEST CASE: ${name} ---`);
  try {
    validateStairInput(input);
    const result = calculateStair(input);
    console.log('Result:', JSON.stringify(result, null, 2));
    return { name, status: 'PASS', result };
  } catch (error) {
    console.log('Caught Expected Error:', error.message);
    return { name, status: 'FAIL_EXPECTED', error: error.message };
  }
}

const tests = [
  {
    name: 'Normal Case (7/11, 10ft)',
    input: { riseIn: 7, runIn: 11, totalHeightFt: 10, widthFt: 3, extBotNS: 6, extBotFS: 6, extTopNS: 6, extTopFS: 6 }
  },
  {
    name: 'Edge Case (Small Rise 5.5, 30ft)',
    input: { riseIn: 5.5, runIn: 12, totalHeightFt: 30, widthFt: 4, extBotNS: 0, extBotFS: 0, extTopNS: 0, extTopFS: 0 }
  },
  {
    name: 'Invalid Input (Negative Rise)',
    input: { riseIn: -7, runIn: 11, totalHeightFt: 10, widthFt: 3 }
  },
  {
    name: 'Invalid Input (Missing Field)',
    input: { runIn: 11, totalHeightFt: 10, widthFt: 3 }
  },
  {
    name: 'Invalid Input (String instead of number)',
    input: { riseIn: 'abc', runIn: 11, totalHeightFt: 10, widthFt: 3 }
  }
];

const results = tests.map(t => runTest(t.name, t.input));

console.log('\n--- QA SUMMARY ---');
results.forEach(r => console.log(`${r.name}: ${r.status}`));
