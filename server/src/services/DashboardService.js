/**
 * DashboardService.js
 * Generic service for computing dashboard metrics from project data.
 */

const statusEngine = require('./StatusEngine');

class DashboardService {
    /**
     * Compute dashboard metrics from project list
     * @param {Array} projects - List of projects
     * @returns {Object} - metrics: {received, due, lapsed, submitted}, recentProjects
     */
    computeMetrics(projects) {
        const metrics = {
            received: projects.length,
            due: 0,
            lapsed: 0,
            submitted: 0
        };

        const terminalStatuses = ['Submitted', 'Won', 'Lost'];

        projects.forEach(p => {
            // Use Status Engine logic for uniform indicator calculation
            const indicator = statusEngine.getStatusIndicator(p);
            
            if (terminalStatuses.includes(p.status)) {
                metrics.submitted++;
            } else if (indicator === 'Lapsed') {
                metrics.lapsed++;
            } else if (indicator === 'Due') {
                metrics.due++;
            }
        });

        // Get 10 most recent projects
        const recentProjects = projects
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 10);

        return {
            metrics,
            projects: recentProjects.map(p => ({
                id: p.id,
                projectNumber: p.projectNumber,
                projectName: p.projectName,
                customer_name: p.customer_name,
                assignedEngineer: p.assignedEngineer,
                status: p.status,
                submissionDeadline: p.submissionDeadline,
                statusIndicator: statusEngine.getStatusIndicator(p)
            }))
        };
    }
}

module.exports = new DashboardService();
