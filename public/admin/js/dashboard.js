/**
 * Dashboard Module - Statistics and System Overview
 */

const DashboardModule = {
    title: 'Dashboard',
    
    async render() {
        PrimeXCore.showLoading(true);
        
        try {
            const stats = await PrimeXCore.apiCall('/admin/dashboard/stats');
            const health = await PrimeXCore.apiCall('/admin/dashboard/health');
            
            const content = `
                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon primary">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Total Users</div>
                            <div class="stat-value">${PrimeXCore.formatNumber(stats.data.users.total_users)}</div>
                            <div class="stat-change positive">
                                <i class="fas fa-arrow-up"></i> Active: ${stats.data.users.active_users}
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Active Subscriptions</div>
                            <div class="stat-value">${PrimeXCore.formatNumber(stats.data.users.active_subscriptions)}</div>
                            <div class="stat-change warning">
                                <i class="fas fa-exclamation-triangle"></i> Expiring Soon: ${stats.data.users.expiring_soon}
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon info">
                            <i class="fas fa-broadcast-tower"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Total Channels</div>
                            <div class="stat-value">${PrimeXCore.formatNumber(stats.data.channels.total_channels)}</div>
                            <div class="stat-change positive">
                                <i class="fas fa-check"></i> Active: ${stats.data.channels.active_channels}
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Streaming Servers</div>
                            <div class="stat-value">${PrimeXCore.formatNumber(stats.data.servers.total_servers)}</div>
                            <div class="stat-change positive">
                                <i class="fas fa-check"></i> Active: ${stats.data.servers.active_servers}
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Subscription Codes</div>
                            <div class="stat-value">${PrimeXCore.formatNumber(stats.data.codes.active_codes)}</div>
                            <div class="stat-change">
                                Used: ${stats.data.codes.used_codes} / ${stats.data.codes.total_codes}
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon danger">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Expired Subscriptions</div>
                            <div class="stat-value">${PrimeXCore.formatNumber(stats.data.users.expired_subscriptions)}</div>
                            <div class="stat-change negative">
                                <i class="fas fa-arrow-down"></i> Requires attention
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Health -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-heartbeat"></i>
                            System Health
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon ${health.data.database === 'connected' ? 'success' : 'danger'}">
                                    <i class="fas fa-database"></i>
                                </div>
                                <div class="stat-details">
                                    <div class="stat-label">Database</div>
                                    <div class="stat-value">${health.data.database}</div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon info">
                                    <i class="fas fa-memory"></i>
                                </div>
                                <div class="stat-details">
                                    <div class="stat-label">Memory Usage</div>
                                    <div class="stat-value">${health.data.memory?.used || 'N/A'}</div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon success">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="stat-details">
                                    <div class="stat-label">Uptime</div>
                                    <div class="stat-value">${this.formatUptime(health.data.uptime)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Users -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-user-plus"></i>
                            Recent Users
                        </h3>
                        <a href="#users" class="btn btn-sm btn-primary">View All</a>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Created</th>
                                        <th>Subscription End</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.data.recent_users.map(user => `
                                        <tr>
                                            <td>${PrimeXCore.escapeHtml(user.username)}</td>
                                            <td>${PrimeXCore.escapeHtml(user.email || 'N/A')}</td>
                                            <td>${PrimeXCore.formatDate(user.created_at)}</td>
                                            <td>${PrimeXCore.formatDate(user.subscription_end)}</td>
                                            <td>
                                                <span class="badge ${this.getSubscriptionBadge(user.subscription_end)}">
                                                    ${this.getSubscriptionStatus(user.subscription_end)}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-history"></i>
                            Recent Activity
                        </h3>
                        <a href="#logs" class="btn btn-sm btn-primary">View All Logs</a>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.data.recent_activity.map(log => `
                                        <tr>
                                            <td>${PrimeXCore.escapeHtml(log.username || 'System')}</td>
                                            <td>${PrimeXCore.escapeHtml(log.action)}</td>
                                            <td>${PrimeXCore.escapeHtml(log.details || 'N/A')}</td>
                                            <td>${PrimeXCore.formatDate(log.created_at)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('contentArea').innerHTML = content;
        } catch (error) {
            document.getElementById('contentArea').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <p style="color: var(--danger);">Failed to load dashboard: ${error.message}</p>
                    </div>
                </div>
            `;
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    },

    getSubscriptionStatus(endDate) {
        if (!endDate) return 'Unlimited';
        const end = new Date(endDate);
        const now = new Date();
        if (end < now) return 'Expired';
        if (end - now < 7 * 24 * 60 * 60 * 1000) return 'Expiring Soon';
        return 'Active';
    },

    getSubscriptionBadge(endDate) {
        const status = this.getSubscriptionStatus(endDate);
        if (status === 'Active' || status === 'Unlimited') return 'badge-success';
        if (status === 'Expiring Soon') return 'badge-warning';
        return 'badge-danger';
    }
};
