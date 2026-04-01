// server/src/repositories/estimation.repository.js
const db = require('../config/mssql');

class EstimationRepository {
    async getStats() {
        const [rows] = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM projects 
            GROUP BY status
        `);
        return rows;
    }

    async findAll(filters = {}) {
        let query = 'SELECT * FROM projects WHERE 1=1';
        let params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.engineerId) {
            query += ' AND engineerId = ?';
            params.push(filters.engineerId);
        }

        query += ' ORDER BY updatedAt DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
        return rows[0];
    }

    async create(data) {
        const { projectName, customer_name, dueDate, createdBy } = data;
        const [result] = await db.query(`
            INSERT INTO projects (projectName, customer_name, dueDate, status, userId, createdBy, created_at, updatedAt)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, 'NEW', ?, ?, GETDATE(), GETDATE())
        `, [projectName, customer_name, dueDate ? dueDate : null, createdBy, createdBy]);
        return result[0].id;
    }

    async updateStatus(id, status, extraFields = {}) {
        let sets = ['status = ?', 'updatedAt = GETDATE()'];
        let params = [status];

        if (extraFields.assignedAt) {
            sets.push('assignedAt = GETDATE()');
        }
        if (extraFields.submittedAt) {
            sets.push('submittedAt = GETDATE()');
        }
        if (extraFields.engineerId) {
            sets.push('engineerId = ?');
            params.push(extraFields.engineerId);
        }

        params.push(id);
        const query = `UPDATE projects SET ${sets.join(', ')} WHERE id = ?`;
        return await db.query(query, params);
    }

    async updateData(id, data) {
        const { 
            modules, totalWeight, totalCost, 
            projectName, customer_name, dueDate, projectNumber, projectLocation,
            architect, eor, gcName, detailer, vendorName, aiscCertified, units,
            isPinned, isArchived
        } = data;

        // Build dynamic SET clauses only for defined fields to avoid overwriting with undefined
        const sets = ['updatedAt = GETDATE()'];
        const params = [];

        const addField = (col, val) => {
            if (val !== undefined) {
                sets.push(`${col} = ?`);
                params.push(val === '' ? null : val);
            }
        };

        addField('modules',        modules !== undefined ? (modules ? JSON.stringify(modules) : null) : undefined);
        addField('totalWeight',    totalWeight);
        addField('totalCost',      totalCost);
        addField('projectName',    projectName);
        addField('customer_name',  customer_name);
        addField('dueDate',        dueDate);
        addField('projectNumber',  projectNumber);
        addField('projectLocation',projectLocation);
        addField('architect',      architect);
        addField('eor',            eor);
        addField('gcName',         gcName);
        addField('detailer',       detailer);
        addField('vendorName',     vendorName);
        addField('aiscCertified',  aiscCertified);
        addField('units',          units);
        addField('isPinned',       isPinned !== undefined ? (isPinned ? 1 : 0) : undefined);
        addField('isArchived',     isArchived !== undefined ? (isArchived ? 1 : 0) : undefined);

        params.push(id);
        return await db.query(
            `UPDATE projects SET ${sets.join(', ')} WHERE id = ?`,
            params
        );
    }

    async delete(id) {
        await db.query(`DELETE FROM estimation_activity_logs WHERE estimationId = ?`, [id]);
        return await db.query(`DELETE FROM projects WHERE id = ?`, [id]);
    }

    async duplicate(sourceId, userId) {
        const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [sourceId]);
        if (!rows || rows.length === 0) throw new Error('Source project not found');
        const src = rows[0];

        const cloneName = src.projectName ? (src.projectName + ' (Copy)') : 'Cloned Project';
        const [result] = await db.query(`
            INSERT INTO projects (
                projectName, customer_name, dueDate, status, userId, createdBy, created_at, updatedAt,
                projectNumber, projectLocation, architect, eor, gcName, detailer, vendorName, aiscCertified, units,
                modules, isPinned, isArchived
            )
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, 'NEW', ?, ?, GETDATE(), GETDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
        `, [
            cloneName, src.customer_name, src.dueDate, userId, userId,
            src.projectNumber, src.projectLocation, src.architect, src.eor, src.gcName, src.detailer, src.vendorName, src.aiscCertified, src.units,
            src.modules
        ]);
        
        return result[0].id;
    }

    async logActivity(estimationId, action, performedBy, notes = null) {
        return await db.query(`
            INSERT INTO estimation_activity_logs (estimationId, action, performedBy, notes)
            VALUES (?, ?, ?, ?)
        `, [estimationId, action, performedBy, notes]);
    }
}

module.exports = new EstimationRepository();
