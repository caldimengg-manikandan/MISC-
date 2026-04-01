/**
 * CalendarService.js
 * Generic service for mapping project data to status-driven indicators for calendars.
 */

const statusEngine = require('./StatusEngine');

class CalendarService {
    /**
     * Map projects to calendar events
     * @param {Array} projects 
     * @returns {Array} - Project indicators for calendar visualization
     */
    mapProjectsToCalendarEvents(projects) {
        return projects.map(p => {
            const indicator = statusEngine.getStatusIndicator(p);
            return {
                id: p.id,
                projectNumber: p.projectNumber,
                projectName: p.projectName,
                customer_name: p.customer_name,
                status: p.status,
                submissionDeadline: p.submissionDeadline,
                statusIndicator: indicator // 'Lapsed', 'Due', 'Won', 'Lost', etc.
            };
        });
    }
}

module.exports = new CalendarService();
