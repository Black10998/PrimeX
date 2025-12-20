/**
 * PrimeX IPTV Enterprise Panel - Core Framework
 * Handles authentication, API calls, routing, and utilities
 */

const PrimeXCore = {
    // Configuration
    config: {
        apiUrl: '/api/v1',
        token: localStorage.getItem('adminToken'),
        refreshInterval: 30000
    },

    // Initialize
    async init() {
        this.checkAuth();
        await this.loadPermissions();
        this.setupEventListeners();
        this.loadCurrentModule();
    },

    // Load user permissions
    async loadPermissions() {
        try {
            const response = await this.apiCall('/admin/permissions');
            if (response.success) {
                this.permissions = response.data.permissions;
                this.userRole = response.data.role;
                console.log('Permissions loaded:', this.userRole, this.permissions);
                this.applyPermissions();
            } else {
                console.warn('Permissions API returned error, defaulting to full access');
                this.setDefaultPermissions();
            }
        } catch (error) {
            console.error('Failed to load permissions:', error);
            console.warn('Defaulting to full access due to API error');
            this.setDefaultPermissions();
        }
    },

    // Set default permissions (full access) when API fails
    setDefaultPermissions() {
        this.permissions = {
            dashboard: true,
            users: true,
            subscriptions: true,
            codes: true,
            channels: true,
            categories: true,
            servers: true,
            plans: true,
            settings: true,
            security: true,
            notifications: true,
            api_settings: true,
            activity_logs: true,
            admin_management: true
        };
        this.userRole = 'super_admin';
        this.applyPermissions();
    },

    // Apply permissions to UI
    applyPermissions() {
        // If no permissions loaded, show everything (fail-safe)
        if (!this.permissions || Object.keys(this.permissions).length === 0) {
            console.warn('No permissions loaded, showing all modules');
            return;
        }

        const moduleMap = {
            'dashboard': 'dashboard',
            'users': 'users',
            'subscriptions': 'subscriptions',
            'codes': 'codes',
            'channels': 'channels',
            'categories': 'categories',
            'servers': 'servers',
            'plans': 'plans',
            'settings': 'settings',
            'security': 'security',
            'notifications': 'notifications',
            'api-settings': 'api_settings',
            'logs': 'activity_logs',
            'devices': 'users'
        };

        // Show/hide navigation items based on permissions
        document.querySelectorAll('.nav-item').forEach(item => {
            const module = item.getAttribute('data-module');
            const permissionKey = moduleMap[module];
            
            // Only hide if explicitly set to false
            // If undefined or true, show the item
            if (permissionKey && this.permissions[permissionKey] === false) {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        });

        // Show admin management only for super_admin
        const adminManagementNav = document.getElementById('adminManagementNav');
        if (adminManagementNav) {
            adminManagementNav.style.display = this.userRole === 'super_admin' ? 'flex' : 'none';
        }

        // Update user role display
        const userRole = document.getElementById('userRole');
        if (userRole) {
            const roleLabels = {
                'super_admin': 'Super Admin',
                'admin': 'Admin',
                'moderator': 'Moderator',
                'codes_seller': 'Codes Seller'
            };
            userRole.textContent = roleLabels[this.userRole] || this.userRole;
        }
    },

    // Check if user has permission for a module
    hasPermission(module) {
        // If no permissions loaded, allow access (fail-safe)
        if (!this.permissions || Object.keys(this.permissions).length === 0) {
            return true;
        }
        // Only deny if explicitly set to false
        return this.permissions[module] !== false;
    },

    // Authentication
    checkAuth() {
        // Skip auth check if on login page
        if (window.location.pathname.includes('login.html')) {
            return true;
        }
        
        if (!this.config.token) {
            window.location.href = '/admin/login.html';
            return false;
        }
        return true;
    },

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    },

    // API Calls
    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.token}`
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.config.apiUrl}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }

            return result;
        } catch (error) {
            this.showToast(error.message, 'error');
            throw error;
        }
    },

    // UI Utilities
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    },

    // Modal
    showModal(title, content, buttons = []) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const buttonHTML = buttons.map(btn => 
            `<button class="btn ${btn.class || 'btn-secondary'}" onclick="${btn.onclick}">${btn.text}</button>`
        ).join('');

        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="PrimeXCore.closeModal()">×</button>
            </div>
            <div class="modal-body">${content}</div>
            <div class="modal-footer">${buttonHTML}</div>
        `;

        overlay.innerHTML = '';
        overlay.appendChild(modal);
        overlay.classList.add('active');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    },

    // Routing
    loadModule(moduleName) {
        const modules = {
            'dashboard': typeof DashboardModule !== 'undefined' ? DashboardModule : null,
            'users': typeof UsersModule !== 'undefined' ? UsersModule : null,
            'subscriptions': typeof SubscriptionsModule !== 'undefined' ? SubscriptionsModule : null,
            'plans': typeof PlansModule !== 'undefined' ? PlansModule : null,
            'codes': typeof CodesModule !== 'undefined' ? CodesModule : null,
            'channels': typeof ChannelsModule !== 'undefined' ? ChannelsModule : null,
            'categories': typeof CategoriesModule !== 'undefined' ? CategoriesModule : null,
            'servers': typeof ServersModule !== 'undefined' ? ServersModule : null,
            'devices': typeof DevicesModule !== 'undefined' ? DevicesModule : null,
            'logs': typeof LogsModule !== 'undefined' ? LogsModule : null,
            'settings': typeof SettingsModule !== 'undefined' ? SettingsModule : null,
            'api-settings': typeof APISettingsModule !== 'undefined' ? APISettingsModule : null,
            'security': typeof SecurityModule !== 'undefined' ? SecurityModule : null,
            'notifications': typeof NotificationsModule !== 'undefined' ? NotificationsModule : null,
            'admin-management': typeof AdminManagement !== 'undefined' ? AdminManagement : null
        };

        const moduleMap = {
            'dashboard': 'dashboard',
            'users': 'users',
            'subscriptions': 'subscriptions',
            'codes': 'codes',
            'channels': 'channels',
            'categories': 'categories',
            'servers': 'servers',
            'plans': 'plans',
            'settings': 'settings',
            'security': 'security',
            'notifications': 'notifications',
            'api-settings': 'api_settings',
            'logs': 'activity_logs',
            'devices': 'users',
            'admin-management': 'admin_management'
        };

        // Check permissions
        const permissionKey = moduleMap[moduleName];
        if (permissionKey && !this.hasPermission(permissionKey)) {
            document.getElementById('contentArea').innerHTML = `
                <div class="card">
                    <div class="card-body" style="text-align: center; padding: 60px 20px;">
                        <i class="fas fa-lock" style="font-size: 64px; color: var(--danger); margin-bottom: 20px;"></i>
                        <h3 style="color: var(--text-primary); margin-bottom: 10px;">Access Denied</h3>
                        <p style="color: var(--text-muted);">You don't have permission to access this module.</p>
                    </div>
                </div>
            `;
            return;
        }

        const module = modules[moduleName];
        if (module) {
            document.getElementById('pageTitle').textContent = module.title || moduleName;
            if (module.render) {
                module.render();
            } else if (module.init) {
                module.init();
            }
        } else {
            console.error(`Module "${moduleName}" not found or not loaded`);
            document.getElementById('contentArea').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <p style="color: var(--danger);">Module "${moduleName}" failed to load. Please refresh the page.</p>
                    </div>
                </div>
            `;
        }
    },

    loadCurrentModule() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.loadModule(hash);
    },

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const module = item.dataset.module;
                window.location.hash = module;
                this.loadModule(module);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Mobile menu
        document.getElementById('mobileMenuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                this.logout();
            }
        });

        // Hash change
        window.addEventListener('hashchange', () => {
            this.loadCurrentModule();
        });
    },

    // Utilities
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    PrimeXCore.init();
});
