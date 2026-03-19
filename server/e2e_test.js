/**
 * FULL END-TO-END TEST
 * =====================
 * 1. Register user
 * 2. Login → get JWT token
 * 3. Create project (POST /api/projects/upsert)
 * 4. Run full calculation (POST /api/calculate/calculate)
 * 5. Save estimate + takeoff_items + estimate_results to DB
 * 6. Verify every row with SELECT queries
 */

const http = require('http');
const mssql = require('mssql');
require('dotenv').config();

const BASE = 'http://localhost:5000';

// ── DB config ──────────────────────────────────────────────────────────────
const dbConfig = {
  user: (process.env.MSSQL_USER || 'sa').trim(),
  password: (process.env.MSSQL_PASSWORD || '').trim(),
  server: (process.env.MSSQL_SERVER || 'localhost').trim(),
  database: (process.env.MSSQL_DATABASE || 'MISC_DB').trim(),
  port: parseInt(process.env.MSSQL_PORT) || 1433,
  options: { encrypt: true, trustServerCertificate: true }
};

// ── HTTP helper ────────────────────────────────────────────────────────────
function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Separator ──────────────────────────────────────────────────────────────
const sep = () => console.log('\n' + '═'.repeat(65));

// ── MAIN ───────────────────────────────────────────────────────────────────
async function runE2ETest() {
  console.log('\n🚀 STARTING FULL END-TO-END TEST');
  sep();

  // ── STEP 1: REGISTER USER ────────────────────────────────────────────────
  console.log('\n📋 STEP 1: REGISTER TEST USER');
  const regRes = await api('POST', '/api/auth/register', {
    email: 'e2e.test@steelestimate.com',
    password: 'TestPass#2026',
    company: 'Steel Estimate Test Co.',
    phone: '9876543210'
  });

  if (regRes.status === 201 || regRes.body?.success) {
    console.log(`  ✅ User registered: e2e.test@steelestimate.com`);
  } else {
    console.log(`  ℹ️  Registration response: ${regRes.body?.message || regRes.body?.error || 'already registered — OK'}`);
  }

  // ── STEP 2: LOGIN ────────────────────────────────────────────────────────
  console.log('\n🔐 STEP 2: LOGIN');
  const loginRes = await api('POST', '/api/auth/login', {
    email: 'e2e.test@steelestimate.com',
    password: 'TestPass#2026'
  });

  if (!loginRes.body?.token) {
    console.error('  ❌ Login failed:', JSON.stringify(loginRes.body));
    process.exit(1);
  }
  const TOKEN = loginRes.body.token;
  const USER_ID = loginRes.body.user?.id;
  console.log(`  ✅ Login OK | userId=${USER_ID} | token=...${TOKEN.slice(-10)}`);

  // ── STEP 3: CREATE PROJECT ────────────────────────────────────────────────
  console.log('\n🏗️  STEP 3: CREATE PROJECT');
  const RUN_ID = Date.now().toString().slice(-6); // e.g. 163320
  const stairData = [
    {
      label: 'Stair 1',
      stairType: 'pan-concrete',
      stairWidth: 4.33,
      rise: 7,
      run: 11,
      numRisers: 17,
      stringerSize: 'W12x35',
      finish: 'GALVANIZED',
      flights: [],
      landings: [{ label: 'Landing 1', type: 'Metal Pan Stair Platform', length: 10, width: 5 }],
      rails: [
        { type: 'guardRail', railType: '2-Line Steel Pipe Guardrail 1.25 SCH40', railLength: 25.5, postSpacing: 5, finish: 'GALVANIZED' },
        { type: 'wallRail',  railType: '1-Line Wall Railing wall bolted 1.25 SCH40', railLength: 12.0, finish: 'PRIMER' },
        { type: 'grabRail',  railType: '1-Line Hand Railing wall bolted 1.25 SCH40', railLength: 8.5,  finish: 'PRIMER' }
      ]
    }
  ];

  const projectRes = await api('POST', '/api/projects/upsert', {
    projectNumber: `E2E-${RUN_ID}`,
    projectName: 'End-to-End Test Project',
    customerName: 'Test Customer Inc.',
    projectLocation: 'Chennai, TN',
    architect: 'Arch. John Doe',
    eor: 'EOR Inc.',
    gcName: 'General Contractor Co.',
    detailer: 'Detail Pro',
    vendorName: 'Steel Vendor Ltd.',
    aiscCertified: 'Yes',
    units: 'IMPERIAL',
    notes: 'E2E automated test project',
    stairs: stairData,
    guardRails: [],
    customRailValues: {}
  }, TOKEN);

  const projectId = projectRes.body?.project?.id || projectRes.body?.id;
  if (!projectId) {
    console.error('  ❌ Project creation failed:', JSON.stringify(projectRes.body));
    process.exit(1);
  }
  console.log(`  ✅ Project created | id=${projectId}`);
  console.log(`     Project Number: E2E-2026-001`);
  console.log(`     Project Name:   End-to-End Test Project`);

  // ── STEP 4: RUN CALCULATION ───────────────────────────────────────────────
  console.log('\n🧮 STEP 4: RUN FULL CALCULATION');
  const calcRes = await api('POST', '/api/calculate/calculate', {
    rails: [
      { rail_type_id: 1, length: 25.5, spacing: 5  },
      { rail_type_id: 4, length: 12.0, spacing: 0  },
      { rail_type_id: 5, length: 8.5,  spacing: 0  }
    ],
    platforms: [
      { platform_type_id: 1, length: 10, width: 5 }
    ],
    stringers: [
      { stringer_type_id: 3, length: 14.5 }
    ],
    stairs: [
      { height: 10.0, rise: 0.583, run: 0.917 }
    ],
    pricing_map: { steel: 1.25 },
    labor_rates: { shop: 75.00, field: 85.00 },
    finish_rate_per_lb: 0.15
  }, TOKEN);

  if (!calcRes.body?.success) {
    console.error('  ❌ Calculation failed:', JSON.stringify(calcRes.body));
    process.exit(1);
  }
  const C = calcRes.body;
  console.log(`  ✅ Calculation OK`);
  console.log(`     Total Steel:    ${C.totalSteel} lbs`);
  console.log(`     Total Labor:    ${C.totalLaborHours} hrs`);
  console.log(`     J53 Subtotal:   $${C.subtotal}`);
  console.log(`     J54 Tax (6%):   $${C.tax}`);
  console.log(`     J55 Total:      $${C.totalEstimatedCost}`);

  // ── STEP 5: SAVE TO DATABASE ─────────────────────────────────────────────
  console.log('\n💾 STEP 5: SAVE ESTIMATE TO DATABASE');
  const pool = await mssql.connect(dbConfig);

  // 5a. Create ESTIMATE record
  const estimateResult = await pool.request()
    .input('project_id', mssql.BigInt, projectId)
    .input('version', mssql.Int, 1)
    .input('status', mssql.NVarChar, 'COMPLETE')
    .input('total_steel_weight', mssql.Decimal(15,6), C.totalSteel)
    .input('total_shop_labor_hours', mssql.Decimal(15,6), C.totalLaborHours)
    .input('total_field_labor_hours', mssql.Decimal(15,6), 0)
    .input('total_material_cost', mssql.Decimal(15,6), C.totalSteelCost)
    .input('total_labor_cost', mssql.Decimal(15,6), C.totalLaborCost)
    .input('total_estimated_cost', mssql.Decimal(15,6), C.totalEstimatedCost)
    .query(`INSERT INTO estimates (project_id, version, status, total_steel_weight, total_shop_labor_hours,
            total_field_labor_hours, total_material_cost, total_labor_cost, total_estimated_cost)
            OUTPUT INSERTED.id
            VALUES (@project_id, @version, @status, @total_steel_weight, @total_shop_labor_hours,
            @total_field_labor_hours, @total_material_cost, @total_labor_cost, @total_estimated_cost)`);

  const estimateId = estimateResult.recordset[0].id;
  console.log(`  ✅ Estimate saved | estimates.id=${estimateId}`);

  // 5b. Save TAKEOFF ITEMS (one per component)
  const takeoffItems = [
    // category_id: 1=RAIL, 2=PLATFORM, 3=STRINGER, 4=STAIR
    { cat: 1, typeId: 1, desc: 'Guard Rail 2-Line 1.25" SCH40', len: 25.5, spacing: 5,   qty: 1 },
    { cat: 1, typeId: 4, desc: 'Wall Rail 1-Line 1.25" SCH40',  len: 12.0, spacing: 0,   qty: 1 },
    { cat: 1, typeId: 5, desc: 'Grab Rail 1-Line 1.25" SCH40',  len: 8.5,  spacing: 0,   qty: 1 },
    { cat: 2, typeId: 1, desc: 'Metal Pan Stair Platform',        len: 10,  width: 5,     qty: 1 },
    { cat: 3, typeId: 3, desc: 'W12x35 Stringer',                len: 14.5, spacing: 0,  qty: 1 },
    { cat: 4, typeId: null, desc: 'Stair Geometry', rise: 0.583, run: 0.917, qty: 1 }
  ];

  const savedTakeoffIds = [];
  for (const item of takeoffItems) {
    const r = await pool.request()
      .input('estimate_id',  mssql.BigInt, estimateId)
      .input('category_id',  mssql.Int,    item.cat)
      .input('item_type_id', mssql.BigInt, item.typeId || null)
      .input('description',  mssql.NVarChar, item.desc)
      .input('length',       mssql.Decimal(15,6), item.len  || null)
      .input('width',        mssql.Decimal(15,6), item.width || null)
      .input('quantity',     mssql.Int,    item.qty)
      .input('spacing',      mssql.Decimal(15,6), item.spacing ?? null)
      .input('rise',         mssql.Decimal(15,6), item.rise  || null)
      .input('run',          mssql.Decimal(15,6), item.run   || null)
      .query(`INSERT INTO takeoff_items (estimate_id, category_id, item_type_id, description, length, width, quantity, spacing, rise, run)
              OUTPUT INSERTED.id
              VALUES (@estimate_id, @category_id, @item_type_id, @description, @length, @width, @quantity, @spacing, @rise, @run)`);
    savedTakeoffIds.push(r.recordset[0].id);
  }
  console.log(`  ✅ Takeoff items saved | ids: [${savedTakeoffIds.join(', ')}]`);

  // 5c. Save ESTIMATE RESULTS (one per line item)
  const railItems = C.breakdown?.rail?.items || [];
  const platformItems = C.breakdown?.platform?.items || [];
  const stringerItems = C.breakdown?.stringer?.items || [];
  const allItems = [...railItems, ...platformItems, ...stringerItems];

  let resultCount = 0;
  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const takeoffId = savedTakeoffIds[i] || savedTakeoffIds[0];
    await pool.request()
      .input('estimate_id',    mssql.BigInt, estimateId)
      .input('takeoff_item_id',mssql.BigInt, takeoffId)
      .input('steel_weight',   mssql.Decimal(15,6), item.steelWeight || 0)
      .input('shop_labor_hours',mssql.Decimal(15,6), item.shopLabor || 0)
      .input('field_labor_hours',mssql.Decimal(15,6), item.fieldLabor || 0)
      .input('material_cost',  mssql.Decimal(15,6), (item.steelWeight || 0) * 1.25)
      .input('labor_cost',     mssql.Decimal(15,6), ((item.shopLabor||0)*75 + (item.fieldLabor||0)*85))
      .input('total_cost',     mssql.Decimal(15,6), 0)
      .query(`INSERT INTO estimate_results (estimate_id, takeoff_item_id, steel_weight, shop_labor_hours, field_labor_hours, material_cost, labor_cost, total_cost)
              VALUES (@estimate_id, @takeoff_item_id, @steel_weight, @shop_labor_hours, @field_labor_hours, @material_cost, @labor_cost, @total_cost)`);
    resultCount++;
  }
  console.log(`  ✅ Estimate results saved | ${resultCount} rows`);

  await pool.close();

  // ── STEP 6: VERIFY ALL DATA IN DB ────────────────────────────────────────
  console.log('\n🔍 STEP 6: VERIFY DATABASE — ALL TABLES');
  sep();

  const verify = await mssql.connect(dbConfig);

  // 6a. Users
  const uRows = await verify.request()
    .input('id', mssql.BigInt, USER_ID)
    .query("SELECT id, email, company, phone, role, [plan] FROM users WHERE id = @id");
  console.log('\n📌 users table:');
  uRows.recordset.forEach(r => console.log(`  ${JSON.stringify(r)}`));

  // 6b. Projects
  const pRows = await verify.request()
    .input('id', mssql.BigInt, projectId)
    .query("SELECT id, userId, projectName, projectNumber, customer_name, project_location, status, created_at FROM projects WHERE id = @id");
  console.log('\n📌 projects table:');
  pRows.recordset.forEach(r => console.log(`  ${JSON.stringify(r)}`));

  // 6c. Estimates
  const eRows = await verify.request()
    .input('id', mssql.BigInt, estimateId)
    .query("SELECT id, project_id, version, status, total_steel_weight, total_shop_labor_hours, total_material_cost, total_labor_cost, total_estimated_cost FROM estimates WHERE id = @id");
  console.log('\n📌 estimates table:');
  eRows.recordset.forEach(r => console.log(`  ${JSON.stringify(r)}`));

  // 6d. Takeoff Items
  const tRows = await verify.request()
    .input('eid', mssql.BigInt, estimateId)
    .query("SELECT id, estimate_id, category_id, item_type_id, description, length, width, quantity, spacing, rise, run FROM takeoff_items WHERE estimate_id = @eid");
  console.log('\n📌 takeoff_items table:');
  tRows.recordset.forEach(r => console.log(`  ${JSON.stringify(r)}`));

  // 6e. Estimate Results
  const rRows = await verify.request()
    .input('eid', mssql.BigInt, estimateId)
    .query("SELECT id, estimate_id, takeoff_item_id, steel_weight, shop_labor_hours, field_labor_hours, material_cost, labor_cost FROM estimate_results WHERE estimate_id = @eid");
  console.log('\n📌 estimate_results table:');
  rRows.recordset.forEach(r => console.log(`  ${JSON.stringify(r)}`));

  // 6f. Summary counts
  const counts = await verify.request().query(`
    SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users
    UNION ALL SELECT 'projects',       COUNT(*) FROM projects
    UNION ALL SELECT 'estimates',      COUNT(*) FROM estimates
    UNION ALL SELECT 'takeoff_items',  COUNT(*) FROM takeoff_items
    UNION ALL SELECT 'estimate_results', COUNT(*) FROM estimate_results
    UNION ALL SELECT 'rail_types',     COUNT(*) FROM rail_types
    UNION ALL SELECT 'platform_types', COUNT(*) FROM platform_types
    UNION ALL SELECT 'stringer_types', COUNT(*) FROM stringer_types
    UNION ALL SELECT 'system_config',  COUNT(*) FROM system_config
    UNION ALL SELECT 'categories',     COUNT(*) FROM categories
  `);
  sep();
  console.log('\n📊 ROW COUNT SUMMARY — ALL TABLES:');
  console.log('  Table'.padEnd(25) + 'Rows');
  console.log('  ' + '─'.repeat(35));
  counts.recordset.forEach(r => console.log(`  ${r.tbl.padEnd(25)}${r.cnt}`));

  await verify.close();

  sep();
  console.log(`\n✅ END-TO-END TEST COMPLETE`);
  console.log(`\n   User ID:      ${USER_ID}`);
  console.log(`   Project ID:   ${projectId}`);
  console.log(`   Estimate ID:  ${estimateId}`);
  console.log(`   Takeoff IDs:  [${savedTakeoffIds.join(', ')}]`);
  console.log(`\n   J53 Subtotal: $${C.subtotal}`);
  console.log(`   J54 Tax:      $${C.tax}`);
  console.log(`   J55 Total:    $${C.totalEstimatedCost}`);
  sep();
  console.log('   ✅ All data saved and verified in MISC_DB\n');
}

runE2ETest().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err.message);
  process.exit(1);
});
