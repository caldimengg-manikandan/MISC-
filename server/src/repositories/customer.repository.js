// server/src/repositories/customer.repository.js
const db = require('../config/mssql');

class CustomerRepository {
    async findAll(filters = {}) {
        let query = 'SELECT * FROM customers WHERE 1=1';
        let params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY companyName ASC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
        return rows[0];
    }

    async create(data) {
        const { 
            companyName, contactPerson, email, phone, 
            street, city, state, zip, notes, createdBy 
        } = data;
        
        const [result] = await db.query(`
            INSERT INTO customers (
                companyName, contactPerson, email, phone, 
                street, city, state, zip, status, notes, 
                createdBy, updatedBy, createdAt, updatedAt
            )
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, GETDATE(), GETDATE())
        `, [
            companyName, contactPerson, email, phone, 
            street, city, state, zip, notes, createdBy, createdBy
        ]);
        
        return result[0].id;
    }

    async update(id, data) {
        const { 
            companyName, contactPerson, email, phone, 
            street, city, state, zip, status, notes, updatedBy 
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

        params.push(id);
        const query = `UPDATE customers SET ${sets.join(', ')} WHERE id = ?`;
        return await db.query(query, params);
    }

    async updateStatus(id, status, updatedBy) {
        return await db.query(
            'UPDATE customers SET status = ?, updatedBy = ?, updatedAt = GETDATE() WHERE id = ?',
            [status, updatedBy, id]
        );
    }

    async search(searchTerm) {
        const [rows] = await db.query(
            "SELECT * FROM customers WHERE status = 'active' AND companyName LIKE ? ORDER BY companyName ASC",
            [`%${searchTerm}%`]
        );
        return rows;
    }
}

module.exports = new CustomerRepository();
