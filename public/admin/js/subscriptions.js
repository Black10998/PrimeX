/**
 * Subscriptions Management Module
 */

const SubscriptionsModule = {
    title: 'Subscriptions Management',
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    filterStatus: 'all',
    subscriptions: [],

    async render() {
        await this.loadSubscriptions();
    },

    async loadSubscriptions() {
        PrimeXCore.showLoading(true);
        try {
            // Get all users with subscription info
            const response = await PrimeXCore.apiCall('/admin/users');
            
            // Normalize response - ensure subscriptions is always an array
            if (response.data) {
                if (Array.isArray(response.data)) {
                    this.subscriptions = response.data;
                } else if (response.data.users && Array.isArray(response.data.users)) {
                    this.subscriptions = response.data.users;
                } else {
                    this.subscriptions = [];
                }
            } else {
                this.subscriptions = [];
            }
            
            this.renderSubscriptionsList();
        } catch (error) {
            this.subscriptions = [];
            PrimeXCore.showToast('Failed to load subscriptions', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderSubscriptionsList() {
        const filtered = this.getFilteredSubscriptions();
        const paginated = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);

        const stats = this.calculateStats(this.subscriptions);

        const content = `
            <!-- Stats Cards -->
            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Active Subscriptions</div>
                        <div class="stat-value">${stats.active}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Expiring Soon (7 days)</div>
                        <div class="stat-value">${stats.expiringSoon}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon danger">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Expired</div>
                        <div class="stat-value">${stats.expired}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <i class="fas fa-infinity"></i>
                    </div>
                    <div class="stat-details">
                        <div class="stat-label">Unlimited</div>
                        <div class="stat-value">${stats.unlimited}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-calendar-check"></i> Subscriptions Management</h3>
                    <button class="btn btn-danger" onclick="SubscriptionsModule.deactivateExpired()">
                        <i class="fas fa-ban"></i> Deactivate Expired
                    </button>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <div class="search-box" style="flex: 1;">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Search users..." value="${this.searchTerm}" 
                                   onkeyup="SubscriptionsModule.handleSearch(this.value)">
                        </div>
                        <select class="form-control" style="width: 200px;" onchange="SubscriptionsModule.handleFilter(this.value)">
                            <option value="all">All Subscriptions</option>
                            <option value="active" ${this.filterStatus === 'active' ? 'selected' : ''}>Active</option>
                            <option value="expiring" ${this.filterStatus === 'expiring' ? 'selected' : ''}>Expiring Soon</option>
                            <option value="expired" ${this.filterStatus === 'expired' ? 'selected' : ''}>Expired</option>
                            <option value="unlimited" ${this.filterStatus === 'unlimited' ? 'selected' : ''}>Unlimited</option>
                        </select>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days Left</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginated.map(sub => `
                                    <tr>
                                        <td><strong>${PrimeXCore.escapeHtml(sub.username)}</strong></td>
                                        <td>${PrimeXCore.escapeHtml(sub.email || 'N/A')}</td>
                                        <td><span class="badge badge-info">${sub.customer_type || 'Regular'}</span></td>
                                        <td>${PrimeXCore.formatDate(sub.subscription_start)}</td>
                                        <td>${this.formatEndDate(sub.subscription_end)}</td>
                                        <td>${this.calculateDaysLeft(sub.subscription_end)}</td>
                                        <td>${this.getStatusBadge(sub)}</td>
                                        <td>
                                            <div style="display: flex; gap: 5px;">
                                                <button class="btn btn-sm btn-success" onclick="SubscriptionsModule.extendSubscription(${sub.id})" title="Extend">
                                                    <i class="fas fa-calendar-plus"></i>
                                                </button>
                                                <button class="btn btn-sm btn-info" onclick="SubscriptionsModule.viewHistory(${sub.id})" title="History">
                                                    <i class="fas fa-history"></i>
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

    getFilteredSubscriptions() {
        return this.subscriptions.filter(sub => {
            const matchesSearch = !this.searchTerm || 
                sub.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (sub.email && sub.email.toLowerCase().includes(this.searchTerm.toLowerCase()));
            
            let matchesFilter = true;
            if (this.filterStatus === 'active') {
                matchesFilter = sub.status === 'active' && (!sub.subscription_end || new Date(sub.subscription_end) > new Date());
            } else if (this.filterStatus === 'expiring') {
                const daysLeft = this.getDaysLeft(sub.subscription_end);
                matchesFilter = daysLeft > 0 && daysLeft <= 7;
            } else if (this.filterStatus === 'expired') {
                matchesFilter = sub.subscription_end && new Date(sub.subscription_end) < new Date();
            } else if (this.filterStatus === 'unlimited') {
                matchesFilter = !sub.subscription_end;
            }
            
            return matchesSearch && matchesFilter;
        });
    },

    calculateStats(subscriptions) {
        const now = new Date();
        return {
            active: subscriptions.filter(s => s.status === 'active' && (!s.subscription_end || new Date(s.subscription_end) > now)).length,
            expiringSoon: subscriptions.filter(s => {
                if (!s.subscription_end) return false;
                const end = new Date(s.subscription_end);
                const diff = (end - now) / (1000 * 60 * 60 * 24);
                return diff > 0 && diff <= 7;
            }).length,
            expired: subscriptions.filter(s => s.subscription_end && new Date(s.subscription_end) < now).length,
            unlimited: subscriptions.filter(s => !s.subscription_end).length
        };
    },

    handleSearch(value) {
        this.searchTerm = value;
        this.currentPage = 1;
        this.renderSubscriptionsList();
    },

    handleFilter(value) {
        this.filterStatus = value;
        this.currentPage = 1;
        this.renderSubscriptionsList();
    },

    formatEndDate(endDate) {
        if (!endDate) return '<span class="badge badge-info">Unlimited</span>';
        return PrimeXCore.formatDate(endDate);
    },

    calculateDaysLeft(endDate) {
        if (!endDate) return '<span class="badge badge-info">∞</span>';
        const days = this.getDaysLeft(endDate);
        if (days < 0) return '<span class="badge badge-danger">Expired</span>';
        if (days <= 7) return `<span class="badge badge-warning">${days} days</span>`;
        return `<span class="badge badge-success">${days} days</span>`;
    },

    getDaysLeft(endDate) {
        if (!endDate) return Infinity;
        const now = new Date();
        const end = new Date(endDate);
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    },

    getStatusBadge(sub) {
        if (!sub.subscription_end) return '<span class="badge badge-info">Unlimited</span>';
        const days = this.getDaysLeft(sub.subscription_end);
        if (days < 0) return '<span class="badge badge-danger">Expired</span>';
        if (days <= 7) return '<span class="badge badge-warning">Expiring Soon</span>';
        return '<span class="badge badge-success">Active</span>';
    },

    extendSubscription(userId) {
        const user = this.subscriptions.find(u => u.id === userId);
        if (!user) return;

        const modalContent = `
            <form id="extendSubForm">
                <p>Extend subscription for: <strong>${PrimeXCore.escapeHtml(user.username)}</strong></p>
                <p>Current end: <strong>${this.formatEndDate(user.subscription_end)}</strong></p>
                <div class="form-group">
                    <label class="form-label">Extend by (days)</label>
                    <input type="number" class="form-control" name="days" value="30" min="1" required>
                </div>
            </form>
        `;

        PrimeXCore.showModal('Extend Subscription', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Extend', class: 'btn-success', onclick: 'document.getElementById("extendSubForm").requestSubmit()' }
        ]);
    },

    async submitExtend(event, userId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const days = formData.get('days');

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/users/${userId}/extend`, 'POST', { days: parseInt(days) });
            PrimeXCore.showToast('Subscription extended successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadSubscriptions();
        } catch (error) {
            PrimeXCore.showToast('Failed to extend subscription', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async viewHistory(userId) {
        const user = this.subscriptions.find(u => u.id === userId);
        if (!user) return;

        const modalContent = `
            <div style="margin-bottom: 20px;">
                <h4>${PrimeXCore.escapeHtml(user.username)}</h4>
                <p><strong>Current Status:</strong> ${this.getStatusBadge(user)}</p>
                <p><strong>Start Date:</strong> ${PrimeXCore.formatDate(user.subscription_start)}</p>
                <p><strong>End Date:</strong> ${this.formatEndDate(user.subscription_end)}</p>
                <p><strong>Days Left:</strong> ${this.calculateDaysLeft(user.subscription_end)}</p>
            </div>
            <p style="color: var(--text-muted);">Full subscription history coming in next update...</p>
        `;

        PrimeXCore.showModal('Subscription History', modalContent, [
            { text: 'Close', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' }
        ]);
    },

    async deactivateExpired() {
        if (!confirm('Deactivate all expired subscriptions? This will set their status to inactive.')) return;

        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/subscriptions/deactivate-expired', 'POST');
            PrimeXCore.showToast(`Deactivated ${response.data.count || 0} expired subscriptions`, 'success');
            await this.loadSubscriptions();
        } catch (error) {
            PrimeXCore.showToast('Failed to deactivate expired subscriptions', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    }
};
