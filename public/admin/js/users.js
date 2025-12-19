/**
 * Users Management Module - Full CRUD Operations
 */

const UsersModule = {
    title: 'User Management',
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    filterStatus: 'all',
    users: [],

    async render() {
        await this.loadUsers();
    },

    async loadUsers() {
        PrimeXCore.showLoading(true);
        
        try {
            const response = await PrimeXCore.apiCall('/admin/users');
            this.users = response.data || [];
            this.renderUsersList();
        } catch (error) {
            PrimeXCore.showToast('Failed to load users: ' + error.message, 'error');
            document.getElementById('contentArea').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <p style="color: var(--danger);">Failed to load users</p>
                    </div>
                </div>
            `;
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderUsersList() {
        const filteredUsers = this.getFilteredUsers();
        const paginatedUsers = this.getPaginatedUsers(filteredUsers);

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-users"></i>
                        User Management
                    </h3>
                    <button class="btn btn-primary" onclick="UsersModule.showCreateModal()">
                        <i class="fas fa-plus"></i> Add User
                    </button>
                </div>
                <div class="card-body">
                    <!-- Filters -->
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div class="search-box" style="flex: 1; min-width: 250px;">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Search users..." id="userSearch" 
                                   value="${this.searchTerm}" 
                                   onkeyup="UsersModule.handleSearch(this.value)">
                        </div>
                        <select class="form-control" style="width: 200px;" id="statusFilter" 
                                onchange="UsersModule.handleFilter(this.value)">
                            <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Users</option>
                            <option value="active" ${this.filterStatus === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${this.filterStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="expired" ${this.filterStatus === 'expired' ? 'selected' : ''}>Expired</option>
                        </select>
                        <button class="btn btn-secondary" onclick="UsersModule.exportUsers()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>

                    <!-- Users Table -->
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Subscription End</th>
                                    <th>Devices</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginatedUsers.length > 0 ? paginatedUsers.map(user => `
                                    <tr>
                                        <td>#${user.id}</td>
                                        <td><strong>${PrimeXCore.escapeHtml(user.username)}</strong></td>
                                        <td>${PrimeXCore.escapeHtml(user.email || 'N/A')}</td>
                                        <td><span class="badge badge-info">${user.customer_type || 'Regular'}</span></td>
                                        <td>
                                            <span class="badge ${this.getStatusBadge(user.status)}">
                                                ${user.status}
                                            </span>
                                        </td>
                                        <td>${this.formatSubscriptionEnd(user.subscription_end)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-secondary" onclick="UsersModule.showDevices(${user.id})">
                                                <i class="fas fa-mobile-alt"></i> ${user.max_devices || 1}
                                            </button>
                                        </td>
                                        <td>${PrimeXCore.formatDate(user.created_at)}</td>
                                        <td>
                                            <div style="display: flex; gap: 5px;">
                                                <button class="btn btn-sm btn-primary" onclick="UsersModule.showEditModal(${user.id})" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-success" onclick="UsersModule.showExtendModal(${user.id})" title="Extend">
                                                    <i class="fas fa-calendar-plus"></i>
                                                </button>
                                                <button class="btn btn-sm btn-warning" onclick="UsersModule.changePassword(${user.id})" title="Password">
                                                    <i class="fas fa-key"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="UsersModule.deleteUser(${user.id})" title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="9" style="text-align: center; padding: 40px;">
                                            <i class="fas fa-users" style="font-size: 48px; color: var(--text-muted); margin-bottom: 10px;"></i>
                                            <p>No users found</p>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    ${this.renderPagination(filteredUsers.length)}
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    getFilteredUsers() {
        return this.users.filter(user => {
            const matchesSearch = !this.searchTerm || 
                user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (user.email && user.email.toLowerCase().includes(this.searchTerm.toLowerCase()));
            
            const matchesFilter = this.filterStatus === 'all' || 
                (this.filterStatus === 'expired' && user.subscription_end && new Date(user.subscription_end) < new Date()) ||
                user.status === this.filterStatus;
            
            return matchesSearch && matchesFilter;
        });
    },

    getPaginatedUsers(users) {
        const start = (this.currentPage - 1) * this.pageSize;
        return users.slice(start, start + this.pageSize);
    },

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        if (totalPages <= 1) return '';

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <div>Showing ${((this.currentPage - 1) * this.pageSize) + 1} to ${Math.min(this.currentPage * this.pageSize, totalItems)} of ${totalItems} users</div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-sm btn-secondary" ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="UsersModule.changePage(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        const page = i + 1;
                        return `
                            <button class="btn btn-sm ${page === this.currentPage ? 'btn-primary' : 'btn-secondary'}" 
                                    onclick="UsersModule.changePage(${page})">
                                ${page}
                            </button>
                        `;
                    }).join('')}
                    <button class="btn btn-sm btn-secondary" ${this.currentPage === totalPages ? 'disabled' : ''} 
                            onclick="UsersModule.changePage(${this.currentPage + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    },

    handleSearch(value) {
        this.searchTerm = value;
        this.currentPage = 1;
        this.renderUsersList();
    },

    handleFilter(value) {
        this.filterStatus = value;
        this.currentPage = 1;
        this.renderUsersList();
    },

    changePage(page) {
        this.currentPage = page;
        this.renderUsersList();
    },

    showCreateModal() {
        const modalContent = `
            <form id="createUserForm" onsubmit="UsersModule.createUser(event)">
                <div class="form-group">
                    <label class="form-label">Username *</label>
                    <input type="text" class="form-control" name="username" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password *</label>
                    <input type="password" class="form-control" name="password" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email">
                </div>
                <div class="form-group">
                    <label class="form-label">Customer Type</label>
                    <select class="form-control" name="customer_type">
                        <option value="regular">Regular</option>
                        <option value="vip">VIP</option>
                        <option value="reseller">Reseller</option>
                        <option value="test">Test</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Subscription Days</label>
                    <input type="number" class="form-control" name="subscription_days" value="30">
                </div>
                <div class="form-group">
                    <label class="form-label">Max Devices</label>
                    <input type="number" class="form-control" name="max_devices" value="1" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" name="notes" rows="3"></textarea>
                </div>
            </form>
        `;

        PrimeXCore.showModal('Create New User', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Create User', class: 'btn-primary', onclick: 'document.getElementById("createUserForm").requestSubmit()' }
        ]);
    },

    async createUser(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/users', 'POST', data);
            PrimeXCore.showToast('User created successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadUsers();
        } catch (error) {
            PrimeXCore.showToast('Failed to create user: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async showEditModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modalContent = `
            <form id="editUserForm" onsubmit="UsersModule.updateUser(event, ${userId})">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" name="username" value="${PrimeXCore.escapeHtml(user.username)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email" value="${PrimeXCore.escapeHtml(user.email || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Customer Type</label>
                    <select class="form-control" name="customer_type">
                        <option value="regular" ${user.customer_type === 'regular' ? 'selected' : ''}>Regular</option>
                        <option value="vip" ${user.customer_type === 'vip' ? 'selected' : ''}>VIP</option>
                        <option value="reseller" ${user.customer_type === 'reseller' ? 'selected' : ''}>Reseller</option>
                        <option value="test" ${user.customer_type === 'test' ? 'selected' : ''}>Test</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" name="status">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Max Devices</label>
                    <input type="number" class="form-control" name="max_devices" value="${user.max_devices || 1}" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" name="notes" rows="3">${PrimeXCore.escapeHtml(user.notes || '')}</textarea>
                </div>
            </form>
        `;

        PrimeXCore.showModal('Edit User', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Update', class: 'btn-primary', onclick: 'document.getElementById("editUserForm").requestSubmit()' }
        ]);
    },

    async updateUser(event, userId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}`, 'PUT', data);
            PrimeXCore.showToast('User updated successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadUsers();
        } catch (error) {
            PrimeXCore.showToast('Failed to update user: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    showExtendModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modalContent = `
            <form id="extendForm" onsubmit="UsersModule.extendSubscription(event, ${userId})">
                <p>Extend subscription for: <strong>${PrimeXCore.escapeHtml(user.username)}</strong></p>
                <p>Current end date: <strong>${this.formatSubscriptionEnd(user.subscription_end)}</strong></p>
                <div class="form-group">
                    <label class="form-label">Extend by (days)</label>
                    <input type="number" class="form-control" name="days" value="30" min="1" required>
                </div>
            </form>
        `;

        PrimeXCore.showModal('Extend Subscription', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Extend', class: 'btn-success', onclick: 'document.getElementById("extendForm").requestSubmit()' }
        ]);
    },

    async extendSubscription(event, userId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const days = formData.get('days');

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}/extend`, 'POST', { days: parseInt(days) });
            PrimeXCore.showToast('Subscription extended successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadUsers();
        } catch (error) {
            PrimeXCore.showToast('Failed to extend subscription: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async showDevices(userId) {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall(`/admin/users/${userId}/devices`);
            const devices = response.data || [];
            
            const modalContent = `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Device ID</th>
                                <th>IP Address</th>
                                <th>Last Seen</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${devices.length > 0 ? devices.map(device => `
                                <tr>
                                    <td>${PrimeXCore.escapeHtml(device.device_id)}</td>
                                    <td>${PrimeXCore.escapeHtml(device.ip_address || 'N/A')}</td>
                                    <td>${PrimeXCore.formatDate(device.last_seen)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="UsersModule.removeDevice(${userId}, ${device.id})">
                                            <i class="fas fa-trash"></i> Remove
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="4" style="text-align: center;">No devices connected</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
            `;

            PrimeXCore.showModal('User Devices', modalContent, [
                { text: 'Close', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' }
            ]);
        } catch (error) {
            PrimeXCore.showToast('Failed to load devices: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async removeDevice(userId, deviceId) {
        if (!confirm('Remove this device?')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}/devices/${deviceId}`, 'DELETE');
            PrimeXCore.showToast('Device removed successfully', 'success');
            PrimeXCore.closeModal();
            await this.showDevices(userId);
        } catch (error) {
            PrimeXCore.showToast('Failed to remove device: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async changePassword(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modalContent = `
            <form id="passwordForm" onsubmit="UsersModule.updatePassword(event, ${userId})">
                <p>Change password for: <strong>${PrimeXCore.escapeHtml(user.username)}</strong></p>
                <div class="form-group">
                    <label class="form-label">New Password</label>
                    <input type="password" class="form-control" name="password" required minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" class="form-control" name="confirm_password" required minlength="6">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Change Password', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Change Password', class: 'btn-warning', onclick: 'document.getElementById("passwordForm").requestSubmit()' }
        ]);
    },

    async updatePassword(event, userId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const password = formData.get('password');
        const confirm = formData.get('confirm_password');

        if (password !== confirm) {
            PrimeXCore.showToast('Passwords do not match', 'error');
            return;
        }

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}/change-password`, 'POST', { password });
            PrimeXCore.showToast('Password changed successfully', 'success');
            PrimeXCore.closeModal();
        } catch (error) {
            PrimeXCore.showToast('Failed to change password: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Delete user "${user.username}"? This action cannot be undone.`)) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}`, 'DELETE');
            PrimeXCore.showToast('User deleted successfully', 'success');
            await this.loadUsers();
        } catch (error) {
            PrimeXCore.showToast('Failed to delete user: ' + error.message, 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    exportUsers() {
        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        PrimeXCore.showToast('Users exported successfully', 'success');
    },

    generateCSV() {
        const headers = ['ID', 'Username', 'Email', 'Type', 'Status', 'Subscription End', 'Created'];
        const rows = this.users.map(user => [
            user.id,
            user.username,
            user.email || '',
            user.customer_type || 'regular',
            user.status,
            user.subscription_end || '',
            user.created_at
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    getStatusBadge(status) {
        return status === 'active' ? 'badge-success' : 'badge-danger';
    },

    formatSubscriptionEnd(endDate) {
        if (!endDate) return '<span class="badge badge-info">Unlimited</span>';
        const end = new Date(endDate);
        const now = new Date();
        if (end < now) return '<span class="badge badge-danger">Expired</span>';
        if (end - now < 7 * 24 * 60 * 60 * 1000) return '<span class="badge badge-warning">' + PrimeXCore.formatDate(endDate) + '</span>';
        return '<span class="badge badge-success">' + PrimeXCore.formatDate(endDate) + '</span>';
    }
};
