// server/src/migrations/run_license_session_v1.js
// License + Session + OTP migration — fully idempotent (safe to re-run)
// Run: node server/src/migrations/run_license_session_v1.js

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/mssql');
const bcrypt = require('bcryptjs');

const col = (table, name) =>
  `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('${table}') AND name = '${name}')`;

async function run() {
  console.log('\n=== MISC License + Session Migration v1 ===\n');

  // ─────────────────────────────────────────────────
  // STEP 1 — CREATE licenses table (C3: 4 invite cols)
  // ─────────────────────────────────────────────────
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'licenses')
    CREATE TABLE [dbo].[licenses] (
      [id]                  INT IDENTITY PRIMARY KEY,
      [license_key]         NVARCHAR(64)  NOT NULL UNIQUE,
      [admin_user_id]       BIGINT        NULL,
      [license_type]        NVARCHAR(50)  NOT NULL DEFAULT 'standard',
      [max_estimators]      INT           NOT NULL DEFAULT 3,
      [valid_from]          DATE          NOT NULL,
      [valid_until]         DATE          NOT NULL,
      [is_active]           BIT           NOT NULL DEFAULT 1,
      [created_by]          BIGINT        NOT NULL,
      [created_at]          DATETIME      NOT NULL DEFAULT GETDATE(),
      [notes]               NVARCHAR(MAX) NULL,
      [invite_token]        NVARCHAR(128) NULL,
      [invite_email]        NVARCHAR(255) NULL,
      [invite_sent_at]      DATETIME      NULL,
      [invite_accepted_at]  DATETIME      NULL
    )
  `);
  console.log('[1] ✓ licenses table');

  // ─────────────────────────────────────────────────
  // STEP 2 — CREATE superadmin_activity_log table
  // ─────────────────────────────────────────────────
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'superadmin_activity_log')
    CREATE TABLE [dbo].[superadmin_activity_log] (
      [id]          INT IDENTITY PRIMARY KEY,
      [actor_id]    BIGINT        NOT NULL,
      [action]      NVARCHAR(100) NOT NULL,
      [target_id]   BIGINT        NULL,
      [target_type] NVARCHAR(50)  NULL,
      [detail]      NVARCHAR(MAX) NULL,
      [created_at]  DATETIME      NOT NULL DEFAULT GETDATE()
    )
  `);
  console.log('[2] ✓ superadmin_activity_log table');

  // ─────────────────────────────────────────────────
  // STEP 3 — ALTER users: all session + OTP + ownership columns
  // C4: mustChangePassword guarded separately in case multitenancy v2 was skipped
  // ─────────────────────────────────────────────────
  const userCols = [
    ['mustChangePassword', 'BIT NOT NULL DEFAULT 0'],       // C4 guard
    ['admin_owner_id',     'BIGINT NULL'],                  // links estimators to admin
    ['session_token',      'NVARCHAR(255) NULL'],           // single session enforcement
    ['session_ip',         'NVARCHAR(50) NULL'],            // OTP device detection
    ['session_device',     'NVARCHAR(500) NULL'],           // User-Agent hash
    ['session_device_id',  'NVARCHAR(100) NULL'],           // UUID cookie (W5)
    ['session_at',         'DATETIME NULL'],                // last login timestamp
    ['otp_code',           'NVARCHAR(10) NULL'],            // device-change OTP
    ['otp_expires_at',     'DATETIME NULL'],
    ['otp_attempts',       'INT NOT NULL DEFAULT 0'],
    ['otp_resend_count',   'INT NOT NULL DEFAULT 0'],       // W6: resend cap
    ['otp_resend_window_start', 'DATETIME NULL'],           // W6: resend window
    ['locked_until',       'DATETIME NULL'],                // 15-min lockout
  ];
  for (const [name, def] of userCols) {
    await db.query(`
      ${col('users', name)}
        ALTER TABLE [dbo].[users] ADD [${name}] ${def}
    `);
  }
  console.log('[3] ✓ users: session + OTP + ownership columns');

  // ─────────────────────────────────────────────────
  // STEP 4 — ADD owner_admin_id to projects, customers, estimates
  // ─────────────────────────────────────────────────
  for (const t of ['projects', 'customers', 'estimates']) {
    await db.query(`
      ${col(t, 'owner_admin_id')}
        ALTER TABLE [dbo].[${t}] ADD [owner_admin_id] BIGINT NULL
    `);
  }
  console.log('[4] ✓ owner_admin_id → projects, customers, estimates');

  // ─────────────────────────────────────────────────
  // STEP 5 — ADD owner_admin_id to 5 missing tables (I2)
  // ─────────────────────────────────────────────────
  for (const t of [
    'estimation_activity_logs',
    'estimate_results',
    'takeoff_items',
    'project_notes',
    'project_attachments',
  ]) {
    // Two-step: check table exists, then check column doesn't exist
    const [tbl] = await db.query(`SELECT 1 as found FROM sys.tables WHERE name = '${t}'`);
    if (tbl.length === 0) { console.log(`  [5] Skipped ${t} (table not found)`); continue; }
    const [col2] = await db.query(`SELECT 1 as found FROM sys.columns WHERE object_id = OBJECT_ID('${t}') AND name = 'owner_admin_id'`);
    if (col2.length === 0) {
      await db.query(`ALTER TABLE [dbo].[${t}] ADD [owner_admin_id] BIGINT NULL`);
    }
  }
  console.log('[5] ✓ owner_admin_id → 5 supplementary tables');

  // ─────────────────────────────────────────────────
  // STEP 6 — Role updates
  // Drop check constraint on role column first (may not allow 'superadmin'/'estimator')
  // ─────────────────────────────────────────────────
  await db.query(`
    IF EXISTS (
      SELECT 1 FROM sys.check_constraints
      WHERE parent_object_id = OBJECT_ID('users') AND name LIKE '%role%'
    )
    BEGIN
      DECLARE @cname NVARCHAR(200)
      SELECT @cname = name FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID('users') AND name LIKE '%role%'
      EXEC('ALTER TABLE [dbo].[users] DROP CONSTRAINT [' + @cname + ']')
    END
  `);
  console.log('[6a] ✓ Dropped role check constraint (if any)');

  await db.query(`UPDATE [dbo].[users] SET [role] = 'estimator' WHERE [role] = 'user'`);
  await db.query(`UPDATE [dbo].[users] SET [role] = 'superadmin' WHERE email = 'admin@caldim.com'`);
  console.log('[6b] ✓ Roles: user→estimator, admin@caldim.com→superadmin');


  // ─────────────────────────────────────────────────
  // STEP 7 — Seed superadmin@miscpro.com (W4: mustChangePassword = 1)
  // ─────────────────────────────────────────────────
  const pwHash = await bcrypt.hash('MISC@SuperAdmin2026!', 12);
  await db.query(`
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@miscpro.com')
      INSERT INTO [dbo].[users]
        (email, [password], [role], isPaid, subscriptionStatus, mustChangePassword, createdAt)
      VALUES
        ('superadmin@miscpro.com', ?, 'superadmin', 1, 'active', 1, GETDATE())
  `, [pwHash]);
  console.log('[7] ✓ Seeded superadmin@miscpro.com (mustChangePassword=1)');

  // ─────────────────────────────────────────────────
  // STEP 8 — PREVIEW before backfill (C6: NULL for estimators is expected here)
  // ─────────────────────────────────────────────────
  console.log('\n--- Backfill Preview: projects.owner_admin_id ---');
  console.log('(C6: admin_owner_id IS NULL for estimators at this point — expected. Fallback applies.)');
  const [preview] = await db.query(`
    SELECT p.id, p.projectNumber, u.email, u.role,
      CASE
        WHEN u.role IN ('admin','superadmin') THEN u.id
        WHEN u.role = 'estimator'             THEN u.admin_owner_id
        ELSE (SELECT TOP 1 id FROM users WHERE role IN ('admin','superadmin') ORDER BY id)
      END AS would_assign_owner_admin_id
    FROM projects p
    JOIN users u ON p.userId = u.id
    WHERE p.owner_admin_id IS NULL
  `);
  if (preview.length === 0) {
    console.log('  (No projects need backfill — already set)');
  } else {
    preview.slice(0, 20).forEach(r =>
      console.log(`  project #${r.id} [${r.projectNumber}] user:${r.email} role:${r.role} → owner_admin_id:${r.would_assign_owner_admin_id}`)
    );
    if (preview.length > 20) console.log(`  ... and ${preview.length - 20} more`);
  }

  // ─────────────────────────────────────────────────
  // STEP 9 — Backfill projects.owner_admin_id (I1 fix: smart CASE)
  // ─────────────────────────────────────────────────
  await db.query(`
    UPDATE p SET p.owner_admin_id =
      CASE
        WHEN u.role IN ('admin','superadmin') THEN u.id
        WHEN u.role = 'estimator'             THEN u.admin_owner_id
        ELSE (SELECT TOP 1 id FROM users WHERE role IN ('admin','superadmin') ORDER BY id)
      END
    FROM [dbo].[projects] p
    JOIN [dbo].[users] u ON p.userId = u.id
    WHERE p.owner_admin_id IS NULL
  `);
  console.log('[9] ✓ Backfilled projects.owner_admin_id');

  // ─────────────────────────────────────────────────
  // STEP 10 — Backfill customers.owner_admin_id (C1 fix: via createdBy)
  // ─────────────────────────────────────────────────
  await db.query(`
    UPDATE c SET c.owner_admin_id =
      COALESCE(
        (SELECT CASE
           WHEN u2.role IN ('admin','superadmin') THEN u2.id
           WHEN u2.role = 'estimator'             THEN u2.admin_owner_id
         END
         FROM [dbo].[users] u2 WHERE u2.id = c.createdBy),
        (SELECT TOP 1 id FROM [dbo].[users]
         WHERE role IN ('admin','superadmin') ORDER BY id)
      )
    FROM [dbo].[customers] c
    WHERE c.owner_admin_id IS NULL
  `);
  console.log('[10] ✓ Backfilled customers.owner_admin_id (via createdBy)');

  // ─────────────────────────────────────────────────
  // STEP 11 — Backfill estimates.owner_admin_id via projects JOIN
  // ─────────────────────────────────────────────────
  await db.query(`
    UPDATE e SET e.owner_admin_id = p.owner_admin_id
    FROM [dbo].[estimates] e
    JOIN [dbo].[projects] p ON e.project_id = p.id
    WHERE e.owner_admin_id IS NULL
  `);
  console.log('[11] ✓ Backfilled estimates.owner_admin_id');

  // ─────────────────────────────────────────────────
  // STEP 12 — Backfill 5 supplementary tables (I2, C5: column name verified)
  // C5: project_notes and project_attachments use camelCase projectId FK
  // ─────────────────────────────────────────────────

  // estimation_activity_logs via estimates → projects
  if (await tableExists('estimation_activity_logs')) {
    await db.query(`
      UPDATE al SET al.owner_admin_id = p.owner_admin_id
      FROM [dbo].[estimation_activity_logs] al
      JOIN [dbo].[estimates] e ON al.estimationId = e.id
      JOIN [dbo].[projects] p ON e.project_id = p.id
      WHERE al.owner_admin_id IS NULL
    `);
    console.log('[12a] ✓ Backfilled estimation_activity_logs');
  }

  // estimate_results via estimates → projects
  if (await tableExists('estimate_results')) {
    await db.query(`
      UPDATE er SET er.owner_admin_id = p.owner_admin_id
      FROM [dbo].[estimate_results] er
      JOIN [dbo].[estimates] e ON er.estimate_id = e.id
      JOIN [dbo].[projects] p ON e.project_id = p.id
      WHERE er.owner_admin_id IS NULL
    `);
    console.log('[12b] ✓ Backfilled estimate_results');
  }

  // takeoff_items via estimates → projects
  if (await tableExists('takeoff_items')) {
    await db.query(`
      UPDATE ti SET ti.owner_admin_id = p.owner_admin_id
      FROM [dbo].[takeoff_items] ti
      JOIN [dbo].[estimates] e ON ti.estimate_id = e.id
      JOIN [dbo].[projects] p ON e.project_id = p.id
      WHERE ti.owner_admin_id IS NULL
    `);
    console.log('[12c] ✓ Backfilled takeoff_items');
  }

  // project_notes — C5: uses camelCase projectId
  if (await tableExists('project_notes')) {
    const fkCol = await detectFkColumn('project_notes', ['projectId', 'project_id']);
    if (fkCol) {
      await db.query(`
        UPDATE pn SET pn.owner_admin_id = p.owner_admin_id
        FROM [dbo].[project_notes] pn
        JOIN [dbo].[projects] p ON pn.[${fkCol}] = p.id
        WHERE pn.owner_admin_id IS NULL
      `);
      console.log(`[12d] ✓ Backfilled project_notes (FK: ${fkCol})`);
    }
  }

  // project_attachments — C5: uses camelCase projectId
  if (await tableExists('project_attachments')) {
    const fkCol = await detectFkColumn('project_attachments', ['projectId', 'project_id']);
    if (fkCol) {
      await db.query(`
        UPDATE pa SET pa.owner_admin_id = p.owner_admin_id
        FROM [dbo].[project_attachments] pa
        JOIN [dbo].[projects] p ON pa.[${fkCol}] = p.id
        WHERE pa.owner_admin_id IS NULL
      `);
      console.log(`[12e] ✓ Backfilled project_attachments (FK: ${fkCol})`);
    }
  }

  // ─────────────────────────────────────────────────
  // VERIFICATION
  // ─────────────────────────────────────────────────
  console.log('\n=== Verification ===');
  const checks = [
    ['licenses table',           `SELECT COUNT(*) as n FROM licenses`],
    ['superadmin accounts',      `SELECT COUNT(*) as n FROM users WHERE role = 'superadmin'`],
    ['admin accounts',           `SELECT COUNT(*) as n FROM users WHERE role = 'admin'`],
    ['estimator accounts',       `SELECT COUNT(*) as n FROM users WHERE role = 'estimator'`],
    ['projects with owner',      `SELECT COUNT(*) as n FROM projects WHERE owner_admin_id IS NOT NULL`],
    ['projects without owner',   `SELECT COUNT(*) as n FROM projects WHERE owner_admin_id IS NULL`],
    ['customers with owner',     `SELECT COUNT(*) as n FROM customers WHERE owner_admin_id IS NOT NULL`],
    ['users with session cols',  `SELECT COUNT(*) as n FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name IN ('session_token','otp_code','locked_until','admin_owner_id')`],
  ];
  for (const [label, sql] of checks) {
    const [rows] = await db.query(sql);
    console.log(`  ${label.padEnd(36)} → ${rows[0].n}`);
  }

  console.log('\n✅ Migration v1 Complete\n');
  console.log('Superadmin credentials:');
  console.log('  Email:    superadmin@miscpro.com');
  console.log('  Password: MISC@SuperAdmin2026!');
  console.log('  → You will be prompted to change password on first login.\n');
  process.exit(0);
}

async function tableExists(name) {
  const [rows] = await db.query(`SELECT 1 as found FROM sys.tables WHERE name = '${name}'`);
  return rows.length > 0;
}

async function detectFkColumn(table, candidates) {
  for (const c of candidates) {
    const [rows] = await db.query(
      `SELECT 1 as found FROM sys.columns WHERE object_id = OBJECT_ID('${table}') AND name = '${c}'`
    );
    if (rows.length > 0) return c;
  }
  console.warn(`  ⚠ Could not find FK column in ${table} from candidates: ${candidates.join(', ')}`);
  return null;
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
