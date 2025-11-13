// Employee Management JavaScript

// Load all employees
async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        if (!response.ok) throw new Error('Failed to fetch employees');
        const employees = await response.json();
        
        const tbody = document.getElementById('employeeTableBody');
        tbody.innerHTML = '';
        
        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #718096;">No employees found</td></tr>';
            return;
        }
        
        employees.forEach(emp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.unique_id}</td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.email_id || 'N/A'}</td>
                <td>${emp.contact_number || 'N/A'}</td>
                <td>${emp.department_name || 'N/A'}</td>
                <td>${emp.roles || 'No role'}</td>
                <td>
                    <span class="status-indicator ${emp.is_on_duty ? 'status-on-duty' : 'status-off-duty'}"></span>
                    ${emp.is_on_duty ? 'On Duty' : 'Off Duty'}
                </td>
                <td>${formatDate(emp.date_joined)}</td>
                <td>
                    <button onclick="openEditEmployeeModal('${emp.unique_id}')" class="btn-edit" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                    <button onclick="confirmDeleteEmployee('${emp.unique_id}', '${emp.name}')" class="btn-delete" style="padding: 5px 10px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading employees:', error);
        showAlert('Failed to load employees', 'error');
        document.getElementById('employeeTableBody').innerHTML = '<tr><td colspan="9" style="text-align: center; color: #f56565;">Error loading employees</td></tr>';
    }
}

// Search employee by ID
async function searchEmployee() {
    const empId = document.getElementById('searchEmployeeId').value.trim();
    const resultDiv = document.getElementById('searchResult');
    
    if (!empId) {
        showAlert('Please enter an Employee ID', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/employees/${empId}`);
        
        if (response.status === 404) {
            resultDiv.innerHTML = `
                <div style="padding: 15px; background: #fed7d7; border: 1px solid #fc8181; border-radius: 4px; color: #c53030;">
                    <strong>Employee not found</strong><br>
                    No employee found with ID: ${empId}
                </div>
            `;
            return;
        }
        
        if (!response.ok) throw new Error('Failed to search employee');
        
        const employee = await response.json();
        
        resultDiv.innerHTML = `
            <div style="padding: 15px; background: #c6f6d5; border: 1px solid #68d391; border-radius: 4px; color: #22543d;">
                <strong>Employee Found:</strong><br>
                <strong>ID:</strong> ${employee.unique_id} | 
                <strong>Name:</strong> ${employee.name} | 
                <strong>Email:</strong> ${employee.email_id || 'N/A'} | 
                <strong>Department:</strong> ${employee.department_name || 'N/A'} | 
                <strong>Contact:</strong> ${employee.contact_number || 'N/A'}
                <br>
                <button onclick="openEditEmployeeModal('${employee.unique_id}')" class="btn-edit" style="margin-top: 10px; padding: 5px 15px;">View/Edit</button>
            </div>
        `;
    } catch (error) {
        console.error('Error searching employee:', error);
        showAlert('Failed to search employee', 'error');
        resultDiv.innerHTML = `
            <div style="padding: 15px; background: #fed7d7; border: 1px solid #fc8181; border-radius: 4px; color: #c53030;">
                Error searching employee. Please try again.
            </div>
        `;
    }
}

// Clear search
function clearSearch() {
    document.getElementById('searchEmployeeId').value = '';
    document.getElementById('searchResult').innerHTML = '';
}

// Open Add Employee Modal
async function openAddEmployeeModal() {
    await loadDepartmentsDropdown('addDepartment');
    await loadRolesDropdown('addRoles');
    await loadShiftsDropdown('addShift');
    document.getElementById('addEmployeeModal').classList.add('active');
}

// Close Add Employee Modal
function closeAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.remove('active');
    document.getElementById('addEmployeeForm').reset();
}

// Submit Add Employee
async function submitAddEmployee(event) {
    event.preventDefault();
    
    try {
        // Step 1: Create employee
        const employeeData = {
            unique_id: document.getElementById('addUniqueId').value,
            name: document.getElementById('addName').value,
            email_id: document.getElementById('addEmail').value,
            contact_number: document.getElementById('addContact').value,
            department_id: document.getElementById('addDepartment').value
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
        const roles = Array.from(document.getElementById('addRoles').selectedOptions).map(o => parseInt(o.value));
        if (roles.length > 0) {
            await fetch(`${API_URL}/employees/${employeeId}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roles })
            });
        }
        
        // Step 3: Add qualification
        const qualification = {
            degree: document.getElementById('addDegree').value,
            institution: document.getElementById('addInstitution').value,
            year_awarded: parseInt(document.getElementById('addYearAwarded').value)
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
            base_salary: parseFloat(document.getElementById('addBaseSalary').value),
            bonus: parseFloat(document.getElementById('addBonus').value) || 0,
            pay_grade: document.getElementById('addPayGrade').value
        };
        if (salary.base_salary) {
            await fetch(`${API_URL}/salary/employees/${employeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salary)
            });
        }
        
        // Step 5: Assign shift
        const shiftId = document.getElementById('addShift').value;
        if (shiftId) {
            await fetch(`${API_URL}/employees/${employeeId}/shifts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shift_id: parseInt(shiftId) })
            });
        }
        
        showAlert('Employee added successfully with all details', 'success');
        closeAddEmployeeModal();
        loadEmployees();
    } catch (error) {
        console.error('Error adding employee:', error);
        showAlert(error.message || 'Failed to add employee', 'error');
    }
}

// Open Edit Employee Modal
async function openEditEmployeeModal(empId) {
    try {
        const response = await fetch(`${API_URL}/employees/${empId}`);
        if (!response.ok) throw new Error('Failed to fetch employee');
        
        const employee = await response.json();
        
        document.getElementById('editUniqueId').value = employee.unique_id;
        document.getElementById('editName').value = employee.name;
        document.getElementById('editEmail').value = employee.email_id || '';
        document.getElementById('editContact').value = employee.contact_number || '';
        document.getElementById('editDepartment').value = employee.department_id || '';
        document.getElementById('editIsOnDuty').value = employee.is_on_duty ? '1' : '0';
        
        await loadDepartmentsDropdown('editDepartment');
        document.getElementById('editDepartment').value = employee.department_id || '';
        
        document.getElementById('editEmployeeModal').classList.add('active');
    } catch (error) {
        console.error('Error loading employee:', error);
        showAlert('Failed to load employee details', 'error');
    }
}

// Close Edit Employee Modal
function closeEditEmployeeModal() {
    document.getElementById('editEmployeeModal').classList.remove('active');
    document.getElementById('editEmployeeForm').reset();
}

// Submit Edit Employee
async function submitEditEmployee(event) {
    event.preventDefault();
    
    const empId = document.getElementById('editUniqueId').value;
    const updates = {
        name: document.getElementById('editName').value,
        email_id: document.getElementById('editEmail').value,
        contact_number: document.getElementById('editContact').value,
        department_id: parseInt(document.getElementById('editDepartment').value),
        is_on_duty: parseInt(document.getElementById('editIsOnDuty').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/employees/${empId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Employee updated successfully', 'success');
            closeEditEmployeeModal();
            loadEmployees();
            clearSearch();
        } else {
            throw new Error(result.error || 'Failed to update employee');
        }
    } catch (error) {
        console.error('Error updating employee:', error);
        showAlert(error.message || 'Failed to update employee', 'error');
    }
}

// Confirm and Delete Employee
async function confirmDeleteEmployee(empId, empName) {
    if (!confirm(`Are you sure you want to delete employee "${empName}" (ID: ${empId})?\n\nThis action cannot be undone!`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/employees/${empId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Employee deleted successfully', 'success');
            loadEmployees();
            clearSearch();
        } else {
            throw new Error(result.error || 'Failed to delete employee');
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        showAlert(error.message || 'Failed to delete employee', 'error');
    }
}

// Load departments dropdown (helper function with ID parameter)
async function loadDepartmentsDropdown(selectId) {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const departments = await response.json();
        
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(dept => {
                select.innerHTML += `<option value="${dept.department_id}">${dept.department_name}</option>`;
            });
            select.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Load roles dropdown (helper function with ID parameter)
async function loadRolesDropdown(selectId) {
    try {
        const response = await fetch(`${API_URL}/roles`);
        const roles = await response.json();
        
        const select = document.getElementById(selectId);
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

// Load shifts dropdown (helper function with ID parameter)
async function loadShiftsDropdown(selectId) {
    try {
        const response = await fetch(`${API_URL}/shifts`);
        const shifts = await response.json();
        
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Shift</option>';
            shifts.forEach(shift => {
                select.innerHTML += `<option value="${shift.shift_id}">${shift.shift_type} - ${shift.shift_time || 'N/A'}</option>`;
            });
            select.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading shifts:', error);
    }
}

