/**
 * PrimeX IPTV - Admin Management Module
 * 
 * Manages admin users and roles
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const AdminManagement = {
    title: 'Admin Management',
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,

    async render() {
        console.log('Rendering Admin Management module');
        
        // Load template
        const response = await fetch('/admin/templates/admin-management.html');
        const html = await response.text();
        document.getElementById('contentArea').innerHTML = html;
        
        // Initialize
        this.attachEventListeners();
        await this.loadAdmins();
    },

    async init() {
        console.log('Initializing Admin Management module');
        this.attachEventListeners();
        await this.loadAdmins();
    },

    attachEventListeners() {
        // Create admin button
        const createBtn = document.getElementById('createAdminBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Form submissions
        const createForm = document.getElementById('createAdminForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitCreate();
            });
        }

        const editForm = document.getElementById('editAdminForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitEdit();
            });
        }

        // Search
        const searchInput = document.getElementById('adminSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Core.debounce(() => {
                this.currentPage = 1;
                this.loadAdmins();
            }, 500));
        }

        // Role filter
        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.loadAdmins();
            });
        }
    },

    async loadAdmins() {
        try {
            Core.showLoading();

            const search = document.getElementById('adminSearch')?.value || '';
            const role = document.getElementById('roleFilter')?.value || '';

            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage
            });

            if (search) params.append('search', search);
            if (role) params.append('role', role);

            const response = await Core.apiRequest(`/admin/admins?${params}`);

            if (response.success) {
                this.totalItems = response.data.total;
                this.renderAdmins(response.data.admins);
                this.renderPagination();
            } else {
                Core.showToast(response.message || 'Failed to load admins', 'error');
            }
        } catch (error) {
            console.error('Load admins error:', error);
            Core.showToast('Failed to load admins', 'error');
        } finally {
            Core.hideLoading();
        }
    },

    renderAdmins(admins) {
        const tbody = document.getElementById('adminsTableBody');
        if (!tbody) return;

        if (!admins || admins.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-user-shield" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                        <p style="color: var(--text-muted);">No admins found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = admins.map(admin => `
            <tr>
                <td>${Core.escapeHtml(admin.id)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar">${admin.username.charAt(0).toUpperCase()}</div>
                        <div>
                            <div style="font-weight: 500;">${Core.escapeHtml(admin.username)}</div>
                            <div style="font-size: 12px; color: var(--text-muted);">${Core.escapeHtml(admin.email)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${this.getRoleBadgeColor(admin.role)}">
                        ${this.getRoleLabel(admin.role)}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${admin.status === 'active' ? 'success' : 'danger'}">
                        ${admin.status}
                    </span>
                </td>
                <td>
                    ${admin.two_factor_enabled ? 
                        '<span class="badge badge-success"><i class="fas fa-shield-alt"></i> Enabled</span>' : 
                        '<span class="badge badge-secondary">Disabled</span>'
                    }
                </td>
                <td>
                    <small style="color: var(--text-muted);">
                        ${admin.last_login ? Core.formatDate(admin.last_login) : 'Never'}
                    </small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="AdminManagement.editAdmin(${admin.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${admin.role !== 'super_admin' ? `
                            <button class="btn-icon btn-danger" onclick="AdminManagement.deleteAdmin(${admin.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getRoleLabel(role) {
        const labels = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'moderator': 'Moderator',
            'codes_seller': 'Codes Seller'
        };
        return labels[role] || role;
    },

    getRoleBadgeColor(role) {
        const colors = {
            'super_admin': 'primary',
            'admin': 'info',
            'moderator': 'warning',
            'codes_seller': 'success'
        };
        return colors[role] || 'secondary';
    },

    renderPagination() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('adminsPagination');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        let html = '<div class="pagination">';
        
        // Previous button
        html += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="AdminManagement.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="AdminManagement.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next button
        html += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="AdminManagement.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        html += '</div>';
        paginationContainer.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadAdmins();
    },

    showCreateModal() {
        const modal = document.getElementById('createAdminModal');
        if (modal) {
            document.getElementById('createAdminForm').reset();
            modal.style.display = 'flex';
        }
    },

    async submitCreate() {
        try {
            const form = document.getElementById('createAdminForm');
            const formData = new FormData(form);

            const data = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role'),
                status: formData.get('status') || 'active'
            };

            // Validate
            if (!data.username || !data.email || !data.password || !data.role) {
                Core.showToast('Please fill all required fields', 'error');
                return;
            }

            if (data.password.length < 8) {
                Core.showToast('Password must be at least 8 characters', 'error');
                return;
            }

            Core.showLoading();

            const response = await Core.apiRequest('/admin/admins', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (response.success) {
                Core.showToast('Admin created successfully', 'success');
                Core.closeModal('createAdminModal');
                await this.loadAdmins();
            } else {
                Core.showToast(response.message || 'Failed to create admin', 'error');
            }
        } catch (error) {
            console.error('Create admin error:', error);
            Core.showToast('Failed to create admin', 'error');
        } finally {
            Core.hideLoading();
        }
    },

    async editAdmin(id) {
        try {
            Core.showLoading();

            const response = await Core.apiRequest(`/admin/admins/${id}`);

            if (response.success) {
                const admin = response.data;
                
                // Populate form
                document.getElementById('editAdminId').value = admin.id;
                document.getElementById('editUsername').value = admin.username;
                document.getElementById('editEmail').value = admin.email;
                document.getElementById('editRole').value = admin.role;
                document.getElementById('editStatus').value = admin.status;

                // Show modal
                document.getElementById('editAdminModal').style.display = 'flex';
            } else {
                Core.showToast(response.message || 'Failed to load admin', 'error');
            }
        } catch (error) {
            console.error('Load admin error:', error);
            Core.showToast('Failed to load admin', 'error');
        } finally {
            Core.hideLoading();
        }
    },

    async submitEdit() {
        try {
            const id = document.getElementById('editAdminId').value;
            const form = document.getElementById('editAdminForm');
            const formData = new FormData(form);

            const data = {
                username: formData.get('username'),
                email: formData.get('email'),
                role: formData.get('role'),
                status: formData.get('status')
            };

            const password = formData.get('password');
            if (password) {
                if (password.length < 8) {
                    Core.showToast('Password must be at least 8 characters', 'error');
                    return;
                }
                data.password = password;
            }

            Core.showLoading();

            const response = await Core.apiRequest(`/admin/admins/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (response.success) {
                Core.showToast('Admin updated successfully', 'success');
                Core.closeModal('editAdminModal');
                await this.loadAdmins();
            } else {
                Core.showToast(response.message || 'Failed to update admin', 'error');
            }
        } catch (error) {
            console.error('Update admin error:', error);
            Core.showToast('Failed to update admin', 'error');
        } finally {
            Core.hideLoading();
        }
    },

    async deleteAdmin(id) {
        if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
            return;
        }

        try {
            Core.showLoading();

            const response = await Core.apiRequest(`/admin/admins/${id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                Core.showToast('Admin deleted successfully', 'success');
                await this.loadAdmins();
            } else {
                Core.showToast(response.message || 'Failed to delete admin', 'error');
            }
        } catch (error) {
            console.error('Delete admin error:', error);
            Core.showToast('Failed to delete admin', 'error');
        } finally {
            Core.hideLoading();
        }
    }
};

// Don't auto-initialize - will be called by Core.loadModule()
