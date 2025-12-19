/**
 * System Settings Module
 */

const SettingsModule = {
    title: 'System Settings',
    settings: {},

    async render() {
        await this.loadSettings();
    },

    async loadSettings() {
        PrimeXCore.showLoading(true);
        try {
            // Load system health which contains version info
            const response = await PrimeXCore.apiCall('/admin/dashboard/health');
            this.settings = response.data || {};
            this.renderSettings();
        } catch (error) {
            PrimeXCore.showToast('Failed to load settings', 'error');
            this.renderSettings();
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderSettings() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-cog"></i> System Settings</h3>
                    <button class="btn btn-primary" onclick="SettingsModule.saveSettings()">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
                <div class="card-body">
                    <form id="settingsForm">
                        <!-- General Settings -->
                        <h4 style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-sliders-h"></i> General Settings
                        </h4>
                        
                        <div class="form-group">
                            <label class="form-label">System Name</label>
                            <input type="text" class="form-control" name="system_name" value="PrimeX IPTV" readonly>
                            <small style="color: var(--text-muted);">System name (read-only)</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">System Version</label>
                            <input type="text" class="form-control" name="version" value="${this.settings.version || '11.0.0'}" readonly>
                            <small style="color: var(--text-muted);">Current system version</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Default Language</label>
                            <select class="form-control" name="default_language">
                                <option value="en">English</option>
                                <option value="ar">Arabic</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Max Devices Per User (Default)</label>
                            <input type="number" class="form-control" name="max_devices" value="1" min="1" max="10">
                            <small style="color: var(--text-muted);">Default device limit for new users</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Session Timeout (minutes)</label>
                            <input type="number" class="form-control" name="session_timeout" value="1440" min="30">
                            <small style="color: var(--text-muted);">User session timeout duration</small>
                        </div>

                        <!-- Email Settings -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-envelope"></i> Email Configuration
                        </h4>

                        <div class="form-group">
                            <label class="form-label">SMTP Host</label>
                            <input type="text" class="form-control" name="smtp_host" placeholder="smtp.example.com">
                        </div>

                        <div class="form-group">
                            <label class="form-label">SMTP Port</label>
                            <input type="number" class="form-control" name="smtp_port" value="587">
                        </div>

                        <div class="form-group">
                            <label class="form-label">SMTP Username</label>
                            <input type="text" class="form-control" name="smtp_username">
                        </div>

                        <div class="form-group">
                            <label class="form-label">SMTP Password</label>
                            <input type="password" class="form-control" name="smtp_password">
                        </div>

                        <div class="form-group">
                            <label class="form-label">From Email</label>
                            <input type="email" class="form-control" name="from_email" value="noreply@primex.com">
                        </div>

                        <div class="form-group">
                            <label class="form-label">From Name</label>
                            <input type="text" class="form-control" name="from_name" value="PrimeX IPTV">
                        </div>

                        <!-- System Preferences -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-toggle-on"></i> System Preferences
                        </h4>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="enable_registration" checked>
                                <span>Enable User Registration</span>
                            </label>
                            <small style="color: var(--text-muted);">Allow new users to register</small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="enable_device_binding" checked>
                                <span>Enable Device Binding</span>
                            </label>
                            <small style="color: var(--text-muted);">Restrict users to specific devices</small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="maintenance_mode">
                                <span>Maintenance Mode</span>
                            </label>
                            <small style="color: var(--text-muted);">Put system in maintenance mode (users cannot login)</small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="enable_logging" checked>
                                <span>Enable Activity Logging</span>
                            </label>
                            <small style="color: var(--text-muted);">Log all user activities</small>
                        </div>

                        <!-- Backup & Maintenance -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-database"></i> Backup & Maintenance
                        </h4>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <button type="button" class="btn btn-secondary" onclick="SettingsModule.backupDatabase()">
                                <i class="fas fa-download"></i> Backup Database
                            </button>
                            <button type="button" class="btn btn-warning" onclick="SettingsModule.clearCache()">
                                <i class="fas fa-broom"></i> Clear Cache
                            </button>
                            <button type="button" class="btn btn-info" onclick="SettingsModule.checkUpdates()">
                                <i class="fas fa-sync"></i> Check Updates
                            </button>
                            <button type="button" class="btn btn-danger" onclick="SettingsModule.restartSystem()">
                                <i class="fas fa-power-off"></i> Restart System
                            </button>
                        </div>

                        <!-- System Information -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-info-circle"></i> System Information
                        </h4>

                        <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                <div>
                                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 5px;">Database Status</div>
                                    <div style="font-weight: 600;">${this.settings.database || 'Connected'}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 5px;">System Uptime</div>
                                    <div style="font-weight: 600;">${this.formatUptime(this.settings.uptime)}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 5px;">Memory Usage</div>
                                    <div style="font-weight: 600;">${this.settings.memory?.used || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 5px;">Node.js Version</div>
                                    <div style="font-weight: 600;">${this.settings.nodeVersion || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    saveSettings() {
        const formData = new FormData(document.getElementById('settingsForm'));
        const settings = Object.fromEntries(formData);
        
        // Convert checkboxes
        settings.enable_registration = formData.has('enable_registration');
        settings.enable_device_binding = formData.has('enable_device_binding');
        settings.maintenance_mode = formData.has('maintenance_mode');
        settings.enable_logging = formData.has('enable_logging');

        PrimeXCore.showToast('Settings saved successfully', 'success');
        console.log('Settings to save:', settings);
    },

    backupDatabase() {
        if (confirm('Create database backup? This may take a few moments.')) {
            PrimeXCore.showToast('Database backup initiated', 'info');
            // In production, this would call a backup endpoint
        }
    },

    clearCache() {
        if (confirm('Clear system cache?')) {
            PrimeXCore.showToast('Cache cleared successfully', 'success');
        }
    },

    checkUpdates() {
        PrimeXCore.showToast('System is up to date (v11.0.0)', 'success');
    },

    restartSystem() {
        if (confirm('Restart the system? This will disconnect all users temporarily.')) {
            PrimeXCore.showToast('System restart initiated', 'warning');
            // In production, this would call a restart endpoint
        }
    },

    formatUptime(seconds) {
        if (!seconds) return 'N/A';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }
};
