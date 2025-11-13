const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all departments with employee count
router.get('/', async (req, res) => {
    try {
        const [departments] = await db.query(`
            SELECT 
                d.department_id,
                d.department_name,
                d.department_location,
                COUNT(CASE WHEN e.is_active = 1 THEN 1 END) as active_count,
                COUNT(CASE WHEN e.is_active = 1 AND e.is_on_duty = 1 THEN 1 END) as on_duty_count
            FROM departments d
            LEFT JOIN employees e ON d.department_id = e.department_id
            GROUP BY d.department_id
        `);
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get department by ID
router.get('/:id', async (req, res) => {
    try {
        const [department] = await db.query(
            'SELECT * FROM departments WHERE department_id = ?',
            [req.params.id]
        );
        res.json(department[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify department password
router.post('/:id/verify-password', async (req, res) => {
    try {
        const [department] = await db.query(
            'SELECT department_password FROM departments WHERE department_id = ?',
            [req.params.id]
        );
        
        if (department[0].department_password === req.body.password) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new department
router.post('/', async (req, res) => {
    try {
        const { department_name, department_location, department_password } = req.body;
        
        if (!department_name || !department_password) {
            return res.status(400).json({ error: 'Department name and password are required' });
        }
        
        const [result] = await db.query(`
            INSERT INTO departments (department_name, department_location, department_password)
            VALUES (?, ?, ?)
        `, [department_name, department_location || null, department_password]);
        
        res.json({ message: 'Department created successfully', department_id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update department
router.put('/:id', async (req, res) => {
    try {
        const { department_name, department_location, department_password } = req.body;
        
        const updates = [];
        const values = [];
        
        if (department_name !== undefined) {
            updates.push('department_name = ?');
            values.push(department_name);
        }
        if (department_location !== undefined) {
            updates.push('department_location = ?');
            values.push(department_location);
        }
        if (department_password !== undefined) {
            updates.push('department_password = ?');
            values.push(department_password);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.id);
        
        await db.query(`
            UPDATE departments 
            SET ${updates.join(', ')}
            WHERE department_id = ?
        `, values);
        
        res.json({ message: 'Department updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete department
router.delete('/:id', async (req, res) => {
    try {
        // Check if department has employees
        const [employees] = await db.query(
            'SELECT COUNT(*) as count FROM employees WHERE department_id = ? AND is_active = 1',
            [req.params.id]
        );
        
        if (employees[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete department with active employees. Please reassign or archive employees first.' 
            });
        }
        
        await db.query('DELETE FROM departments WHERE department_id = ?', [req.params.id]);
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employees by department
router.get('/:id/employees', async (req, res) => {
    try {
        const isActive = req.query.active !== 'false';
        const [employees] = await db.query(`
            SELECT 
                e.*,
                d.department_name,
                GROUP_CONCAT(DISTINCT r.role_name) as roles
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN employee_roles er ON e.unique_id = er.employee_id
            LEFT JOIN roles r ON er.role_id = r.role_id
            WHERE e.department_id = ? AND e.is_active = ?
            GROUP BY e.unique_id
        `, [req.params.id, isActive]);
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
