/**
 * backfill_owner_admin.js
 * One-time migration: sets owner_admin_id on all projects that have NULL.
 * 
 * Logic:
 *   - If project.userId belongs to an admin → owner_admin_id = project.userId
 *   - If project.userId belongs to an estimator → owner_admin_id = user.admin_owner_id
 *   - Also backfills company_id from the user's company_id
 */
require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    console.log('--- BACKFILLING owner_admin_id on projects ---\n');

    // 1. Fetch all projects with NULL owner_admin_id
    const [projects] = await db.query(
      `SELECT id, userId, createdBy, owner_admin_id, company_id FROM projects WHERE owner_admin_id IS NULL OR owner_admin_id = ''`
    );

    console.log(`Found ${projects.length} project(s) with NULL owner_admin_id\n`);

    if (projects.length === 0) {
      console.log('✅ Nothing to backfill. All projects already have owner_admin_id.');
      process.exit(0);
    }

    // 2. For each project, resolve the correct owner_admin_id
    let fixed = 0;
    let skipped = 0;

    for (const proj of projects) {
      const creatorId = proj.userId || proj.createdBy;
      if (!creatorId) {
        console.log(`  ⚠️  Project ${proj.id} has no userId/createdBy — skipping`);
        skipped++;
        continue;
      }

      // Look up the creator user
      const [userRows] = await db.query(
        `SELECT id, role, admin_owner_id, company_id FROM users WHERE id = ?`,
        [creatorId]
      );
      const user = userRows[0];

      if (!user) {
        console.log(`  ⚠️  Project ${proj.id}: creator user ${creatorId} not found — skipping`);
        skipped++;
        continue;
      }

      let ownerAdminId;
      if (user.role === 'admin' || user.role === 'superadmin') {
        ownerAdminId = user.id;
      } else {
        // estimator — use their admin
        ownerAdminId = user.admin_owner_id || user.id;
      }

      const companyId = proj.company_id || user.company_id || null;

      await db.query(
        `UPDATE projects SET owner_admin_id = ?, company_id = ? WHERE id = ?`,
        [ownerAdminId, companyId, proj.id]
      );

      console.log(`  ✅ Project ${proj.id}: owner_admin_id = ${ownerAdminId}, company_id = ${companyId}`);
      fixed++;
    }

    console.log(`\n--- DONE: ${fixed} fixed, ${skipped} skipped ---`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
