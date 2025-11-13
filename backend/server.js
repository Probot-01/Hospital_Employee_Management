const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // <-- Add this

const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const leaveRoutes = require('./routes/leave');
const salaryRoutes = require('./routes/salary');
const rolesRoutes = require('./routes/roles');
const shiftsRoutes = require('./routes/shifts');
const qualificationsRoutes = require('./routes/qualifications');
const employeeRolesRoutes = require('./routes/employee-roles');
const employeeShiftsRoutes = require('./routes/employee-shifts');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend'))); // <-- Add this

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/leave', leaveRoutes);

app.use('/api/salary', salaryRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/qualifications', qualificationsRoutes);
app.use('/api', employeeRolesRoutes); // Routes: /api/employees/:id/roles
app.use('/api', employeeShiftsRoutes); // Routes: /api/employees/:id/shifts

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Optional: redirect root to dashboard.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
