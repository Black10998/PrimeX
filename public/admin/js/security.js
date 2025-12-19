/**
 * Security Module - 2FA, Sessions, Password
 */

const SecurityModule = {
    title: 'Security',
    twoFAStatus: null,
    sessions: [],

    async render() {
        await this.loadSecurityData();
    },

    async loadSecurityData() {
        PrimeXCore.showLoading(true);
        try {
            const [twoFAResponse, sessionsResponse] = await Promise.all([
                PrimeXCore.apiCall('/admin/2fa/status'),
                PrimeXCore.apiCall('/admin/sessions/my')
            ]);
            this.twoFAStatus = twoFAResponse.data || {};
            this.sessions = sessionsResponse.data || [];
            this.renderSecurity();
        } catch (error) {
            PrimeXCore.showToast('Failed to load security data', 'error');
            this.renderSecurity();
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    renderSecurity() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-shield-alt"></i> Security Settings</h3>
                </div>
                <div class="card-body">
                    <!-- Two-Factor Authentication -->
                    <h4 style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                        <i class="fas fa-mobile-alt"></i> Two-Factor Authentication (2FA)
                    </h4>

                    <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <h5 style="margin: 0 0 5px 0;">2FA Status</h5>
                                <p style="margin: 0; color: var(--text-muted); font-size: 14px;">
                                    ${this.twoFAStatus.enabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
                                </p>
                            </div>
                            <span class="badge ${this.twoFAStatus.enabled ? 'badge-success' : 'badge-danger'}" style="font-size: 14px; padding: 8px 16px;">
                                ${this.twoFAStatus.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        ${this.twoFAStatus.enabled ? `
                            <button class="btn btn-danger" onclick="SecurityModule.disable2FA()">
                                <i class="fas fa-times"></i> Disable 2FA
                            </button>
                            <button class="btn btn-warning" onclick="SecurityModule.regenerateBackupCodes()">
                                <i class="fas fa-sync"></i> Regenerate Backup Codes
                            </button>
                        ` : `
                            <button class="btn btn-success" onclick="SecurityModule.enable2FA()">
                                <i class="fas fa-check"></i> Enable 2FA
                            </button>
                        `}
                    </div>

                    <!-- Change Password -->
                    <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                        <i class="fas fa-key"></i> Change Admin Password
                    </h4>

                    <form id="changePasswordForm" onsubmit="SecurityModule.changePassword(event)" style="max-width: 500px; margin-bottom: 30px;">
                        <div class="form-group">
                            <label class="form-label">Current Password</label>
                            <input type="password" class="form-control" name="current_password" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Password</label>
                            <input type="password" class="form-control" name="new_password" required minlength="8">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm New Password</label>
                            <input type="password" class="form-control" name="confirm_password" required minlength="8">
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Change Password
                        </button>
                    </form>

                    <!-- Active Sessions -->
                    <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                        <i class="fas fa-users-cog"></i> Active Sessions
                    </h4>

                    <div style="margin-bottom: 15px;">
                        <button class="btn btn-danger" onclick="SecurityModule.logoutAllOthers()">
                            <i class="fas fa-sign-out-alt"></i> Logout All Other Sessions
                        </button>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Device</th>
                                    <th>IP Address</th>
                                    <th>Location</th>
                                    <th>Last Activity</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.sessions.length > 0 ? this.sessions.map(session => `
                                    <tr>
                                        <td>
                                            <i class="fas fa-${this.getDeviceIcon(session.user_agent)}"></i>
                                            ${this.getDeviceName(session.user_agent)}
                                        </td>
                                        <td>${PrimeXCore.escapeHtml(session.ip_address || 'N/A')}</td>
                                        <td>${PrimeXCore.escapeHtml(session.location || 'Unknown')}</td>
                                        <td>${PrimeXCore.formatDate(session.last_activity)}</td>
                                        <td>
                                            ${session.is_current ? '<span class="badge badge-success">Current</span>' : '<span class="badge badge-info">Active</span>'}
                                        </td>
                                        <td>
                                            ${!session.is_current ? `
                                                <button class="btn btn-sm btn-danger" onclick="SecurityModule.deleteSession(${session.id})">
                                                    <i class="fas fa-sign-out-alt"></i> Logout
                                                </button>
                                            ` : '<span style="color: var(--text-muted);">Current session</span>'}
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" style="text-align: center; padding: 20px;">No active sessions</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <!-- Security Logs -->
                    <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                        <i class="fas fa-history"></i> Recent Security Events
                    </h4>

                    <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px;">
                        <p style="color: var(--text-muted);">Security event logging is active. Check Activity Logs for detailed history.</p>
                        <button class="btn btn-secondary" onclick="window.location.hash='logs'">
                            <i class="fas fa-external-link-alt"></i> View Activity Logs
                        </button>
                    </div>

                    <!-- IP Whitelist/Blacklist -->
                    <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                        <i class="fas fa-ban"></i> IP Access Control
                    </h4>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                        <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px;">
                            <h5 style="margin-bottom: 15px;">IP Whitelist</h5>
                            <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 15px;">Only allow access from these IPs</p>
                            <button class="btn btn-sm btn-primary" onclick="SecurityModule.manageWhitelist()">
                                <i class="fas fa-plus"></i> Manage Whitelist
                            </button>
                        </div>
                        <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px;">
                            <h5 style="margin-bottom: 15px;">IP Blacklist</h5>
                            <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 15px;">Block access from these IPs</p>
                            <button class="btn btn-sm btn-danger" onclick="SecurityModule.manageBlacklist()">
                                <i class="fas fa-ban"></i> Manage Blacklist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    async enable2FA() {
        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/2fa/generate', 'POST');
            const qrCode = response.data.qr_code;
            const secret = response.data.secret;

            const modalContent = `
                <div style="text-align: center;">
                    <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                    <img src="${qrCode}" style="max-width: 250px; margin: 20px auto;">
                    <p style="margin-top: 20px;"><strong>Secret Key:</strong></p>
                    <code style="font-size: 14px; padding: 10px; background: var(--bg-tertiary); display: block; margin: 10px 0;">${secret}</code>
                    <form id="verify2FAForm" onsubmit="SecurityModule.verify2FA(event)" style="margin-top: 20px;">
                        <div class="form-group">
                            <label class="form-label">Enter 6-digit code from your app</label>
                            <input type="text" class="form-control" name="token" required pattern="[0-9]{6}" maxlength="6" style="text-align: center; font-size: 24px; letter-spacing: 5px;">
                        </div>
                    </form>
                </div>
            `;

            PrimeXCore.showModal('Enable Two-Factor Authentication', modalContent, [
                { text: 'Cancel', class: 'btn-secondary', onclick: 'PrimeXCore.closeModal()' },
                { text: 'Verify & Enable', class: 'btn-success', onclick: 'document.getElementById("verify2FAForm").requestSubmit()' }
            ]);
        } catch (error) {
            PrimeXCore.showToast('Failed to generate 2FA setup', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async verify2FA(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const token = formData.get('token');

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/2fa/enable', 'POST', { token });
            PrimeXCore.showToast('2FA enabled successfully', 'success');
            PrimeXCore.closeModal();
            await this.loadSecurityData();
        } catch (error) {
            PrimeXCore.showToast('Invalid code. Please try again.', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async disable2FA() {
        const token = prompt('Enter your 2FA code to disable:');
        if (!token) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/2fa/disable', 'POST', { token });
            PrimeXCore.showToast('2FA disabled successfully', 'success');
            await this.loadSecurityData();
        } catch (error) {
            PrimeXCore.showToast('Failed to disable 2FA', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async regenerateBackupCodes() {
        if (!confirm('Regenerate backup codes? Old codes will be invalidated.')) return;

        PrimeXCore.showLoading(true);
        try {
            const response = await PrimeXCore.apiCall('/admin/2fa/regenerate-backup-codes', 'POST');
            const codes = response.data.backup_codes || [];
            
            const modalContent = `
                <div>
                    <p><strong>Save these backup codes in a safe place:</strong></p>
                    <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${codes.map(code => `<div style="font-family: monospace; padding: 5px;">${code}</div>`).join('')}
                    </div>
                    <p style="color: var(--warning);">⚠️ These codes will only be shown once!</p>
                </div>
            `;

            PrimeXCore.showModal('Backup Codes', modalContent, [
                { text: 'Close', class: 'btn-primary', onclick: 'PrimeXCore.closeModal()' }
            ]);
        } catch (error) {
            PrimeXCore.showToast('Failed to regenerate backup codes', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async changePassword(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        if (data.new_password !== data.confirm_password) {
            PrimeXCore.showToast('Passwords do not match', 'error');
            return;
        }

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/security/change-password', 'POST', {
                current_password: data.current_password,
                new_password: data.new_password
            });
            PrimeXCore.showToast('Password changed successfully', 'success');
            event.target.reset();
        } catch (error) {
            PrimeXCore.showToast('Failed to change password', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async deleteSession(sessionId) {
        if (!confirm('Logout this session?')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall(`/admin/sessions/${sessionId}`, 'DELETE');
            PrimeXCore.showToast('Session terminated', 'success');
            await this.loadSecurityData();
        } catch (error) {
            PrimeXCore.showToast('Failed to terminate session', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    async logoutAllOthers() {
        if (!confirm('Logout all other sessions?')) return;

        PrimeXCore.showLoading(true);
        try {
            await PrimeXCore.apiCall('/admin/sessions/logout-all-others', 'POST');
            PrimeXCore.showToast('All other sessions logged out', 'success');
            await this.loadSecurityData();
        } catch (error) {
            PrimeXCore.showToast('Failed to logout sessions', 'error');
        } finally {
            PrimeXCore.showLoading(false);
        }
    },

    manageWhitelist() {
        PrimeXCore.showToast('IP Whitelist management - Coming soon', 'info');
    },

    manageBlacklist() {
        PrimeXCore.showToast('IP Blacklist management - Coming soon', 'info');
    },

    getDeviceIcon(userAgent) {
        if (!userAgent) return 'desktop';
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android')) return 'mobile-alt';
        if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet-alt';
        return 'desktop';
    },

    getDeviceName(userAgent) {
        if (!userAgent) return 'Unknown Device';
        if (userAgent.includes('Chrome')) return 'Chrome Browser';
        if (userAgent.includes('Firefox')) return 'Firefox Browser';
        if (userAgent.includes('Safari')) return 'Safari Browser';
        return 'Web Browser';
    }
};
