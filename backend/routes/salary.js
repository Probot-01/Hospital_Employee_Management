const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get salary by employee ID (alternative route)
router.get('/employees/:employeeId', async (req, res) => {
    try {
        const [salary] = await db.query(
            'SELECT * FROM salary WHERE employee_id = ?',
            [req.params.employeeId]
        );
        res.json(salary[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get salary by employee ID (original route)
router.get('/:employeeId', async (req, res) => {
    try {
        const [salary] = await db.query(
            'SELECT * FROM salary WHERE employee_id = ?',
            [req.params.employeeId]
        );
        res.json(salary[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create salary for employee
router.post('/employees/:employeeId', async (req, res) => {
    try {
        const { base_salary, bonus, pay_grade } = req.body;
        
        if (base_salary === undefined) {
            return res.status(400).json({ error: 'Base salary is required' });
        }
        
        // Check if salary already exists
        const [existing] = await db.query(
            'SELECT * FROM salary WHERE employee_id = ?',
            [req.params.employeeId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Salary already exists for this employee. Use PUT to update.' });
        }

        const [result] = await db.query(
            'INSERT INTO salary (employee_id, base_salary, bonus, pay_grade) VALUES (?, ?, ?, ?)',
            [req.params.employeeId, base_salary, bonus || 0, pay_grade || null]
        );

        res.json({ message: 'Salary created successfully', salary_id: req.params.employeeId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update salary (upsert)
router.put('/:employeeId', async (req, res) => {
    try {
        const { base_salary, bonus, pay_grade } = req.body;
        
        const [existing] = await db.query(
            'SELECT * FROM salary WHERE employee_id = ?',
            [req.params.employeeId]
        );

        if (existing.length === 0) {
            await db.query(`
                INSERT INTO salary (employee_id, base_salary, bonus, pay_grade)
                VALUES (?, ?, ?, ?)
            `, [req.params.employeeId, base_salary, bonus, pay_grade]);
        } else {
            await db.query(`
                UPDATE salary 
                SET base_salary = ?, bonus = ?, pay_grade = ?
                WHERE employee_id = ?
            `, [base_salary, bonus, pay_grade, req.params.employeeId]);
        }

        res.json({ message: 'Salary updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete salary
router.delete('/:employeeId', async (req, res) => {
    try {
        await db.query('DELETE FROM salary WHERE employee_id = ?', [req.params.employeeId]);
        res.json({ message: 'Salary deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
