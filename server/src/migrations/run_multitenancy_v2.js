// server/src/migrations/run_multitenancy_v2.js
// Safe, additive multi-tenancy migration — run once
// All steps are idempotent (guarded with IF NOT EXISTS checks)

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/mssql');
const bcrypt = require('bcryptjs');

async function run() {
  console.log('\n=== MISC Multi-Tenancy Migration v2 ===\n');

  // -------------------------------------------------------
  // STEP 1: companies table
  // -------------------------------------------------------
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'companies')
    CREATE TABLE [dbo].[companies] (
      [id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      [name]       NVARCHAR(255) NOT NULL,
      [slug]       NVARCHAR(100) NOT NULL,
      [plan]       NVARCHAR(50)  NOT NULL DEFAULT 'standard',
      [is_active]  BIT           NOT NULL DEFAULT 1,
      [created_at] DATETIME      NOT NULL DEFAULT GETDATE(),
      CONSTRAINT [UQ_companies_slug] UNIQUE ([slug])
    )
  `);
  console.log('[1] ✓ companies table');

  // -------------------------------------------------------
  // STEP 2: Seed the 3 companies
  // -------------------------------------------------------
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'caldim')
      INSERT INTO companies (name, slug, [plan], is_active)
      VALUES ('Caldim Engineering', 'caldim', 'standard', 1)
  `);
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'steelestimate-test')
      INSERT INTO companies (name, slug, [plan], is_active)
      VALUES ('Steel Estimate Test Co.', 'steelestimate-test', 'standard', 1)
  `);
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'admin-corp')
      INSERT INTO companies (name, slug, [plan], is_active)
      VALUES ('Admin Corp', 'admin-corp', 'standard', 1)
  `);
  console.log('[2] ✓ Seeded companies: Caldim(1), Steel Estimate Test Co.(2), Admin Corp(3)');

  // -------------------------------------------------------
  // STEP 3: Add company_id to all isolated tables
  // -------------------------------------------------------
  const tables = [
    'users', 'projects', 'customers',
    'project_notes', 'project_attachments',
    'estimates', 'estimate_results',
    'estimation_activity_logs', 'takeoff_items'
  ];
  for (const t of tables) {
    await db.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('${t}') AND name = 'company_id')
        ALTER TABLE [dbo].[${t}] ADD [company_id] INT NULL
    `);
  }
  console.log('[3] ✓ Added company_id to all isolated tables');

  // -------------------------------------------------------
  // STEP 4: Add mustChangePassword to users
  // -------------------------------------------------------
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'mustChangePassword')
      ALTER TABLE [dbo].[users] ADD [mustChangePassword] BIT NOT NULL DEFAULT 0
  `);
  console.log('[4] ✓ Added mustChangePassword column to users');

  // -------------------------------------------------------
  // STEP 5: Add fullName to users (if not present)
  // -------------------------------------------------------
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'fullName')
      ALTER TABLE [dbo].[users] ADD [fullName] NVARCHAR(255) NULL
  `);
  console.log('[5] ✓ Added fullName column to users');

  // -------------------------------------------------------
  // STEP 6: Backfill users — explicit per-user assignments
  // -------------------------------------------------------
  // Caldim domain users → company_id = 1
  await db.query(`
    UPDATE [dbo].[users]
    SET company_id = 1
    WHERE company_id IS NULL
      AND (email LIKE '%@caldimengg.in' OR email LIKE '%@caldim.%')
  `);
  // vigneshgovardhan5163@gmail.com → Admin Corp (company_id = 3)
  await db.query(`
    UPDATE [dbo].[users]
    SET company_id = (SELECT id FROM companies WHERE slug = 'admin-corp'),
        role = 'admin'
    WHERE email = 'vigneshgovardhan5163@gmail.com'
  `);
  // e2e test account → Steel Estimate Test Co. (company_id = 2)
  await db.query(`
    UPDATE [dbo].[users]
    SET company_id = (SELECT id FROM companies WHERE slug = 'steelestimate-test'),
        role = 'admin'
    WHERE email = 'e2e.test@steelestimate.com'
  `);
  console.log('[6] ✓ Backfilled user company assignments');

  // -------------------------------------------------------
  // STEP 7: Fix 'user' role → 'estimator' for scoped users (W1)
  // -------------------------------------------------------
  await db.query(`
    UPDATE [dbo].[users]
    SET role = 'estimator'
    WHERE role = 'user' AND company_id IS NOT NULL
  `);
  console.log('[7] ✓ Upgraded role=user → estimator for company-linked users');

  // -------------------------------------------------------
  // STEP 8: Backfill projects → company_id = 1
  // -------------------------------------------------------
  await db.query(`UPDATE [dbo].[projects] SET company_id = 1 WHERE company_id IS NULL`);
  console.log('[8] ✓ Backfilled projects → company_id = 1');

  // -------------------------------------------------------
  // STEP 9: Backfill customers → company_id = 1
  // -------------------------------------------------------
  await db.query(`UPDATE [dbo].[customers] SET company_id = 1 WHERE company_id IS NULL`);
  console.log('[9] ✓ Backfilled customers → company_id = 1');

  // -------------------------------------------------------
  // STEP 10: Backfill project_notes (camelCase FK: projectId)
  // -------------------------------------------------------
  await db.query(`
    UPDATE pn SET pn.company_id = p.company_id
    FROM [dbo].[project_notes] pn
    JOIN [dbo].[projects] p ON pn.projectId = p.id
    WHERE pn.company_id IS NULL
  `);
  console.log('[10] ✓ Backfilled project_notes');

  // -------------------------------------------------------
  // STEP 11: Backfill project_attachments (camelCase FK: projectId)
  // -------------------------------------------------------
  await db.query(`
    UPDATE pa SET pa.company_id = p.company_id
    FROM [dbo].[project_attachments] pa
    JOIN [dbo].[projects] p ON pa.projectId = p.id
    WHERE pa.company_id IS NULL
  `);
  console.log('[11] ✓ Backfilled project_attachments');

  // -------------------------------------------------------
  // STEP 12: Backfill estimates via project_id FK
  // -------------------------------------------------------
  await db.query(`
    UPDATE e SET e.company_id = p.company_id
    FROM [dbo].[estimates] e
    JOIN [dbo].[projects] p ON e.project_id = p.id
    WHERE e.company_id IS NULL
  `);
  console.log('[12] ✓ Backfilled estimates');

  // -------------------------------------------------------
  // STEP 13: Backfill estimate_results via estimate chain
  // -------------------------------------------------------
  await db.query(`
    UPDATE er SET er.company_id = p.company_id
    FROM [dbo].[estimate_results] er
    JOIN [dbo].[estimates] est ON er.estimate_id = est.id
    JOIN [dbo].[projects] p ON est.project_id = p.id
    WHERE er.company_id IS NULL
  `);
  console.log('[13] ✓ Backfilled estimate_results');

  // -------------------------------------------------------
  // STEP 14: Backfill estimation_activity_logs (FK: estimationId)
  // -------------------------------------------------------
  await db.query(`
    UPDATE al SET al.company_id = p.company_id
    FROM [dbo].[estimation_activity_logs] al
    JOIN [dbo].[projects] p ON al.estimationId = p.id
    WHERE al.company_id IS NULL
  `);
  console.log('[14] ✓ Backfilled estimation_activity_logs');

  // -------------------------------------------------------
  // STEP 15: Backfill takeoff_items via estimate chain
  // -------------------------------------------------------
  await db.query(`
    UPDATE ti SET ti.company_id = p.company_id
    FROM [dbo].[takeoff_items] ti
    JOIN [dbo].[estimates] est ON ti.estimate_id = est.id
    JOIN [dbo].[projects] p ON est.project_id = p.id
    WHERE ti.company_id IS NULL
  `);
  console.log('[15] ✓ Backfilled takeoff_items');

  // -------------------------------------------------------
  // STEP 16: Seed estimator@caldim.com and admin@caldim.com
  // -------------------------------------------------------
  const pwHash = await bcrypt.hash('12345678', 12);

  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'estimator@caldim.com')
      INSERT INTO [dbo].[users]
        (email, [password], company, [role], company_id, [plan], isPaid, subscriptionStatus, mustChangePassword, createdAt)
      VALUES ('estimator@caldim.com', ?, 'Caldim Engineering', 'estimator', 1, 'standard', 1, 'active', 1, GETDATE())
  `, [pwHash]);

  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@caldim.com')
      INSERT INTO [dbo].[users]
        (email, [password], company, [role], company_id, [plan], isPaid, subscriptionStatus, mustChangePassword, createdAt)
      VALUES ('admin@caldim.com', ?, 'Caldim Engineering', 'admin', 1, 'standard', 1, 'active', 1, GETDATE())
  `, [pwHash]);

  console.log('[16] ✓ Seeded estimator@caldim.com and admin@caldim.com (mustChangePassword=1)');

  // -------------------------------------------------------
  // STEP 17: Verification
  // -------------------------------------------------------
  console.log('\n=== Verification Counts ===');
  const checks = [
    ['companies',                       `SELECT COUNT(*) as n FROM companies`],
    ['users total',                     `SELECT COUNT(*) as n FROM users`],
    ['users company_id=1 (Caldim)',     `SELECT COUNT(*) as n FROM users WHERE company_id = 1`],
    ['users company_id=2 (Test)',       `SELECT COUNT(*) as n FROM users WHERE company_id = 2`],
    ['users company_id=3 (AdminCorp)', `SELECT COUNT(*) as n FROM users WHERE company_id = 3`],
    ['users company_id=NULL',           `SELECT COUNT(*) as n FROM users WHERE company_id IS NULL`],
    ['projects company_id=1',           `SELECT COUNT(*) as n FROM projects WHERE company_id = 1`],
    ['projects company_id=NULL',        `SELECT COUNT(*) as n FROM projects WHERE company_id IS NULL`],
    ['customers company_id=1',          `SELECT COUNT(*) as n FROM customers WHERE company_id = 1`],
    ['estimates company_id=1',          `SELECT COUNT(*) as n FROM estimates WHERE company_id = 1`],
    ['estimation_activity_logs cid=1',  `SELECT COUNT(*) as n FROM estimation_activity_logs WHERE company_id = 1`],
  ];
  for (const [label, sql] of checks) {
    const [rows] = await db.query(sql);
    console.log(`  ${label.padEnd(40)} → ${rows[0].n}`);
  }

  console.log('\n=== Migration Complete ✓ ===\n');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
