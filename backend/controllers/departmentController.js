const db = require('../config/database');

// Get all departments
exports.getAllDepartments = async (req, res) => {
    try {
        const [departments] = await db.query('SELECT * FROM departments ORDER BY department_id DESC');
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get department by ID
exports.getDepartmentById = async (req, res) => {
    try {
        const [department] = await db.query(
            'SELECT * FROM departments WHERE department_id = ?',
            [req.params.id]
        );
        if (department.length === 0) return res.status(404).json({ message: 'Department not found' });
        res.json(department[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add department
exports.addDepartment = async (req, res) => {
    try {
        const { department_name, head_of_department } = req.body;

        await db.query(`
            INSERT INTO departments (department_name, head_of_department)
            VALUES (?, ?)
        `, [department_name, head_of_department]);

        res.json({ message: 'Department added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update department
exports.updateDepartment = async (req, res) => {
    try {
        const { department_name, head_of_department } = req.body;

        await db.query(`
            UPDATE departments 
            SET department_name = ?, head_of_department = ?
            WHERE department_id = ?
        `, [department_name, head_of_department, req.params.id]);

        res.json({ message: 'Department updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
    try {
        await db.query('DELETE FROM departments WHERE department_id = ?', [req.params.id]);
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
