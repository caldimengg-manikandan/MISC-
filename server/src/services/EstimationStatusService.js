/**
 * EstimationStatusService.js
 * Central service for managing estimation status workflows and automated rules.
 */

const STATUS = {
    NEW: 'NEW',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'REVIEW',
    SUBMITTED: 'SUBMITTED',
    OVERDUE: 'OVERDUE'
};

class EstimationStatusService {
    /**
     * Determine the current status based on timing and current state.
     * Only auto-transitions to OVERDUE.
     * @param {Object} estimation - The estimation entity
     * @returns {String} - Current status
     */
    updateStatus(estimation) {
        const today = new Date();

        // Terminal status
        if (estimation.status === STATUS.SUBMITTED) {
            return STATUS.SUBMITTED;
        }

        // Overdue check
        if (estimation.dueDate && new Date(estimation.dueDate) < today) {
            return STATUS.OVERDUE;
        }

        return estimation.status || STATUS.NEW;
    }

    /**
     * Validate a status transition (Strict Rules)
     * @param {String} from 
     * @param {String} to 
     * @returns {Boolean}
     */
    isValidTransition(from, to) {
        const transitions = {
            [null]: [STATUS.NEW],
            [STATUS.NEW]: [STATUS.ASSIGNED],
            [STATUS.ASSIGNED]: [STATUS.IN_PROGRESS],
            [STATUS.IN_PROGRESS]: [STATUS.REVIEW],
            [STATUS.REVIEW]: [STATUS.SUBMITTED],
            [STATUS.OVERDUE]: [STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.REVIEW, STATUS.SUBMITTED]
        };

        const allowed = transitions[from] || [];
        return allowed.includes(to);
    }
}

module.exports = new EstimationStatusService();
