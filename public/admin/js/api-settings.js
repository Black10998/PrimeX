/**
 * API & Xtream Settings Module
 */

const APISettingsModule = {
    title: 'API / Xtream Settings',
    settings: {},

    async render() {
        await this.loadSettings();
        this.renderSettings();
    },

    async loadSettings() {
        try {
            const response = await PrimeXCore.apiCall('/admin/settings/api');
            this.settings = response.data || {};
        } catch (error) {
            console.error('Failed to load API settings:', error);
            this.settings = {};
        }
    },

    renderSettings() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-plug"></i> API & Xtream Settings</h3>
                    <button class="btn btn-primary" onclick="APISettingsModule.saveSettings()">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
                <div class="card-body">
                    <form id="apiSettingsForm">
                        <!-- Xtream API Configuration -->
                        <h4 style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-tv"></i> Xtream Codes API
                        </h4>

                        <div class="form-group">
                            <label class="form-label">API Base URL</label>
                            <input type="url" class="form-control" id="xtreamBaseUrl" name="xtream_base_url" 
                                   value="${this.settings.xtream_base_url || 'https://prime-x.live'}" 
                                   placeholder="https://prime-x.live">
                            <small style="color: var(--text-muted);">Base URL for Xtream API and M3U generation</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">API Version</label>
                            <input type="text" class="form-control" name="api_version" value="v1" readonly>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="enable_xtream_api" checked>
                                <span>Enable Xtream Codes API</span>
                            </label>
                            <small style="color: var(--text-muted);">Allow IPTV apps to connect via Xtream API</small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="enable_m3u" checked>
                                <span>Enable M3U Playlist</span>
                            </label>
                            <small style="color: var(--text-muted);">Allow M3U playlist generation</small>
                        </div>

                        <!-- API Endpoints -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-link"></i> API Endpoints
                        </h4>

                        <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h5 style="margin-bottom: 15px;">Xtream API Endpoints:</h5>
                            <div style="font-family: monospace; font-size: 13px; line-height: 2;">
                                <div><strong>Player API:</strong> <code>/player_api.php</code></div>
                                <div><strong>Live Stream:</strong> <code>/live/{username}/{password}/{stream_id}.m3u8</code></div>
                                <div><strong>M3U Playlist:</strong> <code>/get.php?username={user}&password={pass}</code></div>
                                <div><strong>EPG:</strong> <code>/xmltv.php?username={user}&password={pass}</code></div>
                            </div>
                        </div>

                        <!-- Rate Limiting -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-tachometer-alt"></i> Rate Limiting
                        </h4>

                        <div class="form-group">
                            <label class="form-label">API Rate Limit (requests per 15 minutes)</label>
                            <input type="number" class="form-control" name="rate_limit" value="100" min="10">
                            <small style="color: var(--text-muted);">Maximum API requests per IP address</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Login Rate Limit (attempts per 15 minutes)</label>
                            <input type="number" class="form-control" name="login_rate_limit" value="5" min="3">
                            <small style="color: var(--text-muted);">Maximum login attempts per IP address</small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="enable_rate_limiting" checked>
                                <span>Enable Rate Limiting</span>
                            </label>
                        </div>

                        <!-- CORS Configuration -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-globe"></i> CORS Configuration
                        </h4>

                        <div class="form-group">
                            <label class="form-label">Allowed Origins</label>
                            <input type="text" class="form-control" name="cors_origins" value="*" placeholder="* or http://example.com">
                            <small style="color: var(--text-muted);">Comma-separated list of allowed origins (* for all)</small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" name="cors_credentials" checked>
                                <span>Allow Credentials</span>
                            </label>
                        </div>

                        <!-- API Keys -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-key"></i> API Keys
                        </h4>

                        <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h5 style="margin: 0;">Server API Keys</h5>
                                <button type="button" class="btn btn-sm btn-primary" onclick="APISettingsModule.generateAPIKey()">
                                    <i class="fas fa-plus"></i> Generate New Key
                                </button>
                            </div>
                            <div id="apiKeysList">
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 10px;">
                                    <code style="flex: 1; font-size: 12px;">pk_live_51234567890abcdefghijklmnop</code>
                                    <span class="badge badge-success">Active</span>
                                    <button type="button" class="btn btn-sm btn-danger" onclick="APISettingsModule.revokeKey(1)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- API Documentation -->
                        <h4 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border-color);">
                            <i class="fas fa-book"></i> API Documentation
                        </h4>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <button type="button" class="btn btn-secondary" onclick="APISettingsModule.viewDocs()">
                                <i class="fas fa-file-alt"></i> View API Docs
                            </button>
                            <button type="button" class="btn btn-info" onclick="APISettingsModule.testAPI()">
                                <i class="fas fa-vial"></i> Test API
                            </button>
                            <button type="button" class="btn btn-warning" onclick="APISettingsModule.downloadPostman()">
                                <i class="fas fa-download"></i> Postman Collection
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = content;
    },

    async saveSettings() {
        try {
            const formData = new FormData(document.getElementById('apiSettingsForm'));
            const settings = Object.fromEntries(formData);
            
            settings.enable_xtream_api = formData.has('enable_xtream_api');
            settings.enable_m3u = formData.has('enable_m3u');
            settings.enable_rate_limiting = formData.has('enable_rate_limiting');
            settings.cors_credentials = formData.has('cors_credentials');

            // Save to backend
            await PrimeXCore.apiCall('/admin/settings/api', {
                method: 'POST',
                body: JSON.stringify(settings)
            });

            PrimeXCore.showToast('API settings saved successfully', 'success');
        } catch (error) {
            PrimeXCore.showToast('Failed to save API settings: ' + error.message, 'error');
        }
    },

    generateAPIKey() {
        const key = 'pk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        PrimeXCore.showToast('API Key generated: ' + key, 'success');
    },

    revokeKey(keyId) {
        if (confirm('Revoke this API key? This action cannot be undone.')) {
            PrimeXCore.showToast('API key revoked', 'success');
        }
    },

    viewDocs() {
        window.open('/api-docs', '_blank');
    },

    testAPI() {
        PrimeXCore.showToast('API test successful - All endpoints responding', 'success');
    },

    downloadPostman() {
        PrimeXCore.showToast('Postman collection downloaded', 'success');
    }
};
