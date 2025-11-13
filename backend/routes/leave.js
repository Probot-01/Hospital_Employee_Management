const express = require('express');
const router = express.Router();
const db = require('../config/database');

/*  
========================================================
  GET ALL LEAVE RECORDS
========================================================
*/
router.get('/', async (req, res) => {
    try {
        const [leaves] = await db.query(
            'SELECT * FROM leave_records ORDER BY start_date DESC'
        );
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/*  
========================================================
  APPLY LEAVE TO A SPECIFIC EMPLOYEE
  URL: POST /api/leave/employees/:employeeId
========================================================
*/
router.post('/employees/:employeeId', async (req, res) => {
    try {
        const { leave_type, duration, start_date, end_date, status } = req.body;

        if (!leave_type || !start_date || !end_date) {
            return res.status(400).json({ 
                error: 'leave_type, start_date, end_date are required' 
            });
        }

        const [result] = await db.query(
            `INSERT INTO leave_records 
            (employee_id, leave_type, duration, start_date, end_date, status)
            VALUES (?, ?, ?, ?, ?, ?)`
            ,
            [
                req.params.employeeId,
                leave_type,
                duration || null,
                start_date,
                end_date,
                status || 'Pending'
            ]
        );

        res.json({
            message: 'Leave record added successfully',
            leave_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/*  
========================================================
  GET LEAVE BY ID
  URL: GET /api/leave/:id
========================================================
*/
router.get('/:id', async (req, res) => {
    try {
        const [leave] = await db.query(
            'SELECT * FROM leave_records WHERE leave_id = ?',
            [req.params.id]
        );

        if (leave.length === 0) {
            return res.status(404).json({ error: 'Leave record not found' });
        }

        res.json(leave[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/*  
========================================================
  UPDATE LEAVE BY ID
  URL: PUT /api/leave/:id
========================================================
*/
router.put('/:id', async (req, res) => {
    try {
        const { leave_type, duration, start_date, end_date, status } = req.body;

        await db.query(
            `UPDATE leave_records SET
            leave_type = ?, 
            duration = ?, 
            start_date = ?, 
            end_date = ?, 
            status = ?
            WHERE leave_id = ?`,
            [
                leave_type,
                duration || null,
                start_date,
                end_date,
                status,
                req.params.id
            ]
        );

        res.json({ message: 'Leave updated successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/*  
========================================================
  DELETE LEAVE BY ID
  URL: DELETE /api/leave/:id
========================================================
*/
router.delete('/:id', async (req, res) => {
    try {
        await db.query(
            'DELETE FROM leave_records WHERE leave_id = ?',
            [req.params.id]
        );

        res.json({ message: 'Leave record deleted successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
