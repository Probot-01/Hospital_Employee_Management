var API_URL = 'https://hospital-employee-management.onrender.com/api';


// Load employee ID function (if needed for autofill or validation)
function loadEmployeeId() {
    // This function can be used to load employee IDs for a dropdown
    // or validate if an employee exists
    // Currently, the form allows manual entry
    const employeeIdInput = document.getElementById('employeeId');
    if (employeeIdInput) {
        // Focus on the input field when page loads
        employeeIdInput.focus();
    }
}

document.getElementById('leaveForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const employee_id = document.getElementById('employeeId').value.trim();
    const leave_type = document.getElementById('leaveType').value;
    const duration = document.getElementById('duration').value;
    const start_date = document.getElementById('startDate').value;
    const end_date = document.getElementById('endDate').value;

    if (!employee_id || !leave_type || !duration || !start_date || !end_date) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employee_id,
                leave_type,
                duration,
                start_date,
                end_date,
                status: 'Pending'
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Leave applied successfully!');
            document.getElementById('leaveForm').reset();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to apply leave. Please try again.');
    }
});
