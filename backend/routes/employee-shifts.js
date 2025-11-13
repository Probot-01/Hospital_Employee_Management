const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get shift assigned to an employee
router.get('/employees/:employeeId/shifts', async (req, res) => {
    try {
        const [shifts] = await db.query(`
            SELECT s.* 
            FROM shifts s
            JOIN employee_shifts es ON s.shift_id = es.shift_id
            WHERE es.employee_id = ?
        `, [req.params.employeeId]);
        res.json(shifts[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Assign shift to employee (POST)
router.post('/employees/:employeeId/shifts', async (req, res) => {
    try {
        const { shift_id } = req.body;
        
        if (!shift_id) {
            return res.status(400).json({ error: 'Shift ID is required' });
        }
        
        // Remove existing shift assignment
        await db.query(
            'DELETE FROM employee_shifts WHERE employee_id = ?',
            [req.params.employeeId]
        );
        
        // Insert new shift assignment
        await db.query(
            'INSERT INTO employee_shifts (employee_id, shift_id) VALUES (?, ?)',
            [req.params.employeeId, shift_id]
        );
        
        res.json({ message: 'Shift assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update shift for employee (PUT)
router.put('/employees/:employeeId/shifts', async (req, res) => {
    try {
        const { shift_id } = req.body;
        
        if (!shift_id) {
            return res.status(400).json({ error: 'Shift ID is required' });
        }
        
        // Check if shift assignment exists
        const [existing] = await db.query(
            'SELECT * FROM employee_shifts WHERE employee_id = ?',
            [req.params.employeeId]
        );
        
        if (existing.length === 0) {
            // Insert if doesn't exist
            await db.query(
                'INSERT INTO employee_shifts (employee_id, shift_id) VALUES (?, ?)',
                [req.params.employeeId, shift_id]
            );
        } else {
            // Update if exists
            await db.query(
                'UPDATE employee_shifts SET shift_id = ? WHERE employee_id = ?',
                [shift_id, req.params.employeeId]
            );
        }
        
        res.json({ message: 'Shift updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

