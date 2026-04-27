// server/src/repositories/customer.repository.js
// Isolation switched from company_id → owner_admin_id
// SuperAdmin (ownerAdminId = null) sees all records

const db = require('../config/mssql');

class CustomerRepository {
  _scopeWhere(ownerAdminId) {
    if (ownerAdminId === null || ownerAdminId === undefined) return ''; // superadmin — no filter
    return ` AND owner_admin_id = ${parseInt(ownerAdminId)}`;
  }

  async findAll(filters = {}, ownerAdminId = null) {
    const scope = this._scopeWhere(ownerAdminId);
    let query = `SELECT * FROM customers WHERE status != 'deleted'${scope}`;
    const params = [];
    if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
    query += ' ORDER BY companyName ASC';
    const [rows] = await db.query(query, params);
    return rows;
  }

  async findById(id, ownerAdminId = null) {
    const scope = this._scopeWhere(ownerAdminId);
    const [rows] = await db.query(
      `SELECT * FROM customers WHERE id = ?${scope}`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { companyName, contactPerson, email, phone, street, city, state, zip, notes, createdBy, ownerAdminId } = data;
    const [result] = await db.query(`
      INSERT INTO customers (companyName, contactPerson, email, phone, street, city, state, zip, status, notes, owner_admin_id, createdBy, updatedBy, createdAt, updatedAt)
      OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, GETDATE(), GETDATE())
    `, [companyName, contactPerson, email, phone, street, city, state, zip, notes, ownerAdminId || null, createdBy, createdBy]);
    return result[0].id;
  }

  async update(id, data) {
    const { companyName, contactPerson, email, phone, street, city, state, zip, status, notes, updatedBy, ownerAdminId } = data;
    const sets = ['updatedAt = GETDATE()'];
    const params = [];
    const addField = (col, val) => { if (val !== undefined) { sets.push(`${col} = ?`); params.push(val === '' ? null : val); } };
    addField('companyName', companyName); addField('contactPerson', contactPerson);
    addField('email', email); addField('phone', phone); addField('street', street);
    addField('city', city); addField('state', state); addField('zip', zip);
    addField('status', status); addField('notes', notes); addField('updatedBy', updatedBy);

    let where = 'id = ?';
    params.push(id);
    if (ownerAdminId !== null && ownerAdminId !== undefined) {
      where += ' AND owner_admin_id = ?';
      params.push(ownerAdminId);
    }
    return await db.query(`UPDATE customers SET ${sets.join(', ')} WHERE ${where}`, params);
  }

  async updateStatus(id, status, updatedBy, ownerAdminId = null) {
    let query = 'UPDATE customers SET status = ?, updatedBy = ?, updatedAt = GETDATE() WHERE id = ?';
    const params = [status, updatedBy, id];
    if (ownerAdminId !== null && ownerAdminId !== undefined) {
      query += ' AND owner_admin_id = ?';
      params.push(ownerAdminId);
    }
    return await db.query(query, params);
  }

  async search(searchTerm, ownerAdminId = null) {
    const scope = this._scopeWhere(ownerAdminId);
    const [rows] = await db.query(
      `SELECT * FROM customers WHERE status = 'active'${scope} AND companyName LIKE ? ORDER BY companyName ASC`,
      [`%${searchTerm}%`]
    );
    return rows;
  }

  async delete(id, ownerAdminId = null) {
    let query = `UPDATE customers SET status = 'deleted', updatedAt = GETDATE() WHERE id = ?`;
    const params = [id];
    if (ownerAdminId !== null && ownerAdminId !== undefined) {
      query += ' AND owner_admin_id = ?';
      params.push(ownerAdminId);
    }
    return await db.query(query, params);
  }
}

module.exports = new CustomerRepository();
