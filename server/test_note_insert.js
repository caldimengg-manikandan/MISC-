require('dotenv').config();
const db = require('./src/config/mssql');

async function run() {
  try {
    const projectId = 5; // Assuming ID 5 exists from earlier license fix
    const userId = 5;
    const title = 'Test Note';
    const content = 'Test Content';
    const note_type = 'personal';
    const pos_x = 100;
    const pos_y = 100;
    const lockedBit = 0;
    const color = '#e0f7fa';
    const mentions = '[]';
    const context_type = 'global';
    const context_id = null;

    console.log('Attempting INSERT...');
    const [result] = await db.query(
      `INSERT INTO project_notes (projectId, userId, title, content, note_type, pos_x, pos_y, isPinned, color, mentions, context_type, context_id)
       OUTPUT INSERTED.id
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, userId, title, content, note_type,
        pos_x, pos_y, lockedBit, color, mentions,
        context_type, context_id
      ]
    );

    console.log('Insert Result:', result);
  } catch(e) {
    console.error('INSERT FAILED:', e);
  } finally {
    process.exit(0);
  }
}
run();
