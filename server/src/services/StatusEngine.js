/**
 * StatusEngine.js
 * Generic service for managing project status workflows and automated rules.
 */

const WORKFLOWS = {
    MISC: {
        statuses: [
            'New',
            'Assigned',
            'Estimation In Progress',
            'Review',
            'Submitted',
            'Won',
            'Lost'
        ],
        terminalStatuses: ['Submitted', 'Won', 'Lost'],
        lapsedEligible: ['New', 'Assigned', 'Estimation In Progress', 'Review']
    }
};

class StatusEngine {
    constructor(workflowName = 'MISC') {
        this.config = WORKFLOWS[workflowName] || WORKFLOWS.MISC;
    }

    /**
     * Compute the current status indicator (e.g. Lapsed, Due, etc.)
     * @param {Object} project - The project entity
     * @returns {String} - Modified status or indicator
     */
    getStatusIndicator(project) {
        const { status, submissionDeadline } = project;
        const now = new Date();

        // If it's a terminal status, we don't show Lapsed/Due indicators
        if (this.config.terminalStatuses.includes(status)) {
            return status;
        }

        // Check for Lapsed
        if (submissionDeadline && new Date(submissionDeadline) < now) {
            return 'Lapsed';
        }

        // Check for Due (e.g. due in 2 days)
        // This is a dynamic indicator for the dashboard
        if (submissionDeadline) {
            const deadlineDate = new Date(submissionDeadline);
            const diffTime = deadlineDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 2 && diffDays >= 0) {
                return 'Due';
            }
        }

        return status || 'New';
    }

    /**
     * Validate if a transition is allowed
     * @param {String} fromStatus 
     * @param {String} toStatus 
     * @returns {Boolean}
     */
    canTransition(fromStatus, toStatus) {
        // For now, allow all transitions within the status list
        return this.config.statuses.includes(toStatus);
    }
}

module.exports = new StatusEngine();
