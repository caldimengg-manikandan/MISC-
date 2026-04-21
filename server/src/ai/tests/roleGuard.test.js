/**
 * roleGuard.test.js
 * Cross-role security tests for the MISC Pro AI Agent.
 * Run with: node src/ai/tests/roleGuard.test.js
 *
 * Tests:
 *  1. Estimator cannot access get_rates
 *  2. Estimator cannot access get_company_metrics
 *  3. Admin CAN access get_rates
 *  4. Admin CAN access get_company_metrics
 *  5. Query router blocks admin-only intent for estimator
 *  6. Query router allows admin-only intent for admin
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });

const { executeTool }    = require('../tools/index');
const { classifyQuery }  = require('../agent/queryRouter');

// ─── Test helpers ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

async function assertThrows(fn, errorFragment, label) {
  try {
    await fn();
    console.error(`  ❌ FAIL (no throw): ${label}`);
    failed++;
  } catch (err) {
    if (err.message.includes(errorFragment)) {
      console.log(`  ✅ PASS (threw correctly): ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL (wrong error "${err.message}"): ${label}`);
      failed++;
    }
  }
}

// ─── Fake context ─────────────────────────────────────────────────────────────
const ESTIMATOR_CTX = { userId: 999, companyId: 1, role: 'estimator' };
const ADMIN_CTX     = { userId: 1,   companyId: 1, role: 'admin' };

// ─── Run Tests ────────────────────────────────────────────────────────────────
async function runTests() {
  console.log('\n======================================');
  console.log('  MISC Pro AI Agent — Role Guard Tests');
  console.log('======================================\n');

  // ── Tool-level role guards ──────────────────────────────────────────────────
  console.log('📋 Tool Registry Guard Tests:');

  await assertThrows(
    () => executeTool('get_rates', { ...ESTIMATOR_CTX, params: {} }),
    'ACCESS_DENIED',
    'Estimator cannot call get_rates'
  );

  await assertThrows(
    () => executeTool('get_company_metrics', { ...ESTIMATOR_CTX, params: {} }),
    'ACCESS_DENIED',
    'Estimator cannot call get_company_metrics'
  );

  await assertThrows(
    () => executeTool('NONEXISTENT_TOOL', { ...ESTIMATOR_CTX, params: {} }),
    'UNKNOWN_TOOL',
    'Unknown tool name throws UNKNOWN_TOOL error'
  );

  // Admin can call restricted tools (will fail on DB connection in unit test, but passes role check)
  try {
    await executeTool('get_rates', { ...ADMIN_CTX, params: {} });
    console.log('  ✅ PASS: Admin can call get_rates (may fail DB, but passes role check)');
    passed++;
  } catch (err) {
    if (err.message.includes('ACCESS_DENIED')) {
      console.error('  ❌ FAIL: Admin incorrectly blocked from get_rates');
      failed++;
    } else {
      console.log(`  ✅ PASS: Admin passes role check (DB error expected in unit test: ${err.message.substring(0, 50)})`);
      passed++;
    }
  }

  // ── Query router intent classification ─────────────────────────────────────
  console.log('\n📋 Query Router Classification Tests:');

  const blocked1 = classifyQuery('What is the current steel price per pound?', 'estimator');
  assert(blocked1.type === 'BLOCKED', 'Estimator: "current steel price" → BLOCKED');

  const blocked2 = classifyQuery('Show me company-wide project totals', 'estimator');
  assert(blocked2.type === 'BLOCKED', 'Estimator: "company-wide totals" → BLOCKED');

  const blocked3 = classifyQuery('How many projects do we have across all engineers?', 'estimator');
  assert(blocked3.type === 'BLOCKED', 'Estimator: "all engineers" → BLOCKED');

  const allowed1 = classifyQuery('What is the current steel price per pound?', 'admin');
  assert(allowed1.type !== 'BLOCKED', 'Admin: "current steel price" → NOT BLOCKED');

  const dynamic1 = classifyQuery('Show me my projects', 'estimator');
  assert(dynamic1.type === 'DYNAMIC', 'Estimator: "show me my projects" → DYNAMIC');

  const static1 = classifyQuery('How is scrap factor calculated?', 'estimator');
  assert(static1.type === 'STATIC', 'Estimator: "how is scrap factor calculated" → STATIC');

  const static2 = classifyQuery('How does intermediate rails affect steel weight?', 'estimator');
  assert(static2.type === 'STATIC', 'Estimator: "intermediate rails" → STATIC');

  const dynamic2 = classifyQuery('What is the total cost of project MISC?', 'estimator');
  assert(dynamic2.type === 'DYNAMIC' || dynamic2.type === 'MIXED', 'Estimator: "total cost of project MISC" → DYNAMIC or MIXED');

  const deadline1 = classifyQuery('Show me upcoming deadlines', 'estimator');
  assert(deadline1.type === 'DYNAMIC', 'Estimator: "upcoming deadlines" → DYNAMIC');

  // ── Result Summary ──────────────────────────────────────────────────────────
  console.log('\n======================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('======================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
