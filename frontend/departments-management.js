// Department Management JavaScript

// Load all departments
async function loadDepartments() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        if (!response.ok) throw new Error('Failed to fetch departments');
        const departments = await response.json();
        
        const tbody = document.getElementById('departmentTableBody');
        tbody.innerHTML = '';
        
        if (departments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #718096;">No departments found</td></tr>';
            return;
        }
        
        departments.forEach(dept => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dept.department_id}</td>
                <td><strong>${dept.department_name}</strong></td>
                <td>${dept.department_location || 'N/A'}</td>
                <td>${dept.active_count || 0}</td>
                <td>${dept.on_duty_count || 0}</td>
                <td>
                    <button onclick="openEditDepartmentModal(${dept.department_id})" class="btn-edit" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                    <button onclick="confirmDeleteDepartment(${dept.department_id}, '${dept.department_name}', ${dept.active_count || 0})" class="btn-delete" style="padding: 5px 10px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading departments:', error);
        showAlert('Failed to load departments', 'error');
        document.getElementById('departmentTableBody').innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f56565;">Error loading departments</td></tr>';
    }
}

// Search department by ID
async function searchDepartment() {
    const deptId = document.getElementById('searchDepartmentId').value.trim();
    const resultDiv = document.getElementById('departmentSearchResult');
    
    if (!deptId) {
        showAlert('Please enter a Department ID', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/departments/${deptId}`);
        
        if (response.status === 404) {
            resultDiv.innerHTML = `
                <div style="padding: 15px; background: #fed7d7; border: 1px solid #fc8181; border-radius: 4px; color: #c53030;">
                    <strong>Department not found</strong><br>
                    No department found with ID: ${deptId}
                </div>
            `;
            return;
        }
        
        if (!response.ok) throw new Error('Failed to search department');
        
        const department = await response.json();
        
        resultDiv.innerHTML = `
            <div style="padding: 15px; background: #c6f6d5; border: 1px solid #68d391; border-radius: 4px; color: #22543d;">
                <strong>Department Found:</strong><br>
                <strong>ID:</strong> ${department.department_id} | 
                <strong>Name:</strong> ${department.department_name} | 
                <strong>Location:</strong> ${department.department_location || 'N/A'}
                <br>
                <button onclick="openEditDepartmentModal(${department.department_id})" class="btn-edit" style="margin-top: 10px; padding: 5px 15px;">View/Edit</button>
            </div>
        `;
    } catch (error) {
        console.error('Error searching department:', error);
        showAlert('Failed to search department', 'error');
        resultDiv.innerHTML = `
            <div style="padding: 15px; background: #fed7d7; border: 1px solid #fc8181; border-radius: 4px; color: #c53030;">
                Error searching department. Please try again.
            </div>
        `;
    }
}

// Clear department search
function clearDepartmentSearch() {
    document.getElementById('searchDepartmentId').value = '';
    document.getElementById('departmentSearchResult').innerHTML = '';
}

// Open Add Department Modal
function openAddDepartmentModal() {
    document.getElementById('addDepartmentModal').classList.add('active');
}

// Close Add Department Modal
function closeAddDepartmentModal() {
    document.getElementById('addDepartmentModal').classList.remove('active');
    document.getElementById('addDepartmentForm').reset();
}

// Submit Add Department
async function submitAddDepartment(event) {
    event.preventDefault();
    
    const formData = {
        department_name: document.getElementById('addDeptName').value,
        department_location: document.getElementById('addDeptLocation').value || null,
        department_password: document.getElementById('addDeptPassword').value
    };
    
    try {
        const response = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Department added successfully', 'success');
            closeAddDepartmentModal();
            loadDepartments();
        } else {
            throw new Error(result.error || 'Failed to add department');
        }
    } catch (error) {
        console.error('Error adding department:', error);
        showAlert(error.message || 'Failed to add department', 'error');
    }
}

// Open Edit Department Modal
async function openEditDepartmentModal(deptId) {
    try {
        const response = await fetch(`${API_URL}/departments/${deptId}`);
        if (!response.ok) throw new Error('Failed to fetch department');
        
        const department = await response.json();
        
        document.getElementById('editDeptId').value = department.department_id;
        document.getElementById('editDeptName').value = department.department_name;
        document.getElementById('editDeptLocation').value = department.department_location || '';
        document.getElementById('editDeptPassword').value = '';
        
        document.getElementById('editDepartmentModal').classList.add('active');
    } catch (error) {
        console.error('Error loading department:', error);
        showAlert('Failed to load department details', 'error');
    }
}

// Close Edit Department Modal
function closeEditDepartmentModal() {
    document.getElementById('editDepartmentModal').classList.remove('active');
    document.getElementById('editDepartmentForm').reset();
}

// Submit Edit Department
async function submitEditDepartment(event) {
    event.preventDefault();
    
    const deptId = document.getElementById('editDeptId').value;
    const formData = {
        department_name: document.getElementById('editDeptName').value,
        department_location: document.getElementById('editDeptLocation').value || null
    };
    
    // Only include password if provided
    const password = document.getElementById('editDeptPassword').value;
    if (password) {
        formData.department_password = password;
    }
    
    try {
        const response = await fetch(`${API_URL}/departments/${deptId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Department updated successfully', 'success');
            closeEditDepartmentModal();
            loadDepartments();
            clearDepartmentSearch();
        } else {
            throw new Error(result.error || 'Failed to update department');
        }
    } catch (error) {
        console.error('Error updating department:', error);
        showAlert(error.message || 'Failed to update department', 'error');
    }
}

// Confirm and Delete Department
async function confirmDeleteDepartment(deptId, deptName, activeCount) {
    if (activeCount > 0) {
        alert(`Cannot delete department "${deptName}" because it has ${activeCount} active employee(s).\n\nPlease reassign or archive employees first.`);
        return;
    }
    
    if (!confirm(`Are you sure you want to delete department "${deptName}" (ID: ${deptId})?\n\nThis action cannot be undone!`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/departments/${deptId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Department deleted successfully', 'success');
            loadDepartments();
            clearDepartmentSearch();
        } else {
            throw new Error(result.error || 'Failed to delete department');
        }
    } catch (error) {
        console.error('Error deleting department:', error);
        showAlert(error.message || 'Failed to delete department', 'error');
    }
}

