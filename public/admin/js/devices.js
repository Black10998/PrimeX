/**
 * Devices & Connections Tracking Module
 */

const DevicesModule = {
    title: 'Devices & Connections',
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    devices: [],
    users: [],

    async render() {
        await this.loadDevices();
    },

    async loadDevices() {
        PrimeXCore.showLoading(true);
        try {
            // Get all users to access their devices
            const usersResponse = await PrimeXCore.apiCall('/admin/users');
            
            // Normalize users response
            if (usersResponse.data) {
                if (Array.isArray(usersResponse.data)) {
                    this.users = usersResponse.data;
                } else if (usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
                    this.users = usersResponse.data.users;
                } else {
                    this.users = [];
                }
            } else {
                this.users = [];
            }
            
            // Collect all devices from all users
            this.devices = [];
            for (const user of this.users) {
                try {
                    const devicesResponse = await PrimeXCore.apiCall(`/admin/users/${user.id}/devices`);
                    
                    // Normalize devices response
                    let userDevices = [];
                    if (devicesResponse.data) {
                        if (Array.isArray(devicesResponse.data)) {
                            userDevices = devicesResponse.data;
                        } else if (devicesResponse.data.devices && Array.isArray(devicesResponse.data.devices)) {
                            userDevices = devicesResponse.data.devices;
                        }
                    }
                    
                    const mappedDevices = userDevices.map(device => ({
                        ...device,
                        username: user.username,
                        userId: user.id,
                        userEmail: user.email
                    }));
                    this.devices.push(...mappedDevices);
                } catch (error) {
                    // Skip if user has no devices
                }
            }
            
            this.renderDevicesList();
        } catch (error) {
            PrimeXCore.showToast('Failed to load devices', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderDevicesList() {
        const filtered = this.getFilteredDevices();
        const paginated = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);

        const stats = this.calculateStats();

        const content = `
            <!-- Device Stats -->
            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Total Devices</div>
                        <div class="stat-value">${this.devices.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Active Now</div>
                        <div class="stat-value">${stats.activeNow}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Unique Users</div>
                        <div class="stat-value">${stats.uniqueUsers}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Limit Violations</div>
                        <div class="stat-value">${stats.violations}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-mobile-alt"></i> Devices & Connections</h3>
                    <button class="btn btn-danger" onclick="DevicesModule.kickAllInactive()">
                        <i class="fas fa-ban"></i> Kick Inactive
                    </button>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <div class="search-box" style="flex: 1;">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Search devices or users..." value="${this.searchTerm}" 
                                   onkeyup="DevicesModule.handleSearch(this.value)">
                        </div>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Device ID</th>
                                    <th>Device Model</th>
                                    <th>IP Address</th>
                                    <th>Last Seen</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginated.length > 0 ? paginated.map(device => `
                                    <tr>
                                        <td>
                                            <strong>${PrimeXCore.escapeHtml(device.username)}</strong>
                                            ${device.userEmail ? `<br><small style="color: var(--text-muted);">${PrimeXCore.escapeHtml(device.userEmail)}</small>` : ''}
                                        </td>
                                        <td><code style="font-size: 11px;">${PrimeXCore.escapeHtml(device.device_id || 'N/A')}</code></td>
                                        <td>${PrimeXCore.escapeHtml(device.device_model || 'Unknown')}</td>
                                        <td>${PrimeXCore.escapeHtml(device.ip_address || 'N/A')}</td>
                                        <td>${PrimeXCore.formatDate(device.last_seen)}</td>
                                        <td>${this.getDeviceStatus(device.last_seen)}</td>
                                        <td>
                                            <div style="display: flex; gap: 5px;">
                                                <button class="btn btn-sm btn-warning" onclick="DevicesModule.kickDevice(${device.userId}, ${device.id})" title="Kick">
                                                    <i class="fas fa-sign-out-alt"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="DevicesModule.removeDevice(${device.userId}, ${device.id})" title="Remove">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="7" style="text-align: center; padding: 40px;">
                                            <i class="fas fa-mobile-alt" style="font-size: 48px; color: var(--text-muted); margin-bottom: 10px;"></i>
                                            <p>No devices found</p>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    getFilteredDevices() {
        return this.devices.filter(device => {
            if (!this.searchTerm) return true;
            const search = this.searchTerm.toLowerCase();
            return device.username.toLowerCase().includes(search) ||
                   (device.device_id && device.device_id.toLowerCase().includes(search)) ||
                   (device.ip_address && device.ip_address.includes(search));
        });
    },

    calculateStats() {
        const now = new Date();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        
        return {
            activeNow: this.devices.filter(d => d.last_seen && new Date(d.last_seen) > fiveMinutesAgo).length,
            uniqueUsers: new Set(this.devices.map(d => d.userId)).size,
            violations: 0 // Would need to check against user max_devices
        };
    },

    getDeviceStatus(lastSeen) {
        if (!lastSeen) return '<span class="badge badge-secondary">Unknown</span>';
        
        const now = new Date();
        const last = new Date(lastSeen);
        const minutesAgo = (now - last) / (1000 * 60);
        
        if (minutesAgo < 5) return '<span class="badge badge-success">Online</span>';
        if (minutesAgo < 60) return '<span class="badge badge-warning">Idle</span>';
        return '<span class="badge badge-secondary">Offline</span>';
    },

    handleSearch(value) {
        this.searchTerm = value;
        this.currentPage = 1;
        this.renderDevicesList();
    },

    async kickDevice(userId, deviceId) {
        if (!confirm('Kick this device? The user will need to reconnect.')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}/devices/${deviceId}/kick`, 'POST');
            PrimeXCore.showToast('Device kicked successfully', 'success');
            await this.loadDevices();
        } catch (error) {
            PrimeXCore.showToast('Failed to kick device', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async removeDevice(userId, deviceId) {
        if (!confirm('Remove this device permanently?')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}/devices/${deviceId}`, 'DELETE');
            PrimeXCore.showToast('Device removed successfully', 'success');
            await this.loadDevices();
        } catch (error) {
            PrimeXCore.showToast('Failed to remove device', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async kickAllInactive() {
        if (!confirm('Kick all inactive devices (offline for more than 1 hour)?')) return;

        PrimeXCore.showLoading(true);
        try {
            const now = new Date();
            const oneHourAgo = new Date(now - 60 * 60 * 1000);
            
            let kicked = 0;
            for (const device of this.devices) {
                if (device.last_seen && new Date(device.last_seen) < oneHourAgo) {
                    try {
                        await PrimeXCore.apiCall(`/admin/users/${device.userId}/devices/${device.id}/kick`, 'POST');
                        kicked++;
                    } catch (error) {
                        // Continue with next device
                    }
                }
            }
            
            PrimeXCore.showToast(`Kicked ${kicked} inactive devices`, 'success');
            await this.loadDevices();
        } catch (error) {
            PrimeXCore.showToast('Failed to kick devices', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    }
};
