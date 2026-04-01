require('dotenv').config();
const { poolPromise, sql } = require('./src/config/mssql');

async function migrate() {
  try {
    console.log('Starting migration for EMS fields...');
    const pool = await poolPromise;

    // Add assignedEngineer
    try {
      await pool.request().query(`ALTER TABLE projects ADD assignedEngineer NVARCHAR(100) NULL`);
      console.log('Added assignedEngineer column.');
    } catch (e) {
      if (e.message.includes('is already an object') || e.message.includes('already has a column') || e.message.includes('already exist')) {
        console.log('Column assignedEngineer already exists.');
      } else {
        throw e;
      }
    }

    // Add enquiryDate
    try {
      await pool.request().query(`ALTER TABLE projects ADD enquiryDate DATETIME NULL`);
      console.log('Added enquiryDate column.');
    } catch (e) {
      if (e.message.includes('is already an object') || e.message.includes('already has a column') || e.message.includes('already exist')) {
        console.log('Column enquiryDate already exists.');
      } else {
        throw e;
      }
    }

    // Add submissionDeadline
    try {
      await pool.request().query(`ALTER TABLE projects ADD submissionDeadline DATETIME NULL`);
      console.log('Added submissionDeadline column.');
    } catch (e) {
      if (e.message.includes('is already an object') || e.message.includes('already has a column') || e.message.includes('already exist')) {
        console.log('Column submissionDeadline already exists.');
      } else {
        throw e;
      }
    }

    console.log('Updating legacy statues...');
    await pool.request().query(`UPDATE projects SET status = 'Project Created' WHERE status = 'draft' OR status IS NULL`);
    
    // Fix existing rows enquiry date so they aren't null for testing
    await pool.request().query(`UPDATE projects SET enquiryDate = GETDATE() WHERE enquiryDate IS NULL`);
    await pool.request().query(`UPDATE projects SET submissionDeadline = DATEADD(day, 7, GETDATE()) WHERE submissionDeadline IS NULL`);

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
