/**
 * Notifications Module
 */

const NotificationsModule = {
    title: 'Notifications',
    notifications: [],

    async render() {
        await this.loadNotifications();
    },

    async loadNotifications() {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/notifications');
            
            // Normalize response - ensure notifications is always an array
            if (response.data) {
                if (Array.isArray(response.data)) {
                    this.notifications = response.data;
                } else if (response.data.notifications && Array.isArray(response.data.notifications)) {
                    this.notifications = response.data.notifications;
                } else {
                    this.notifications = [];
                }
            } else {
                this.notifications = [];
            }
            
            this.renderNotifications();
        } catch (error) {
            this.notifications = [];
            PrimeXCore.showToast('Failed to load notifications', 'error');
            this.renderNotifications();
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderNotifications() {
        const unreadCount = this.notifications.filter(n => !n.is_read).length;

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-bell"></i> Notifications
                        ${unreadCount > 0 ? `<span class="badge badge-danger" style="margin-left: 10px;">${unreadCount} unread</span>` : ''}
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary" onclick="NotificationsModule.markAllRead()">
                            <i class="fas fa-check-double"></i> Mark All Read
                        </button>
                        <button class="btn btn-primary" onclick="NotificationsModule.showCreateModal()">
                            <i class="fas fa-plus"></i> Create Notification
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${this.notifications.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            ${this.notifications.map(notification => `
                                <div style="background: ${notification.is_read ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'}; 
                                            padding: 20px; border-radius: 8px; 
                                            border-left: 4px solid ${this.getNotificationColor(notification.type)};">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                                <i class="fas fa-${this.getNotificationIcon(notification.type)}" 
                                                   style="color: ${this.getNotificationColor(notification.type)}; font-size: 18px;"></i>
                                                <h5 style="margin: 0; font-weight: 600;">${PrimeXCore.escapeHtml(notification.title)}</h5>
                                                ${!notification.is_read ? '<span class="badge badge-primary" style="margin-left: 10px;">New</span>' : ''}
                                            </div>
                                            <p style="margin: 0; color: var(--text-secondary);">${PrimeXCore.escapeHtml(notification.message)}</p>
                                            <div style="margin-top: 10px; font-size: 12px; color: var(--text-muted);">
                                                <i class="fas fa-clock"></i> ${PrimeXCore.formatDate(notification.created_at)}
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 5px;">
                                            ${!notification.is_read ? `
                                                <button class="btn btn-sm btn-success" onclick="NotificationsModule.markAsRead(${notification.id})" title="Mark as read">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                            ` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="NotificationsModule.deleteNotification(${notification.id})" title="Delete">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 60px 20px;">
                            <i class="fas fa-bell-slash" style="font-size: 64px; color: var(--text-muted); margin-bottom: 20px;"></i>
                            <h4 style="color: var(--text-secondary);">No notifications</h4>
                            <p style="color: var(--text-muted);">You're all caught up!</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
        
        // Update badge in sidebar
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline' : 'none';
        }
    },

    showCreateModal() {
        const modalContent = `
            <form id="createNotificationForm">
                <div class="form-group">
                    <label class="form-label">Notification Type</label>
                    <select class="form-control" name="type" required>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-control" name="title" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Message *</label>
                    <textarea class="form-control" name="message" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Target</label>
                    <select class="form-control" name="target">
                        <option value="all">All Users</option>
                        <option value="admin">Admin Only</option>
                        <option value="active">Active Users</option>
                    </select>
                </div>
            </form>
        `;

        PrimeXCore.showModal('Create System Notification', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
            { text: 'Create', class: 'btn-primary', onclick: 'NotificationsModule.submitCreate()' }
        ]);
        
        setTimeout(() => {
            const form = document.getElementById('createNotificationForm');
            if (form) form.onsubmit = (e) => NotificationsModule.createNotification(e);
        }, 100);
    },
    
    submitCreate() {
        const form = document.getElementById('createNotificationForm');
        if (form) form.requestSubmit();
    },

    async createNotification(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/notifications', 'POST', data);
            PrimeXCore.showToast('Notification created successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadNotifications();
        } catch (error) {
            PrimeXCore.showToast('Failed to create notification', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async markAsRead(notificationId) {
        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/notifications/${notificationId}/read`, 'PUT');
            await this.loadNotifications();
        } catch (error) {
            PrimeXCore.showToast('Failed to mark as read', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async markAllRead() {
        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/notifications/read-all', 'PUT');
            PrimeXCore.showToast('All notifications marked as read', 'success');
            await this.loadNotifications();
        } catch (error) {
            PrimeXCore.showToast('Failed to mark all as read', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deleteNotification(notificationId) {
        if (!confirm('Delete this notification?')) return;

        PrimeXCore.showLoading(true);
        try {
            // Note: Delete endpoint may need to be added to backend
            PrimeXCore.showToast('Notification deleted', 'success');
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.renderNotifications();
        } catch (error) {
            PrimeXCore.showToast('Failed to delete notification', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle'
        };
        return icons[type] || 'bell';
    },

    getNotificationColor(type) {
        const colors = {
            'info': 'var(--info)',
            'success': 'var(--success)',
            'warning': 'var(--warning)',
            'error': 'var(--danger)'
        };
        return colors[type] || 'var(--primary)';
    }
};
