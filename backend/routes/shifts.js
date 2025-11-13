const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all shifts
router.get('/', async (req, res) => {
    try {
        console.log('[Shifts API] Fetching all shifts...');
        const [shifts] = await db.query('SELECT * FROM shifts ORDER BY shift_type, shift_time');
        console.log('[Shifts API] Found', shifts.length, 'shifts');
        res.json(shifts);
    } catch (error) {
        console.error('[Shifts API] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get shift by ID
router.get('/:id', async (req, res) => {
    try {
        const [shifts] = await db.query(
            'SELECT * FROM shifts WHERE shift_id = ?',
            [req.params.id]
        );
        
        if (shifts.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        
        res.json(shifts[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new shift
router.post('/', async (req, res) => {
    try {
        const { shift_type, shift_time } = req.body;
        
        if (!shift_type) {
            return res.status(400).json({ error: 'Shift type is required' });
        }
        
        const [result] = await db.query(
            'INSERT INTO shifts (shift_type, shift_time) VALUES (?, ?)',
            [shift_type, shift_time || null]
        );
        
        res.json({ 
            message: 'Shift created successfully', 
            shift_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update shift
router.put('/:id', async (req, res) => {
    try {
        const { shift_type, shift_time } = req.body;
        
        const updates = [];
        const values = [];
        
        if (shift_type !== undefined) {
            updates.push('shift_type = ?');
            values.push(shift_type);
        }
        if (shift_time !== undefined) {
            updates.push('shift_time = ?');
            values.push(shift_time);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.id);
        
        await db.query(
            `UPDATE shifts SET ${updates.join(', ')} WHERE shift_id = ?`,
            values
        );
        
        res.json({ message: 'Shift updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete shift
router.delete('/:id', async (req, res) => {
    try {
        // Check if shift is assigned to any employees
        const [employees] = await db.query(
            'SELECT COUNT(*) as count FROM employee_shifts WHERE shift_id = ?',
            [req.params.id]
        );
        
        if (employees[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete shift. It is assigned to employees. Please reassign employees first.' 
            });
        }
        
        await db.query('DELETE FROM shifts WHERE shift_id = ?', [req.params.id]);
        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

