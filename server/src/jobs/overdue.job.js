// server/src/jobs/overdue.job.js
const cron = require('node-cron');
const estimationRepository = require('../repositories/estimation.repository');
const statusService = require('../services/EstimationStatusService');
const { STATUS } = require('../constants/status.constants');

const initOverdueJob = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Overdue Status Check Job...');
        try {
            const projects = await estimationRepository.findAll({ 
                // Only check projects that are NOT already submitted or overdue
                status: null 
            });

            for (const project of projects) {
                if (project.status === STATUS.SUBMITTED || project.status === STATUS.OVERDUE) continue;

                const newStatus = statusService.updateStatus(project);
                if (newStatus === STATUS.OVERDUE && project.status !== STATUS.OVERDUE) {
                    await estimationRepository.updateStatus(project.id, STATUS.OVERDUE);
                    await estimationRepository.logActivity(
                        project.id, 
                        'SYSTEM_UPDATE', 
                        null, 
                        'Status auto-updated to OVERDUE by system job'
                    );
                    console.log(`Project ${project.id} marked as OVERDUE`);
                }
            }
        } catch (err) {
            console.error('Overdue Job Error:', err);
        }
    });
};

module.exports = { initOverdueJob };
