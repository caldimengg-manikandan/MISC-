const db = require('./src/config/mssql');
require('dotenv').config();

async function check() {
    const id = process.argv[2] || 1;
    console.log('Checking project ID:', id);
    try {
        const [rows] = await db.query('SELECT TOP 1 * FROM projects WHERE id = ?', [id]);
        if (rows.length === 0) {
            console.log('Project not found');
            return;
        }
        const p = rows[0];
        console.log('Columns found:', Object.keys(p).join(', '));
        console.log('Values:');
        console.log('totalWeight:', p.totalWeight);
        console.log('total_weight:', p.total_weight);
        console.log('totalCost:', p.totalCost);
        console.log('total_cost:', p.total_cost);
        console.log('estimationResult:', p.estimationResult ? 'EXISTS' : 'NULL');
        if (p.estimationResult) {
            const er = typeof p.estimationResult === 'string' ? JSON.parse(p.estimationResult) : p.estimationResult;
            console.log('EstimationResult Summary Keys:', Object.keys(er.summary || er.standardSummary || {}));
            console.log('EstimationResult Summary:', er.summary || er.standardSummary);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
