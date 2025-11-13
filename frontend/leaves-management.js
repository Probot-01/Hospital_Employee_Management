// Leave Management JavaScript

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

// Ensure formatDate is available
if (typeof formatDate === 'undefined') {
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// Load all leave records
async function loadLeaveRecords() {
    try {
        const response = await fetch(`${API_URL}/leave`);
        if (!response.ok) throw new Error('Failed to fetch leave records');
        const leaves = await response.json();
        
        const tbody = document.getElementById('leaveTableBody');
        tbody.innerHTML = '';
        
        if (leaves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #718096;">No leave records found</td></tr>';
            return;
        }
        
        leaves.forEach(leave => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${leave.leave_id}</td>
                <td>${leave.employee_id}</td>
                <td>${leave.leave_type}</td>
                <td>${formatDate(leave.start_date)}</td>
                <td>${formatDate(leave.end_date)}</td>
                <td>${leave.duration || 'N/A'} days</td>
                <td><span class="status-badge status-${leave.status.toLowerCase()}">${leave.status}</span></td>
                <td>
                    <button onclick="openUpdateLeaveModal(${leave.leave_id})" class="btn-edit" style="padding: 5px 10px; margin-right: 5px;">Update</button>
                    <button onclick="confirmDeleteLeave(${leave.leave_id})" class="btn-delete" style="padding: 5px 10px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading leave records:', error);
        showAlert('Failed to load leave records', 'error');
        document.getElementById('leaveTableBody').innerHTML = '<tr><td colspan="8" style="text-align: center; color: #f56565;">Error loading leave records</td></tr>';
    }
}

// Open Apply Leave Modal
function openApplyLeaveModal() {
    document.getElementById('applyLeaveModal').classList.add('active');
    
    // Auto-calculate duration when dates change
    document.getElementById('leaveStartDate').addEventListener('change', calculateDuration);
    document.getElementById('leaveEndDate').addEventListener('change', calculateDuration);
}

// Calculate duration
function calculateDuration() {
    const startDate = new Date(document.getElementById('leaveStartDate').value);
    const endDate = new Date(document.getElementById('leaveEndDate').value);
    
    if (startDate && endDate && endDate >= startDate) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
        document.getElementById('leaveDuration').value = diffDays;
    }
}

// Close Apply Leave Modal
function closeApplyLeaveModal() {
    document.getElementById('applyLeaveModal').classList.remove('active');
    document.getElementById('applyLeaveForm').reset();
}

// Submit Apply Leave
async function submitApplyLeave(event) {
    event.preventDefault();
    
    const employeeId = document.getElementById('leaveEmployeeId').value;
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('leaveStartDate').value;
    const endDate = document.getElementById('leaveEndDate').value;
    const duration = parseInt(document.getElementById('leaveDuration').value) || null;
    const status = document.getElementById('leaveStatus').value || 'Pending';
    
    const formData = {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        duration: duration,
        status: status
    };
    
    try {
        const response = await fetch(`${API_URL}/leave/employees/${employeeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Leave applied successfully', 'success');
            closeApplyLeaveModal();
            loadLeaveRecords();
        } else {
            throw new Error(result.error || 'Failed to apply leave');
        }
    } catch (error) {
        console.error('Error applying leave:', error);
        showAlert(error.message || 'Failed to apply leave', 'error');
    }
}

// Open Update Leave Modal
async function openUpdateLeaveModal(leaveId) {
    try {
        const response = await fetch(`${API_URL}/leave/${leaveId}`);
        if (!response.ok) throw new Error('Failed to fetch leave record');
        
        const leave = await response.json();
        
        document.getElementById('updateLeaveId').value = leave.leave_id;
        document.getElementById('updateLeaveType').value = leave.leave_type;
        document.getElementById('updateLeaveDuration').value = leave.duration || '';
        document.getElementById('updateLeaveStartDate').value = leave.start_date;
        document.getElementById('updateLeaveEndDate').value = leave.end_date;
        document.getElementById('updateLeaveStatus').value = leave.status;
        
        document.getElementById('updateLeaveModal').classList.add('active');
    } catch (error) {
        console.error('Error loading leave:', error);
        showAlert('Failed to load leave details', 'error');
    }
}

// Close Update Leave Modal
function closeUpdateLeaveModal() {
    document.getElementById('updateLeaveModal').classList.remove('active');
    document.getElementById('updateLeaveForm').reset();
}

// Submit Update Leave
async function submitUpdateLeave(event) {
    event.preventDefault();
    
    const leaveId = document.getElementById('updateLeaveId').value;
    const formData = {
        leave_type: document.getElementById('updateLeaveType').value,
        duration: parseInt(document.getElementById('updateLeaveDuration').value) || null,
        start_date: document.getElementById('updateLeaveStartDate').value,
        end_date: document.getElementById('updateLeaveEndDate').value,
        status: document.getElementById('updateLeaveStatus').value
    };
    
    try {
        const response = await fetch(`${API_URL}/leave/${leaveId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Leave status updated successfully', 'success');
            closeUpdateLeaveModal();
            loadLeaveRecords();
        } else {
            throw new Error(result.error || 'Failed to update leave');
        }
    } catch (error) {
        console.error('Error updating leave:', error);
        showAlert(error.message || 'Failed to update leave', 'error');
    }
}

// Confirm and Delete Leave
async function confirmDeleteLeave(leaveId) {
    if (!confirm('Are you sure you want to delete this leave record? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/leave/${leaveId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Leave record deleted successfully', 'success');
            loadLeaveRecords();
        } else {
            throw new Error(result.error || 'Failed to delete leave record');
        }
    } catch (error) {
        console.error('Error deleting leave:', error);
        showAlert(error.message || 'Failed to delete leave record', 'error');
    }
}

