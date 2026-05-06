require('dotenv').config();
const db = require('../src/config/mssql');

const profiles = [
  { pattern: 'MC 12 X 10.6', weight: 10.6 },
  { pattern: 'MC 12 X 14.3', weight: 14.3 },
  { pattern: 'C 12 X 20.7', weight: 20.7 },
  { pattern: 'TS 12 X 2 x 3/16', weight: 39.0 },
  { pattern: 'TS 12 X 2 x 1/4', weight: 50.0 },
];

const skipPatterns = [
  "Std. 6'-0\" wide > 19'-0\" span metal pan stairs",
  "Std. 4'-0\" wide > 19'-0\" span grating tread stairs",
  "Std. 5'-0\" wide > 19'-0\" span grating tread stairs"
];

async function run() {
  try {
    console.log('Migrating stringer weights...');
    const category = 'stringer_size';
    
    // Get all stringer sizes
    const [entries] = await db.query('SELECT * FROM dictionary WHERE category = ?', [category]);
    
    for (const entry of entries) {
      // Check if it's one of the skip patterns
      if (skipPatterns.some(p => entry.label.includes(p))) {
        // Set to NULL
        await db.query('UPDATE dictionary SET steelLbsLf = NULL WHERE id = ?', [entry.id]);
        console.log(`Skipped (set to NULL): ${entry.label}`);
        continue;
      }
      
      // Check if it matches a profile pattern
      let matched = false;
      for (const profile of profiles) {
        // Handle TS 12 X 2 x 1/4" which might have quotes or not
        const normalizedLabel = entry.label.toLowerCase().replace(/"/g, '');
        const normalizedPattern = profile.pattern.toLowerCase().replace(/"/g, '');
        
        if (normalizedLabel.includes(normalizedPattern) || entry.label.includes(profile.pattern)) {
          // Found a match
          // Only update if it's not already correct
          if (parseFloat(entry.steelLbsLf) !== profile.weight) {
             await db.query('UPDATE dictionary SET steelLbsLf = ? WHERE id = ?', [profile.weight, entry.id]);
             console.log(`Updated: ${entry.label} -> ${profile.weight}`);
          } else {
             console.log(`Already correct: ${entry.label}`);
          }
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        console.log(`No pattern matched for: ${entry.label}`);
      }
    }
    
    console.log('✅ Success');
  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    process.exit();
  }
}

run();
