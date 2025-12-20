/**
 * PrimeX IPTV - Device Activation Module
 * 
 * Industry-standard device activation (4Kmatic-style)
 * Integrated into existing admin panel
 * 
 * Developer: PAX
 */

const DeviceActivationModule = {
    title: 'Device Activation',
    currentPage: 1,
    pageSize: 20,
    devices: [],
    plans: [],
    apps: [],

    async render() {
        const response = await fetch('/admin/templates/device-activation.html');
        const html = await response.text();
        document.getElementById('contentArea').innerHTML = html;
        
        await this.init();
    },

    async init() {
        await this.loadPlans();
        await this.loadDevices();
        await this.loadApps();
        this.attachEventListeners();
    },

    attachEventListeners() {
        // Activate device button
        const activateBtn = document.getElementById('activateDeviceBtn');
        if (activateBtn) {
            activateBtn.addEventListener('click', () => this.activateDevice());
        }

        // Filter by status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.loadDevices());
        }

        // Refresh buttons
        const refreshDevicesBtn = document.getElementById('refreshDevicesBtn');
        if (refreshDevicesBtn) {
            refreshDevicesBtn.addEventListener('click', () => this.loadDevices());
        }

        // Auto-fill duration when plan is selected
        const planSelect = document.getElementById('planSelect');
        const durationInput = document.getElementById('durationInput');
        if (planSelect && durationInput) {
            planSelect.addEventListener('change', (e) => {
                const selectedPlan = this.plans.find(p => p.id == e.target.value);
                if (selectedPlan) {
                    durationInput.value = selectedPlan.duration_days || 30;
                }
            });
        }
    },

    async loadPlans() {
        try {
            const response = await PrimeXCore.apiCall('/admin/plans');
            if (response.success && response.data) {
                this.plans = Array.isArray(response.data) ? response.data : 
                            (response.data.plans || []);
                
                // Populate dropdown immediately after loading
                this.populatePlansDropdown();
            }
        } catch (error) {
            console.error('Failed to load plans:', error);
            PrimeXCore.showToast('Failed to load subscription plans', 'error');
        }
    },

    populatePlansDropdown() {
        const planSelect = document.getElementById('planSelect');
        if (!planSelect) return;

        if (!this.plans || this.plans.length === 0) {
            planSelect.innerHTML = '<option value="">No plans available</option>';
            return;
        }

        planSelect.innerHTML = '<option value="">Select Plan</option>' +
            this.plans.map(plan => {
                // Handle bilingual names (name_en/name_ar) or fallback to name
                const planName = plan.name_en || plan.name_ar || plan.name || 'Unnamed Plan';
                const duration = plan.duration_days || 30;
                const price = plan.price || 0;
                return `<option value="${plan.id}">${planName} (${duration} days - $${price})</option>`;
            }).join('');
    },

    async loadDevices() {
        try {
            PrimeXCore.showLoading(true);

            const status = document.getElementById('statusFilter')?.value || '';
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize
            });

            if (status) params.append('status', status);

            const response = await PrimeXCore.apiCall(`/admin/device/activations?${params}`);

            if (response.success) {
                this.devices = response.data.devices || [];
                this.renderDevices();
                this.renderPagination(response.data);
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
            PrimeXCore.showToast('Failed to load devices', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderDevices() {
        const tbody = document.getElementById('devicesTableBody');
        if (!tbody) return;

        if (this.devices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-tv" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                        <p style="color: var(--text-muted);">No devices found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.devices.map(device => `
            <tr>
                <td><code>${PrimeXCore.escapeHtml(device.device_key)}</code></td>
                <td>${device.user_username || device.username || '-'}</td>
                <td>${device.plan_name || '-'}</td>
                <td>
                    <span class="badge badge-${this.getStatusBadge(device.status)}">
                        ${device.status}
                    </span>
                </td>
                <td>
                    <small style="color: var(--text-muted);">
                        ${device.activated_at ? PrimeXCore.formatDate(device.activated_at) : '-'}
                    </small>
                </td>
                <td>
                    <small style="color: var(--text-muted);">
                        ${device.activated_by_username || '-'}
                    </small>
                </td>
                <td>
                    <div class="action-buttons">
                        ${device.status === 'activated' ? `
                            <button class="btn-icon" onclick="DeviceActivationModule.viewCredentials(${device.id})" title="View Credentials">
                                <i class="fas fa-key"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="DeviceActivationModule.deactivateDevice(${device.id})" title="Deactivate">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination(data) {
        const container = document.getElementById('devicesPagination');
        if (!container) return;

        const totalPages = data.totalPages || 1;
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination">';
        
        // Previous
        html += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="DeviceActivationModule.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="DeviceActivationModule.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next
        html += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="DeviceActivationModule.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        html += '</div>';
        container.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadDevices();
    },

    async activateDevice() {
        try {
            const deviceKey = document.getElementById('deviceKeyInput')?.value.trim();
            const planId = document.getElementById('planSelect')?.value;
            const username = document.getElementById('usernameInput')?.value.trim();
            const durationDays = document.getElementById('durationInput')?.value;

            if (!deviceKey) {
                PrimeXCore.showToast('Please enter device key', 'error');
                return;
            }

            if (!planId) {
                PrimeXCore.showToast('Please select a plan', 'error');
                return;
            }

            PrimeXCore.showLoading(true);

            const data = {
                device_key: deviceKey,
                plan_id: parseInt(planId)
            };

            if (username) data.username = username;
            if (durationDays) data.duration_days = parseInt(durationDays);

            const response = await PrimeXCore.apiCall('/admin/device/activate', 'POST', data);

            if (response.success) {
                PrimeXCore.showToast('Device activated successfully', 'success');
                
                // Show credentials
                this.showCredentialsModal(response.data);
                
                // Clear form
                document.getElementById('deviceKeyInput').value = '';
                document.getElementById('usernameInput').value = '';
                
                // Reload devices
                await this.loadDevices();
            } else {
                PrimeXCore.showToast(response.message || 'Activation failed', 'error');
            }
        } catch (error) {
            console.error('Activation error:', error);
            PrimeXCore.showToast(error.message || 'Failed to activate device', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    showCredentialsModal(data) {
        const modalContent = `
            <div class="credentials-display">
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    Device activated successfully!
                </div>

                <div class="credential-item">
                    <label>Device Key:</label>
                    <div class="credential-value">
                        <code>${data.device_key}</code>
                        <button onclick="DeviceActivationModule.copyToClipboard('${data.device_key}')" class="btn-icon">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="credential-item">
                    <label>Username:</label>
                    <div class="credential-value">
                        <code>${data.username}</code>
                        <button onclick="DeviceActivationModule.copyToClipboard('${data.username}')" class="btn-icon">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="credential-item">
                    <label>Password:</label>
                    <div class="credential-value">
                        <code>${data.password}</code>
                        <button onclick="DeviceActivationModule.copyToClipboard('${data.password}')" class="btn-icon">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="credential-item">
                    <label>Server URL:</label>
                    <div class="credential-value">
                        <code>${data.server_url}</code>
                        <button onclick="DeviceActivationModule.copyToClipboard('${data.server_url}')" class="btn-icon">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="credential-item">
                    <label>Xtream API URL:</label>
                    <div class="credential-value">
                        <code style="font-size: 11px;">${data.xtream_url}</code>
                        <button onclick="DeviceActivationModule.copyToClipboard('${data.xtream_url}')" class="btn-icon">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="credential-item">
                    <label>M3U URL:</label>
                    <div class="credential-value">
                        <code style="font-size: 10px; word-break: break-all;">${data.m3u_url}</code>
                        <button onclick="DeviceActivationModule.copyToClipboard('${data.m3u_url}')" class="btn-icon">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="alert alert-info" style="margin-top: 20px;">
                    <i class="fas fa-info-circle"></i>
                    The device will automatically receive these credentials and activate within seconds.
                </div>
            </div>
        `;

        PrimeXCore.showModal('Device Activated', modalContent, [
            { text: 'Close', class: 'btn-primary', onclick: 'PrimeXCore.closeModal()' }
        ]);
    },

    async viewCredentials(deviceId) {
        try {
            PrimeXCore.showLoading(true);

            const device = this.devices.find(d => d.id === deviceId);
            if (!device) {
                PrimeXCore.showToast('Device not found', 'error');
                return;
            }

            const modalContent = `
                <div class="credentials-display">
                    <div class="credential-item">
                        <label>Device Key:</label>
                        <div class="credential-value">
                            <code>${device.device_key}</code>
                        </div>
                    </div>

                    <div class="credential-item">
                        <label>Username:</label>
                        <div class="credential-value">
                            <code>${device.username || device.user_username}</code>
                            <button onclick="DeviceActivationModule.copyToClipboard('${device.username || device.user_username}')" class="btn-icon">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <div class="credential-item">
                        <label>Password:</label>
                        <div class="credential-value">
                            <code>${device.plain_password || '••••••••'}</code>
                            ${device.plain_password ? `
                                <button onclick="DeviceActivationModule.copyToClipboard('${device.plain_password}')" class="btn-icon">
                                    <i class="fas fa-copy"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <div class="credential-item">
                        <label>Server URL:</label>
                        <div class="credential-value">
                            <code>${device.server_url || '-'}</code>
                        </div>
                    </div>

                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Password may not be available for security reasons. Check immediately after activation.
                    </div>
                </div>
            `;

            PrimeXCore.showModal('Device Credentials', modalContent, [
                { text: 'Close', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' }
            ]);

        } catch (error) {
            console.error('View credentials error:', error);
            PrimeXCore.showToast('Failed to load credentials', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deactivateDevice(deviceId) {
        if (!confirm('Deactivate this device? The user account will be disabled.')) {
            return;
        }

        try {
            PrimeXCore.showLoading(true);

            await PrimeXCore.apiCall(`/admin/device/${deviceId}`, 'DELETE');
            PrimeXCore.showToast('Device deactivated successfully', 'success');
            await this.loadDevices();

        } catch (error) {
            console.error('Deactivate error:', error);
            PrimeXCore.showToast('Failed to deactivate device', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async loadApps() {
        try {
            const response = await PrimeXCore.apiCall('/apps');
            if (response.success) {
                this.apps = response.data.grouped || {};
                this.renderApps();
            }
        } catch (error) {
            console.error('Failed to load apps:', error);
        }
    },

    renderApps() {
        const container = document.getElementById('appsContainer');
        if (!container) return;

        const platforms = {
            tv: { title: 'Smart TV / TV Devices', icon: 'tv' },
            mobile: { title: 'Mobile Devices', icon: 'mobile-alt' },
            desktop: { title: 'Desktop / Laptop', icon: 'desktop' },
            stb: { title: 'STB / Other Devices', icon: 'box' }
        };

        let html = '';

        Object.keys(platforms).forEach(platform => {
            const apps = this.apps[platform] || [];
            if (apps.length === 0) return;

            html += `
                <div class="apps-section">
                    <h4><i class="fas fa-${platforms[platform].icon}"></i> ${platforms[platform].title}</h4>
                    <div class="apps-grid">
                        ${apps.map(app => `
                            <div class="app-card">
                                <div class="app-icon">
                                    ${app.icon_url ? 
                                        `<img src="${app.icon_url}" alt="${app.name}">` : 
                                        `<i class="fas fa-${platforms[platform].icon}"></i>`
                                    }
                                </div>
                                <div class="app-info">
                                    <h5>${app.name}</h5>
                                    <p class="app-os">${app.os || platform}</p>
                                    <div class="app-methods">
                                        ${app.supports_device_code ? '<span class="method-badge">Device Code</span>' : ''}
                                        ${app.supports_xtream ? '<span class="method-badge">Xtream</span>' : ''}
                                        ${app.supports_m3u ? '<span class="method-badge">M3U</span>' : ''}
                                    </div>
                                    ${app.is_verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="color: var(--text-muted);">No apps available</p>';
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            PrimeXCore.showToast('Copied to clipboard', 'success');
        }).catch(() => {
            PrimeXCore.showToast('Failed to copy', 'error');
        });
    },

    getStatusBadge(status) {
        const badges = {
            'pending': 'warning',
            'activated': 'success',
            'expired': 'secondary',
            'deactivated': 'danger'
        };
        return badges[status] || 'secondary';
    }
};

// Don't auto-initialize - will be called by Core.loadModule()
