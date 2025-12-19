/**
 * Activity Logs Module - With Filtering
 */

const LogsModule = {
    title: 'Activity Logs',
    currentPage: 1,
    pageSize: 50,
    searchTerm: '',
    filterAction: 'all',
    logs: [],

    async render() {
        await this.loadLogs();
    },

    async loadLogs() {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/dashboard/stats');
            
            // Normalize response - ensure logs is always an array
            if (response.data && response.data.recent_activity) {
                if (Array.isArray(response.data.recent_activity)) {
                    this.logs = response.data.recent_activity;
                } else {
                    this.logs = [];
                }
            } else {
                this.logs = [];
            }
            
            this.renderLogsList();
        } catch (error) {
            this.logs = [];
            PrimeXCore.showToast('Failed to load activity logs', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderLogsList() {
        const filtered = this.getFilteredLogs();
        const paginated = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);

        const actions = this.getUniqueActions();

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-history"></i> Activity Logs</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary" onclick="LogsModule.exportLogs()">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="btn btn-primary" onclick="LogsModule.loadLogs()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div class="search-box" style="flex: 1; min-width: 250px;">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Search logs..." value="${this.searchTerm}" 
                                   onkeyup="LogsModule.handleSearch(this.value)">
                        </div>
                        <select class="form-control" style="width: 200px;" onchange="LogsModule.handleFilter(this.value)">
                            <option value="all">All Actions</option>
                            ${actions.map(action => `
                                <option value="${action}" ${this.filterAction === action ? 'selected' : ''}>
                                    ${action}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div style="margin-bottom: 15px; color: var(--text-muted);">
                        Showing ${paginated.length} of ${filtered.length} logs
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginated.length > 0 ? paginated.map(log => `
                                    <tr>
                                        <td style="white-space: nowrap;">${PrimeXCore.formatDate(log.created_at)}</td>
                                        <td><strong>${PrimeXCore.escapeHtml(log.username || 'System')}</strong></td>
                                        <td>${this.getActionBadge(log.action)}</td>
                                        <td>${PrimeXCore.escapeHtml(log.details || 'N/A')}</td>
                                        <td>${PrimeXCore.escapeHtml(log.ip_address || 'N/A')}</td>
                                        <td>${this.getStatusBadge(log.status)}</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" style="text-align: center; padding: 40px;">
                                            <i class="fas fa-history" style="font-size: 48px; color: var(--text-muted); margin-bottom: 10px;"></i>
                                            <p>No logs found</p>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    ${this.renderPagination(filtered.length)}
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    getFilteredLogs() {
        return this.logs.filter(log => {
            const matchesSearch = !this.searchTerm || 
                (log.username && log.username.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
                (log.action && log.action.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
                (log.details && log.details.toLowerCase().includes(this.searchTerm.toLowerCase()));
            
            const matchesFilter = this.filterAction === 'all' || log.action === this.filterAction;
            
            return matchesSearch && matchesFilter;
        });
    },

    getUniqueActions() {
        const actions = new Set(this.logs.map(log => log.action).filter(Boolean));
        return Array.from(actions).sort();
    },

    handleSearch(value) {
        this.searchTerm = value;
        this.currentPage = 1;
        this.renderLogsList();
    },

    handleFilter(value) {
        this.filterAction = value;
        this.currentPage = 1;
        this.renderLogsList();
    },

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        if (totalPages <= 1) return '';

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <div>Page ${this.currentPage} of ${totalPages}</div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-sm btn-secondary" ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="LogsModule.changePage(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <button class="btn btn-sm btn-secondary" ${this.currentPage === totalPages ? 'disabled' : ''} 
                            onclick="LogsModule.changePage(${this.currentPage + 1})">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    },

    changePage(page) {
        this.currentPage = page;
        this.renderLogsList();
    },

    getActionBadge(action) {
        const actionColors = {
            'login': 'badge-success',
            'logout': 'badge-info',
            'create': 'badge-primary',
            'update': 'badge-warning',
            'delete': 'badge-danger',
            'error': 'badge-danger'
        };
        
        let color = 'badge-secondary';
        for (const [key, value] of Object.entries(actionColors)) {
            if (action && action.toLowerCase().includes(key)) {
                color = value;
                break;
            }
        }
        
        return `<span class="badge ${color}">${PrimeXCore.escapeHtml(action || 'Unknown')}</span>`;
    },

    getStatusBadge(status) {
        if (!status) return '<span class="badge badge-secondary">N/A</span>';
        
        const statusColors = {
            'success': 'badge-success',
            'failed': 'badge-danger',
            'error': 'badge-danger',
            'warning': 'badge-warning'
        };
        
        const color = statusColors[status.toLowerCase()] || 'badge-secondary';
        return `<span class="badge ${color}">${PrimeXCore.escapeHtml(status)}</span>`;
    },

    exportLogs() {
        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        PrimeXCore.showToast('Logs exported successfully', 'success');
    },

    generateCSV() {
        const headers = ['Time', 'User', 'Action', 'Details', 'IP Address', 'Status'];
        const rows = this.logs.map(log => [
            log.created_at,
            log.username || 'System',
            log.action || '',
            log.details || '',
            log.ip_address || '',
            log.status || ''
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
};
