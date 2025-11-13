// API Base URL (make it global)
var API_URL = 'http://localhost:3000/api';

// Utility Functions
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} show`;
    alertDiv.textContent = message;
    
    const content = document.querySelector('.content');
    if (content) {
        content.insertBefore(alertDiv, content.firstChild);
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
}

// Login Page Functions
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple admin login (you can enhance this with backend authentication)
    if (username === 'admin' && password === 'admin123') {
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        showAlert('Invalid credentials. Use admin/admin123', 'error');
    }
}

// Dashboard Functions
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const departments = await response.json();
        
        const grid = document.getElementById('departmentGrid');
        grid.innerHTML = '';
        
        departments.forEach(dept => {
            const card = document.createElement('div');
            card.className = 'department-card';
            card.onclick = () => openDepartment(dept.department_id);
            
            card.innerHTML = `
                <h3>${dept.department_name}</h3>
                <div class="department-info">
                    <div class="info-row">
                        <span class="info-label">Location</span>
                        <span class="info-value">${dept.department_location}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Active Employees</span>
                        <span class="info-value">${dept.active_count}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">On Duty</span>
                        <span class="info-value duty-badge">
                            <span class="status-indicator status-on-duty"></span>
                            ${dept.on_duty_count}
                        </span>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Failed to load departments', 'error');
    }
}

function openDepartment(deptId) {
    sessionStorage.setItem('selectedDepartment', deptId);
    window.location.href = 'department-employees.html';
}

// Department Employees Page
async function loadDepartmentEmployees() {
    const deptId = sessionStorage.getItem('selectedDepartment');
    const showActive = sessionStorage.getItem('showActiveEmployees') !== 'false';
    
    try {
        // Load department info
        const deptResponse = await fetch(`${API_URL}/departments/${deptId}`);
        const department = await deptResponse.json();
        document.getElementById('departmentName').textContent = department.department_name;
        
        // Load employees
        const empResponse = await fetch(`${API_URL}/departments/${deptId}/employees?active=${showActive}`);
        const employees = await empResponse.json();
        
        const list = document.getElementById('employeeList');
        list.innerHTML = '';
        
        if (employees.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>No employees found</h3>
                    <p>There are no ${showActive ? 'active' : 'ex-'} employees in this department.</p>
                </div>
            `;
            return;
        }

   

        
        employees.forEach(emp => {
            const item = document.createElement('div');
            item.className = 'employee-item';
            item.onclick = () => verifyAndOpenProfile(emp.unique_id, deptId);
            
            item.innerHTML = `
                <div class="employee-info">
                    <h4>${emp.name}</h4>
                    <p>${emp.roles || 'No role assigned'} | ${emp.contact_number || 'No contact'}</p>
                </div>
                <div>
                    ${showActive ? `
                        <span class="status-indicator ${emp.is_on_duty ? 'status-on-duty' : 'status-off-duty'}"></span>
                        ${emp.is_on_duty ? 'On Duty' : 'Off Duty'}
                    ` : `
                        <span style="color: #718096;">Left: ${formatDate(emp.date_left)}</span>
                    `}
                </div>
            `;
            
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading employees:', error);
        showAlert('Failed to load employees', 'error');
    }
}

function toggleEmployeeView() {
    const showActive = sessionStorage.getItem('showActiveEmployees') !== 'false';
    sessionStorage.setItem('showActiveEmployees', !showActive);
    loadDepartmentEmployees();
    
    const btn = document.getElementById('toggleViewBtn');
    btn.textContent = showActive ? 'Show Active Employees' : 'Show Ex-Employees';
}

async function verifyAndOpenProfile(empId, deptId) {
    const modal = document.getElementById('passwordModal');
    modal.classList.add('active');
    
    document.getElementById('verifyPassword').onclick = async () => {
        const password = document.getElementById('deptPassword').value;
        
        try {
            const response = await fetch(`${API_URL}/departments/${deptId}/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                sessionStorage.setItem('selectedEmployee', empId);
                window.location.href = 'employee-profile.html';
            } else {
                showAlert('Incorrect password', 'error');
            }
        } catch (error) {
            console.error('Error verifying password:', error);
            showAlert('Failed to verify password', 'error');
        }
    };
    
    document.getElementById('cancelPassword').onclick = () => {
        modal.classList.remove('active');
        document.getElementById('deptPassword').value = '';
    };
}

// Employee Profile Page
async function loadEmployeeProfile() {
    const empId = sessionStorage.getItem('selectedEmployee');
    
    try {
        const response = await fetch(`${API_URL}/employees/${empId}`);
        const employee = await response.json();
        
        // Fill basic info
        document.getElementById('empName').value = employee.name;
        document.getElementById('empId').value = employee.unique_id;
        document.getElementById('empEmail').value = employee.email_id || '';
        document.getElementById('empContact').value = employee.contact_number || '';
        document.getElementById('empDepartment').value = employee.department_id;
        document.getElementById('dateJoined').value = formatDate(employee.date_joined);
        
        // Fill qualification
        if (employee.qualifications && employee.qualifications.length > 0) {
            const qual = employee.qualifications[0];
            document.getElementById('degree').value = qual.degree || '';
            document.getElementById('institution').value = qual.institution || '';
            document.getElementById('yearAwarded').value = qual.year_awarded || '';
        }
        
        // Fill roles
        if (employee.roles && employee.roles.length > 0) {
            document.getElementById('roleDisplay').value = employee.roles.map(r => r.role_name).join(', ');
        }
        
        // Fill salary
        if (employee.salary) {
            document.getElementById('baseSalary').value = employee.salary.base_salary || '';
            document.getElementById('bonus').value = employee.salary.bonus || '';
            document.getElementById('payGrade').value = employee.salary.pay_grade || '';
        }
        
        // Fill shift
        if (employee.shift) {
            document.getElementById('shiftType').value = employee.shift.shift_type || '';
            document.getElementById('shiftTime').value = employee.shift.shift_time || '';
        }
        
        // Load leave records
        loadLeaveRecords(employee.leaves || []);
        
        // Set duty status button
        const dutyBtn = document.getElementById('toggleDutyBtn');
        dutyBtn.textContent = employee.is_on_duty ? 'Mark Off Duty' : 'Mark On Duty';
        dutyBtn.onclick = () => toggleDutyStatus(empId);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load employee profile', 'error');
    }
    
    // Load departments for dropdown
    loadDepartmentsDropdown();
    loadShiftsDropdown();
}

function loadLeaveRecords(leaves) {
    const tbody = document.getElementById('leaveTableBody');
    tbody.innerHTML = '';
    
    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #718096;">No leave records</td></tr>';
        return;
    }
    
    leaves.forEach(leave => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${leave.leave_type}</td>
            <td>${formatDate(leave.start_date)}</td>
            <td>${formatDate(leave.end_date)}</td>
            <td>${leave.duration} days</td>
            <td><span class="status-badge status-${leave.status.toLowerCase()}">${leave.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

async function saveEmployeeChanges() {
    const empId = sessionStorage.getItem('selectedEmployee');
    
    try {
        // Get current employee data to preserve is_on_duty status
        const currentResponse = await fetch(`${API_URL}/employees/${empId}`);
        const currentEmployee = await currentResponse.json();
        
        const updates = {
            contact_number: document.getElementById('empContact').value,
            email_id: document.getElementById('empEmail').value,
            department_id: parseInt(document.getElementById('empDepartment').value),
            is_on_duty: currentEmployee.is_on_duty ? 1 : 0 // Preserve current status
        };
        
        // Update basic info
        await fetch(`${API_URL}/employees/${empId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        // Update salary
        const salary = {
            base_salary: document.getElementById('baseSalary').value,
            bonus: document.getElementById('bonus').value,
            pay_grade: document.getElementById('payGrade').value
        };
        
        await fetch(`${API_URL}/salary/${empId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salary)
        });
        
        // Update shift if changed
        const shiftId = document.getElementById('shiftType').value;
        if (shiftId) {
            await fetch(`${API_URL}/employees/${empId}/shift`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shift_id: shiftId })
            });
        }
        
        showAlert('Employee updated successfully', 'success');
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error('Error saving changes:', error);
        showAlert('Failed to save changes', 'error');
    }
}

async function toggleDutyStatus(empId) {
    try {
        await fetch(`${API_URL}/employees/${empId}/toggle-duty`, {
            method: 'PUT'
        });
        showAlert('Duty status updated', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Error toggling duty:', error);
        showAlert('Failed to update duty status', 'error');
    }
}

async function archiveEmployee() {
    const empId = sessionStorage.getItem('selectedEmployee');
    const reason = prompt('Enter reason for leaving:');
    
    if (!reason) return;
    
    try {
        await fetch(`${API_URL}/employees/${empId}/archive`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason_for_leaving: reason })
        });
        
        showAlert('Employee archived successfully', 'success');
        setTimeout(() => {
            window.location.href = 'department-employees.html';
        }, 1500);
    } catch (error) {
        console.error('Error archiving employee:', error);
        showAlert('Failed to archive employee', 'error');
    }
}

// Add Employee Page
async function loadAddEmployeeForm() {
    await loadDepartmentsDropdown();
    await loadRolesDropdown();
    await loadShiftsDropdown();
}

async function loadDepartmentsDropdown() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const departments = await response.json();
        
        const select = document.getElementById('empDepartment') || document.getElementById('department');
        if (select) {
            select.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(dept => {
                select.innerHTML += `<option value="${dept.department_id}">${dept.department_name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

async function loadRolesDropdown() {
    try {
        const response = await fetch(`${API_URL}/roles`);
        const roles = await response.json();
        
        const select = document.getElementById('roles');
        if (select) {
            select.innerHTML = '';
            roles.forEach(role => {
                select.innerHTML += `<option value="${role.role_id}">${role.role_name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

async function loadShiftsDropdown() {
    try {
        const response = await fetch(`${API_URL}/shifts`);
        const shifts = await response.json();
        
        const select = document.getElementById('shiftType') || document.getElementById('shift');
        if (select) {
            select.innerHTML = '<option value="">Select Shift</option>';
            shifts.forEach(shift => {
                select.innerHTML += `<option value="${shift.shift_id}">${shift.shift_type} - ${shift.shift_time || 'N/A'}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading shifts:', error);
    }
}

async function submitNewEmployee(event) {
    event.preventDefault();
    
    try {
        // Step 1: Create employee
        const employeeData = {
            unique_id: document.getElementById('uniqueId').value,
            name: document.getElementById('name').value,
            email_id: document.getElementById('email').value,
            contact_number: document.getElementById('contact').value,
            department_id: document.getElementById('department').value
        };
        
        const empResponse = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        
        if (!empResponse.ok) {
            const error = await empResponse.json();
            throw new Error(error.error || 'Failed to add employee');
        }
        
        const empResult = await empResponse.json();
        const employeeId = employeeData.unique_id;
        
        // Step 2: Assign roles
        const roles = Array.from(document.getElementById('roles').selectedOptions).map(o => parseInt(o.value));
        if (roles.length > 0) {
            await fetch(`${API_URL}/employees/${employeeId}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roles })
            });
        }
        
        // Step 3: Add qualification
        const qualification = {
            degree: document.getElementById('degree').value,
            institution: document.getElementById('institution').value,
            year_awarded: parseInt(document.getElementById('yearAwarded').value)
        };
        if (qualification.degree) {
            await fetch(`${API_URL}/qualifications/employees/${employeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(qualification)
            });
        }
        
        // Step 4: Add salary
        const salary = {
            base_salary: parseFloat(document.getElementById('baseSalary').value),
            bonus: parseFloat(document.getElementById('bonus').value) || 0,
            pay_grade: document.getElementById('payGrade').value
        };
        if (salary.base_salary) {
            await fetch(`${API_URL}/salary/employees/${employeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salary)
            });
        }
        
        // Step 5: Assign shift
        const shiftId = document.getElementById('shift').value;
        if (shiftId) {
            await fetch(`${API_URL}/employees/${employeeId}/shifts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shift_id: parseInt(shiftId) })
            });
        }
        
        showAlert('Employee added successfully with all details', 'success');
        setTimeout(() => {
            window.location.href = 'employees.html';
        }, 1500);
    } catch (error) {
        console.error('Error adding employee:', error);
        showAlert(error.message || 'Failed to add employee', 'error');
    }
}

// Active Employees Page
async function loadActiveEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const employees = await response.json();
        
        const tbody = document.getElementById('employeeTableBody');
        tbody.innerHTML = '';
        
        employees.forEach(emp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.name}</td>
                <td>${emp.department_name}</td>
                <td>${emp.contact_number || 'N/A'}</td>
                <td>${emp.roles || 'No role'}</td>
                <td>
                    <span class="status-indicator ${emp.is_on_duty ? 'status-on-duty' : 'status-off-duty'}"></span>
                    ${emp.is_on_duty ? 'On Duty' : 'Off Duty'}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading active employees:', error);
        showAlert('Failed to load employees', 'error');
    }
}

// Logout
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

   
    function openApplyLeave() {
        window.location.href = 'apply-leave.html';
    }

// Check authentication
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!isLoggedIn && currentPage !== 'index.html' && currentPage !== '') {
        window.location.href = 'index.html';
    }
}