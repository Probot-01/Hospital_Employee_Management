// Shift Management JavaScript

// Ensure API_URL is defined (in case script.js didn't load)
if (typeof API_URL === 'undefined') {
    var API_URL = 'http://localhost:3000/api';
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

// Load all shifts
async function loadShifts() {
    try {
        console.log('Loading shifts from:', `${API_URL}/shifts`);
        const response = await fetch(`${API_URL}/shifts`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Shifts API Error:', response.status, errorText);
            throw new Error(`Failed to fetch shifts: ${response.status} ${errorText}`);
        }
        
        const shifts = await response.json();
        console.log('Loaded shifts:', shifts);
        
        const tbody = document.getElementById('shiftTableBody');
        tbody.innerHTML = '';
        
        if (!Array.isArray(shifts)) {
            console.error('Invalid shifts data:', shifts);
            throw new Error('Invalid response format from server');
        }
        
        if (shifts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #718096;">No shifts found. Click "+ Add Shift" to create one.</td></tr>';
            return;
        }
        
        shifts.forEach(shift => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${shift.shift_id}</td>
                <td><strong>${shift.shift_type}</strong></td>
                <td>${shift.shift_time || 'N/A'}</td>
                <td>
                    <button onclick="openEditShiftModal(${shift.shift_id})" class="btn-edit" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                    <button onclick="confirmDeleteShift(${shift.shift_id}, '${shift.shift_type.replace(/'/g, "\\'")}')" class="btn-delete" style="padding: 5px 10px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading shifts:', error);
        const errorMsg = error.message || 'Failed to load shifts. Please check if the backend server is running and database is connected.';
        showAlert(errorMsg, 'error');
        const tbody = document.getElementById('shiftTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #f56565;">Error: ${errorMsg}</td></tr>`;
        }
    }
}

// Open Add Shift Modal
function openAddShiftModal() {
    document.getElementById('addShiftModal').classList.add('active');
}

// Close Add Shift Modal
function closeAddShiftModal() {
    document.getElementById('addShiftModal').classList.remove('active');
    document.getElementById('addShiftForm').reset();
}

// Submit Add Shift
async function submitAddShift(event) {
    event.preventDefault();
    
    const formData = {
        shift_type: document.getElementById('addShiftType').value,
        shift_time: document.getElementById('addShiftTime').value || null
    };
    
    try {
        const response = await fetch(`${API_URL}/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Shift added successfully', 'success');
            closeAddShiftModal();
            loadShifts();
        } else {
            throw new Error(result.error || 'Failed to add shift');
        }
    } catch (error) {
        console.error('Error adding shift:', error);
        showAlert(error.message || 'Failed to add shift', 'error');
    }
}

// Open Edit Shift Modal
async function openEditShiftModal(shiftId) {
    try {
        const response = await fetch(`${API_URL}/shifts/${shiftId}`);
        if (!response.ok) throw new Error('Failed to fetch shift');
        
        const shift = await response.json();
        
        document.getElementById('editShiftId').value = shift.shift_id;
        document.getElementById('editShiftType').value = shift.shift_type;
        document.getElementById('editShiftTime').value = shift.shift_time || '';
        
        document.getElementById('editShiftModal').classList.add('active');
    } catch (error) {
        console.error('Error loading shift:', error);
        showAlert('Failed to load shift details', 'error');
    }
}

// Close Edit Shift Modal
function closeEditShiftModal() {
    document.getElementById('editShiftModal').classList.remove('active');
    document.getElementById('editShiftForm').reset();
}

// Submit Edit Shift
async function submitEditShift(event) {
    event.preventDefault();
    
    const shiftId = document.getElementById('editShiftId').value;
    const formData = {
        shift_type: document.getElementById('editShiftType').value,
        shift_time: document.getElementById('editShiftTime').value || null
    };
    
    try {
        const response = await fetch(`${API_URL}/shifts/${shiftId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Shift updated successfully', 'success');
            closeEditShiftModal();
            loadShifts();
        } else {
            throw new Error(result.error || 'Failed to update shift');
        }
    } catch (error) {
        console.error('Error updating shift:', error);
        showAlert(error.message || 'Failed to update shift', 'error');
    }
}

// Confirm and Delete Shift
async function confirmDeleteShift(shiftId, shiftType) {
    if (!confirm(`Are you sure you want to delete shift "${shiftType}" (ID: ${shiftId})?\n\nThis will unassign it from all employees.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/shifts/${shiftId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Shift deleted successfully', 'success');
            loadShifts();
        } else {
            throw new Error(result.error || 'Failed to delete shift');
        }
    } catch (error) {
        console.error('Error deleting shift:', error);
        showAlert(error.message || 'Failed to delete shift', 'error');
    }
}

