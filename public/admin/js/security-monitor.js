class SecurityMonitor {
    constructor() {
        this.refreshInterval = null;
        this.currentPanel = null;
        this.lastUpdate = null;
        this.init();
    }

    init() {
        const securityBtn = document.getElementById('securityMonitorBtn');
        if (securityBtn) {
            console.log('✅ Security Monitor: Button found, attaching click handler');
            securityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🔐 Security Monitor: Button clicked');
                this.toggleSecurityPanel(e.currentTarget);
            });
        } else {
            console.error('❌ Security Monitor: Button not found (ID: securityMonitorBtn)');
        }

        // Auto-refresh every 10 seconds
        this.startAutoRefresh();
        console.log('✅ Security Monitor: Initialized successfully');
    }

    async fetchSecurityStatus() {
        try {
            const token = localStorage.getItem('adminToken');
            console.log('🔐 Fetching security status...');
            const response = await fetch('/api/v1/admin/security/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('❌ Security status fetch failed:', response.status, response.statusText);
                throw new Error('Failed to fetch security status');
            }

            const result = await response.json();
            console.log('✅ Security status received:', result.data);
            return result.data;
        } catch (error) {
            console.error('❌ Security status fetch error:', error);
            return null;
        }
    }

    async fetchRecentEvents(limit = 10) {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/v1/admin/security/events?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch security events');

            const result = await response.json();
            return result.data.events;
        } catch (error) {
            console.error('Security events fetch error:', error);
            return [];
        }
    }

    updateStatusIndicator(status) {
        const indicator = document.getElementById('securityStatusIndicator');
        if (!indicator) return;

        indicator.className = 'security-status-indicator';
        indicator.classList.add(status);
    }

    async toggleSecurityPanel(button) {
        if (this.currentPanel) {
            this.closeSecurityPanel();
            return;
        }

        // Fetch data
        const [statusData, events] = await Promise.all([
            this.fetchSecurityStatus(),
            this.fetchRecentEvents(10)
        ]);

        if (!statusData) {
            this.showError('Failed to load security data');
            return;
        }

        this.showSecurityPanel(button, statusData, events);
        this.lastUpdate = new Date();
    }

    showSecurityPanel(button, statusData, events) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'dropdown-overlay';
        overlay.addEventListener('click', () => this.closeSecurityPanel());

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'security-panel';

        // Position panel
        const rect = button.getBoundingClientRect();
        panel.style.top = `${rect.bottom + 10}px`;
        panel.style.right = `${window.innerWidth - rect.right}px`;

        // Build panel content
        panel.innerHTML = this.buildPanelHTML(statusData, events);

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        this.currentPanel = { overlay, panel };

        // Add refresh button handler
        const refreshBtn = panel.querySelector('.security-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshPanel());
        }

        // Update status indicator
        this.updateStatusIndicator(statusData.status);
    }

    buildPanelHTML(statusData, events) {
        const { status, statusColor, stats } = statusData;

        return `
            <div class="security-panel-header">
                <div class="security-panel-title">
                    <h3>Security Monitor</h3>
                    <span class="security-status-badge ${status}">
                        <i class="fas fa-circle"></i>
                        ${status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div class="security-panel-body">
                <div class="security-stats-grid">
                    <div class="security-stat-card">
                        <div class="security-stat-label">Total Events (24h)</div>
                        <div class="security-stat-value">${stats.total_events}</div>
                    </div>
                    <div class="security-stat-card">
                        <div class="security-stat-label">Critical</div>
                        <div class="security-stat-value critical">${stats.critical_events}</div>
                    </div>
                    <div class="security-stat-card">
                        <div class="security-stat-label">Failed Logins</div>
                        <div class="security-stat-value ${stats.failed_logins > 5 ? 'warning' : ''}">${stats.failed_logins}</div>
                    </div>
                    <div class="security-stat-card">
                        <div class="security-stat-label">Blocked IPs</div>
                        <div class="security-stat-value">${stats.blocked_ips}</div>
                    </div>
                    <div class="security-stat-card">
                        <div class="security-stat-label">Rate Limit Violations</div>
                        <div class="security-stat-value ${stats.rate_limit_violations > 10 ? 'warning' : ''}">${stats.rate_limit_violations}</div>
                    </div>
                    <div class="security-stat-card">
                        <div class="security-stat-label">Recent (1h)</div>
                        <div class="security-stat-value ${stats.recent_events_1h > 20 ? 'warning' : ''}">${stats.recent_events_1h}</div>
                    </div>
                </div>

                <div class="security-events-list">
                    <div class="security-events-header">
                        <h4>Recent Events</h4>
                    </div>
                    ${this.buildEventsHTML(events)}
                </div>
            </div>

            <div class="security-panel-footer">
                <button class="security-refresh-btn">
                    <i class="fas fa-sync-alt"></i>
                    Refresh
                </button>
                <span class="security-last-update">
                    Updated: ${this.formatTime(new Date())}
                </span>
            </div>
        `;
    }

    buildEventsHTML(events) {
        if (!events || events.length === 0) {
            return '<div style="text-align: center; padding: 20px; color: var(--text-muted);">No recent events</div>';
        }

        return events.map(event => `
            <div class="security-event-item">
                <div class="security-event-header">
                    <div class="security-event-type">
                        <i class="fas ${this.getEventIcon(event.event_type)}"></i>
                        ${this.formatEventType(event.event_type)}
                    </div>
                    <span class="security-event-severity ${event.severity}">${event.severity}</span>
                </div>
                <div class="security-event-description">
                    ${event.description || 'No description'}
                </div>
                <div class="security-event-meta">
                    <span><i class="fas fa-network-wired"></i> ${event.ip_address}</span>
                    ${event.username ? `<span><i class="fas fa-user"></i> ${event.username}</span>` : ''}
                    <span><i class="fas fa-clock"></i> ${this.formatTimeAgo(event.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    getEventIcon(eventType) {
        const icons = {
            'failed_login': 'fa-user-times',
            'unauthorized_access': 'fa-ban',
            'brute_force': 'fa-hammer',
            'suspicious_ip': 'fa-exclamation-triangle',
            'rate_limit_exceeded': 'fa-tachometer-alt',
            'malformed_request': 'fa-bug',
            'blocked_ip': 'fa-shield-alt',
            'api_abuse': 'fa-code'
        };
        return icons[eventType] || 'fa-info-circle';
    }

    formatEventType(eventType) {
        return eventType.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const eventTime = new Date(timestamp);
        const diffMs = now - eventTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return eventTime.toLocaleDateString();
    }

    async refreshPanel() {
        if (!this.currentPanel) return;

        const refreshBtn = this.currentPanel.panel.querySelector('.security-refresh-btn');
        const icon = refreshBtn.querySelector('i');
        
        // Animate refresh
        icon.style.animation = 'spin 0.5s linear';
        
        const [statusData, events] = await Promise.all([
            this.fetchSecurityStatus(),
            this.fetchRecentEvents(10)
        ]);

        if (statusData) {
            // Update panel content
            const panelBody = this.currentPanel.panel.querySelector('.security-panel-body');
            const panelHeader = this.currentPanel.panel.querySelector('.security-panel-header');
            
            panelHeader.innerHTML = this.buildPanelHTML(statusData, events).match(/<div class="security-panel-header">([\s\S]*?)<\/div>/)[1];
            panelBody.innerHTML = this.buildPanelHTML(statusData, events).match(/<div class="security-panel-body">([\s\S]*?)<\/div>/)[1];
            
            // Update footer timestamp
            const lastUpdate = this.currentPanel.panel.querySelector('.security-last-update');
            lastUpdate.textContent = `Updated: ${this.formatTime(new Date())}`;
            
            // Update status indicator
            this.updateStatusIndicator(statusData.status);
            
            this.lastUpdate = new Date();
        }

        setTimeout(() => {
            icon.style.animation = '';
        }, 500);
    }

    closeSecurityPanel() {
        if (this.currentPanel) {
            this.currentPanel.overlay.remove();
            this.currentPanel.panel.remove();
            this.currentPanel = null;
        }
    }

    startAutoRefresh() {
        console.log('🔄 Security Monitor: Starting auto-refresh (10s interval)');
        
        // Initial status fetch
        this.fetchSecurityStatus().then(statusData => {
            if (statusData) {
                this.updateStatusIndicator(statusData.status);
                console.log('✅ Initial security status loaded:', statusData.status);
            }
        });
        
        // Update status indicator every 10 seconds
        this.refreshInterval = setInterval(async () => {
            const statusData = await this.fetchSecurityStatus();
            if (statusData) {
                this.updateStatusIndicator(statusData.status);
                
                // If panel is open, refresh it
                if (this.currentPanel) {
                    await this.refreshPanel();
                }
            }
        }, 10000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showError(message) {
        console.error('Security Monitor Error:', message);
        // Could show a toast notification here
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.securityMonitor = new SecurityMonitor();
    });
} else {
    window.securityMonitor = new SecurityMonitor();
}
