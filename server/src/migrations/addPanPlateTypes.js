require('dotenv').config();
const db = require('../config/mssql');

async function up() {
  console.log('🚀 Running migration: Seed pan_plate_type and pan_support_type into dictionary');
  try {
    // ── 1. Seed pan_plate_type (6 rows) ──────────────────────────────────────
    // shopEfficiency column = shop hours per SF (1.1 - 1.3 from Excel matrix)
    const panPlateTypes = [
      { label: 'TYPE-1(Z shape)',     value: 'TYPE_1_Z',    shopHrs: 1.20 },
      { label: 'TYPE-2(Z-shape)',     value: 'TYPE_2_Z',    shopHrs: 1.25 },
      { label: 'TYPE-3(bent plate)',  value: 'TYPE_3_BENT', shopHrs: 1.30 },
      { label: 'TYPE-(Welded)',       value: 'TYPE_WELDED', shopHrs: 1.10 },
      { label: 'TYPE-1(C-shape)',     value: 'TYPE_1_C',    shopHrs: 1.20 },
      { label: 'TYPE-2(C-shape)',     value: 'TYPE_2_C',    shopHrs: 1.25 },
    ];

    for (const pt of panPlateTypes) {
      const [existing] = await db.query(
        `SELECT id FROM dictionary WHERE category = 'pan_plate_type' AND value = ?`,
        [pt.value]
      );
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO dictionary 
            (category, label, value, [order], isActive, is_active, shopEfficiency, fieldEfficiency)
           VALUES (?, ?, ?, 0, 1, 1, ?, 0)`,
          ['pan_plate_type', pt.label, pt.value, pt.shopHrs]
        );
        console.log(`  ✅ Inserted pan_plate_type: ${pt.label} (${pt.shopHrs} hrs/SF)`);
      } else {
        // Update shopEfficiency in case it drifted
        await db.query(
          `UPDATE dictionary SET shopEfficiency = ?, label = ? WHERE id = ?`,
          [pt.shopHrs, pt.label, existing[0].id]
        );
        console.log(`  ↩️  Updated pan_plate_type: ${pt.label}`);
      }
    }

    // ── 2. Seed pan_support_type (4 rows) ────────────────────────────────────
    // fieldEfficiency column = labor multiplier (as percentage × 100 to stay integer-friendly)
    // We store the raw multiplier × 100 so 1.0 → 100, 1.1 → 110, etc.
    const panSupportTypes = [
      { label: 'Type-1(Single support)', value: 'SINGLE_SUPPORT', multiplier: 100 }, // 1.0x
      { label: 'Type-2(Dual support)',   value: 'DUAL_SUPPORT',   multiplier: 110 }, // 1.1x
      { label: 'Type-3(bent plate)',     value: 'BENT_PLATE',     multiplier: 115 }, // 1.15x
      { label: 'Type-(Welded)',          value: 'WELDED',         multiplier: 95  }, // 0.95x
    ];

    for (const st of panSupportTypes) {
      const [existing] = await db.query(
        `SELECT id FROM dictionary WHERE category = 'pan_support_type' AND value = ?`,
        [st.value]
      );
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO dictionary 
            (category, label, value, [order], isActive, is_active, fieldEfficiency)
           VALUES (?, ?, ?, 0, 1, 1, ?)`,
          ['pan_support_type', st.label, st.value, st.multiplier]
        );
        console.log(`  ✅ Inserted pan_support_type: ${st.label} (${st.multiplier / 100}x multiplier)`);
      } else {
        await db.query(
          `UPDATE dictionary SET fieldEfficiency = ?, label = ? WHERE id = ?`,
          [st.multiplier, st.label, existing[0].id]
        );
        console.log(`  ↩️  Updated pan_support_type: ${st.label}`);
      }
    }

    console.log('✅ Migration complete: pan_plate_type and pan_support_type seeded.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  }
}

if (require.main === module) {
  up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
