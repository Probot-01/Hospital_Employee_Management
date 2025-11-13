// Role Management JavaScript

// Ensure API_URL is defined (in case script.js didn't load)
if (typeof API_URL === 'undefined') {
    var API_URL = 'https://hospital-employee-management.onrender.com/api';

}

// Ensure showAlert is available
if (typeof showAlert === 'undefined') {
    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} show`;
        alertDiv.textContent = message;
        
        const content = document.querySelector('.content');
        if (content) {
            content.insertBefore(alertDiv, content.firstChild);
            setTimeout(() => alertDiv.remove(), 3000);
        } else {
            alert(message);
        }
    }
}

// Load all roles
async function loadRoles() {
    try {
        console.log('Loading roles from:', `${API_URL}/roles`);
        const response = await fetch(`${API_URL}/roles`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Roles API Error:', response.status, errorText);
            throw new Error(`Failed to fetch roles: ${response.status} ${errorText}`);
        }
        
        const roles = await response.json();
        console.log('Loaded roles:', roles);
        
        const tbody = document.getElementById('roleTableBody');
        tbody.innerHTML = '';
        
        if (!Array.isArray(roles)) {
            console.error('Invalid roles data:', roles);
            throw new Error('Invalid response format from server');
        }
        
        if (roles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #718096;">No roles found. Click "+ Add Role" to create one.</td></tr>';
            return;
        }
        
        roles.forEach(role => {
            const row = document.createElement('tr');
            const roleNameEscaped = (role.role_name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            row.innerHTML = `
                <td>${role.role_id}</td>
                <td><strong>${role.role_name}</strong></td>
                <td>${role.role_type || 'N/A'}</td>
                <td>
                    <button onclick="openEditRoleModal(${role.role_id})" class="btn-edit" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                    <button onclick="confirmDeleteRole(${role.role_id}, '${roleNameEscaped}')" class="btn-delete" style="padding: 5px 10px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading roles:', error);
        const errorMsg = error.message || 'Failed to load roles. Please check if the backend server is running and database is connected.';
        showAlert(errorMsg, 'error');
        const tbody = document.getElementById('roleTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #f56565;">Error: ${errorMsg}</td></tr>`;
        }
    }
}

// Open Add Role Modal
function openAddRoleModal() {
    document.getElementById('addRoleModal').classList.add('active');
}

// Close Add Role Modal
function closeAddRoleModal() {
    document.getElementById('addRoleModal').classList.remove('active');
    document.getElementById('addRoleForm').reset();
}

// Submit Add Role
async function submitAddRole(event) {
    event.preventDefault();
    
    const formData = {
        role_name: document.getElementById('addRoleName').value,
        role_type: document.getElementById('addRoleType').value || null
    };
    
    try {
        const response = await fetch(`${API_URL}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Role added successfully', 'success');
            closeAddRoleModal();
            loadRoles();
        } else {
            throw new Error(result.error || 'Failed to add role');
        }
    } catch (error) {
        console.error('Error adding role:', error);
        showAlert(error.message || 'Failed to add role', 'error');
    }
}

// Open Edit Role Modal
async function openEditRoleModal(roleId) {
    try {
        const response = await fetch(`${API_URL}/roles/${roleId}`);
        if (!response.ok) throw new Error('Failed to fetch role');
        
        const role = await response.json();
        
        document.getElementById('editRoleId').value = role.role_id;
        document.getElementById('editRoleName').value = role.role_name;
        document.getElementById('editRoleType').value = role.role_type || '';
        
        document.getElementById('editRoleModal').classList.add('active');
    } catch (error) {
        console.error('Error loading role:', error);
        showAlert('Failed to load role details', 'error');
    }
}

// Close Edit Role Modal
function closeEditRoleModal() {
    document.getElementById('editRoleModal').classList.remove('active');
    document.getElementById('editRoleForm').reset();
}

// Submit Edit Role
async function submitEditRole(event) {
    event.preventDefault();
    
    const roleId = document.getElementById('editRoleId').value;
    const formData = {
        role_name: document.getElementById('editRoleName').value,
        role_type: document.getElementById('editRoleType').value || null
    };
    
    try {
        const response = await fetch(`${API_URL}/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Role updated successfully', 'success');
            closeEditRoleModal();
            loadRoles();
        } else {
            throw new Error(result.error || 'Failed to update role');
        }
    } catch (error) {
        console.error('Error updating role:', error);
        showAlert(error.message || 'Failed to update role', 'error');
    }
}

// Confirm and Delete Role
async function confirmDeleteRole(roleId, roleName) {
    if (!confirm(`Are you sure you want to delete role "${roleName}" (ID: ${roleId})?\n\nThis will remove it from all employee assignments.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/roles/${roleId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Role deleted successfully', 'success');
            loadRoles();
        } else {
            throw new Error(result.error || 'Failed to delete role');
        }
    } catch (error) {
        console.error('Error deleting role:', error);
        showAlert(error.message || 'Failed to delete role', 'error');
    }
}

