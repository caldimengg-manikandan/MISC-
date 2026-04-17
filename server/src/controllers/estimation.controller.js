// server/src/controllers/estimation.controller.js
const estimationRepository = require('../repositories/estimation.repository');
const statusService = require('../services/EstimationStatusService');
const { STATUS, STATUS_ACTIONS } = require('../constants/status.constants');

class EstimationController {
    async getDashboardStats(req, res) {
        try {
            const rows = await estimationRepository.getStats(req.companyId);
            const stats = {
                [STATUS.NEW]: 0,
                [STATUS.ASSIGNED]: 0,
                [STATUS.IN_PROGRESS]: 0,
                [STATUS.REVIEW]: 0,
                [STATUS.SUBMITTED]: 0,
                [STATUS.OVERDUE]: 0
            };
            rows.forEach(r => {
                if (stats.hasOwnProperty(r.status)) stats[r.status] = r.count;
            });
            res.json({ success: true, stats });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getList(req, res) {
        try {
            const { status, engineerId } = req.query;
            const estimations = await estimationRepository.findAll({ status, engineerId }, req.companyId);
            const processed = estimations.map(e => ({
                ...e,
                status: statusService.updateStatus(e)
            }));
            res.json({ success: true, estimations: processed });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getDetail(req, res) {
        try {
            const { id } = req.params;
            const estimation = await estimationRepository.findById(id, req.companyId);
            if (!estimation) return res.status(404).json({ success: false, message: 'Not found' });

            if (estimation.modules && typeof estimation.modules === 'string') {
                try { estimation.modules = JSON.parse(estimation.modules); } catch (e) { estimation.modules = null; }
            }
            res.json({ success: true, estimation });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async create(req, res) {
        try {
            const { projectName, customer_name, customer_id, dueDate } = req.body;
            const id = await estimationRepository.create({ 
                projectName, customer_name, customer_id, dueDate, 
                createdBy: req.userId,
                companyId: req.companyId
            });
            
            await estimationRepository.updateData(id, req.body);
            await estimationRepository.logActivity(id, STATUS_ACTIONS.CREATE, req.userId, null, req.companyId);
            res.json({ success: true, id });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id, action } = req.params; // action = assign, start, review, submit
            const project = await estimationRepository.findById(id);
            if (!project) return res.status(404).json({ success: false, message: 'Not found' });

            let targetStatus, logAction, extraFields = {};
            
            switch (action) {
                case 'assign':
                    targetStatus = STATUS.ASSIGNED;
                    logAction = STATUS_ACTIONS.ASSIGN;
                    extraFields = { engineerId: req.body.engineerId, assignedAt: true };
                    break;
                case 'start':
                    targetStatus = STATUS.IN_PROGRESS;
                    logAction = STATUS_ACTIONS.START;
                    break;
                case 'review':
                    targetStatus = STATUS.REVIEW;
                    logAction = STATUS_ACTIONS.REVIEW;
                    break;
                case 'submit':
                    targetStatus = STATUS.SUBMITTED;
                    logAction = STATUS_ACTIONS.SUBMIT;
                    extraFields = { submittedAt: true };
                    break;
                default:
                    return res.status(400).json({ success: false, message: 'Invalid action' });
            }

            if (!statusService.isValidTransition(project.status, targetStatus)) {
                return res.status(400).json({ success: false, message: 'Invalid status transition' });
            }

            await estimationRepository.updateStatus(id, targetStatus, extraFields);
            await estimationRepository.logActivity(id, logAction, req.userId, extraFields.engineerId ? `Assigned to: ${extraFields.engineerId}` : null, req.companyId);
            
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async saveData(req, res) {
        try {
            const { id } = req.params;
            await estimationRepository.updateData(id, req.body);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async deleteData(req, res) {
        try {
            const { id } = req.params;
            await estimationRepository.delete(id);
            res.json({ success: true, message: 'Deleted successfully' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async bulkDeleteData(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                return res.status(400).json({ success: false, message: 'Invalid IDs' });
            }
            await estimationRepository.bulkDelete(ids);
            res.json({ success: true, message: 'Bulk delete successful' });
        } catch (err) {
            console.error('BULK DELETE ERROR:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async duplicateData(req, res) {
        try {
            const { id } = req.params;
            const newId = await estimationRepository.duplicate(id, req.userId);
            res.json({ success: true, newId });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new EstimationController();
