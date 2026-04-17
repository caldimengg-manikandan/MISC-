// server/src/controllers/customer.controller.js
const customerRepository = require('../repositories/customer.repository');

class CustomerController {
    async getAll(req, res) {
        try {
            const filter = req.userRole === 'admin' ? {} : { status: 'active' };
            const customers = await customerRepository.findAll(filter, req.companyId);
            res.json({ success: true, customers });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getById(req, res) {
        try {
            const customer = await customerRepository.findById(req.params.id, req.companyId);
            if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
            res.json({ success: true, customer });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async create(req, res) {
        try {
            if (req.userRole !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can create customers' });
            }
            const id = await customerRepository.create({ 
                ...req.body, 
                createdBy: req.userId,
                companyId: req.companyId
            });
            res.json({ success: true, id });
        } catch (err) {
            if (err.message.includes('unique')) {
                return res.status(400).json({ success: false, message: 'Company name already exists' });
            }
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async update(req, res) {
        try {
            if (req.userRole !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can update customers' });
            }
            await customerRepository.update(req.params.id, { 
                ...req.body, 
                updatedBy: req.userId,
                companyId: req.companyId
            });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateStatus(req, res) {
        try {
            if (req.userRole !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can change customer status' });
            }
            const { status } = req.body;
            await customerRepository.updateStatus(req.params.id, status, req.userId, req.companyId);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async search(req, res) {
        try {
            const { q } = req.query;
            const customers = await customerRepository.search(q || '', req.companyId);
            res.json({ success: true, customers });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new CustomerController();
