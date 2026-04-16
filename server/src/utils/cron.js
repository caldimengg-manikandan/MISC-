const cron = require('node-cron');
const db = require('../config/mssql');
const statusService = require('../services/EstimationStatusService');

// Lazy-load NotificationService to avoid circular dep issues at boot time
const getNotif = () => require('../services/NotificationService');

/**
 * Initialize all cron jobs for the application.
 */
function initCron() {
    // ── 1. Daily Overdue Check — midnight ─────────────────────────────────
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running Daily Overdue Check...');
        try {
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

    // ── 2. Deadline Reminder Notifications — 8 AM daily ──────────────────
    // Triggers 9, 10, 11 from workflow spec:
    //   Deadline in 3 days → Estimator (in-app + email) + Admin (in-app only)
    //   Deadline tomorrow  → Estimator only (in-app + email, URGENT)
    cron.schedule('0 8 * * *', async () => {
        console.log('🔔 Running Deadline Reminder Check...');
        try {
            const notif = getNotif();
            const now = new Date();

            // Find projects due in ~3 days or ~1 day
            const [projects] = await db.query(`
                SELECT id, projectName, projectNumber, submissionDeadline, assigned_engineer_id, workflow_status
                FROM projects
                WHERE workflow_status NOT IN ('submitted')
                AND submissionDeadline IS NOT NULL
            `);

            for (const project of projects) {
                const deadline = new Date(project.submissionDeadline);
                const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

                if (daysLeft === 1) {
                    // URGENT: deadline tomorrow
                    await notif.onDeadlineApproaching(project, 1);
                    console.log(`🚨 URGENT reminder sent for project #${project.id} — due tomorrow`);
                } else if (daysLeft === 3) {
                    // 3-day warning
                    await notif.onDeadlineApproaching(project, 3);
                    console.log(`⚠️  Deadline warning sent for project #${project.id} — due in 3 days`);
                }
            }

            console.log('✅ Deadline Reminder Check Completed.');
        } catch (err) {
            console.error('❌ Error in Deadline Reminder Cron:', err);
        }
    });

    console.log('🚀 Cron Jobs Initialized.');
}

module.exports = { initCron };
