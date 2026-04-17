// server/src/repositories/customer.repository.js
const db = require('../config/mssql');

class CustomerRepository {
    async findAll(filters = {}, companyId = null) {
        // NULL company = no data access
        if (companyId === null || companyId === undefined) return [];

        let query = 'SELECT * FROM customers WHERE company_id = ?';
        let params = [companyId];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY companyName ASC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    async findById(id, companyId = null) {
        if (companyId === null || companyId === undefined) return null;
        const [rows] = await db.query('SELECT * FROM customers WHERE id = ? AND company_id = ?', [id, companyId]);
        return rows[0] || null;
    }

    async create(data) {
        const { 
            companyName, contactPerson, email, phone, 
            street, city, state, zip, notes, createdBy, companyId
        } = data;
        
        const [result] = await db.query(`
            INSERT INTO customers (
                companyName, contactPerson, email, phone, 
                street, city, state, zip, status, notes, 
                company_id, createdBy, updatedBy, createdAt, updatedAt
            )
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, GETDATE(), GETDATE())
        `, [
            companyName, contactPerson, email, phone, 
            street, city, state, zip, notes, companyId || null, createdBy, createdBy
        ]);
        
        return result[0].id;
    }

    async update(id, data) {
        const { 
            companyName, contactPerson, email, phone, 
            street, city, state, zip, status, notes, updatedBy, companyId
        } = data;

        const sets = ['updatedAt = GETDATE()'];
        const params = [];

        const addField = (col, val) => {
            if (val !== undefined) {
                sets.push(`${col} = ?`);
                params.push(val === '' ? null : val);
            }
        };

        addField('companyName', companyName);
        addField('contactPerson', contactPerson);
        addField('email', email);
        addField('phone', phone);
        addField('street', street);
        addField('city', city);
        addField('state', state);
        addField('zip', zip);
        addField('status', status);
        addField('notes', notes);
        addField('updatedBy', updatedBy);

        let whereClause = 'id = ?';
        params.push(id);
        if (companyId !== null) {
            whereClause += ' AND company_id = ?';
            params.push(companyId);
        }

        const query = `UPDATE customers SET ${sets.join(', ')} WHERE ${whereClause}`;
        return await db.query(query, params);
    }

    async updateStatus(id, status, updatedBy, companyId = null) {
        let query = 'UPDATE customers SET status = ?, updatedBy = ?, updatedAt = GETDATE() WHERE id = ?';
        let params = [status, updatedBy, id];
        if (companyId !== null) {
            query += ' AND company_id = ?';
            params.push(companyId);
        }
        return await db.query(query, params);
    }

    async search(searchTerm, companyId = null) {
        if (companyId === null || companyId === undefined) return [];
        let query = "SELECT * FROM customers WHERE status = 'active' AND company_id = ? AND companyName LIKE ?";
        let params = [companyId, `%${searchTerm}%`];
        query += ' ORDER BY companyName ASC';
        const [rows] = await db.query(query, params);
        return rows;
    }
}

module.exports = new CustomerRepository();
