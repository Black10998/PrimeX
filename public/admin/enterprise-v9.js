// Enterprise Admin Dashboard v9.0 - Full Featured
const API_URL = '/api/v1';
let authToken = localStorage.getItem('adminToken');
let currentSection = 'overview';
let allCategories = [];

// Mobile Menu Toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<strong>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</strong> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Auth and Login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Add mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
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
            localStorage.clear();
            authToken = null;
            location.reload();
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
    loadCategories();
}

function logout() {
    localStorage.clear();
    authToken = null;
    location.reload();
}

// Section Navigation
function showSection(section) {
    currentSection = section;
    
    // Close mobile menu
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('mobile-open');
    
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
        case 'clients': showClientInfo(); break;
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

// Load Categories
async function loadCategories() {
    try {
        const data = await apiRequest('/admin/categories');
        if (data.success) {
            allCategories = data.data;
        }
    } catch (error) {
        console.error('Failed to load categories');
    }
}

// USERS MANAGEMENT - ENHANCED
async function loadUsers() {
    try {
        const data = await apiRequest('/admin/users');
        const tbody = document.getElementById('usersTableBody');
        
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(user => {
                const isActive = user.status === 'active';
                const isExpired = user.subscription_end && new Date(user.subscription_end) < new Date();
                const statusBadge = isExpired ? 'danger' : (isActive ? 'success' : 'warning');
                const statusText = isExpired ? 'Expired' : user.status;
                
                return `
                <tr>
                    <td>${user.id}</td>
                    <td><strong>${user.username}</strong></td>
                    <td>${user.email || 'N/A'}</td>
                    <td><span class="badge badge-${statusBadge}">${statusText}</span></td>
                    <td>${user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : 'N/A'}</td>
                    <td>${user.max_devices || 1}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="viewUserProfile(${user.id})" title="View Profile">
                            👤
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="btn btn-sm ${isActive ? 'btn-warning' : 'btn-success'}" 
                                onclick="toggleUserStatus(${user.id}, '${user.status}')" 
                                title="${isActive ? 'Suspend' : 'Activate'}">
                            ${isActive ? '⏸️' : '▶️'}
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="extendSubscription(${user.id})" title="Extend">
                            📅
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('user', ${user.id})" title="Delete">
                            🗑️
                        </button>
                    </td>
                </tr>
            `}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load users', 'error');
    }
}

// View User Profile
function viewUserProfile(userId) {
    showNotification('User profile view coming soon', 'info');
}

// Toggle User Status
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'suspend';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
        const data = await apiRequest(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (data.success) {
            showNotification(`User ${action}d successfully`);
            loadUsers();
        } else {
            showNotification(data.message || `Failed to ${action} user`, 'error');
        }
    } catch (error) {
        showNotification(`Error ${action}ing user`, 'error');
    }
}

// Extend Subscription
function extendSubscription(userId) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">Extend Subscription</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="extendForm" onsubmit="saveExtension(event, ${userId})">
                        <div class="form-group">
                            <label class="form-label">Extend by (days)</label>
                            <input type="number" id="extendDays" class="form-input" value="30" min="1" max="365" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea id="extendNotes" class="form-textarea" placeholder="Reason for extension..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="document.getElementById('extendForm').requestSubmit()">Extend</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function saveExtension(event, userId) {
    event.preventDefault();
    const days = parseInt(document.getElementById('extendDays').value);
    
    try {
        const data = await apiRequest(`/admin/users/${userId}/extend`, {
            method: 'POST',
            body: JSON.stringify({ days })
        });
        
        if (data.success) {
            showNotification(`Subscription extended by ${days} days`);
            closeModal();
            loadUsers();
        } else {
            showNotification(data.message || 'Failed to extend subscription', 'error');
        }
    } catch (error) {
        showNotification('Error extending subscription', 'error');
    }
}

// User Modal
function showUserModal(userId = null) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${userId ? 'Edit User' : 'Create New User'}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="userForm" onsubmit="saveUser(event, ${userId})">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Username</label>
                                <input type="text" id="userUsername" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="userEmail" class="form-input">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Password ${userId ? '(leave blank to keep)' : ''}</label>
                                <input type="password" id="userPassword" class="form-input" ${userId ? '' : 'required'}>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="userStatus" class="form-select" required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Max Devices</label>
                                <input type="number" id="userMaxDevices" class="form-input" value="1" min="1" max="10">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Subscription Days</label>
                                <input type="number" id="userSubDays" class="form-input" value="30" min="1">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="document.getElementById('userForm').requestSubmit()">
                        ${userId ? 'Update' : 'Create'}
                    </button>
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
            showNotification(userId ? 'User updated' : 'User created');
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

// Continue with other management functions (codes, channels, etc.)
// Keep existing implementations from enterprise.js

// Modal helpers
function closeModal(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modalContainer').innerHTML = '';
    }
}

// Confirmation Dialog
function confirmDelete(type, id) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">Confirm Delete</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this ${type}?</p>
                    <p class="text-muted">This action cannot be undone.</p>
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
            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
            closeModal();
            
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

// CODES, SERVERS, CHANNELS, PLANS - Keep implementations
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
                    <h2 class="modal-title">Generate Codes</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="codeForm" onsubmit="generateCodes(event)">
                        <div class="form-group">
                            <label class="form-label">Source Name</label>
                            <input type="text" id="codeSource" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Count</label>
                            <input type="number" id="codeCount" class="form-input" value="10" min="1" max="1000" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Duration (days)</label>
                            <input type="number" id="codeDuration" class="form-input" value="30" min="1" required>
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
        duration_days: parseInt(document.getElementById('codeDuration').value)
    };
    
    try {
        const data = await apiRequest('/admin/codes/generate', { method: 'POST', body: JSON.stringify(codeData) });
        if (data.success) {
            showNotification(`${codeData.count} codes generated`);
            closeModal();
            loadCodes();
        }
    } catch (error) {
        showNotification('Error generating codes', 'error');
    }
}

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
                        <button class="btn btn-sm btn-secondary" onclick="showNotification('Edit coming soon', 'info')">Edit</button>
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

async function loadServers() {
    try {
        const data = await apiRequest('/admin/servers');
        const tbody = document.getElementById('serversTableBody');
        if (data.success && data.data.servers && data.data.servers.length > 0) {
            tbody.innerHTML = data.data.servers.map(srv => `
                <tr>
                    <td>${srv.id}</td>
                    <td><strong>${srv.name}</strong></td>
                    <td><code>${srv.url}</code></td>
                    <td><span class="badge badge-info">${srv.type}</span></td>
                    <td><span class="badge badge-${srv.status === 'active' ? 'success' : 'warning'}">${srv.status}</span></td>
                    <td>${srv.location || 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="showServerModal(${srv.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('server', ${srv.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No servers found</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load servers', 'error');
    }
}

function showServerModal(serverId = null) {
    const modal = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${serverId ? 'Edit Server' : 'Create Server'}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="serverForm" onsubmit="saveServer(event, ${serverId})">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Server Name</label>
                                <input type="text" id="serverName" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Server URL</label>
                                <input type="url" id="serverUrl" class="form-input" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Type</label>
                                <select id="serverType" class="form-select" required>
                                    <option value="primary">Primary</option>
                                    <option value="backup">Backup</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="serverStatus" class="form-select" required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Priority</label>
                                <input type="number" id="serverPriority" class="form-input" value="1" min="1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Max Connections</label>
                                <input type="number" id="serverMaxConn" class="form-input" value="1000" min="1">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Location</label>
                            <input type="text" id="serverLocation" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea id="serverNotes" class="form-textarea"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="document.getElementById('serverForm').requestSubmit()">
                        ${serverId ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function saveServer(event, serverId) {
    event.preventDefault();
    const serverData = {
        name: document.getElementById('serverName').value,
        url: document.getElementById('serverUrl').value,
        type: document.getElementById('serverType').value,
        status: document.getElementById('serverStatus').value,
        priority: parseInt(document.getElementById('serverPriority').value),
        max_connections: parseInt(document.getElementById('serverMaxConn').value),
        location: document.getElementById('serverLocation').value,
        notes: document.getElementById('serverNotes').value
    };
    
    try {
        const endpoint = serverId ? `/admin/servers/${serverId}` : '/admin/servers';
        const method = serverId ? 'PUT' : 'POST';
        const data = await apiRequest(endpoint, { method, body: JSON.stringify(serverData) });
        
        if (data.success) {
            showNotification(serverId ? 'Server updated' : 'Server created');
            closeModal();
            loadServers();
        } else {
            showNotification(data.message || 'Failed to save server', 'error');
        }
    } catch (error) {
        showNotification('Error saving server', 'error');
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
                    <td><strong>${plan.name_en}</strong></td>
                    <td>${plan.duration_days} days</td>
                    <td>$${plan.price}</td>
                    <td>${plan.max_devices}</td>
                    <td><span class="badge badge-${plan.status === 'active' ? 'success' : 'danger'}">${plan.status}</span></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="showNotification('Edit coming soon', 'info')">Edit</button>
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

// CLIENT INFO
function showClientInfo() {
    const serverUrl = window.location.origin;
    const content = document.getElementById('clientsSection');
    
    content.innerHTML = `
        <h1>Client Applications & Connection Info</h1>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>📱 Mobile Applications</h3>
                <p class="text-secondary mb-3">Fully supported on iOS and Android</p>
                <ul style="list-style: none; padding: 0;">
                    <li class="mb-2">✓ IPTV Smarters Pro</li>
                    <li class="mb-2">✓ GSE Smart IPTV</li>
                    <li class="mb-2">✓ Perfect Player</li>
                </ul>
            </div>
            
            <div class="info-card">
                <h3>📺 Smart TV Applications</h3>
                <p class="text-secondary mb-3">Compatible with all major TV platforms</p>
                <ul style="list-style: none; padding: 0;">
                    <li class="mb-2">✓ TiviMate</li>
                    <li class="mb-2">✓ XCIPTV</li>
                    <li class="mb-2">✓ IBO Player</li>
                    <li class="mb-2">✓ Smart IPTV</li>
                </ul>
            </div>
        </div>
        
        <div class="info-card mt-4">
            <h3>🔗 Connection Details</h3>
            <div class="form-group">
                <label class="form-label">Server URL</label>
                <input type="text" class="form-input" value="${serverUrl}" readonly>
            </div>
            <div class="form-group">
                <label class="form-label">M3U Playlist Format</label>
                <input type="text" class="form-input" value="${serverUrl}/get.php?username=USER&password=PASS" readonly>
            </div>
        </div>
    `;
}

function showChannelModal() { showNotification('Channel creation coming soon', 'info'); }
function showCategoryModal() { showNotification('Category creation coming soon', 'info'); }
function showPlanModal() { showNotification('Plan creation coming soon', 'info'); }
