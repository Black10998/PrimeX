const API_URL = '/api/v1';
let authToken = localStorage.getItem('adminToken');
let currentSection = 'overview';

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Login and Auth Guard
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (authToken) {
        verifyTokenAndShowDashboard();
    } else {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('dashboardPage').classList.add('hidden');
    }
});

async function verifyTokenAndShowDashboard() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            showDashboard();
        } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUsername');
            authToken = null;
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('dashboardPage').classList.add('hidden');
        }
    } catch (error) {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('dashboardPage').classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.data.token;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUsername', data.data.admin.username);
            showDashboard();
        } else {
            errorDiv.textContent = data.message || 'Login failed';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error';
        errorDiv.classList.remove('hidden');
    }
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    document.getElementById('adminUsername').textContent = localStorage.getItem('adminUsername');
    loadDashboardStats();
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    authToken = null;
    location.reload();
}

// Section Navigation
function showSection(section) {
    currentSection = section;
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`${section}Section`).classList.remove('hidden');
    event.target.closest('.nav-item').classList.add('active');
    
    switch(section) {
        case 'overview': loadDashboardStats(); break;
        case 'users': loadUsers(); break;
        case 'codes': loadCodes(); break;
        case 'channels': loadChannels(); break;
        case 'categories': loadCategories(); break;
        case 'servers': loadServers(); break;
        case 'plans': loadPlans(); break;
    }
}

// API Helper
async function apiRequest(endpoint, options = {}) {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        }
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, config);
    return response.json();
}

// Dashboard Stats
async function loadDashboardStats() {
    try {
        const data = await apiRequest('/admin/dashboard/stats');
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.data.users.total_users || 0;
            document.getElementById('activeSubscriptions').textContent = data.data.users.active_subscriptions || 0;
            document.getElementById('totalChannels').textContent = data.data.channels.total_channels || 0;
            document.getElementById('activeServers').textContent = data.data.servers.active_servers || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Users Management
async function loadUsers() {
    try {
        const data = await apiRequest('/admin/users');
        const tbody = document.getElementById('usersTableBody');
        
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span></td>
                    <td>${user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('user', ${user.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load users', 'error');
    }
}

function showUserModal(userId = null) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${userId ? 'Edit User' : 'Add User'}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="userForm" onsubmit="saveUser(event, ${userId})">
                        <div class="form-group">
                            <label class="form-label">Username *</label>
                            <input type="text" id="userUsername" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password ${userId ? '' : '*'}</label>
                            <input type="password" id="userPassword" class="form-input" ${userId ? '' : 'required'}>
                            ${userId ? '<small>Leave blank to keep current password</small>' : ''}
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" id="userEmail" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status *</label>
                            <select id="userStatus" class="form-select" required>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Max Devices</label>
                            <input type="number" id="userMaxDevices" class="form-input" value="1" min="1">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="document.getElementById('userForm').requestSubmit()">Save</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function saveUser(event, userId) {
    event.preventDefault();
    const userData = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        status: document.getElementById('userStatus').value,
        max_devices: parseInt(document.getElementById('userMaxDevices').value)
    };
    
    const password = document.getElementById('userPassword').value;
    if (password) userData.password = password;
    
    try {
        const endpoint = userId ? `/admin/users/${userId}` : '/admin/users';
        const method = userId ? 'PUT' : 'POST';
        const data = await apiRequest(endpoint, { method, body: JSON.stringify(userData) });
        
        if (data.success) {
            showNotification(userId ? 'User updated successfully' : 'User created successfully');
            closeModal();
            loadUsers();
        } else {
            showNotification(data.message || 'Failed to save user', 'error');
        }
    } catch (error) {
        showNotification('Error saving user', 'error');
    }
}

async function editUser(userId) {
    try {
        const data = await apiRequest(`/admin/users/${userId}`);
        if (data.success) {
            showUserModal(userId);
            document.getElementById('userUsername').value = data.data.username;
            document.getElementById('userEmail').value = data.data.email || '';
            document.getElementById('userStatus').value = data.data.status;
            document.getElementById('userMaxDevices').value = data.data.max_devices || 1;
        }
    } catch (error) {
        showNotification('Failed to load user', 'error');
    }
}

// Codes Management
async function loadCodes() {
    try {
        const data = await apiRequest('/admin/codes');
        const tbody = document.getElementById('codesTableBody');
        
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(code => `
                <tr>
                    <td><code>${code.code}</code></td>
                    <td>${code.source_name || 'N/A'}</td>
                    <td>${code.duration_days} days</td>
                    <td><span class="badge badge-${code.status === 'active' ? 'success' : 'warning'}">${code.status}</span></td>
                    <td>${code.used_count}/${code.max_uses}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('code', ${code.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No codes found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load codes', 'error');
    }
}

function showCodeModal() {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">Generate Subscription Codes</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="codeForm" onsubmit="generateCodes(event)">
                        <div class="form-group">
                            <label class="form-label">Source Name *</label>
                            <input type="text" id="codeSource" class="form-input" placeholder="e.g., Batch-2024-01" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Number of Codes *</label>
                            <input type="number" id="codeCount" class="form-input" value="10" min="1" max="1000" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Duration (days) *</label>
                            <input type="number" id="codeDuration" class="form-input" value="30" min="1" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Max Uses per Code</label>
                            <input type="number" id="codeMaxUses" class="form-input" value="1" min="1">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="document.getElementById('codeForm').requestSubmit()">Generate</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function generateCodes(event) {
    event.preventDefault();
    const codeData = {
        source_name: document.getElementById('codeSource').value,
        count: parseInt(document.getElementById('codeCount').value),
        duration_days: parseInt(document.getElementById('codeDuration').value),
        max_uses: parseInt(document.getElementById('codeMaxUses').value)
    };
    
    try {
        const data = await apiRequest('/admin/codes/generate', { method: 'POST', body: JSON.stringify(codeData) });
        if (data.success) {
            showNotification(`${codeData.count} codes generated successfully`);
            closeModal();
            loadCodes();
        } else {
            showNotification(data.message || 'Failed to generate codes', 'error');
        }
    } catch (error) {
        showNotification('Error generating codes', 'error');
    }
}

// Channels Management
async function loadChannels() {
    try {
        const data = await apiRequest('/admin/channels');
        const tbody = document.getElementById('channelsTableBody');
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(ch => `
                <tr>
                    <td>${ch.id}</td>
                    <td>${ch.name_en}</td>
                    <td>${ch.name_ar}</td>
                    <td>${ch.category_id}</td>
                    <td><span class="badge badge-${ch.status === 'active' ? 'success' : 'danger'}">${ch.status}</span></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editChannel(${ch.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('channel', ${ch.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No channels found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load channels', 'error');
    }
}

// Categories, Servers, Plans - Similar implementations
async function loadCategories() {
    try {
        const data = await apiRequest('/admin/categories');
        const tbody = document.getElementById('categoriesTableBody');
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(cat => `
                <tr>
                    <td>${cat.id}</td>
                    <td>${cat.name_en}</td>
                    <td>${cat.name_ar}</td>
                    <td>${cat.slug}</td>
                    <td><span class="badge badge-${cat.status === 'active' ? 'success' : 'danger'}">${cat.status}</span></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editCategory(${cat.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('category', ${cat.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No categories found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load categories', 'error');
    }
}

async function loadServers() {
    try {
        const data = await apiRequest('/admin/servers');
        const tbody = document.getElementById('serversTableBody');
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(srv => `
                <tr>
                    <td>${srv.id}</td>
                    <td>${srv.name}</td>
                    <td>${srv.url}</td>
                    <td>${srv.type}</td>
                    <td><span class="badge badge-${srv.status === 'active' ? 'success' : 'danger'}">${srv.status}</span></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editServer(${srv.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('server', ${srv.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No servers found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load servers', 'error');
    }
}

async function loadPlans() {
    try {
        const data = await apiRequest('/admin/plans');
        const tbody = document.getElementById('plansTableBody');
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(plan => `
                <tr>
                    <td>${plan.id}</td>
                    <td>${plan.name_en}</td>
                    <td>${plan.duration_days} days</td>
                    <td>$${plan.price}</td>
                    <td>${plan.max_devices}</td>
                    <td><span class="badge badge-${plan.status === 'active' ? 'success' : 'danger'}">${plan.status}</span></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editPlan(${plan.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('plan', ${plan.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No plans found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load plans', 'error');
    }
}

// Confirmation Dialog
function confirmDelete(type, id) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 class="modal-title">Confirm Delete</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this ${type}? This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-danger" onclick="executeDelete('${type}', ${id})">Delete</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function executeDelete(type, id) {
    const endpoints = {
        user: `/admin/users/${id}`,
        code: `/admin/codes/${id}`,
        channel: `/admin/channels/${id}`,
        category: `/admin/categories/${id}`,
        server: `/admin/servers/${id}`,
        plan: `/admin/plans/${id}`
    };
    
    try {
        const data = await apiRequest(endpoints[type], { method: 'DELETE' });
        if (data.success) {
            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
            closeModal();
            
            // Reload appropriate section
            switch(type) {
                case 'user': loadUsers(); break;
                case 'code': loadCodes(); break;
                case 'channel': loadChannels(); break;
                case 'category': loadCategories(); break;
                case 'server': loadServers(); break;
                case 'plan': loadPlans(); break;
            }
        } else {
            showNotification(data.message || `Failed to delete ${type}`, 'error');
        }
    } catch (error) {
        showNotification(`Error deleting ${type}`, 'error');
    }
}

// Modal helpers
function closeModal(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modalContainer').innerHTML = '';
    }
}

// Placeholder functions for edit operations
function editChannel(id) { showNotification('Channel edit coming soon', 'info'); }
function editCategory(id) { showNotification('Category edit coming soon', 'info'); }
function editServer(id) { showNotification('Server edit coming soon', 'info'); }
function editPlan(id) { showNotification('Plan edit coming soon', 'info'); }
function showChannelModal() { showNotification('Channel creation coming soon', 'info'); }
function showCategoryModal() { showNotification('Category creation coming soon', 'info'); }
function showServerModal() { showNotification('Server creation coming soon', 'info'); }
function showPlanModal() { showNotification('Plan creation coming soon', 'info'); }
