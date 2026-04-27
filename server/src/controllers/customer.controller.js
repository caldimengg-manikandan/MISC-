// server/src/controllers/customer.controller.js
// Updated: uses owner_admin_id (via resolveOwnerAdminId) instead of company_id

const customerRepository = require('../repositories/customer.repository');
const resolveOwnerAdminId = require('../utils/resolveOwnerAdminId');

class CustomerController {
  async getAll(req, res) {
    try {
      const ownerAdminId = await resolveOwnerAdminId(req);
      const filter = ['admin', 'superadmin'].includes(req.userRole) ? {} : { status: 'active' };
      const customers = await customerRepository.findAll(filter, ownerAdminId);
      res.json({ success: true, customers });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const ownerAdminId = await resolveOwnerAdminId(req);
      const customer = await customerRepository.findById(req.params.id, ownerAdminId);
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
      res.json({ success: true, customer });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async create(req, res) {
    try {
      if (!['admin', 'superadmin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Only admins can create customers' });
      }
      const ownerAdminId = await resolveOwnerAdminId(req);
      const id = await customerRepository.create({
        ...req.body,
        createdBy: req.userId,
        ownerAdminId
      });
      res.json({ success: true, id });
    } catch (err) {
      if (err.message?.includes('unique')) {
        return res.status(400).json({ success: false, message: 'Company name already exists' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      if (!['admin', 'superadmin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Only admins can update customers' });
      }
      const ownerAdminId = await resolveOwnerAdminId(req);
      await customerRepository.update(req.params.id, {
        ...req.body,
        updatedBy: req.userId,
        ownerAdminId
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      if (!['admin', 'superadmin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Only admins can change customer status' });
      }
      const { status } = req.body;
      const ownerAdminId = await resolveOwnerAdminId(req);
      await customerRepository.updateStatus(req.params.id, status, req.userId, ownerAdminId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async search(req, res) {
    try {
      const { q } = req.query;
      const ownerAdminId = await resolveOwnerAdminId(req);
      const customers = await customerRepository.search(q || '', ownerAdminId);
      res.json({ success: true, customers });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      if (!['admin', 'superadmin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Only admins can delete customers' });
      }
      const ownerAdminId = await resolveOwnerAdminId(req);
      await customerRepository.delete(req.params.id, ownerAdminId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CustomerController();
