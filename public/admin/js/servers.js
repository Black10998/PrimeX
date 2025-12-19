/**
 * Streaming Servers Module - With Health Monitoring
 */

const ServersModule = {
    title: 'Streaming Servers',
    servers: [],

    async render() {
        await this.loadServers();
    },

    async loadServers() {
        PrimeXCore.showLoading(true);
        try {
            const [serversResponse, statsResponse] = await Promise.all([
                PrimeXCore.apiCall('/admin/servers'),
                PrimeXCore.apiCall('/admin/servers/stats')
            ]);
            
            // Normalize servers response
            if (serversResponse.data) {
                if (Array.isArray(serversResponse.data)) {
                    this.servers = serversResponse.data;
                } else if (serversResponse.data.servers && Array.isArray(serversResponse.data.servers)) {
                    this.servers = serversResponse.data.servers;
                } else {
                    this.servers = [];
                }
            } else {
                this.servers = [];
            }
            
            this.stats = statsResponse.data || {};
            this.renderServersList();
        } catch (error) {
            this.servers = [];
            PrimeXCore.showToast('Failed to load servers', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderServersList() {
        const content = `
            <!-- Server Stats -->
            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Total Servers</div>
                        <div class="stat-value">${this.servers.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Active Servers</div>
                        <div class="stat-value">${this.servers.filter(s => s.status === 'active').length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="fas fa-tools"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Maintenance</div>
                        <div class="stat-value">${this.servers.filter(s => s.status === 'maintenance').length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <i class="fas fa-plug"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Total Connections</div>
                        <div class="stat-value">${this.getTotalConnections()}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-server"></i> Streaming Servers</h3>
                    <button class="btn btn-primary" onclick="ServersModule.showCreateModal()">
                        <i class="fas fa-plus"></i> Add Server
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>URL</th>
                                    <th>Type</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Connections</th>
                                    <th>Priority</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.servers.map(server => `
                                    <tr>
                                        <td>#${server.id}</td>
                                        <td><strong>${PrimeXCore.escapeHtml(server.name)}</strong></td>
                                        <td><code style="font-size: 11px;">${PrimeXCore.escapeHtml(server.url)}</code></td>
                                        <td><span class="badge ${server.server_type === 'primary' ? 'badge-primary' : 'badge-secondary'}">${server.server_type}</span></td>
                                        <td>${PrimeXCore.escapeHtml(server.location || 'N/A')}</td>
                                        <td>${this.getStatusBadge(server.status)}</td>
                                        <td>${server.current_connections || 0} / ${server.max_connections || '∞'}</td>
                                        <td>${server.priority || 0}</td>
                                        <td>
                                            <div style="display: flex; gap: 5px;">
                                                <button class="btn btn-sm btn-info" onclick="ServersModule.testConnection(${server.id})" title="Test">
                                                    <i class="fas fa-plug"></i>
                                                </button>
                                                <button class="btn btn-sm btn-primary" onclick="ServersModule.showEditModal(${server.id})" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="ServersModule.deleteServer(${server.id})" title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    getTotalConnections() {
        return this.servers.reduce((sum, server) => sum + (server.current_connections || 0), 0);
    },

    getStatusBadge(status) {
        const badges = {
            'active': '<span class="badge badge-success">Active</span>',
            'inactive': '<span class="badge badge-danger">Inactive</span>',
            'maintenance': '<span class="badge badge-warning">Maintenance</span>'
        };
        return badges[status] || '<span class="badge badge-secondary">Unknown</span>';
    },

    showCreateModal() {
        const modalContent = `
            <form id="createServerForm" onsubmit="ServersModule.createServer(event)">
                <div class="form-group">
                    <label class="form-label">Server Name *</label>
                    <input type="text" class="form-control" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Server URL *</label>
                    <input type="url" class="form-control" name="url" placeholder="http://server.example.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Server Type *</label>
                    <select class="form-control" name="server_type" required>
                        <option value="primary">Primary</option>
                        <option value="backup">Backup</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-control" name="location" placeholder="e.g., US East, EU West">
                </div>
                <div class="form-group">
                    <label class="form-label">Max Connections</label>
                    <input type="number" class="form-control" name="max_connections" value="1000" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Priority (higher = preferred)</label>
                    <input type="number" class="form-control" name="priority" value="1" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">API Key</label>
                    <input type="text" class="form-control" name="api_key">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Add Streaming Server', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Create', class: 'btn-primary', onclick: 'document.getElementById("createServerForm").requestSubmit()' }
        ]);
    },

    async createServer(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/servers', 'POST', data);
            PrimeXCore.showToast('Server created successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadServers();
        } catch (error) {
            PrimeXCore.showToast('Failed to create server', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async showEditModal(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        const modalContent = `
            <form id="editServerForm" onsubmit="ServersModule.updateServer(event, ${serverId})">
                <div class="form-group">
                    <label class="form-label">Server Name *</label>
                    <input type="text" class="form-control" name="name" value="${PrimeXCore.escapeHtml(server.name)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Server URL *</label>
                    <input type="url" class="form-control" name="url" value="${PrimeXCore.escapeHtml(server.url)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Server Type *</label>
                    <select class="form-control" name="server_type" required>
                        <option value="primary" ${server.server_type === 'primary' ? 'selected' : ''}>Primary</option>
                        <option value="backup" ${server.server_type === 'backup' ? 'selected' : ''}>Backup</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-control" name="location" value="${PrimeXCore.escapeHtml(server.location || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" name="status">
                        <option value="active" ${server.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${server.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="maintenance" ${server.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Max Connections</label>
                    <input type="number" class="form-control" name="max_connections" value="${server.max_connections || 1000}" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <input type="number" class="form-control" name="priority" value="${server.priority || 1}" min="0">
                </div>
            </form>
        `;

        PrimeXCore.showModal('Edit Server', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Update', class: 'btn-primary', onclick: 'document.getElementById("editServerForm").requestSubmit()' }
        ]);
    },

    async updateServer(event, serverId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/servers/${serverId}`, 'PUT', data);
            PrimeXCore.showToast('Server updated successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadServers();
        } catch (error) {
            PrimeXCore.showToast('Failed to update server', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async testConnection(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall(`/admin/servers/${serverId}/test`);
            if (response.success) {
                PrimeXCore.showToast(`Server "${server.name}" is reachable`, 'success');
            } else {
                PrimeXCore.showToast(`Server "${server.name}" is not reachable`, 'error');
            }
        } catch (error) {
            PrimeXCore.showToast('Connection test failed', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deleteServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        if (!confirm(`Delete server "${server.name}"?`)) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/servers/${serverId}`, 'DELETE');
            PrimeXCore.showToast('Server deleted successfully', 'success');
            await this.loadServers();
        } catch (error) {
            PrimeXCore.showToast('Failed to delete server', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    }
};
