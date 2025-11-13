const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all roles
router.get('/', async (req, res) => {
    try {
        console.log('[Roles API] Fetching all roles...');
        const [roles] = await db.query('SELECT * FROM roles ORDER BY role_name');
        console.log('[Roles API] Found', roles.length, 'roles');
        res.json(roles);
    } catch (error) {
        console.error('[Roles API] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get role by ID
router.get('/:id', async (req, res) => {
    try {
        const [roles] = await db.query(
            'SELECT * FROM roles WHERE role_id = ?',
            [req.params.id]
        );
        
        if (roles.length === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        
        res.json(roles[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new role
router.post('/', async (req, res) => {
    try {
        const { role_name, role_type } = req.body;
        
        if (!role_name) {
            return res.status(400).json({ error: 'Role name is required' });
        }
        
        const [result] = await db.query(
            'INSERT INTO roles (role_name, role_type) VALUES (?, ?)',
            [role_name, role_type || null]
        );
        
        res.json({ 
            message: 'Role created successfully', 
            role_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update role
router.put('/:id', async (req, res) => {
    try {
        const { role_name, role_type } = req.body;
        
        const updates = [];
        const values = [];
        
        if (role_name !== undefined) {
            updates.push('role_name = ?');
            values.push(role_name);
        }
        if (role_type !== undefined) {
            updates.push('role_type = ?');
            values.push(role_type);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.id);
        
        await db.query(
            `UPDATE roles SET ${updates.join(', ')} WHERE role_id = ?`,
            values
        );
        
        res.json({ message: 'Role updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete role
router.delete('/:id', async (req, res) => {
    try {
        // Check if role is assigned to any employees
        const [employees] = await db.query(
            'SELECT COUNT(*) as count FROM employee_roles WHERE role_id = ?',
            [req.params.id]
        );
        
        if (employees[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete role. It is assigned to employees. Please remove role assignments first.' 
            });
        }
        
        await db.query('DELETE FROM roles WHERE role_id = ?', [req.params.id]);
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

