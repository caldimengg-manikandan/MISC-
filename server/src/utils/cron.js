const cron = require('node-cron');
const db = require('../config/mssql');
const statusService = require('../services/EstimationStatusService');

/**
 * Initialize all cron jobs for the application.
 */
function initCron() {
    // Run daily at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running Daily Overdue Check...');
        try {
            // Find all non-submitted projects where today > dueDate
            const today = new Date().toISOString();
            
            const [projects] = await db.query(`
                SELECT id, status, dueDate 
                FROM projects 
                WHERE status <> 'SUBMITTED' 
                AND status <> 'OVERDUE'
                AND dueDate < ?
            `, [today]);

            if (projects.length > 0) {
                console.log(`📍 Found ${projects.length} projects to mark as OVERDUE.`);
                
                const ids = projects.map(p => p.id).join(',');
                await db.query(`
                    UPDATE projects 
                    SET status = 'OVERDUE', updatedAt = GETDATE() 
                    WHERE id IN (${ids})
                `);

                // Log activity for each (could be optimized with a bulk insert if needed)
                for (const p of projects) {
                    await db.query(`
                        INSERT INTO estimation_activity_logs (estimationId, action, performedBy, notes)
                        VALUES (?, 'SYSTEM_OVERDUE', 0, 'Automatically marked as OVERDUE by system cron.')
                    `, [p.id]);
                }
            }
            
            console.log('✅ Overdue Check Completed.');
        } catch (err) {
            console.error('❌ Error in Overdue Cron:', err);
        }
    });

    console.log('🚀 Cron Jobs Initialized.');
}

module.exports = { initCron };
