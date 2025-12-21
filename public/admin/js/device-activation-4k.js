/**
 * PrimeX IPTV - 4K Player-Style Device Activation Module
 * 
 * Implements industry-standard device activation flow
 * 
 * Developer: PAX
 */

const DeviceActivation4KModule = {
    title: 'Device Activation (4K Style)',
    pendingDevices: [],
    allDevices: [],
    plans: [],
    autoRefreshInterval: null,

    async init() {
        console.log('Device Activation 4K: Initializing...');
        await this.loadPlans();
        await this.loadPendingDevices();
        this.render();
        this.startAutoRefresh();
    },

    async loadPlans() {
        try {
            const token = localStorage.getItem('adminToken');
            console.log('Loading subscription plans...');
            const response = await fetch('/api/v1/admin/plans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                console.error('Plans API error:', response.status, response.statusText);
                this.plans = [];
                return;
            }
            
            const result = await response.json();
            console.log('Plans API response:', result);
            
            if (result.success) {
                this.plans = result.data || [];
                console.log('Loaded plans:', this.plans.length, this.plans);
            } else {
                console.error('Plans API returned success=false:', result.message);
                this.plans = [];
            }
        } catch (error) {
            console.error('Failed to load plans:', error);
            this.plans = [];
        }
    },

    async loadPendingDevices() {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/v1/admin/device/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                this.pendingDevices = result.data || [];
                console.log('Loaded pending devices:', this.pendingDevices.length);
            }
        } catch (error) {
            console.error('Failed to load pending devices:', error);
            this.pendingDevices = [];
        }
    },

    async loadAllDevices(status = null) {
        try {
            const token = localStorage.getItem('adminToken');
            let url = '/api/v1/admin/device/all?limit=100';
            if (status) {
                url += `&status=${status}`;
            }
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                this.allDevices = result.data.devices || [];
            }
        } catch (error) {
            console.error('Failed to load all devices:', error);
            this.allDevices = [];
        }
    },

    async activateDevice(deviceKey, planId, durationDays) {
        try {
            const token = localStorage.getItem('adminToken');
            
            // Build payload
            const payload = {
                device_key: deviceKey,
                subscription_plan_id: parseInt(planId)
            };
            
            // Only include duration_days if provided
            if (durationDays && durationDays !== '') {
                payload.duration_days = parseInt(durationDays);
            }
            
            console.log('Activating device with payload:', payload);
            
            const response = await fetch('/api/v1/admin/device/activate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Activation response status:', response.status);
            
            const result = await response.json();
            console.log('Activation response:', result);
            
            if (result.success) {
                this.showNotification('success', `Device ${deviceKey} activated successfully!`);
                await this.loadPendingDevices();
                this.render();
            } else {
                // Show detailed error message
                let errorMsg = result.message || 'Activation failed';
                if (result.errors && Array.isArray(result.errors)) {
                    errorMsg += ': ' + result.errors.map(e => e.msg || e.message).join(', ');
                }
                console.error('Activation failed:', errorMsg, result);
                this.showNotification('error', errorMsg);
            }
        } catch (error) {
            console.error('Activation error:', error);
            this.showNotification('error', 'Failed to activate device: ' + error.message);
        }
    },

    render() {
        const container = document.getElementById('contentArea');
        
        if (!container) {
            console.error('contentArea not found');
            return;
        }

        container.innerHTML = `
            <div class="device-activation-4k">
                <div class="page-header">
                    <h1>Device Activation (4K Player Style)</h1>
                    <div class="header-actions">
                        <button class="btn btn-secondary" onclick="DeviceActivation4KModule.refresh()">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                        <button class="btn btn-primary" onclick="DeviceActivation4KModule.openActivateModal()">
                            <i class="fas fa-mobile-alt"></i> Activate Device
                        </button>
                    </div>
                </div>

                <div class="info-banner">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>How it works:</strong>
                        <ol>
                            <li>TV app displays Device Key + MAC Address</li>
                            <li>Admin enters Device Key and selects plan</li>
                            <li>TV app auto-loads content when activated</li>
                        </ol>
                    </div>
                </div>

                <div class="activation-tabs">
                    <button class="tab-btn active" onclick="DeviceActivation4KModule.switchTab('pending')">
                        <i class="fas fa-clock"></i> Pending (${this.pendingDevices.length})
                    </button>
                    <button class="tab-btn" onclick="DeviceActivation4KModule.switchTab('all')">
                        <i class="fas fa-list"></i> All Devices
                    </button>
                </div>

                <div id="tabContent">
                    ${this.renderPendingDevices()}
                </div>
            </div>
        `;
    },

    renderPendingDevices() {
        if (this.pendingDevices.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-mobile-alt"></i>
                    <h3>No Pending Devices</h3>
                    <p>Devices waiting for activation will appear here</p>
                </div>
            `;
        }

        return `
            <div class="devices-grid">
                ${this.pendingDevices.map(device => `
                    <div class="device-card pending">
                        <div class="device-header">
                            <div class="device-key">
                                <i class="fas fa-key"></i>
                                <span>${device.device_key}</span>
                            </div>
                            <span class="status-badge pending">Pending</span>
                        </div>
                        <div class="device-info">
                            <div class="info-row">
                                <i class="fas fa-network-wired"></i>
                                <span>${device.mac_address}</span>
                            </div>
                            <div class="info-row">
                                <i class="fas fa-clock"></i>
                                <span>${this.formatDate(device.created_at)}</span>
                            </div>
                            <div class="info-row">
                                <i class="fas fa-eye"></i>
                                <span>${device.check_count || 0} checks</span>
                            </div>
                            ${device.last_check_at ? `
                                <div class="info-row">
                                    <i class="fas fa-history"></i>
                                    <span>Last check: ${this.formatTimeAgo(device.last_check_at)}</span>
                                </div>
                            ` : ''}
                        </div>
                        <button class="btn btn-primary btn-block" 
                                onclick="DeviceActivation4KModule.openActivateModal('${device.device_key}')">
                            <i class="fas fa-check"></i> Activate Now
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderAllDevices() {
        if (this.allDevices.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-mobile-alt"></i>
                    <h3>No Devices</h3>
                    <p>Activated devices will appear here</p>
                </div>
            `;
        }

        return `
            <div class="devices-table">
                <table>
                    <thead>
                        <tr>
                            <th>Device Key</th>
                            <th>MAC Address</th>
                            <th>Status</th>
                            <th>Plan</th>
                            <th>Activated</th>
                            <th>Expires</th>
                            <th>Checks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.allDevices.map(device => `
                            <tr>
                                <td><strong>${device.device_key}</strong></td>
                                <td>${device.mac_address}</td>
                                <td><span class="status-badge ${device.status}">${device.status}</span></td>
                                <td>${device.plan_name || '-'}</td>
                                <td>${device.activated_at ? this.formatDate(device.activated_at) : '-'}</td>
                                <td>${device.expires_at ? this.formatDate(device.expires_at) : '-'}</td>
                                <td>${device.check_count || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async switchTab(tab) {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        if (tab === 'all') {
            await this.loadAllDevices();
            document.getElementById('tabContent').innerHTML = this.renderAllDevices();
        } else {
            document.getElementById('tabContent').innerHTML = this.renderPendingDevices();
        }
    },

    // Wrapper for onclick handlers (can't be async in HTML)
    openActivateModal(deviceKey = '') {
        this.showActivateModal(deviceKey).catch(error => {
            console.error('Error opening activate modal:', error);
            this.showNotification('error', 'Failed to open activation modal');
        });
    },

    async showActivateModal(deviceKey = '') {
        // Ensure plans are loaded
        if (this.plans.length === 0) {
            console.log('Plans not loaded, loading now...');
            await this.loadPlans();
        }
        
        if (this.plans.length === 0) {
            this.showNotification('error', 'No subscription plans available. Please create plans first.');
            return;
        }
        
        console.log('Showing activate modal with', this.plans.length, 'plans');
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Activate Device</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="activateForm" onsubmit="DeviceActivation4KModule.handleActivate(event)">
                        <div class="form-group">
                            <label>Device Key *</label>
                            <input type="text" id="deviceKey" class="form-control" 
                                   value="${deviceKey}" 
                                   placeholder="Enter 8-digit device key" 
                                   pattern="[0-9]{8}" 
                                   maxlength="8" 
                                   required>
                            <small>8-digit code displayed on TV screen</small>
                        </div>
                        <div class="form-group">
                            <label>Subscription Plan *</label>
                            <select id="planId" class="form-control" required>
                                <option value="">Select Plan</option>
                                ${this.plans.map(plan => `
                                    <option value="${plan.id}" data-duration="${plan.duration_days}">
                                        ${plan.name_en || plan.name_ar || plan.name || 'Plan #' + plan.id} (${plan.duration_days} days)
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Duration (days)</label>
                            <input type="number" id="durationDays" class="form-control" 
                                   placeholder="Auto-filled from plan" min="1">
                            <small>Leave empty to use plan default</small>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="this.closest('.modal-overlay').remove()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-check"></i> Activate Device
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Auto-fill duration when plan selected
        document.getElementById('planId').addEventListener('change', (e) => {
            const option = e.target.selectedOptions[0];
            const duration = option.dataset.duration;
            if (duration) {
                document.getElementById('durationDays').value = duration;
            }
        });
    },

    async handleActivate(event) {
        event.preventDefault();
        
        const deviceKey = document.getElementById('deviceKey').value;
        const planId = document.getElementById('planId').value;
        const durationDays = document.getElementById('durationDays').value;
        
        document.querySelector('.modal-overlay').remove();
        
        await this.activateDevice(deviceKey, planId, durationDays);
    },

    async refresh() {
        await this.loadPendingDevices();
        this.render();
        this.showNotification('info', 'Refreshed');
    },

    startAutoRefresh() {
        // Auto-refresh pending devices every 30 seconds
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        this.autoRefreshInterval = setInterval(async () => {
            await this.loadPendingDevices();
            // Only update if still on pending tab
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.textContent.includes('Pending')) {
                const tabContent = document.getElementById('tabContent');
                if (tabContent) {
                    tabContent.innerHTML = this.renderPendingDevices();
                }
            }
        }, 30000);
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    },

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
};
