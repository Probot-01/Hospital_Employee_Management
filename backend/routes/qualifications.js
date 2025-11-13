const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get qualifications by employee ID
router.get('/employees/:employeeId', async (req, res) => {
    try {
        const [qualifications] = await db.query(
            'SELECT * FROM qualifications WHERE employee_id = ? ORDER BY year_awarded DESC',
            [req.params.employeeId]
        );
        res.json(qualifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get qualification by ID
router.get('/:id', async (req, res) => {
    try {
        const [qualifications] = await db.query(
            'SELECT * FROM qualifications WHERE qualification_id = ?',
            [req.params.id]
        );
        
        if (qualifications.length === 0) {
            return res.status(404).json({ error: 'Qualification not found' });
        }
        
        res.json(qualifications[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create qualification for employee
router.post('/employees/:employeeId', async (req, res) => {
    try {
        const { degree, institution, year_awarded } = req.body;
        
        if (!degree) {
            return res.status(400).json({ error: 'Degree is required' });
        }
        
        const [result] = await db.query(
            'INSERT INTO qualifications (employee_id, degree, institution, year_awarded) VALUES (?, ?, ?, ?)',
            [req.params.employeeId, degree, institution || null, year_awarded || null]
        );
        
        res.json({ 
            message: 'Qualification added successfully', 
            qualification_id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update qualification
router.put('/:id', async (req, res) => {
    try {
        const { degree, institution, year_awarded } = req.body;
        
        const updates = [];
        const values = [];
        
        if (degree !== undefined) {
            updates.push('degree = ?');
            values.push(degree);
        }
        if (institution !== undefined) {
            updates.push('institution = ?');
            values.push(institution);
        }
        if (year_awarded !== undefined) {
            updates.push('year_awarded = ?');
            values.push(year_awarded);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.id);
        
        await db.query(
            `UPDATE qualifications SET ${updates.join(', ')} WHERE qualification_id = ?`,
            values
        );
        
        res.json({ message: 'Qualification updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete qualification
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM qualifications WHERE qualification_id = ?', [req.params.id]);
        res.json({ message: 'Qualification deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

