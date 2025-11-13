const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get roles assigned to an employee
router.get('/employees/:employeeId/roles', async (req, res) => {
    try {
        const [roles] = await db.query(`
            SELECT r.* 
            FROM roles r
            JOIN employee_roles er ON r.role_id = er.role_id
            WHERE er.employee_id = ?
        `, [req.params.employeeId]);
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Assign roles to employee (POST - creates new assignments)
router.post('/employees/:employeeId/roles', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { roles } = req.body; // Array of role IDs
        
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Roles array is required' });
        }
        
        // Remove existing roles first
        await connection.query(
            'DELETE FROM employee_roles WHERE employee_id = ?',
            [req.params.employeeId]
        );
        
        // Insert new roles
        for (const roleId of roles) {
            await connection.query(
                'INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)',
                [req.params.employeeId, roleId]
            );
        }
        
        await connection.commit();
        res.json({ message: 'Roles assigned successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update roles for employee (PUT - replaces all roles)
router.put('/employees/:employeeId/roles', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { roles } = req.body; // Array of role IDs
        
        // Remove existing roles
        await connection.query(
            'DELETE FROM employee_roles WHERE employee_id = ?',
            [req.params.employeeId]
        );
        
        // Insert new roles if provided
        if (roles && Array.isArray(roles) && roles.length > 0) {
            for (const roleId of roles) {
                await connection.query(
                    'INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)',
                    [req.params.employeeId, roleId]
                );
            }
        }
        
        await connection.commit();
        res.json({ message: 'Roles updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Remove a specific role from employee
router.delete('/employees/:employeeId/roles/:roleId', async (req, res) => {
    try {
        await db.query(
            'DELETE FROM employee_roles WHERE employee_id = ? AND role_id = ?',
            [req.params.employeeId, req.params.roleId]
        );
        res.json({ message: 'Role removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

