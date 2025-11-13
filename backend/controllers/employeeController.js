const db = require('../config/database');

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const [employees] = await db.query(`
            SELECT e.*, d.department_name 
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            ORDER BY e.employee_id DESC
        `);
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const [employee] = await db.query(
            'SELECT * FROM employees WHERE employee_id = ?',
            [req.params.id]
        );
        if (employee.length === 0) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add new employee
exports.addEmployee = async (req, res) => {
    try {
        const { name, email, phone, department_id, role, join_date } = req.body;

        await db.query(`
            INSERT INTO employees (name, email, phone, department_id, role, join_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, email, phone, department_id, role, join_date]);

        res.json({ message: 'Employee added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const { name, email, phone, department_id, role, join_date } = req.body;
        await db.query(`
            UPDATE employees 
            SET name = ?, email = ?, phone = ?, department_id = ?, role = ?, join_date = ?
            WHERE employee_id = ?
        `, [name, email, phone, department_id, role, join_date, req.params.id]);

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        await db.query('DELETE FROM employees WHERE employee_id = ?', [req.params.id]);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
