const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all active employees
// Get all active employees
router.get('/', async (req, res) => {
    try {
        const [employees] = await db.query(`
            SELECT 
                e.unique_id,
                e.name,
                e.email_id,
                e.contact_number,
                e.department_id,
                e.is_active,
                e.is_on_duty,
                e.date_joined,
                d.department_name,
                GROUP_CONCAT(DISTINCT r.role_name) AS roles,
                MAX(s.base_salary) AS base_salary,
                MAX(sh.shift_type) AS shift_type
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN employee_roles er ON e.unique_id = er.employee_id
            LEFT JOIN roles r ON er.role_id = r.role_id
            LEFT JOIN salary s ON e.unique_id = s.employee_id
            LEFT JOIN employee_shifts es ON e.unique_id = es.employee_id
            LEFT JOIN shifts sh ON es.shift_id = sh.shift_id
            WHERE e.is_active = 1
            GROUP BY e.unique_id, e.name, e.email_id, e.contact_number, e.department_id, e.is_active, e.is_on_duty, e.date_joined, d.department_name
        `);
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get employee by ID with all details
router.get('/:id', async (req, res) => {
    try {
        const [employee] = await db.query(`
            SELECT e.*, d.department_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            WHERE e.unique_id = ?
        `, [req.params.id]);

        if (employee.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Get roles
        const [roles] = await db.query(`
            SELECT r.* FROM roles r
            JOIN employee_roles er ON r.role_id = er.role_id
            WHERE er.employee_id = ?
        `, [req.params.id]);

        // Get qualifications
        const [qualifications] = await db.query(
            'SELECT * FROM qualifications WHERE employee_id = ?',
            [req.params.id]
        );

        // Get salary
        const [salary] = await db.query(
            'SELECT * FROM salary WHERE employee_id = ?',
            [req.params.id]
        );

        // Get shift
        const [shift] = await db.query(`
            SELECT s.* FROM shifts s
            JOIN employee_shifts es ON s.shift_id = es.shift_id
            WHERE es.employee_id = ?
        `, [req.params.id]);

        // Get leave records
        const [leaves] = await db.query(
            'SELECT * FROM leave_records WHERE employee_id = ? ORDER BY start_date DESC',
            [req.params.id]
        );

        res.json({
            ...employee[0],
            roles,
            qualifications,
            salary: salary[0] || {},
            shift: shift[0] || {},
            leaves
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new employee
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            unique_id, name, email_id, contact_number, department_id,
            roles, qualification, salary, shift
        } = req.body;

        // Insert employee
        await connection.query(`
            INSERT INTO employees (unique_id, name, email_id, contact_number, department_id, date_joined)
            VALUES (?, ?, ?, ?, ?, CURDATE())
        `, [unique_id, name, email_id, contact_number, department_id]);

        // Insert roles
        if (roles && roles.length > 0) {
            for (const roleId of roles) {
                await connection.query(
                    'INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)',
                    [unique_id, roleId]
                );
            }
        }

        // Insert qualification
        if (qualification) {
            await connection.query(`
                INSERT INTO qualifications (employee_id, degree, institution, year_awarded)
                VALUES (?, ?, ?, ?)
            `, [unique_id, qualification.degree, qualification.institution, qualification.year_awarded]);
        }

        // Insert salary
        if (salary) {
            await connection.query(`
                INSERT INTO salary (employee_id, base_salary, bonus, pay_grade)
                VALUES (?, ?, ?, ?)
            `, [unique_id, salary.base_salary, salary.bonus || 0, salary.pay_grade]);
        }

        // Insert shift
        if (shift) {
            await connection.query(
                'INSERT INTO employee_shifts (employee_id, shift_id) VALUES (?, ?)',
                [unique_id, shift.shift_id]
            );
        }

        await connection.commit();
        res.json({ message: 'Employee created successfully', unique_id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const { name, contact_number, email_id, department_id, is_on_duty } = req.body;
        
        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];
        
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (contact_number !== undefined) {
            updates.push('contact_number = ?');
            values.push(contact_number);
        }
        if (email_id !== undefined) {
            updates.push('email_id = ?');
            values.push(email_id);
        }
        if (department_id !== undefined) {
            updates.push('department_id = ?');
            values.push(department_id);
        }
        if (is_on_duty !== undefined) {
            updates.push('is_on_duty = ?');
            values.push(is_on_duty);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(req.params.id);
        
        await db.query(`
            UPDATE employees 
            SET ${updates.join(', ')}
            WHERE unique_id = ?
        `, values);

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update employee shift
router.put('/:id/shift', async (req, res) => {
    try {
        await db.query('DELETE FROM employee_shifts WHERE employee_id = ?', [req.params.id]);
        await db.query(
            'INSERT INTO employee_shifts (employee_id, shift_id) VALUES (?, ?)',
            [req.params.id, req.body.shift_id]
        );
        res.json({ message: 'Shift updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Archive employee (move to ex-employee)
router.put('/:id/archive', async (req, res) => {
    try {
        const { reason_for_leaving } = req.body;
        await db.query(`
            UPDATE employees 
            SET is_active = 0, date_left = CURDATE(), reason_for_leaving = ?
            WHERE unique_id = ?
        `, [reason_for_leaving, req.params.id]);
        res.json({ message: 'Employee archived successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle duty status
router.put('/:id/toggle-duty', async (req, res) => {
    try {
        await db.query(`
            UPDATE employees 
            SET is_on_duty = NOT is_on_duty
            WHERE unique_id = ?
        `, [req.params.id]);
        res.json({ message: 'Duty status toggled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete employee (hard delete - use archive for soft delete)
router.delete('/:id', async (req, res) => {
    try {
        // First check if employee exists
        const [employee] = await db.query(
            'SELECT * FROM employees WHERE unique_id = ?',
            [req.params.id]
        );
        
        if (employee.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        // Delete employee (CASCADE will handle related records)
        await db.query('DELETE FROM employees WHERE unique_id = ?', [req.params.id]);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
