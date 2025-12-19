/**
 * PrimeX IPTV - Ultra-Modern Admin Dashboard
 * Phase 1: Dashboard + About Developer
 * 
 * Developer: PAX
 * Website: https://paxdes.com/
 */

// ============================================
// CONFIGURATION
// ============================================

const API_URL = '/api/v1';
let authToken = localStorage.getItem('adminToken');
let currentPage = 'dashboard';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// API FUNCTIONS
// ============================================

async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });
        
        if (response.status === 401) {
            logout();
            throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('API Error:', {
                endpoint,
                status: response.status,
                statusText: response.statusText,
                data
            });
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Request failed:', {
            endpoint,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// ============================================
// AUTHENTICATION
// ============================================

async function login(username, password, totpToken = null, recoveryCode = null) {
    try {
        const body = { username, password };
        if (totpToken) body.totp_token = totpToken;
        if (recoveryCode) body.recovery_code = recoveryCode;
        
        const response = await fetch(`${API_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUsername', username);
            showDashboard();
            loadDashboardData();
            showToast('Login successful!', 'success');
        } else if (data.requires_2fa) {
            // Show 2FA prompt
            show2FAPrompt(username, password);
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        document.getElementById('loginError').textContent = error.message;
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function show2FAPrompt(username, password) {
    const loginCard = document.querySelector('.login-card');
    loginCard.innerHTML = `
        <div class="login-header">
            <div class="login-logo">
                <i class="fas fa-shield-alt"></i>
                <h1>Two-Factor Authentication</h1>
            </div>
            <p class="login-subtitle">Enter your 6-digit code</p>
        </div>
        <form onsubmit="verify2FALogin(event, '${username}', '${password}')">
            <div class="form-group">
                <label>Authenticator Code</label>
                <input type="text" name="totp_token" pattern="[0-9]{6}" maxlength="6" required autofocus style="text-align: center; font-size: 24px; letter-spacing: 8px;">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-sign-in-alt"></i> Verify & Login
            </button>
            <div style="text-align: center; margin-top: 16px;">
                <a href="#" onclick="show2FARecoveryPrompt('${username}', '${password}'); return false;" style="color: var(--primary); font-size: 14px;">
                    Use recovery code instead
                </a>
            </div>
            <div style="text-align: center; margin-top: 12px;">
                <a href="#" onclick="window.location.reload(); return false;" style="color: var(--text-muted); font-size: 14px;">
                    ← Back to login
                </a>
            </div>
        </form>
    `;
}

function show2FARecoveryPrompt(username, password) {
    const loginCard = document.querySelector('.login-card');
    loginCard.innerHTML = `
        <div class="login-header">
            <div class="login-logo">
                <i class="fas fa-key"></i>
                <h1>Recovery Code</h1>
            </div>
            <p class="login-subtitle">Enter one of your backup codes</p>
        </div>
        <form onsubmit="verify2FARecovery(event, '${username}', '${password}')">
            <div class="form-group">
                <label>Recovery Code</label>
                <input type="text" name="recovery_code" pattern="[A-Z0-9]{4}-[A-Z0-9]{4}" placeholder="XXXX-XXXX" required autofocus style="text-align: center; font-size: 20px; letter-spacing: 4px; text-transform: uppercase;">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-sign-in-alt"></i> Verify & Login
            </button>
            <div style="text-align: center; margin-top: 16px;">
                <a href="#" onclick="show2FAPrompt('${username}', '${password}'); return false;" style="color: var(--primary); font-size: 14px;">
                    Use authenticator code instead
                </a>
            </div>
            <div style="text-align: center; margin-top: 12px;">
                <a href="#" onclick="window.location.reload(); return false;" style="color: var(--text-muted); font-size: 14px;">
                    ← Back to login
                </a>
            </div>
        </form>
    `;
}

async function verify2FALogin(event, username, password) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const totpToken = formData.get('totp_token');
    await login(username, password, totpToken, null);
}

async function verify2FARecovery(event, username, password) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const recoveryCode = formData.get('recovery_code').toUpperCase();
    await login(username, password, null, recoveryCode);
}

function logout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    showToast('Logged out successfully', 'info');
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    
    const username = localStorage.getItem('adminUsername') || 'Admin';
    document.getElementById('sidebarUsername').textContent = username;
}

// ============================================
// DASHBOARD DATA
// ============================================

async function loadDashboardData() {
    try {
        // Load stats
        const stats = await apiRequest('/admin/dashboard/stats');
        updateDashboardStats(stats.data);
        
        // Load health
        const health = await apiRequest('/admin/dashboard/health');
        updateSystemHealth(health.data);
        
        // Load quick stats
        await loadQuickStats();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function updateDashboardStats(stats) {
    // API returns nested structure: stats.users.total_users, stats.channels.total_channels, etc.
    document.getElementById('stat-users').textContent = formatNumber(stats.users?.total_users || 0);
    document.getElementById('stat-active').textContent = formatNumber(stats.users?.active_subscriptions || 0);
    document.getElementById('stat-channels').textContent = formatNumber(stats.channels?.total_channels || 0);
    document.getElementById('stat-servers').textContent = formatNumber(stats.servers?.active_servers || 0);
    
    // Add interactive tooltips to stat cards
    addStatTooltips(stats);
}

function addStatTooltips(stats) {
    const lastUpdated = stats.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Just now';
    
    // Total Users tooltip - click to navigate to Users Management
    addTooltip('stat-users', `
        <div class="tooltip-header">Total Users Breakdown</div>
        <div class="tooltip-row">
            <span>Total Users:</span>
            <span class="tooltip-value">${formatNumber(stats.users?.total_users || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Active:</span>
            <span class="tooltip-value success">${formatNumber(stats.users?.active_users || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Inactive:</span>
            <span class="tooltip-value muted">${formatNumber(stats.users?.inactive_users || 0)}</span>
        </div>
        <div class="tooltip-divider"></div>
        <div class="tooltip-footer">
            <small>Calculation: COUNT(all users)</small>
            <small>Updated: ${lastUpdated}</small>
            <small class="tooltip-hint">💡 Click to view Users Management</small>
        </div>
    `, 'users');
    
    // Active Subscriptions tooltip - click to navigate to Users
    addTooltip('stat-active', `
        <div class="tooltip-header">Active Subscriptions Breakdown</div>
        <div class="tooltip-row">
            <span>Active Subscriptions:</span>
            <span class="tooltip-value success">${formatNumber(stats.users?.active_subscriptions || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Unlimited (NULL):</span>
            <span class="tooltip-value info">${formatNumber(stats.users?.unlimited_subscriptions || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Expiring Soon (7 days):</span>
            <span class="tooltip-value warning">${formatNumber(stats.users?.expiring_soon || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Expired:</span>
            <span class="tooltip-value danger">${formatNumber(stats.users?.expired_subscriptions || 0)}</span>
        </div>
        <div class="tooltip-divider"></div>
        <div class="tooltip-footer">
            <small>Calculation: Active users with valid subscription</small>
            <small>Updated: ${lastUpdated}</small>
            <small class="tooltip-hint">💡 Click to view Subscriptions</small>
        </div>
    `, 'users');
    
    // Total Channels tooltip - click to navigate to Channels
    addTooltip('stat-channels', `
        <div class="tooltip-header">Channels Breakdown</div>
        <div class="tooltip-row">
            <span>Total Channels:</span>
            <span class="tooltip-value">${formatNumber(stats.channels?.total_channels || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Active:</span>
            <span class="tooltip-value success">${formatNumber(stats.channels?.active_channels || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Inactive:</span>
            <span class="tooltip-value muted">${formatNumber(stats.channels?.inactive_channels || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Categories:</span>
            <span class="tooltip-value info">${formatNumber(stats.categories?.total_categories || 0)}</span>
        </div>
        <div class="tooltip-divider"></div>
        <div class="tooltip-footer">
            <small>Calculation: COUNT(all channels)</small>
            <small>Updated: ${lastUpdated}</small>
            <small class="tooltip-hint">💡 Click to view Channels</small>
        </div>
    `, 'channels');
    
    // Active Servers tooltip - click to navigate to Servers
    addTooltip('stat-servers', `
        <div class="tooltip-header">Servers Status</div>
        <div class="tooltip-row">
            <span>Total Servers:</span>
            <span class="tooltip-value">${formatNumber(stats.servers?.total_servers || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Active (Online):</span>
            <span class="tooltip-value success">${formatNumber(stats.servers?.active_servers || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Inactive (Offline):</span>
            <span class="tooltip-value danger">${formatNumber(stats.servers?.inactive_servers || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Maintenance:</span>
            <span class="tooltip-value warning">${formatNumber(stats.servers?.maintenance_servers || 0)}</span>
        </div>
        <div class="tooltip-row">
            <span>Total Connections:</span>
            <span class="tooltip-value info">${formatNumber(stats.servers?.total_connections || 0)}</span>
        </div>
        <div class="tooltip-divider"></div>
        <div class="tooltip-footer">
            <small>Calculation: COUNT(active servers)</small>
            <small>Updated: ${lastUpdated}</small>
            <small class="tooltip-hint">💡 Click to view Servers</small>
        </div>
    `, 'servers');
}

function addTooltip(elementId, content, navigationTarget) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const card = element.closest('.stat-card');
    if (!card) return;
    
    // Remove existing tooltip if any
    const existingTooltip = card.querySelector('.stat-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'stat-tooltip';
    tooltip.innerHTML = content;
    tooltip.style.display = 'none';
    
    // Add tooltip to card
    card.style.position = 'relative';
    card.appendChild(tooltip);
    
    // Make card clickable with cursor pointer
    card.style.cursor = 'pointer';
    
    // Add click navigation
    card.addEventListener('click', (e) => {
        // Don't navigate if clicking inside tooltip
        if (e.target.closest('.stat-tooltip')) {
            return;
        }
        if (navigationTarget) {
            navigateTo(navigationTarget);
        }
    });
    
    let refreshInterval = null;
    
    // Show/hide tooltip on hover
    card.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
        
        // Start auto-refresh when tooltip is shown
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        refreshInterval = setInterval(async () => {
            try {
                const stats = await apiRequest('/admin/dashboard/stats');
                if (stats && stats.data) {
                    // Update tooltip content without recreating it
                    updateTooltipContent(elementId, stats.data);
                }
            } catch (error) {
                console.error('Failed to refresh tooltip data:', error);
            }
        }, 5000); // Refresh every 5 seconds
    });
    
    card.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
        
        // Stop auto-refresh when tooltip is hidden
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    });
}

function updateTooltipContent(elementId, stats) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const card = element.closest('.stat-card');
    if (!card) return;
    
    const tooltip = card.querySelector('.stat-tooltip');
    if (!tooltip) return;
    
    const lastUpdated = stats.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Just now';
    
    // Update content based on card type
    if (elementId === 'stat-users') {
        tooltip.innerHTML = `
            <div class="tooltip-header">Total Users Breakdown</div>
            <div class="tooltip-row">
                <span>Total Users:</span>
                <span class="tooltip-value">${formatNumber(stats.users?.total_users || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Active:</span>
                <span class="tooltip-value success">${formatNumber(stats.users?.active_users || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Inactive:</span>
                <span class="tooltip-value muted">${formatNumber(stats.users?.inactive_users || 0)}</span>
            </div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-footer">
                <small>Calculation: COUNT(all users)</small>
                <small>Updated: ${lastUpdated}</small>
            </div>
        `;
    } else if (elementId === 'stat-active') {
        tooltip.innerHTML = `
            <div class="tooltip-header">Active Subscriptions Breakdown</div>
            <div class="tooltip-row">
                <span>Active Subscriptions:</span>
                <span class="tooltip-value success">${formatNumber(stats.users?.active_subscriptions || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Unlimited (NULL):</span>
                <span class="tooltip-value info">${formatNumber(stats.users?.unlimited_subscriptions || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Expiring Soon (7 days):</span>
                <span class="tooltip-value warning">${formatNumber(stats.users?.expiring_soon || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Expired:</span>
                <span class="tooltip-value danger">${formatNumber(stats.users?.expired_subscriptions || 0)}</span>
            </div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-footer">
                <small>Calculation: Active users with valid subscription</small>
                <small>Updated: ${lastUpdated}</small>
            </div>
        `;
    } else if (elementId === 'stat-channels') {
        tooltip.innerHTML = `
            <div class="tooltip-header">Channels Breakdown</div>
            <div class="tooltip-row">
                <span>Total Channels:</span>
                <span class="tooltip-value">${formatNumber(stats.channels?.total_channels || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Active:</span>
                <span class="tooltip-value success">${formatNumber(stats.channels?.active_channels || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Inactive:</span>
                <span class="tooltip-value muted">${formatNumber(stats.channels?.inactive_channels || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Categories:</span>
                <span class="tooltip-value info">${formatNumber(stats.categories?.total_categories || 0)}</span>
            </div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-footer">
                <small>Calculation: COUNT(all channels)</small>
                <small>Updated: ${lastUpdated}</small>
            </div>
        `;
    } else if (elementId === 'stat-servers') {
        tooltip.innerHTML = `
            <div class="tooltip-header">Servers Status</div>
            <div class="tooltip-row">
                <span>Total Servers:</span>
                <span class="tooltip-value">${formatNumber(stats.servers?.total_servers || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Active (Online):</span>
                <span class="tooltip-value success">${formatNumber(stats.servers?.active_servers || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Inactive (Offline):</span>
                <span class="tooltip-value danger">${formatNumber(stats.servers?.inactive_servers || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Maintenance:</span>
                <span class="tooltip-value warning">${formatNumber(stats.servers?.maintenance_servers || 0)}</span>
            </div>
            <div class="tooltip-row">
                <span>Total Connections:</span>
                <span class="tooltip-value info">${formatNumber(stats.servers?.total_connections || 0)}</span>
            </div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-footer">
                <small>Calculation: COUNT(active servers)</small>
                <small>Updated: ${lastUpdated}</small>
            </div>
        `;
    }
}

function updateSystemHealth(health) {
    // Database status
    const dbStatus = document.getElementById('health-database');
    if (health.database === 'connected') {
        dbStatus.textContent = 'Connected';
        dbStatus.className = 'badge badge-success';
    } else {
        dbStatus.textContent = 'Disconnected';
        dbStatus.className = 'badge badge-danger';
    }
    
    // Memory usage
    if (health.memory) {
        const memoryUsed = health.memory.heapUsed || 0;
        const memoryTotal = health.memory.heapTotal || 0;
        const memoryPercent = Math.round((memoryUsed / memoryTotal) * 100);
        document.getElementById('health-memory').textContent = `${formatBytes(memoryUsed)} (${memoryPercent}%)`;
    }
    
    // Uptime
    if (health.uptime) {
        document.getElementById('health-uptime').textContent = formatUptime(health.uptime);
    }
}

async function loadQuickStats() {
    try {
        // Load codes stats
        const codesStats = await apiRequest('/admin/codes/stats');
        document.getElementById('quick-codes').textContent = formatNumber(codesStats.data?.available || 0);
        
        // Load expired subscriptions
        const expired = await apiRequest('/admin/subscriptions/expired');
        document.getElementById('quick-expired').textContent = formatNumber(expired.data?.length || 0);
        
        // Load categories count
        const categories = await apiRequest('/admin/categories');
        document.getElementById('quick-categories').textContent = formatNumber(categories.data?.length || 0);
        
        // Load plans count
        const plans = await apiRequest('/admin/plans');
        document.getElementById('quick-plans').textContent = formatNumber(plans.data?.length || 0);
        
    } catch (error) {
        console.error('Failed to load quick stats:', error);
    }
}

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
    
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });
    
    // Mobile sidebar toggle
    document.getElementById('mobileSidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

function navigateToPage(page) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        users: 'Users Management',
        channels: 'Channels Management',
        categories: 'Categories',
        servers: 'Streaming Servers',
        codes: 'Subscription Codes',
        plans: 'Subscription Plans',
        apps: 'Player Apps',
        settings: 'System Settings',
        about: 'About Developer'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    
    // Load page content
    currentPage = page;
    loadPageContent(page);
}

function loadPageContent(page) {
    switch (page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'about':
            loadAboutPage();
            break;
        case 'system-guide':
            loadSystemGuidePage();
            break;
        case 'users':
            loadUsersPage();
            break;
        case 'channels':
            loadChannelsPage();
            break;
        case 'categories':
            loadCategoriesPage();
            break;
        case 'servers':
            loadServersPage();
            break;
        case 'codes':
            loadCodesPage();
            break;
        case 'plans':
            loadPlansPage();
            break;
        case 'apps':
            loadAppsPage();
            break;
        case 'settings':
            loadSettingsPage();
            break;
        case 'online-users':
            loadOnlineUsersPage();
            break;
    }
}

// ============================================
// ABOUT DEVELOPER PAGE
// ============================================

function loadAboutPage() {
    const aboutPage = document.getElementById('page-about');
    
    // Default language
    let currentLang = localStorage.getItem('aboutPageLang') || 'ar';
    
    function renderAboutContent(lang) {
        localStorage.setItem('aboutPageLang', lang);
        currentLang = lang;
        
        if (lang === 'ar') {
            aboutPage.innerHTML = getArabicAboutContent();
        } else {
            aboutPage.innerHTML = getEnglishAboutContent();
        }
        
        // Add event listeners for language switcher
        const langButtons = aboutPage.querySelectorAll('.lang-btn');
        langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const newLang = btn.dataset.lang;
                renderAboutContent(newLang);
            });
        });
    }
    
    renderAboutContent(currentLang);
}

function getArabicAboutContent() {
    return `
        <div class="card" style="max-width: 900px; margin: 0 auto;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3><i class="fas fa-info-circle"></i> حول المطور</h3>
                <div class="lang-switcher" style="display: flex; gap: 8px;">
                    <button class="lang-btn btn btn-sm" data-lang="ar" style="background: var(--primary); color: white; border: none;">العربية</button>
                    <button class="lang-btn btn btn-sm btn-secondary" data-lang="en">English</button>
                </div>
            </div>
            <div class="card-body">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 120px; height: 120px; margin: 0 auto 24px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 48px; color: white;">
                        <i class="fas fa-code"></i>
                    </div>
                    
                    <h2 style="font-size: 32px; margin-bottom: 8px; color: var(--text-primary);">PAX</h2>
                    <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 24px;">مطور النظام والمرجع الرئيسي</p>
                    
                    <div style="display: inline-block; padding: 16px 32px; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--primary); border-radius: var(--radius-lg); margin-bottom: 32px;">
                        <a href="https://paxdes.com/" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: none; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-external-link-alt"></i>
                            paxdes.com
                        </a>
                    </div>
                    
                    <div style="max-width: 600px; margin: 0 auto; text-align: left;">
                        <div style="background: var(--bg-secondary); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 20px;">
                            <h4 style="color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-user-tie"></i>
                                الملف المهني
                            </h4>
                            <p style="color: var(--text-secondary); line-height: 1.8; text-align: right; direction: rtl;">
                                PAX هو المطور الرئيسي ومهندس نظام PrimeX IPTV. مع خبرة واسعة في تطوير برمجيات المؤسسات، يتخصص PAX في بناء منصات البث القابلة للتوسع وعالية الأداء وأنظمة توصيل المحتوى.
                            </p>
                        </div>
                        
                        <div style="background: var(--bg-secondary); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 20px;">
                            <h4 style="color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-link"></i>
                                المرجع الرسمي
                            </h4>
                            <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 12px; text-align: right; direction: rtl;">
                                للاستفسارات التقنية أو التطوير المخصص أو الخدمات المهنية المتعلقة بنظام PrimeX IPTV، يرجى زيارة الموقع الرسمي للمطور:
                            </p>
                            <a href="https://paxdes.com/" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width: 100%;">
                                <i class="fas fa-globe"></i>
                                زيارة الموقع الرسمي
                            </a>
                        </div>
                        
                        <div style="background: var(--bg-secondary); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                            <h4 style="color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-envelope"></i>
                                التواصل والدعم
                            </h4>
                            <div style="color: var(--text-secondary); line-height: 1.8; text-align: right; direction: rtl;">
                                <p style="margin-bottom: 8px;">
                                    <strong>البريد الإلكتروني:</strong> info@paxdes.com
                                </p>
                                <p style="margin-bottom: 8px;">
                                    <strong>الموقع الإلكتروني:</strong> <a href="https://paxdes.com/" target="_blank" rel="noopener noreferrer" style="color: var(--primary);">https://paxdes.com/</a>
                                </p>
                                <p style="margin-bottom: 0;">
                                    <strong>إصدار النظام:</strong> PrimeX IPTV v11.0
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card" style="max-width: 900px; margin: 24px auto 0;">
            <div class="card-header">
                <h3><i class="fas fa-shield-alt"></i> معلومات النظام</h3>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--primary); margin-bottom: 8px;">
                            <i class="fas fa-tv"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">المنتج</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">PrimeX IPTV</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--success); margin-bottom: 8px;">
                            <i class="fas fa-code-branch"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">الإصدار</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">11.0.0</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--info); margin-bottom: 8px;">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">تاريخ الإصدار</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">2024</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--warning); margin-bottom: 8px;">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">الترخيص</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">خاص</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getEnglishAboutContent() {
    return `
        <div class="card" style="max-width: 900px; margin: 0 auto;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3><i class="fas fa-info-circle"></i> About Developer</h3>
                <div class="lang-switcher" style="display: flex; gap: 8px;">
                    <button class="lang-btn btn btn-sm btn-secondary" data-lang="ar">العربية</button>
                    <button class="lang-btn btn btn-sm" data-lang="en" style="background: var(--primary); color: white; border: none;">English</button>
                </div>
            </div>
            <div class="card-body">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 120px; height: 120px; margin: 0 auto 24px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 48px; color: white;">
                        <i class="fas fa-code"></i>
                    </div>
                    
                    <h2 style="font-size: 32px; margin-bottom: 8px; color: var(--text-primary);">PAX</h2>
                    <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 24px;">System Developer & Main Reference</p>
                    
                    <div style="display: inline-block; padding: 16px 32px; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--primary); border-radius: var(--radius-lg); margin-bottom: 32px;">
                        <a href="https://paxdes.com/" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: none; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-external-link-alt"></i>
                            paxdes.com
                        </a>
                    </div>
                    
                    <div style="max-width: 600px; margin: 0 auto; text-align: left;">
                        <div style="background: var(--bg-secondary); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 20px;">
                            <h4 style="color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-user-tie"></i>
                                Professional Profile
                            </h4>
                            <p style="color: var(--text-secondary); line-height: 1.8;">
                                PAX is the lead developer and architect of the PrimeX IPTV System. With extensive experience in enterprise software development, PAX specializes in building scalable, high-performance streaming platforms and content delivery systems.
                            </p>
                        </div>
                        
                        <div style="background: var(--bg-secondary); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 20px;">
                            <h4 style="color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-link"></i>
                                Official Reference
                            </h4>
                            <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 12px;">
                                For technical inquiries, custom development, or professional services related to the PrimeX IPTV System, please visit the official developer website:
                            </p>
                            <a href="https://paxdes.com/" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width: 100%;">
                                <i class="fas fa-globe"></i>
                                Visit Official Website
                            </a>
                        </div>
                        
                        <div style="background: var(--bg-secondary); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                            <h4 style="color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-envelope"></i>
                                Contact & Support
                            </h4>
                            <div style="color: var(--text-secondary); line-height: 1.8;">
                                <p style="margin-bottom: 8px;">
                                    <strong>Email:</strong> info@paxdes.com
                                </p>
                                <p style="margin-bottom: 8px;">
                                    <strong>Website:</strong> <a href="https://paxdes.com/" target="_blank" rel="noopener noreferrer" style="color: var(--primary);">https://paxdes.com/</a>
                                </p>
                                <p style="margin-bottom: 0;">
                                    <strong>System Version:</strong> PrimeX IPTV v11.0
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card" style="max-width: 900px; margin: 24px auto 0;">
            <div class="card-header">
                <h3><i class="fas fa-shield-alt"></i> System Information</h3>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--primary); margin-bottom: 8px;">
                            <i class="fas fa-tv"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">Product</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">PrimeX IPTV</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--success); margin-bottom: 8px;">
                            <i class="fas fa-code-branch"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">Version</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">11.0.0</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--info); margin-bottom: 8px;">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">Release</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">2024</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 32px; color: var(--warning); margin-bottom: 8px;">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">License</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary);">Proprietary</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// SYSTEM GUIDE PAGE
// ============================================

function loadSystemGuidePage() {
    const guidePage = document.getElementById('page-system-guide');
    guidePage.innerHTML = getSystemGuideContent();
}

function getSystemGuideContent() {
    return `
        <div style="max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 40px; padding: 40px 20px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 12px;">
                <h1 style="font-size: 48px; margin-bottom: 16px; color: white;">
                    <i class="fas fa-book"></i> دليل نظام PrimeX IPTV
                </h1>
                <p style="font-size: 20px; color: rgba(255, 255, 255, 0.9);">
                    دليل شامل لفهم وتشغيل نظام البث الاحترافي
                </p>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <h2 style="font-size: 32px; margin-bottom: 24px; color: var(--primary); display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-tv"></i> ما هو نظام PrimeX IPTV؟
                </h2>
                <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.8;">
                    PrimeX IPTV هو نظام بث متقدم على مستوى المؤسسات مصمم لإدارة وتوزيع المحتوى المرئي عبر بروتوكول الإنترنت.
                    يوفر النظام منصة متكاملة لإدارة المستخدمين، القنوات، الاشتراكات، والخوادم بطريقة احترافية وآمنة.
                </p>
                <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.8;">
                    تم تطوير النظام باستخدام أحدث التقنيات والمعايير الأمنية لضمان أداء عالي واستقرار تام.
                </p>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <h2 style="font-size: 32px; margin-bottom: 24px; color: var(--primary); display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-star"></i> لماذا PrimeX نظام احترافي؟
                </h2>
                
                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    البنية المعمارية
                </h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--primary);">
                        <strong style="color: var(--primary);">Node.js Backend:</strong> خادم قوي وسريع يدعم آلاف الاتصالات المتزامنة
                    </li>
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--success);">
                        <strong style="color: var(--success);">MySQL Database:</strong> قاعدة بيانات موثوقة لتخزين جميع البيانات بأمان
                    </li>
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--info);">
                        <strong style="color: var(--info);">RESTful API:</strong> واجهة برمجية حديثة ومرنة
                    </li>
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--warning);">
                        <strong style="color: var(--warning);">Xtream API:</strong> توافق كامل مع تطبيقات IPTV الشهيرة
                    </li>
                </ul>

                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    الأمان والحماية
                </h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-shield-alt" style="color: var(--success); margin-left: 8px;"></i>
                        تشفير JWT للمصادقة والجلسات
                    </li>
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-lock" style="color: var(--success); margin-left: 8px;"></i>
                        تشفير كلمات المرور باستخدام bcrypt
                    </li>
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-user-shield" style="color: var(--success); margin-left: 8px;"></i>
                        مصادقة ثنائية (2FA) للمسؤولين
                    </li>
                    <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-ban" style="color: var(--success); margin-left: 8px;"></i>
                        حماية من الهجمات (Rate Limiting)
                    </li>
                </ul>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <h2 style="font-size: 32px; margin-bottom: 24px; color: var(--primary); display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-cogs"></i> كيف يعمل النظام؟
                </h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 24px;">
                    <div style="padding: 24px; background: var(--bg-tertiary); border-radius: 12px; border-top: 4px solid var(--primary);">
                        <div style="font-size: 32px; color: var(--primary); margin-bottom: 12px;">
                            <i class="fas fa-users"></i>
                        </div>
                        <h4 style="font-size: 20px; margin-bottom: 12px; color: var(--text-primary);">إدارة المستخدمين</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            إنشاء حسابات المستخدمين، تعيين الخطط، تتبع الاشتراكات، وإدارة الأجهزة المسموحة
                        </p>
                    </div>
                    
                    <div style="padding: 24px; background: var(--bg-tertiary); border-radius: 12px; border-top: 4px solid var(--success);">
                        <div style="font-size: 32px; color: var(--success); margin-bottom: 12px;">
                            <i class="fas fa-broadcast-tower"></i>
                        </div>
                        <h4 style="font-size: 20px; margin-bottom: 12px; color: var(--text-primary);">إدارة القنوات</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            إضافة القنوات، تنظيمها في فئات، ربطها بالخوادم، وتحديث روابط البث
                        </p>
                    </div>
                    
                    <div style="padding: 24px; background: var(--bg-tertiary); border-radius: 12px; border-top: 4px solid var(--info);">
                        <div style="font-size: 32px; color: var(--info); margin-bottom: 12px;">
                            <i class="fas fa-server"></i>
                        </div>
                        <h4 style="font-size: 20px; margin-bottom: 12px; color: var(--text-primary);">إدارة الخوادم</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            إضافة خوادم البث، مراقبة الأداء، توزيع الحمل، والتبديل التلقائي عند الأعطال
                        </p>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <h2 style="font-size: 32px; margin-bottom: 24px; color: var(--primary); display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-list-check"></i> الميزات الرئيسية
                </h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>إدارة المستخدمين والاشتراكات</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>نظام الخطط والباقات</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>أكواد الاشتراك</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>إدارة القنوات والفئات</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>إدارة الخوادم</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>مراقبة المستخدمين النشطين</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>إدارة الأجهزة</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>تقارير وإحصائيات</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>Xtream API متوافق</strong>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-left: 8px;"></i>
                        <strong>دعم ثنائي اللغة (EN/AR)</strong>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <h2 style="font-size: 32px; margin-bottom: 24px; color: var(--primary); display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-user-gear"></i> دليل التشغيل
                </h2>
                
                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    1. إنشاء مستخدم جديد
                </h3>
                <ol style="color: var(--text-secondary); line-height: 2; padding-right: 20px;">
                    <li>انتقل إلى صفحة "المستخدمين"</li>
                    <li>اضغط على زر "إضافة مستخدم"</li>
                    <li>أدخل اسم المستخدم، البريد الإلكتروني، وكلمة المرور</li>
                    <li>اختر الخطة المناسبة</li>
                    <li>حدد عدد الأجهزة المسموحة</li>
                    <li>اضغط "حفظ"</li>
                </ol>

                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    2. إضافة قناة جديدة
                </h3>
                <ol style="color: var(--text-secondary); line-height: 2; padding-right: 20px;">
                    <li>انتقل إلى صفحة "القنوات"</li>
                    <li>اضغط على "إضافة قناة"</li>
                    <li>أدخل اسم القناة بالعربية والإنجليزية</li>
                    <li>اختر الفئة المناسبة</li>
                    <li>أدخل رابط البث</li>
                    <li>ارفع شعار القناة (اختياري)</li>
                    <li>اضغط "حفظ"</li>
                </ol>

                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    3. إنشاء خطة اشتراك
                </h3>
                <ol style="color: var(--text-secondary); line-height: 2; padding-right: 20px;">
                    <li>انتقل إلى صفحة "الخطط"</li>
                    <li>اضغط على "إضافة خطة"</li>
                    <li>أدخل اسم الخطة والمدة</li>
                    <li>حدد السعر وعدد الأجهزة</li>
                    <li>اختر القنوات المتاحة في هذه الخطة</li>
                    <li>اضغط "حفظ"</li>
                </ol>
            </div>

            <div class="card" style="margin-bottom: 30px; border: 3px solid var(--warning); background: var(--bg-secondary);">
                <h2 style="font-size: 32px; margin-bottom: 24px; color: var(--warning); display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-certificate"></i> الملكية الفكرية والترخيص
                </h2>
                
                <div style="background: var(--bg-tertiary); padding: 24px; border-radius: 8px; border-right: 4px solid var(--warning); margin-bottom: 24px;">
                    <h3 style="font-size: 24px; margin-bottom: 16px; color: var(--warning);">
                        <i class="fas fa-exclamation-triangle"></i> إشعار قانوني مهم
                    </h3>
                    <p style="font-size: 18px; color: var(--text-primary); line-height: 1.8; margin-bottom: 16px;">
                        نظام <strong style="color: var(--primary);">PrimeX IPTV</strong> هو نظام مخصص تم تطويره بالكامل من الصفر.
                        المطور النهائي والمرجع التقني الوحيد للمنصة هو <strong style="color: var(--primary);">PAX</strong>.
                    </p>
                </div>

                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-ban"></i> المحظورات القانونية
                </h3>
                <div style="background: rgba(239, 68, 68, 0.1); border: 2px solid var(--danger); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <p style="font-size: 18px; color: var(--text-primary); margin-bottom: 16px; font-weight: 600;">
                        يُحظر بشكل صارم القيام بأي من الأعمال التالية:
                    </p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--danger);">
                            <i class="fas fa-times-circle" style="color: var(--danger); margin-left: 8px;"></i>
                            <strong>إعادة النشر</strong> (Re-publish) - نشر النظام أو أي جزء منه على منصات أخرى
                        </li>
                        <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--danger);">
                            <i class="fas fa-times-circle" style="color: var(--danger); margin-left: 8px;"></i>
                            <strong>إعادة البيع</strong> (Re-sell) - بيع النظام أو ترخيصه لأطراف ثالثة
                        </li>
                        <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--danger);">
                            <i class="fas fa-times-circle" style="color: var(--danger); margin-left: 8px;"></i>
                            <strong>إعادة التوزيع</strong> (Re-distribute) - توزيع نسخ من النظام بأي شكل
                        </li>
                        <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--danger);">
                            <i class="fas fa-times-circle" style="color: var(--danger); margin-left: 8px;"></i>
                            <strong>النسخ</strong> (Copy) - نسخ الكود أو الوظائف أو التصميم
                        </li>
                        <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--danger);">
                            <i class="fas fa-times-circle" style="color: var(--danger); margin-left: 8px;"></i>
                            <strong>التعديل</strong> (Modify) - تعديل الكود المصدري دون إذن صريح
                        </li>
                        <li style="padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 8px; border-right: 4px solid var(--danger);">
                            <i class="fas fa-times-circle" style="color: var(--danger); margin-left: 8px;"></i>
                            <strong>الهندسة العكسية</strong> (Reverse Engineer) - محاولة فك تشفير أو تحليل الكود
                        </li>
                    </ul>
                </div>

                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-shield-alt"></i> حماية الكود والمنطق الداخلي
                </h3>
                <p style="font-size: 18px; color: var(--text-secondary); line-height: 1.8; margin-bottom: 16px;">
                    يستخدم النظام <strong style="color: var(--primary);">كود مشفر مخصص</strong> ومنطق داخلي محمي.
                    جميع الخوارزميات والوظائف الأساسية محمية بحقوق الملكية الفكرية.
                </p>
                <p style="font-size: 18px; color: var(--text-secondary); line-height: 1.8; margin-bottom: 24px;">
                    أي تطوير أو تخصيص أو ترخيص أو استخدام تجاري يجب أن يتم <strong style="color: var(--warning);">فقط من خلال المطور الرئيسي</strong>.
                </p>

                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-id-card"></i> معرّف الترخيص
                </h3>
                <div style="background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary)); border: 2px solid var(--primary); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                        License ID
                    </div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary); font-family: 'Courier New', monospace; letter-spacing: 2px; padding: 16px; background: var(--bg-primary); border-radius: 8px; margin: 12px 0;">
                        PRIME-X-LICENSE-2025-17659727361262D26F
                    </div>
                    <div style="font-size: 14px; color: var(--text-muted); margin-top: 12px;">
                        <i class="fas fa-info-circle"></i> هذا المعرّف فريد لهذا التثبيت
                    </div>
                </div>

                <div style="background: rgba(99, 102, 241, 0.1); border: 2px solid var(--primary); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <h4 style="font-size: 20px; margin-bottom: 12px; color: var(--primary);">
                        <i class="fas fa-file-contract"></i> شروط الترخيص
                    </h4>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 10px 0; color: var(--text-secondary); font-size: 16px; border-bottom: 1px solid var(--border-color);">
                            <i class="fas fa-check" style="color: var(--success); margin-left: 8px;"></i>
                            كل تثبيت مرتبط بترخيص واحد فقط
                        </li>
                        <li style="padding: 10px 0; color: var(--text-secondary); font-size: 16px; border-bottom: 1px solid var(--border-color);">
                            <i class="fas fa-check" style="color: var(--success); margin-left: 8px;"></i>
                            الترخيص غير قابل للتحويل إلى جهات أخرى
                        </li>
                        <li style="padding: 10px 0; color: var(--text-secondary); font-size: 16px;">
                            <i class="fas fa-check" style="color: var(--success); margin-left: 8px;"></i>
                            أي استخدام خارج شروط الترخيص يعتبر انتهاكاً قانونياً
                        </li>
                    </ul>
                </div>

                <h3 style="font-size: 24px; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-copy"></i> النسخ المرآة (Mirrors)
                </h3>
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; border-right: 4px solid var(--info); margin-bottom: 24px;">
                    <p style="font-size: 18px; color: var(--text-secondary); line-height: 1.8; margin-bottom: 16px;">
                        قد توجد <strong style="color: var(--info);">نسخ مرآة رسمية</strong> من النظام لأغراض التكرار أو النسخ الاحتياطي.
                    </p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 10px 0; color: var(--text-secondary); font-size: 16px; border-bottom: 1px solid var(--border-color);">
                            <i class="fas fa-arrow-left" style="color: var(--info); margin-left: 8px;"></i>
                            جميع النسخ المرآة تظل ملزمة قانونياً بنفس شروط الترخيص
                        </li>
                        <li style="padding: 10px 0; color: var(--text-secondary); font-size: 16px; border-bottom: 1px solid var(--border-color);">
                            <i class="fas fa-arrow-left" style="color: var(--info); margin-left: 8px;"></i>
                            النسخ المرآة لا تمنح حقوق الملكية أو إعادة التوزيع
                        </li>
                        <li style="padding: 10px 0; color: var(--text-secondary); font-size: 16px;">
                            <i class="fas fa-arrow-left" style="color: var(--info); margin-left: 8px;"></i>
                            المطور الرئيسي يظل المصدر الوحيد الموثوق
                        </li>
                    </ul>
                </div>

                <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1)); border: 2px solid var(--danger); border-radius: 12px; padding: 24px; text-align: center; margin-top: 32px;">
                    <div style="font-size: 48px; color: var(--danger); margin-bottom: 16px;">
                        <i class="fas fa-gavel"></i>
                    </div>
                    <h4 style="font-size: 22px; margin-bottom: 12px; color: var(--danger); font-weight: 700;">
                        تحذير قانوني
                    </h4>
                    <p style="font-size: 16px; color: var(--text-primary); line-height: 1.8;">
                        أي انتهاك لشروط الترخيص أو حقوق الملكية الفكرية سيتم اتخاذ الإجراءات القانونية المناسبة ضده.
                        جميع الحقوق محفوظة © 2025 PAX Development.
                    </p>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; text-align: center;">
                <h2 style="font-size: 32px; margin-bottom: 16px;">
                    <i class="fas fa-graduation-cap"></i> الخلاصة
                </h2>
                <p style="font-size: 18px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                    نظام PrimeX IPTV هو حل شامل ومتقدم لإدارة خدمات البث الرقمي.
                    تم تصميمه ليكون قابلاً للتوسع، آمناً، وسهل الإدارة.
                </p>
                <p style="font-size: 18px; line-height: 1.8; color: rgba(255, 255, 255, 0.9); margin-top: 16px;">
                    للدعم الفني: <strong>info@paxdes.com</strong>
                </p>
            </div>
        </div>
    `;
}

// ============================================
// USERS MANAGEMENT PAGE (Phase 2)
// ============================================

let usersData = [];
let usersFilters = { search: '', status: 'all' };

async function loadUsersPage() {
    const page = document.getElementById('page-users');
    
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-users"></i> Users Management</h3>
                <button class="btn btn-primary" onclick="showCreateUserModal()">
                    <i class="fas fa-plus"></i> Add User
                </button>
            </div>
            <div class="card-body">
                <div class="filters-bar" style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                    <input type="text" id="userSearch" placeholder="Search users..." 
                           style="flex: 1; min-width: 200px; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); color: var(--text-primary);"
                           oninput="filterUsers()">
                    <select id="userStatusFilter" onchange="filterUsers()"
                            style="padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); color: var(--text-primary);">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <button class="btn btn-secondary" onclick="loadUsersData()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                
                <div id="usersTableContainer">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
                        <p style="margin-top: 12px;">Loading users...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await loadUsersData();
}

async function loadUsersData() {
    try {
        const response = await apiRequest('/admin/users');
        
        // Normalize array from response
        if (Array.isArray(response.data)) {
            usersData = response.data;
        } else if (response.data && Array.isArray(response.data.users)) {
            usersData = response.data.users;
        } else if (Array.isArray(response)) {
            usersData = response;
        } else {
            usersData = [];
        }
        
        renderUsersTable();
    } catch (error) {
        console.error('Failed to load users:', error);
        usersData = [];
        document.getElementById('usersTableContainer').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="fas fa-exclamation-circle" style="font-size: 32px;"></i>
                <p style="margin-top: 12px;">Failed to load users</p>
            </div>
        `;
    }
}

function filterUsers() {
    usersFilters.search = document.getElementById('userSearch').value.toLowerCase();
    usersFilters.status = document.getElementById('userStatusFilter').value;
    renderUsersTable();
}

function renderUsersTable() {
    let filtered = usersData;
    
    // Apply search filter
    if (usersFilters.search) {
        filtered = filtered.filter(user => 
            user.username?.toLowerCase().includes(usersFilters.search) ||
            user.email?.toLowerCase().includes(usersFilters.search)
        );
    }
    
    // Apply status filter
    if (usersFilters.status !== 'all') {
        filtered = filtered.filter(user => user.status === usersFilters.status);
    }
    
    const container = document.getElementById('usersTableContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 32px;"></i>
                <p style="margin-top: 12px;">No users found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Username</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Email</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Status</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Expires</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Devices</th>
                        <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 600;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(user => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px; color: var(--text-primary);">${user.username || 'N/A'}</td>
                            <td style="padding: 12px; color: var(--text-secondary);">${user.email || 'N/A'}</td>
                            <td style="padding: 12px;">
                                <span class="badge badge-${user.status === 'active' ? 'success' : user.status === 'expired' ? 'danger' : 'warning'}">
                                    ${user.status || 'unknown'}
                                </span>
                            </td>
                            <td style="padding: 12px; color: var(--text-secondary);">
                                ${user.expiry_date ? formatDate(user.expiry_date) : 'N/A'}
                            </td>
                            <td style="padding: 12px; color: var(--text-secondary);">
                                ${user.device_count || 0} / ${user.max_connections || 1}
                            </td>
                            <td style="padding: 12px; text-align: right;">
                                <button class="btn-icon" onclick="viewUser(${user.id})" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon" onclick="editUser(${user.id})" title="Edit User">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon" onclick="deleteUser(${user.id})" title="Delete User">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; color: var(--text-muted); text-align: center;">
            Showing ${filtered.length} of ${usersData.length} users
        </div>
    `;
}

function showCreateUserModal() {
    showModal('Create User', `
        <form id="createUserForm" onsubmit="createUser(event)">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required>
            </div>
            <div class="form-group">
                <label>Subscription Plan</label>
                <select name="plan_id" required id="planSelect">
                    <option value="">Loading plans...</option>
                </select>
            </div>
            <div class="form-group">
                <label>Max Devices</label>
                <input type="number" name="max_devices" value="1" min="1" max="5">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-plus"></i> Create User
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    Cancel
                </button>
            </div>
        </form>
    `);
    
    // Load plans for dropdown
    loadPlansForDropdown();
}

async function loadPlansForDropdown(selectId = 'planSelect') {
    try {
        const response = await apiRequest('/admin/plans');
        const plans = response.data || [];
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = plans.map(plan => 
                `<option value="${plan.id}">${plan.name_en} - ${plan.duration_days} days</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Failed to load plans:', error);
    }
}

async function loadServersForDropdown(selectId, selectedServerId = null) {
    try {
        const response = await apiRequest('/admin/servers');
        const servers = response.data || [];
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = servers.map(server => 
                `<option value="${server.id}" ${server.id == selectedServerId ? 'selected' : ''}>${server.name}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Failed to load servers:', error);
    }
}

async function createUser(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Convert numeric fields
    if (data.plan_id) data.plan_id = parseInt(data.plan_id);
    if (data.max_devices) data.max_devices = parseInt(data.max_devices);
    
    console.log('Creating user with data:', data);
    
    try {
        const response = await apiRequest('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        console.log('User created successfully:', response);
        showToast('User created successfully', 'success');
        closeModal();
        loadUsersData();
    } catch (error) {
        console.error('User creation error:', error);
        showToast(error.message || 'Failed to create user', 'error');
    }
}

async function viewUser(userId) {
    try {
        const response = await apiRequest(`/admin/users/${userId}`);
        // API returns {success: true, data: {user: {...}, devices: [...]}}
        const user = response.data.user || response.data;
        const devices = response.data.devices || [];
        
        const devicesHtml = devices.length > 0 ? devices.map(device => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text-primary);">${device.device_name || device.device_id || 'Unknown Device'}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        <i class="fas fa-network-wired"></i> ${device.ip_address || 'N/A'} | 
                        <i class="fas fa-clock"></i> ${device.last_seen ? formatDate(device.last_seen) : 'Never'}
                    </div>
                    ${device.device_type ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${device.device_type}</div>` : ''}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-warning" onclick="kickDevice(${userId}, ${device.id})" title="Kick Device">
                        <i class="fas fa-ban"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removeDevice(${userId}, ${device.id})" title="Remove Device">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('') : '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No devices connected</div>';
        
        showModal('User Details', `
            <div style="display: grid; gap: 16px;">
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Username</div>
                    <div style="color: var(--text-primary); font-size: 16px; font-weight: 600;">${user.username}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Email</div>
                    <div style="color: var(--text-primary);">${user.email || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Status</div>
                    <span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Plan</div>
                    <div style="color: var(--text-primary);">${user.plan_name_en || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Subscription Start</div>
                    <div style="color: var(--text-primary);">${user.subscription_start ? formatDate(user.subscription_start) : 'N/A'}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Subscription End</div>
                    <div style="color: var(--text-primary);">${user.subscription_end ? formatDate(user.subscription_end) : 'N/A'}</div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Remaining Days</div>
                    <div style="color: var(--text-primary); font-weight: 600;">
                        ${user.remaining_days !== undefined && user.remaining_days !== null && user.remaining_days >= 0 ? user.remaining_days + ' days' : user.remaining_days < 0 ? 'Expired' : 'N/A'}
                    </div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Subscription Status</div>
                    <span class="badge badge-${user.subscription_status === 'active' ? 'success' : user.subscription_status === 'expiring_soon' ? 'warning' : 'danger'}">
                        ${user.subscription_status ? user.subscription_status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </span>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Content Access</div>
                    <div style="color: var(--text-primary);">
                        ${user.categories_count || 0} Categories | ${user.channels_count || 0} Channels
                    </div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Devices (${devices.length} / ${user.max_devices || user.max_connections || 1})</div>
                    <div style="margin-top: 8px;">
                        ${devicesHtml}
                    </div>
                </div>
                <div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Created</div>
                    <div style="color: var(--text-primary);">${formatDate(user.created_at)}</div>
                </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="editUser(${userId}); closeModal();">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-warning" onclick="changeUserPassword(${userId}); closeModal();">
                    <i class="fas fa-key"></i> Change Password
                </button>
                <button class="btn btn-danger" onclick="forceLogoutUser(${userId})">
                    <i class="fas fa-sign-out-alt"></i> Force Logout All
                </button>
                <button class="btn btn-secondary" onclick="closeModal()">
                    Close
                </button>
            </div>
        `, 'large');
    } catch (error) {
        showToast('Failed to load user details', 'error');
    }
}

async function editUser(userId) {
    try {
        const response = await apiRequest(`/admin/users/${userId}`);
        const user = response.data.user || response.data;
        
        showModal('Edit User', `
            <form id="editUserForm" onsubmit="updateUser(event, ${userId})">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" name="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${user.email || ''}" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status" required>
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="expired" ${user.status === 'expired' ? 'selected' : ''}>Expired</option>
                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Max Devices</label>
                    <input type="number" name="max_devices" value="${user.max_devices || user.max_connections || 1}" min="1" max="5">
                </div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">
                        Cancel
                    </button>
                </div>
            </form>
        `);
    } catch (error) {
        showToast('Failed to load user', 'error');
    }
}

async function updateUser(event, userId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        await apiRequest(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        showToast('User updated successfully', 'success');
        closeModal();
        loadUsersData();
    } catch (error) {
        showToast(error.message || 'Failed to update user', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        showToast('User deleted successfully', 'success');
        loadUsersData();
    } catch (error) {
        showToast(error.message || 'Failed to delete user', 'error');
    }
}

async function kickDevice(userId, deviceId) {
    if (!confirm('Kick this device? The user will be disconnected immediately.')) {
        return;
    }
    
    try {
        await apiRequest(`/admin/users/${userId}/devices/${deviceId}/kick`, {
            method: 'POST'
        });
        
        showToast('Device kicked successfully', 'success');
        closeModal();
        viewUser(userId);
    } catch (error) {
        showToast(error.message || 'Failed to kick device', 'error');
    }
}

async function removeDevice(userId, deviceId) {
    if (!confirm('Remove this device permanently? The user will need to re-authenticate.')) {
        return;
    }
    
    try {
        await apiRequest(`/admin/users/${userId}/devices/${deviceId}`, {
            method: 'DELETE'
        });
        
        showToast('Device removed successfully', 'success');
        closeModal();
        viewUser(userId);
    } catch (error) {
        showToast(error.message || 'Failed to remove device', 'error');
    }
}

async function forceLogoutUser(userId) {
    if (!confirm('Force logout this user from ALL devices? They will need to login again.')) {
        return;
    }
    
    try {
        await apiRequest(`/admin/users/${userId}/force-logout`, {
            method: 'POST'
        });
        
        showToast('User logged out from all devices', 'success');
        closeModal();
        loadUsersData();
    } catch (error) {
        showToast(error.message || 'Failed to force logout', 'error');
    }
}

function changeUserPassword(userId) {
    showModal('Change User Password', `
        <form onsubmit="submitPasswordChange(event, ${userId})">
            <div class="form-group">
                <label>New Password</label>
                <input type="password" name="new_password" minlength="6" required>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" name="logout_all_sessions" value="true">
                    <span>Logout from all devices after password change</span>
                </label>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-save"></i> Change Password
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
}

async function submitPasswordChange(event, userId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        new_password: formData.get('new_password'),
        logout_all_sessions: formData.get('logout_all_sessions') === 'true'
    };
    
    try {
        await apiRequest(`/admin/users/${userId}/change-password`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast('Password changed successfully', 'success');
        closeModal();
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
    }
}

// ============================================
// MODAL SYSTEM
// ============================================

function showModal(title, content, size = 'medium') {
    const container = document.getElementById('modalContainer');
    const sizeClass = size === 'large' ? 'modal-large' : '';
    container.innerHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content ${sizeClass}" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="btn-icon" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
}

function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

// Add modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
    }
    
    .modal-content {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-xl);
    }
    
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .modal-header h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 20px;
    }
    
    .modal-body {
        padding: 24px;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        color: var(--text-primary);
        font-size: 14px;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    .filters-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }
`;
document.head.appendChild(modalStyles);

// ============================================
// CHANNELS MANAGEMENT PAGE (Phase 2)
// ============================================

let channelsData = [];
let channelsFilters = { search: '', category: 'all' };

async function loadChannelsPage() {
    const page = document.getElementById('page-channels');
    
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-broadcast-tower"></i> Channels Management</h3>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-success" onclick="showImportM3UModal()">
                        <i class="fas fa-file-import"></i> Import M3U Playlist
                    </button>
                    <button class="btn btn-primary" onclick="showCreateChannelModal()">
                        <i class="fas fa-plus"></i> Add Channel
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <input type="text" id="channelSearch" placeholder="Search channels..." 
                           style="flex: 1; min-width: 200px; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); color: var(--text-primary);"
                           oninput="filterChannels()">
                    <select id="channelCategoryFilter" onchange="filterChannels()"
                            style="padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); color: var(--text-primary);">
                        <option value="all">All Categories</option>
                    </select>
                    <button class="btn btn-secondary" onclick="loadChannelsData()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                
                <div id="channelsTableContainer">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
                        <p style="margin-top: 12px;">Loading channels...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await loadChannelsData();
    await loadCategoriesForFilter();
}

async function loadChannelsData() {
    try {
        const response = await apiRequest('/admin/channels');
        
        // Normalize array from response
        if (Array.isArray(response.data)) {
            channelsData = response.data;
        } else if (response.data && Array.isArray(response.data.channels)) {
            channelsData = response.data.channels;
        } else if (Array.isArray(response)) {
            channelsData = response;
        } else {
            channelsData = [];
        }
        
        renderChannelsTable();
    } catch (error) {
        console.error('Failed to load channels:', error);
        channelsData = [];
        document.getElementById('channelsTableContainer').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="fas fa-exclamation-circle" style="font-size: 32px;"></i>
                <p style="margin-top: 12px;">Failed to load channels</p>
            </div>
        `;
    }
}

async function loadCategoriesForFilter() {
    try {
        const response = await apiRequest('/admin/categories');
        
        // Normalize array from response
        let categories = [];
        if (Array.isArray(response.data)) {
            categories = response.data;
        } else if (response.data && Array.isArray(response.data.categories)) {
            categories = response.data.categories;
        } else if (Array.isArray(response)) {
            categories = response;
        }
        
        const select = document.getElementById('channelCategoryFilter');
        if (select && Array.isArray(categories)) {
            select.innerHTML = '<option value="all">All Categories</option>' + 
                categories.map(cat => `<option value="${cat.id}">${cat.name_en}</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function filterChannels() {
    channelsFilters.search = document.getElementById('channelSearch').value.toLowerCase();
    channelsFilters.category = document.getElementById('channelCategoryFilter').value;
    renderChannelsTable();
}

function renderChannelsTable() {
    let filtered = channelsData;
    
    if (channelsFilters.search) {
        filtered = filtered.filter(ch => 
            ch.name_en?.toLowerCase().includes(channelsFilters.search) ||
            ch.name_ar?.toLowerCase().includes(channelsFilters.search)
        );
    }
    
    if (channelsFilters.category !== 'all') {
        filtered = filtered.filter(ch => ch.category_id == channelsFilters.category);
    }
    
    const container = document.getElementById('channelsTableContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 32px;"></i>
                <p style="margin-top: 12px;">No channels found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Channel Name</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Category</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Stream URL</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Status</th>
                        <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 600;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(channel => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px; color: var(--text-primary);">
                                ${channel.name_en || 'N/A'}
                                ${channel.name_ar ? `<br><span style="color: var(--text-muted); font-size: 12px;">${channel.name_ar}</span>` : ''}
                            </td>
                            <td style="padding: 12px; color: var(--text-secondary);">${channel.category_name || 'Uncategorized'}</td>
                            <td style="padding: 12px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${channel.stream_url || 'N/A'}
                            </td>
                            <td style="padding: 12px;">
                                <span class="badge badge-${channel.status === 'active' ? 'success' : 'danger'}">
                                    ${channel.status || 'inactive'}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: right;">
                                <button class="btn-icon" onclick="editChannel(${channel.id})" title="Edit Channel">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon" onclick="deleteChannel(${channel.id})" title="Delete Channel">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; color: var(--text-muted); text-align: center;">
            Showing ${filtered.length} of ${channelsData.length} channels
        </div>
    `;
}

function showImportM3UModal() {
    showModal('Import M3U Playlist', `
        <div style="margin-bottom: 24px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; border-left: 4px solid var(--info);">
            <h4 style="margin-bottom: 12px; color: var(--info);"><i class="fas fa-info-circle"></i> Legal Public Playlists</h4>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
                Use these 100% legal, open-source playlists from GitHub:
            </p>
            <ul style="font-size: 13px; color: var(--text-muted); line-height: 1.8;">
                <li><strong>All channels:</strong> https://iptv-org.github.io/iptv/index.m3u</li>
                <li><strong>Arabic (region):</strong> https://iptv-org.github.io/iptv/regions/arab.m3u</li>
                <li><strong>Arabic (language):</strong> https://iptv-org.github.io/iptv/languages/ara.m3u</li>
                <li><strong>Saudi Arabia:</strong> https://iptv-org.github.io/iptv/countries/sa.m3u</li>
                <li><strong>Egypt:</strong> https://iptv-org.github.io/iptv/countries/eg.m3u</li>
                <li><strong>UAE:</strong> https://iptv-org.github.io/iptv/countries/ae.m3u</li>
            </ul>
        </div>
        
        <form id="importM3UForm" onsubmit="importM3UPlaylist(event)">
            <div class="form-group">
                <label>M3U Playlist URL</label>
                <input type="url" name="m3u_url" required placeholder="https://iptv-org.github.io/iptv/languages/ara.m3u">
                <small style="color: var(--text-muted); display: block; margin-top: 4px;">
                    Enter the URL of an M3U playlist file
                </small>
            </div>
            
            <div class="form-group">
                <label>Default Category (optional)</label>
                <select name="default_category_id" id="m3uCategorySelect">
                    <option value="">Auto-create from group-title</option>
                </select>
                <small style="color: var(--text-muted); display: block; margin-top: 4px;">
                    Leave empty to automatically create categories from playlist groups
                </small>
            </div>
            
            <div id="importProgress" style="display: none; margin-top: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <i class="fas fa-spinner fa-spin" style="color: var(--primary);"></i>
                    <span style="color: var(--text-primary);">Importing playlist...</span>
                </div>
                <div style="font-size: 13px; color: var(--text-muted);">
                    This may take a few minutes for large playlists
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-success" style="flex: 1;">
                    <i class="fas fa-file-import"></i> Import Playlist
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    Cancel
                </button>
            </div>
        </form>
    `, 'large');
    
    loadCategoriesForM3UForm();
}

async function loadCategoriesForM3UForm() {
    try {
        const response = await apiRequest('/admin/categories');
        const categories = response.data || [];
        const select = document.getElementById('m3uCategorySelect');
        if (select) {
            select.innerHTML = '<option value="">Auto-create from group-title</option>' + 
                categories.map(cat => 
                    `<option value="${cat.id}">${cat.name_en}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function importM3UPlaylist(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {
        m3u_url: formData.get('m3u_url'),
        default_category_id: formData.get('default_category_id') ? parseInt(formData.get('default_category_id')) : null
    };
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const progressDiv = document.getElementById('importProgress');
    
    try {
        submitBtn.disabled = true;
        progressDiv.style.display = 'block';
        
        console.log('Importing M3U playlist:', data);
        
        const response = await apiRequest('/admin/channels/import-m3u', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        console.log('Import completed:', response);
        
        showToast(`Successfully imported ${response.data.imported} channels (${response.data.skipped} skipped, ${response.data.categories_created} categories created)`, 'success');
        closeModal();
        loadChannelsData();
    } catch (error) {
        console.error('M3U import error:', error);
        showToast(error.message || 'Failed to import M3U playlist', 'error');
    } finally {
        submitBtn.disabled = false;
        progressDiv.style.display = 'none';
    }
}

function showCreateChannelModal() {
    showModal('Add Channel', `
        <form id="createChannelForm" onsubmit="createChannel(event)">
            <div class="form-group">
                <label>Channel Name (English)</label>
                <input type="text" name="name_en" required>
            </div>
            <div class="form-group">
                <label>Channel Name (Arabic)</label>
                <input type="text" name="name_ar">
            </div>
            <div class="form-group">
                <label>Stream URL</label>
                <input type="url" name="stream_url" required placeholder="http://example.com/stream.m3u8">
            </div>
            <div class="form-group">
                <label>Category</label>
                <select name="category_id" required id="channelCategorySelect">
                    <option value="">Loading categories...</option>
                </select>
            </div>
            <div class="form-group">
                <label>Logo URL (optional)</label>
                <input type="url" name="logo_url" placeholder="http://example.com/logo.png">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status" required>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-plus"></i> Add Channel
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    Cancel
                </button>
            </div>
        </form>
    `);
    
    loadCategoriesForChannelForm();
}

async function loadCategoriesForChannelForm() {
    try {
        const response = await apiRequest('/admin/categories');
        const categories = response.data || [];
        const select = document.getElementById('channelCategorySelect');
        if (select) {
            select.innerHTML = categories.map(cat => 
                `<option value="${cat.id}">${cat.name_en}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function createChannel(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        await apiRequest('/admin/channels', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast('Channel created successfully', 'success');
        closeModal();
        loadChannelsData();
    } catch (error) {
        showToast(error.message || 'Failed to create channel', 'error');
    }
}

async function editChannel(channelId) {
    try {
        const response = await apiRequest(`/admin/channels/${channelId}`);
        const channel = response.data;
        
        showModal('Edit Channel', `
            <form id="editChannelForm" onsubmit="updateChannel(event, ${channelId})">
                <div class="form-group">
                    <label>Channel Name (English)</label>
                    <input type="text" name="name_en" value="${channel.name_en || ''}" required>
                </div>
                <div class="form-group">
                    <label>Channel Name (Arabic)</label>
                    <input type="text" name="name_ar" value="${channel.name_ar || ''}">
                </div>
                <div class="form-group">
                    <label>Stream URL</label>
                    <input type="url" name="stream_url" value="${channel.stream_url || ''}" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select name="category_id" required id="editChannelCategorySelect">
                        <option value="">Loading...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Logo URL</label>
                    <input type="url" name="logo_url" value="${channel.logo_url || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status" required>
                        <option value="active" ${channel.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${channel.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">
                        Cancel
                    </button>
                </div>
            </form>
        `);
        
        // Load categories and set selected
        const catResponse = await apiRequest('/admin/categories');
        const categories = catResponse.data || [];
        const select = document.getElementById('editChannelCategorySelect');
        if (select) {
            select.innerHTML = categories.map(cat => 
                `<option value="${cat.id}" ${cat.id == channel.category_id ? 'selected' : ''}>${cat.name_en}</option>`
            ).join('');
        }
    } catch (error) {
        showToast('Failed to load channel', 'error');
    }
}

async function updateChannel(event, channelId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        await apiRequest(`/admin/channels/${channelId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        showToast('Channel updated successfully', 'success');
        closeModal();
        loadChannelsData();
    } catch (error) {
        showToast(error.message || 'Failed to update channel', 'error');
    }
}

async function deleteChannel(channelId) {
    if (!confirm('Are you sure you want to delete this channel?')) {
        return;
    }
    
    try {
        await apiRequest(`/admin/channels/${channelId}`, {
            method: 'DELETE'
        });
        
        showToast('Channel deleted successfully', 'success');
        loadChannelsData();
    } catch (error) {
        showToast(error.message || 'Failed to delete channel', 'error');
    }
}

// ============================================
// CATEGORIES MANAGEMENT PAGE (Phase 3)
// ============================================

let categoriesData = [];

async function loadCategoriesPage() {
    const page = document.getElementById('page-categories');
    
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-folder-tree"></i> Categories Management</h3>
                <button class="btn btn-primary" onclick="showCreateCategoryModal()">
                    <i class="fas fa-plus"></i> Add Category
                </button>
            </div>
            <div class="card-body">
                <div id="categoriesTableContainer">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
                        <p style="margin-top: 12px;">Loading categories...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await loadCategoriesData();
}

async function loadCategoriesData() {
    try {
        const response = await apiRequest('/admin/categories');
        
        // Normalize array from response
        if (Array.isArray(response.data)) {
            categoriesData = response.data;
        } else if (response.data && Array.isArray(response.data.categories)) {
            categoriesData = response.data.categories;
        } else if (Array.isArray(response)) {
            categoriesData = response;
        } else {
            categoriesData = [];
        }
        
        renderCategoriesTable();
    } catch (error) {
        console.error('Failed to load categories:', error);
        document.getElementById('categoriesTableContainer').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <i class="fas fa-exclamation-circle" style="font-size: 32px;"></i>
                <p style="margin-top: 12px;">Failed to load categories</p>
            </div>
        `;
    }
}

function renderCategoriesTable() {
    const container = document.getElementById('categoriesTableContainer');
    
    if (categoriesData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 32px;"></i>
                <p style="margin-top: 12px;">No categories found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Name (EN)</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Name (AR)</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 600;">Slug</th>
                        <th style="padding: 12px; text-align: center; color: var(--text-secondary); font-weight: 600;">Channels</th>
                        <th style="padding: 12px; text-align: center; color: var(--text-secondary); font-weight: 600;">Order</th>
                        <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 600;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoriesData.map(cat => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px; color: var(--text-primary);">${cat.name_en || 'N/A'}</td>
                            <td style="padding: 12px; color: var(--text-secondary);">${cat.name_ar || 'N/A'}</td>
                            <td style="padding: 12px; color: var(--text-muted); font-family: monospace; font-size: 12px;">${cat.slug || 'N/A'}</td>
                            <td style="padding: 12px; text-align: center; color: var(--text-secondary);">${cat.channel_count || 0}</td>
                            <td style="padding: 12px; text-align: center; color: var(--text-secondary);">${cat.sort_order || 0}</td>
                            <td style="padding: 12px; text-align: right;">
                                <button class="btn-icon" onclick="editCategory(${cat.id})" title="Edit Category">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon" onclick="deleteCategory(${cat.id})" title="Delete Category">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showCreateCategoryModal() {
    showModal('Add Category', `
        <form id="createCategoryForm" onsubmit="createCategory(event)">
            <div class="form-group">
                <label>Name (English)</label>
                <input type="text" name="name_en" required>
            </div>
            <div class="form-group">
                <label>Name (Arabic)</label>
                <input type="text" name="name_ar" required>
            </div>
            <div class="form-group">
                <label>Slug (URL-friendly)</label>
                <input type="text" name="slug" required placeholder="e.g., sports-channels">
            </div>
            <div class="form-group">
                <label>Sort Order</label>
                <input type="number" name="sort_order" value="0" min="0">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-plus"></i> Add Category
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
}

async function createCategory(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        await apiRequest('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Category created successfully', 'success');
        closeModal();
        loadCategoriesData();
    } catch (error) {
        showToast(error.message || 'Failed to create category', 'error');
    }
}

async function editCategory(categoryId) {
    try {
        const response = await apiRequest(`/admin/categories/${categoryId}`);
        const cat = response.data;
        
        showModal('Edit Category', `
            <form id="editCategoryForm" onsubmit="updateCategory(event, ${categoryId})">
                <div class="form-group">
                    <label>Name (English)</label>
                    <input type="text" name="name_en" value="${cat.name_en || ''}" required>
                </div>
                <div class="form-group">
                    <label>Name (Arabic)</label>
                    <input type="text" name="name_ar" value="${cat.name_ar || ''}" required>
                </div>
                <div class="form-group">
                    <label>Slug</label>
                    <input type="text" name="slug" value="${cat.slug || ''}" required>
                </div>
                <div class="form-group">
                    <label>Sort Order</label>
                    <input type="number" name="sort_order" value="${cat.sort_order || 0}" min="0">
                </div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        `);
    } catch (error) {
        showToast('Failed to load category', 'error');
    }
}

async function updateCategory(event, categoryId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        await apiRequest(`/admin/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        showToast('Category updated successfully', 'success');
        closeModal();
        loadCategoriesData();
    } catch (error) {
        showToast(error.message || 'Failed to update category', 'error');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        await apiRequest(`/admin/categories/${categoryId}`, { method: 'DELETE' });
        showToast('Category deleted successfully', 'success');
        loadCategoriesData();
    } catch (error) {
        showToast(error.message || 'Failed to delete category', 'error');
    }
}

// ============================================
// SERVERS MANAGEMENT PAGE (Phase 3)
// ============================================

let serversData = [];

async function loadServersPage() {
    const page = document.getElementById('page-servers');
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-server"></i> Streaming Servers</h3>
                <button class="btn btn-primary" onclick="showCreateServerModal()">
                    <i class="fas fa-plus"></i> Add Server
                </button>
            </div>
            <div class="card-body">
                <div id="serversTableContainer">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
                        <p style="margin-top: 12px;">Loading servers...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    await loadServersData();
}

async function loadServersData() {
    try {
        const response = await apiRequest('/admin/servers');
        
        // Normalize array from response
        if (Array.isArray(response.data)) {
            serversData = response.data;
        } else if (response.data && Array.isArray(response.data.servers)) {
            serversData = response.data.servers;
        } else if (Array.isArray(response)) {
            serversData = response;
        } else {
            serversData = [];
        }
        
        renderServersTable();
    } catch (error) {
        console.error('Failed to load servers:', error);
    }
}

function renderServersTable() {
    const container = document.getElementById('serversTableContainer');
    if (serversData.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-inbox" style="font-size: 32px;"></i><p style="margin-top: 12px;">No servers found</p></div>`;
        return;
    }
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 12px; text-align: left;">Server Name</th>
                        <th style="padding: 12px; text-align: left;">URL</th>
                        <th style="padding: 12px; text-align: center;">Status</th>
                        <th style="padding: 12px; text-align: center;">Priority</th>
                        <th style="padding: 12px; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${serversData.map(srv => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px; color: var(--text-primary);">${srv.name || 'N/A'}</td>
                            <td style="padding: 12px; color: var(--text-secondary); max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${srv.url || 'N/A'}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge badge-${srv.status === 'active' ? 'success' : 'danger'}">${srv.status || 'inactive'}</span>
                            </td>
                            <td style="padding: 12px; text-align: center; color: var(--text-secondary);">${srv.priority || 0}</td>
                            <td style="padding: 12px; text-align: right;">
                                <button class="btn-icon" onclick="editServer(${srv.id})" title="Edit"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" onclick="deleteServer(${srv.id})" title="Delete"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showCreateServerModal() {
    showModal('Add Server', `
        <form onsubmit="createServer(event)">
            <div class="form-group"><label>Server Name</label><input type="text" name="name" required></div>
            <div class="form-group"><label>Server URL</label><input type="url" name="url" required placeholder="http://server.com"></div>
            <div class="form-group"><label>Priority</label><input type="number" name="priority" value="10" min="0"></div>
            <div class="form-group"><label>Status</label><select name="status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fas fa-plus"></i> Add Server</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
}

async function createServer(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        url: formData.get('url'),
        username: formData.get('username'),
        password: formData.get('password'),
        status: formData.get('status'),
        priority: parseInt(formData.get('priority'))
    };
    try {
        await apiRequest('/admin/servers', { method: 'POST', body: JSON.stringify(data) });
        showToast('Server created successfully', 'success');
        closeModal();
        loadServersData();
    } catch (error) {
        showToast(error.message || 'Failed to create server', 'error');
    }
}

async function editServer(serverId) {
    try {
        const response = await apiRequest(`/admin/servers/${serverId}`);
        const srv = response.data;
        showModal('Edit Server', `
            <form onsubmit="updateServer(event, ${serverId})">
                <div class="form-group"><label>Server Name</label><input type="text" name="name" value="${srv.name || ''}" required></div>
                <div class="form-group"><label>Server URL</label><input type="url" name="url" value="${srv.url || ''}" required></div>
                <div class="form-group"><label>Priority</label><input type="number" name="priority" value="${srv.priority || 10}" min="0"></div>
                <div class="form-group"><label>Status</label><select name="status"><option value="active" ${srv.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${srv.status === 'inactive' ? 'selected' : ''}>Inactive</option></select></div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fas fa-save"></i> Save</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        `);
    } catch (error) {
        showToast('Failed to load server', 'error');
    }
}

async function updateServer(event, serverId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        url: formData.get('url'),
        username: formData.get('username'),
        password: formData.get('password'),
        status: formData.get('status'),
        priority: parseInt(formData.get('priority'))
    };
    try {
        await apiRequest(`/admin/servers/${serverId}`, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Server updated successfully', 'success');
        closeModal();
        loadServersData();
    } catch (error) {
        showToast(error.message || 'Failed to update server', 'error');
    }
}

async function deleteServer(serverId) {
    if (!confirm('Delete this server?')) return;
    try {
        await apiRequest(`/admin/servers/${serverId}`, { method: 'DELETE' });
        showToast('Server deleted successfully', 'success');
        loadServersData();
    } catch (error) {
        showToast(error.message || 'Failed to delete server', 'error');
    }
}

// ============================================
// SUBSCRIPTION CODES PAGE (Phase 3)
// ============================================

let codesData = [];

async function loadCodesPage() {
    const page = document.getElementById('page-codes');
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-ticket-alt"></i> Subscription Codes</h3>
                <button class="btn btn-primary" onclick="showGenerateCodesModal()">
                    <i class="fas fa-plus"></i> Generate Codes
                </button>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <select id="codeStatusFilter" onchange="filterCodes()" style="padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); color: var(--text-primary);">
                        <option value="all">All Status</option>
                        <option value="available">Available</option>
                        <option value="used">Used</option>
                    </select>
                    <button class="btn btn-secondary" onclick="loadCodesData()"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
                <div id="codesTableContainer">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
                        <p style="margin-top: 12px;">Loading codes...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    await loadCodesData();
}

async function loadCodesData() {
    try {
        const response = await apiRequest('/admin/codes');
        
        // Normalize array from response
        if (Array.isArray(response.data)) {
            codesData = response.data;
        } else if (response.data && Array.isArray(response.data.codes)) {
            codesData = response.data.codes;
        } else if (Array.isArray(response)) {
            codesData = response;
        } else {
            codesData = [];
        }
        
        renderCodesTable();
    } catch (error) {
        console.error('Failed to load codes:', error);
    }
}

function filterCodes() {
    renderCodesTable();
}

function renderCodesTable() {
    const filter = document.getElementById('codeStatusFilter')?.value || 'all';
    let filtered = codesData;
    if (filter !== 'all') {
        filtered = codesData.filter(c => c.status === filter);
    }
    
    const container = document.getElementById('codesTableContainer');
    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-inbox" style="font-size: 32px;"></i><p style="margin-top: 12px;">No codes found</p></div>`;
        return;
    }
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 12px; text-align: left;">Code</th>
                        <th style="padding: 12px; text-align: left;">Plan</th>
                        <th style="padding: 12px; text-align: center;">Status</th>
                        <th style="padding: 12px; text-align: left;">Used By</th>
                        <th style="padding: 12px; text-align: left;">Created</th>
                        <th style="padding: 12px; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(code => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px; color: var(--text-primary); font-family: monospace;">${code.code || 'N/A'}</td>
                            <td style="padding: 12px; color: var(--text-secondary);">${code.plan_name || 'N/A'}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge badge-${code.status === 'available' ? 'success' : 'warning'}">${code.status || 'unknown'}</span>
                            </td>
                            <td style="padding: 12px; color: var(--text-secondary);">${code.used_by || '-'}</td>
                            <td style="padding: 12px; color: var(--text-secondary);">${formatDate(code.created_at)}</td>
                            <td style="padding: 12px; text-align: right;">
                                <button class="btn-icon" onclick="deleteCode(${code.id})" title="Delete"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; color: var(--text-muted); text-align: center;">Showing ${filtered.length} of ${codesData.length} codes</div>
    `;
}

function showGenerateCodesModal() {
    showModal('Generate Codes', `
        <form onsubmit="generateCodes(event)">
            <div class="form-group"><label>Subscription Plan</label><select name="plan_id" required id="genCodesPlanSelect"><option value="">Loading...</option></select></div>
            <div class="form-group"><label>Number of Codes</label><input type="number" name="count" value="10" min="1" max="1000" required></div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fas fa-magic"></i> Generate</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    loadPlansForDropdown('genCodesPlanSelect');
}

async function generateCodes(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        count: parseInt(formData.get('count')),
        plan_id: parseInt(formData.get('plan_id'))
    };
    try {
        const result = await apiRequest('/admin/codes/generate', { method: 'POST', body: JSON.stringify(data) });
        showToast(`Generated ${result.data.count} codes successfully`, 'success');
        closeModal();
        loadCodesData();
    } catch (error) {
        showToast(error.message || 'Failed to generate codes', 'error');
    }
}

async function deleteCode(codeId) {
    if (!confirm('Delete this code?')) return;
    try {
        await apiRequest(`/admin/codes/${codeId}`, { method: 'DELETE' });
        showToast('Code deleted successfully', 'success');
        loadCodesData();
    } catch (error) {
        showToast(error.message || 'Failed to delete code', 'error');
    }
}

// ============================================
// SUBSCRIPTION PLANS PAGE (Phase 3)
// ============================================

let plansData = [];

async function loadPlansPage() {
    const page = document.getElementById('page-plans');
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-box"></i> Subscription Plans</h3>
                <button class="btn btn-primary" onclick="showCreatePlanModal()">
                    <i class="fas fa-plus"></i> Add Plan
                </button>
            </div>
            <div class="card-body">
                <div id="plansTableContainer">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
                        <p style="margin-top: 12px;">Loading plans...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    await loadPlansData();
}

async function loadPlansData() {
    try {
        const response = await apiRequest('/admin/plans');
        
        // Normalize array from response
        if (Array.isArray(response.data)) {
            plansData = response.data;
        } else if (response.data && Array.isArray(response.data.plans)) {
            plansData = response.data.plans;
        } else if (Array.isArray(response)) {
            plansData = response;
        } else {
            plansData = [];
        }
        
        renderPlansTable();
    } catch (error) {
        console.error('Failed to load plans:', error);
    }
}

function renderPlansTable() {
    const container = document.getElementById('plansTableContainer');
    if (plansData.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-inbox" style="font-size: 32px;"></i><p style="margin-top: 12px;">No plans found</p></div>`;
        return;
    }
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 12px; text-align: left;">Plan Name</th>
                        <th style="padding: 12px; text-align: center;">Duration</th>
                        <th style="padding: 12px; text-align: center;">Price</th>
                        <th style="padding: 12px; text-align: center;">Max Devices</th>
                        <th style="padding: 12px; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${plansData.map(plan => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px; color: var(--text-primary);">
                                ${plan.name_en || 'N/A'}
                                ${plan.name_ar ? `<br><span style="color: var(--text-muted); font-size: 12px;">${plan.name_ar}</span>` : ''}
                            </td>
                            <td style="padding: 12px; text-align: center; color: var(--text-secondary);">${plan.duration_days || 0} days</td>
                            <td style="padding: 12px; text-align: center; color: var(--text-secondary);">$${plan.price || 0}</td>
                            <td style="padding: 12px; text-align: center; color: var(--text-secondary);">${plan.max_devices || 1}</td>
                            <td style="padding: 12px; text-align: right;">
                                <button class="btn-icon" onclick="editPlan(${plan.id})" title="Edit"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" onclick="deletePlan(${plan.id})" title="Delete"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showCreatePlanModal() {
    showModal('Add Plan', `
        <form onsubmit="createPlan(event)">
            <div class="form-group"><label>Plan Name (EN)</label><input type="text" name="name_en" required></div>
            <div class="form-group"><label>Plan Name (AR)</label><input type="text" name="name_ar"></div>
            <div class="form-group"><label>Duration (days)</label><input type="number" name="duration_days" value="30" min="1" required></div>
            <div class="form-group"><label>Price ($)</label><input type="number" name="price" value="9.99" step="0.01" min="0" required></div>
            <div class="form-group"><label>Max Devices</label><input type="number" name="max_devices" value="1" min="1" max="5" required></div>
            <div class="form-group"><label>Streaming Server</label><select name="server_id" required id="planServerSelect"><option value="">Loading servers...</option></select></div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fas fa-plus"></i> Add Plan</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    loadServersForDropdown('planServerSelect');
}

async function createPlan(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name_en: formData.get('name_en'),
        name_ar: formData.get('name_ar'),
        duration_days: parseInt(formData.get('duration_days')),
        price: parseFloat(formData.get('price')),
        max_devices: parseInt(formData.get('max_devices')),
        server_id: parseInt(formData.get('server_id'))
    };
    try {
        await apiRequest('/admin/plans', { method: 'POST', body: JSON.stringify(data) });
        showToast('Plan created successfully', 'success');
        closeModal();
        loadPlansData();
    } catch (error) {
        showToast(error.message || 'Failed to create plan', 'error');
    }
}

async function editPlan(planId) {
    try {
        const response = await apiRequest(`/admin/plans/${planId}`);
        const plan = response.data;
        showModal('Edit Plan', `
            <form onsubmit="updatePlan(event, ${planId})">
                <div class="form-group"><label>Plan Name (EN)</label><input type="text" name="name_en" value="${plan.name_en || ''}" required></div>
                <div class="form-group"><label>Plan Name (AR)</label><input type="text" name="name_ar" value="${plan.name_ar || ''}"></div>
                <div class="form-group"><label>Duration (days)</label><input type="number" name="duration_days" value="${plan.duration_days || 30}" min="1" required></div>
                <div class="form-group"><label>Price ($)</label><input type="number" name="price" value="${plan.price || 0}" step="0.01" min="0" required></div>
                <div class="form-group"><label>Max Devices</label><input type="number" name="max_devices" value="${plan.max_devices || 1}" min="1" max="5" required></div>
                <div class="form-group"><label>Streaming Server</label><select name="server_id" required id="editPlanServerSelect"><option value="">Loading servers...</option></select></div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fas fa-save"></i> Save</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        `);
        await loadServersForDropdown('editPlanServerSelect', plan.server_id);
    } catch (error) {
        showToast('Failed to load plan', 'error');
    }
}

async function updatePlan(event, planId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name_en: formData.get('name_en'),
        name_ar: formData.get('name_ar'),
        duration_days: parseInt(formData.get('duration_days')),
        price: parseFloat(formData.get('price')),
        max_devices: parseInt(formData.get('max_devices')),
        server_id: parseInt(formData.get('server_id'))
    };
    try {
        await apiRequest(`/admin/plans/${planId}`, { method: 'PUT', body: JSON.stringify(data) });
        showToast('Plan updated successfully', 'success');
        closeModal();
        loadPlansData();
    } catch (error) {
        showToast(error.message || 'Failed to update plan', 'error');
    }
}

async function deletePlan(planId) {
    if (!confirm('Delete this plan?')) return;
    try {
        await apiRequest(`/admin/plans/${planId}`, { method: 'DELETE' });
        showToast('Plan deleted successfully', 'success');
        loadPlansData();
    } catch (error) {
        showToast(error.message || 'Failed to delete plan', 'error');
    }
}

// ============================================
// PLAYER APPS COMPATIBILITY PAGE (Phase 4)
// ============================================

function loadAppsPage() {
    const page = document.getElementById('page-apps');
    const serverUrl = window.location.origin;
    
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-mobile-alt"></i> Player Apps Compatibility</h3>
            </div>
            <div class="card-body">
                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid var(--primary); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px;">
                    <h4 style="color: var(--primary); margin-bottom: 12px;"><i class="fas fa-info-circle"></i> System Compatibility</h4>
                    <p style="color: var(--text-secondary); margin-bottom: 12px;">
                        PrimeX IPTV is fully compatible with all major IPTV players using the Xtream Codes API protocol.
                        The system works on Android TV, Android Phones, Laptops, and Desktop computers.
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 16px;">
                        <div style="text-align: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                            <i class="fas fa-tv" style="font-size: 24px; color: var(--primary); margin-bottom: 8px;"></i>
                            <div style="font-size: 12px; color: var(--text-secondary);">Android TV</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                            <i class="fas fa-mobile-alt" style="font-size: 24px; color: var(--primary); margin-bottom: 8px;"></i>
                            <div style="font-size: 12px; color: var(--text-secondary);">Android Phone</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                            <i class="fas fa-laptop" style="font-size: 24px; color: var(--primary); margin-bottom: 8px;"></i>
                            <div style="font-size: 12px; color: var(--text-secondary);">Laptop</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                            <i class="fas fa-desktop" style="font-size: 24px; color: var(--primary); margin-bottom: 8px;"></i>
                            <div style="font-size: 12px; color: var(--text-secondary);">Desktop</div>
                        </div>
                    </div>
                </div>

                <!-- Server Connection Info -->
                <div class="card" style="margin-bottom: 24px;">
                    <div class="card-header">
                        <h4><i class="fas fa-server"></i> Server Connection Details</h4>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>Server URL</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="serverUrlInput" value="${serverUrl}" readonly style="flex: 1;">
                                <button class="btn btn-secondary" onclick="copyToClipboard('serverUrlInput')">
                                    <i class="fas fa-copy"></i> Copy
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Xtream API Endpoint</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="xtreamApiInput" value="${serverUrl}/player_api.php" readonly style="flex: 1;">
                                <button class="btn btn-secondary" onclick="copyToClipboard('xtreamApiInput')">
                                    <i class="fas fa-copy"></i> Copy
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>M3U Playlist URL</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="m3uUrlInput" value="${serverUrl}/get.php?username=USERNAME&password=PASSWORD&type=m3u_plus" readonly style="flex: 1;">
                                <button class="btn btn-secondary" onclick="copyToClipboard('m3uUrlInput')">
                                    <i class="fas fa-copy"></i> Copy
                                </button>
                            </div>
                            <small style="color: var(--text-muted); font-size: 12px;">Replace USERNAME and PASSWORD with actual user credentials</small>
                        </div>
                    </div>
                </div>

                <!-- Supported Players -->
                <h3 style="margin-bottom: 16px; color: var(--text-primary);"><i class="fas fa-check-circle"></i> Supported Players</h3>
                
                <!-- Moon Player -->
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer;" onclick="togglePlayerDetails('moon')">
                        <h4 style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                            <span><i class="fas fa-moon"></i> Moon Player</span>
                            <span class="badge" style="background: rgba(255,255,255,0.2);">Fully Compatible</span>
                        </h4>
                    </div>
                    <div id="moon-details" class="card-body" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            Moon Player is a premium IPTV player with excellent Xtream Codes support.
                        </p>
                        <h5 style="color: var(--text-primary); margin-bottom: 12px;">Setup Instructions:</h5>
                        <ol style="color: var(--text-secondary); line-height: 1.8;">
                            <li>Open Moon Player app</li>
                            <li>Go to Settings → Add Playlist</li>
                            <li>Select "Xtream Codes API"</li>
                            <li>Enter Server URL: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${serverUrl}</code></li>
                            <li>Enter Username and Password (from user account)</li>
                            <li>Click "Add" or "Connect"</li>
                            <li>Channels will load automatically</li>
                        </ol>
                        <div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--success); border-radius: var(--radius);">
                            <strong style="color: var(--success);">✓ Tested & Working</strong>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 14px;">
                                Live channels, VOD, and series fully supported
                            </p>
                        </div>
                    </div>
                </div>

                <!-- 4K Matic -->
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; cursor: pointer;" onclick="togglePlayerDetails('4kmatic')">
                        <h4 style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                            <span><i class="fas fa-film"></i> 4K Matic</span>
                            <span class="badge" style="background: rgba(255,255,255,0.2);">Fully Compatible</span>
                        </h4>
                    </div>
                    <div id="4kmatic-details" class="card-body" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            4K Matic is optimized for high-quality streaming with full Xtream Codes support.
                        </p>
                        <h5 style="color: var(--text-primary); margin-bottom: 12px;">Setup Instructions:</h5>
                        <ol style="color: var(--text-secondary); line-height: 1.8;">
                            <li>Launch 4K Matic app</li>
                            <li>Tap "Add New Playlist"</li>
                            <li>Choose "Xtream Codes Login"</li>
                            <li>Server: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${serverUrl}</code></li>
                            <li>Username: (user's username)</li>
                            <li>Password: (user's password)</li>
                            <li>Tap "Login"</li>
                            <li>Content loads automatically</li>
                        </ol>
                        <div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--success); border-radius: var(--radius);">
                            <strong style="color: var(--success);">✓ Tested & Working</strong>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 14px;">
                                4K streaming, EPG, and catch-up supported
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Smart IPTV -->
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; cursor: pointer;" onclick="togglePlayerDetails('smartiptv')">
                        <h4 style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                            <span><i class="fas fa-tv"></i> Smart IPTV</span>
                            <span class="badge" style="background: rgba(255,255,255,0.2);">Compatible</span>
                        </h4>
                    </div>
                    <div id="smartiptv-details" class="card-body" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            Smart IPTV is popular on Samsung and LG Smart TVs. Use M3U playlist method.
                        </p>
                        <h5 style="color: var(--text-primary); margin-bottom: 12px;">Setup Instructions:</h5>
                        <ol style="color: var(--text-secondary); line-height: 1.8;">
                            <li>Open Smart IPTV app on your TV</li>
                            <li>Note the MAC address shown</li>
                            <li>Visit siptv.app and add your MAC</li>
                            <li>Upload M3U playlist URL: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 11px;">${serverUrl}/get.php?username=USER&password=PASS&type=m3u_plus</code></li>
                            <li>Restart Smart IPTV app</li>
                            <li>Channels will appear</li>
                        </ol>
                    </div>
                </div>

                <!-- IPTV Smarters -->
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; cursor: pointer;" onclick="togglePlayerDetails('smarters')">
                        <h4 style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                            <span><i class="fas fa-play-circle"></i> IPTV Smarters Pro</span>
                            <span class="badge" style="background: rgba(255,255,255,0.2);">Compatible</span>
                        </h4>
                    </div>
                    <div id="smarters-details" class="card-body" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            IPTV Smarters Pro is one of the most popular IPTV players with full Xtream support.
                        </p>
                        <h5 style="color: var(--text-primary); margin-bottom: 12px;">Setup Instructions:</h5>
                        <ol style="color: var(--text-secondary); line-height: 1.8;">
                            <li>Open IPTV Smarters Pro</li>
                            <li>Select "Login with Xtream Codes API"</li>
                            <li>Server URL: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${serverUrl}</code></li>
                            <li>Username: (user credentials)</li>
                            <li>Password: (user credentials)</li>
                            <li>Tap "Add User"</li>
                            <li>All content loads automatically</li>
                        </ol>
                    </div>
                </div>

                <!-- TiviMate -->
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white; cursor: pointer;" onclick="togglePlayerDetails('tivimate')">
                        <h4 style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                            <span><i class="fas fa-broadcast-tower"></i> TiviMate</span>
                            <span class="badge" style="background: rgba(255,255,255,0.2);">Compatible</span>
                        </h4>
                    </div>
                    <div id="tivimate-details" class="card-body" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            TiviMate is a premium IPTV player for Android TV with excellent EPG support.
                        </p>
                        <h5 style="color: var(--text-primary); margin-bottom: 12px;">Setup Instructions:</h5>
                        <ol style="color: var(--text-secondary); line-height: 1.8;">
                            <li>Open TiviMate app</li>
                            <li>Go to Settings → Playlists</li>
                            <li>Click "Add Playlist"</li>
                            <li>Select "Xtream Codes"</li>
                            <li>Name: PrimeX IPTV</li>
                            <li>URL: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${serverUrl}</code></li>
                            <li>Username & Password: (user credentials)</li>
                            <li>Click "Next" to load channels</li>
                        </ol>
                    </div>
                </div>

                <!-- GSE Smart IPTV -->
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; cursor: pointer;" onclick="togglePlayerDetails('gse')">
                        <h4 style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                            <span><i class="fas fa-mobile-alt"></i> GSE Smart IPTV</span>
                            <span class="badge" style="background: rgba(0,0,0,0.1);">Compatible</span>
                        </h4>
                    </div>
                    <div id="gse-details" class="card-body" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            GSE Smart IPTV is popular on iOS and Android devices.
                        </p>
                        <h5 style="color: var(--text-primary); margin-bottom: 12px;">Setup Instructions:</h5>
                        <ol style="color: var(--text-secondary); line-height: 1.8;">
                            <li>Open GSE Smart IPTV</li>
                            <li>Tap "+" to add playlist</li>
                            <li>Select "Xtream Codes API"</li>
                            <li>Server: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${serverUrl}</code></li>
                            <li>Enter username and password</li>
                            <li>Tap "Add"</li>
                            <li>Channels load automatically</li>
                        </ol>
                    </div>
                </div>

                <!-- Perfect Player -->
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; cursor: pointer;" onclick="togglePlayerDetails('perfect')">
                        <h4 style="margin: 0; display: flex; align-items: center; justify-content: space-between;">
                            <span><i class="fas fa-star"></i> Perfect Player</span>
                            <span class="badge" style="background: rgba(0,0,0,0.1);">Compatible</span>
                        </h4>
                    </div>
                    <div id="perfect-details" class="card-body" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            Perfect Player is a feature-rich IPTV player for Android.
                        </p>
                        <h5 style="color: var(--text-primary); margin-bottom: 12px;">Setup Instructions:</h5>
                        <ol style="color: var(--text-secondary); line-height: 1.8;">
                            <li>Open Perfect Player</li>
                            <li>Go to Settings → General → Playlists</li>
                            <li>Click "Add playlist"</li>
                            <li>Name: PrimeX IPTV</li>
                            <li>Playlist URL: <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 11px;">${serverUrl}/get.php?username=USER&password=PASS&type=m3u_plus</code></li>
                            <li>Click "OK"</li>
                            <li>Restart app to load channels</li>
                        </ol>
                    </div>
                </div>

                <!-- API Testing -->
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-vial"></i> API Connection Testing</h4>
                    </div>
                    <div class="card-body">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            Test the Xtream Codes API connection with user credentials.
                        </p>
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="testUsername" placeholder="Enter username">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="testPassword" placeholder="Enter password">
                        </div>
                        <button class="btn btn-primary" onclick="testApiConnection()">
                            <i class="fas fa-plug"></i> Test Connection
                        </button>
                        <div id="testResult" style="margin-top: 16px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function togglePlayerDetails(playerId) {
    const details = document.getElementById(`${playerId}-details`);
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}

function copyToClipboard(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.select();
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    }
}

async function testApiConnection() {
    const username = document.getElementById('testUsername').value;
    const password = document.getElementById('testPassword').value;
    const resultDiv = document.getElementById('testResult');
    
    if (!username || !password) {
        resultDiv.innerHTML = `
            <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--danger); border-radius: var(--radius);">
                <strong style="color: var(--danger);">Error:</strong> Please enter both username and password
            </div>
        `;
        return;
    }
    
    resultDiv.innerHTML = `
        <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid var(--info); border-radius: var(--radius);">
            <i class="fas fa-spinner fa-spin"></i> Testing connection...
        </div>
    `;
    
    try {
        const response = await fetch(`/player_api.php?username=${username}&password=${password}`);
        const data = await response.json();
        
        if (data.user_info) {
            resultDiv.innerHTML = `
                <div style="padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--success); border-radius: var(--radius);">
                    <strong style="color: var(--success);"><i class="fas fa-check-circle"></i> Connection Successful!</strong>
                    <div style="margin-top: 8px; color: var(--text-secondary); font-size: 14px;">
                        <div>Username: ${data.user_info.username}</div>
                        <div>Status: ${data.user_info.status}</div>
                        <div>Expires: ${data.user_info.exp_date || 'N/A'}</div>
                        <div>Max Connections: ${data.user_info.max_connections || 1}</div>
                    </div>
                </div>
            `;
        } else {
            throw new Error('Invalid response');
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--danger); border-radius: var(--radius);">
                <strong style="color: var(--danger);"><i class="fas fa-times-circle"></i> Connection Failed</strong>
                <div style="margin-top: 8px; color: var(--text-secondary); font-size: 14px;">
                    Invalid credentials or user not found
                </div>
            </div>
        `;
    }
}

// ============================================
// SYSTEM SETTINGS PAGE (Phase 4)
// ============================================

async function loadOnlineUsersPage() {
    const page = document.getElementById('page-online-users');
    
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-circle" style="color: var(--success);"></i> Online Users</h3>
                <button class="btn btn-primary" onclick="loadOnlineUsersData()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
            <div class="card-body">
                <div id="onlineUsersContainer">
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--primary);"></i>
                        <p style="margin-top: 16px; color: var(--text-muted);">Loading online users...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadOnlineUsersData();
}

async function loadOnlineUsersData() {
    try {
        const response = await apiRequest('/admin/users/online/list');
        
        // Handle different response structures
        let users = [];
        if (response.data && response.data.users) {
            users = response.data.users;
        } else if (response.data && Array.isArray(response.data)) {
            users = response.data;
        } else if (response.users) {
            users = response.users;
        } else if (Array.isArray(response)) {
            users = response;
        }
        
        const container = document.getElementById('onlineUsersContainer');
        
        if (!Array.isArray(users) || users.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-user-slash" style="font-size: 48px; color: var(--text-muted); opacity: 0.5;"></i>
                    <p style="margin-top: 16px; color: var(--text-muted); font-size: 16px;">No users currently online</p>
                </div>
            `;
            return;
        }
        
        const usersHtml = users.map(user => `
            <div class="card" style="margin-bottom: 16px;">
                <div class="card-body" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--success); box-shadow: 0 0 10px var(--success);"></div>
                                <h4 style="margin: 0; color: var(--text-primary);">${user.username}</h4>
                                <span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 12px;">
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Email</div>
                                    <div style="color: var(--text-secondary);">${user.email || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Plan</div>
                                    <div style="color: var(--text-secondary);">${user.plan_name || 'No Plan'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Server</div>
                                    <div style="color: var(--text-secondary);">${user.server_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Active Devices</div>
                                    <div style="color: var(--text-secondary); font-weight: 600;">${user.active_devices || 0}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Last Activity</div>
                                    <div style="color: var(--text-secondary);">${user.last_activity ? formatDate(user.last_activity) : 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-left: 20px;">
                            <button class="btn btn-primary" onclick="viewUser(${user.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-danger" onclick="forceLogoutUser(${user.id})" title="Force Logout">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div style="margin-bottom: 20px; padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-users" style="font-size: 24px; color: var(--success);"></i>
                    <div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--success);">${users.length}</div>
                        <div style="font-size: 14px; color: var(--text-muted);">Users Currently Online</div>
                    </div>
                </div>
            </div>
            ${usersHtml}
        `;
    } catch (error) {
        console.error('Load online users error:', error);
        const container = document.getElementById('onlineUsersContainer');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--danger);"></i>
                <p style="margin-top: 16px; color: var(--text-muted);">Failed to load online users</p>
                <p style="margin-top: 8px; color: var(--text-muted); font-size: 14px;">${error.message || 'Unknown error'}</p>
                <button class="btn btn-primary" onclick="loadOnlineUsersData()" style="margin-top: 16px;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    }
}

async function loadSettingsPage() {
    const page = document.getElementById('page-settings');
    
    page.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-cog"></i> System Settings</h3>
            </div>
            <div class="card-body">
                <!-- System Information -->
                <div class="card" style="margin-bottom: 24px;">
                    <div class="card-header">
                        <h4><i class="fas fa-info-circle"></i> System Information</h4>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                            <div>
                                <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">System Name</div>
                                <div style="color: var(--text-primary); font-weight: 600;">PrimeX IPTV</div>
                            </div>
                            <div>
                                <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Version</div>
                                <div style="color: var(--text-primary); font-weight: 600;">11.0.0</div>
                            </div>
                            <div>
                                <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Environment</div>
                                <div style="color: var(--text-primary); font-weight: 600;">Production</div>
                            </div>
                            <div>
                                <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">Node.js Version</div>
                                <div style="color: var(--text-primary); font-weight: 600;" id="nodeVersion">Loading...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- API Configuration -->
                <div class="card" style="margin-bottom: 24px;">
                    <div class="card-header">
                        <h4><i class="fas fa-plug"></i> API Configuration</h4>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>API Base URL</label>
                            <input type="text" value="${window.location.origin}/api/v1" readonly>
                        </div>
                        <div class="form-group">
                            <label>Xtream API URL</label>
                            <input type="text" value="${window.location.origin}/player_api.php" readonly>
                        </div>
                        <div class="form-group">
                            <label>M3U Playlist URL</label>
                            <input type="text" value="${window.location.origin}/get.php" readonly>
                        </div>
                        <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid var(--info); border-radius: var(--radius); margin-top: 16px;">
                            <strong style="color: var(--info);">ℹ️ API Status:</strong>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 14px;">
                                All API endpoints are operational and accessible
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Security Settings -->
                <div class="card" style="margin-bottom: 24px;">
                    <div class="card-header">
                        <h4><i class="fas fa-shield-alt"></i> Security Settings</h4>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; gap: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                                <div>
                                    <div style="color: var(--text-primary); font-weight: 600;">JWT Authentication</div>
                                    <div style="color: var(--text-muted); font-size: 12px;">Token-based authentication enabled</div>
                                </div>
                                <span class="badge badge-success">Enabled</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                                <div>
                                    <div style="color: var(--text-primary); font-weight: 600;">Rate Limiting</div>
                                    <div style="color: var(--text-muted); font-size: 12px;">API request rate limiting active</div>
                                </div>
                                <span class="badge badge-success">Enabled</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                                <div>
                                    <div style="color: var(--text-primary); font-weight: 600;">Device Binding</div>
                                    <div style="color: var(--text-muted); font-size: 12px;">Limit users to specific devices</div>
                                </div>
                                <span class="badge badge-success">Enabled</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                                <div>
                                    <div style="color: var(--text-primary); font-weight: 600;">Password Encryption</div>
                                    <div style="color: var(--text-muted); font-size: 12px;">Bcrypt hashing with salt</div>
                                </div>
                                <span class="badge badge-success">Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Two-Factor Authentication -->
                <div class="card" style="margin-bottom: 24px;">
                    <div class="card-header">
                        <h4><i class="fas fa-mobile-alt"></i> Two-Factor Authentication (2FA)</h4>
                    </div>
                    <div class="card-body" id="twoFactorContainer">
                        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                            <i class="fas fa-spinner fa-spin"></i> Loading 2FA status...
                        </div>
                    </div>
                </div>

                <!-- Admin Sessions -->
                <div class="card" style="margin-bottom: 24px;">
                    <div class="card-header">
                        <h4><i class="fas fa-desktop"></i> Active Sessions</h4>
                        <button class="btn btn-secondary btn-sm" onclick="loadAdminSessions()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                    <div class="card-body" id="adminSessionsContainer">
                        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                            <i class="fas fa-spinner fa-spin"></i> Loading sessions...
                        </div>
                    </div>
                </div>

                <!-- System Health -->
                <div class="card">
                    <div class="card-header">
                        <h4><i class="fas fa-heartbeat"></i> System Health</h4>
                        <button class="btn btn-secondary btn-sm" onclick="loadSystemHealth()">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                    <div class="card-body" id="systemHealthContainer">
                        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                            <i class="fas fa-spinner fa-spin"></i> Loading system health...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await load2FAStatus();
    await loadAdminSessions();
    await loadSystemHealth();
}

async function loadSystemHealth() {
    try {
        const response = await apiRequest('/admin/dashboard/health');
        const health = response.data;
        
        const container = document.getElementById('systemHealthContainer');
        if (container) {
            container.innerHTML = `
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Database</div>
                            <div style="color: var(--text-muted); font-size: 12px;">MySQL connection status</div>
                        </div>
                        <span class="badge badge-${health.database === 'connected' ? 'success' : 'danger'}">
                            ${health.database === 'connected' ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">API Server</div>
                            <div style="color: var(--text-muted); font-size: 12px;">REST API status</div>
                        </div>
                        <span class="badge badge-success">Online</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Memory Usage</div>
                            <div style="color: var(--text-muted); font-size: 12px;">Heap memory consumption</div>
                        </div>
                        <span class="badge badge-info">
                            ${health.memory ? formatBytes(health.memory.heapUsed) : 'N/A'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius);">
                        <div>
                            <div style="color: var(--text-primary); font-weight: 600;">Uptime</div>
                            <div style="color: var(--text-muted); font-size: 12px;">Server running time</div>
                        </div>
                        <span class="badge badge-info">
                            ${health.uptime ? formatUptime(health.uptime) : 'N/A'}
                        </span>
                    </div>
                </div>
            `;
        }
        
        // Update Node version
        const nodeVersionEl = document.getElementById('nodeVersion');
        if (nodeVersionEl && health.nodeVersion) {
            nodeVersionEl.textContent = health.nodeVersion;
        }
    } catch (error) {
        console.error('Failed to load system health:', error);
    }
}

// ============================================
// REFRESH FUNCTION
// ============================================

function refreshCurrentPage() {
    const btn = event.target.closest('.btn-icon');
    btn.style.animation = 'spin 0.5s ease';
    setTimeout(() => btn.style.animation = '', 500);
    
    loadPageContent(currentPage);
    showToast('Data refreshed', 'success');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (authToken) {
        showDashboard();
        loadDashboardData();
    }
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        await login(username, password);
    });
    
    // Initialize navigation
    initNavigation();
    
    // Auto-refresh dashboard every 30 seconds
    setInterval(() => {
        if (currentPage === 'dashboard' && authToken) {
            loadDashboardData();
        }
    }, 30000);
});

// ============================================
// TWO-FACTOR AUTHENTICATION (2FA)
// ============================================

async function load2FAStatus() {
    try {
        const response = await apiRequest('/admin/2fa/status');
        const status = response.data;
        
        const container = document.getElementById('twoFactorContainer');
        if (!container) return;
        
        if (status.enabled) {
            container.innerHTML = `
                <div style="padding: 20px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: var(--radius); margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <i class="fas fa-check-circle" style="font-size: 24px; color: var(--success);"></i>
                        <div>
                            <div style="font-weight: 600; color: var(--success);">2FA is Enabled</div>
                            <div style="font-size: 12px; color: var(--text-muted);">Your account is protected with two-factor authentication</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 12px;">
                        <div>
                            <div style="font-size: 12px; color: var(--text-muted);">Enabled On</div>
                            <div style="color: var(--text-primary);">${formatDate(status.enabled_at)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-muted);">Backup Codes Remaining</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${status.remaining_backup_codes} / 10</div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-warning" onclick="regenerateBackupCodes()">
                        <i class="fas fa-sync"></i> Regenerate Backup Codes
                    </button>
                    <button class="btn btn-danger" onclick="disable2FA()">
                        <i class="fas fa-times-circle"></i> Disable 2FA
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="padding: 20px; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--warning); border-radius: var(--radius); margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 24px; color: var(--warning);"></i>
                        <div>
                            <div style="font-weight: 600; color: var(--warning);">2FA is Disabled</div>
                            <div style="font-size: 12px; color: var(--text-muted);">Enable two-factor authentication for enhanced security</div>
                        </div>
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                        Two-factor authentication adds an extra layer of security to your admin account. 
                        You'll need to enter a 6-digit code from your authenticator app when logging in.
                    </div>
                </div>
                <button class="btn btn-primary" onclick="setup2FA()">
                    <i class="fas fa-shield-alt"></i> Enable 2FA
                </button>
            `;
        }
    } catch (error) {
        console.error('Load 2FA status error:', error);
        const container = document.getElementById('twoFactorContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load 2FA status
                </div>
            `;
        }
    }
}

async function setup2FA() {
    try {
        const response = await apiRequest('/admin/2fa/generate', { method: 'POST' });
        const { secret, qrCode } = response.data;
        
        showModal('Enable Two-Factor Authentication', `
            <div style="text-align: center;">
                <p style="margin-bottom: 20px; color: var(--text-secondary);">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <img src="${qrCode}" alt="QR Code" style="max-width: 250px; margin: 0 auto 20px; display: block;">
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius); margin-bottom: 20px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Manual Entry Code:</div>
                    <div style="font-family: monospace; font-size: 14px; color: var(--text-primary); word-break: break-all;">${secret}</div>
                </div>
                <form onsubmit="verify2FASetup(event, '${secret}')">
                    <div class="form-group">
                        <label>Enter 6-digit code from your app:</label>
                        <input type="text" name="token" pattern="[0-9]{6}" maxlength="6" required autofocus style="text-align: center; font-size: 20px; letter-spacing: 8px;">
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-check"></i> Verify & Enable
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `, 'large');
    } catch (error) {
        showToast(error.message || 'Failed to generate 2FA setup', 'error');
    }
}

async function verify2FASetup(event, secret) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = formData.get('token');
    
    try {
        const response = await apiRequest('/admin/2fa/enable', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        
        const recoveryCodes = response.data.recoveryCodes;
        
        showModal('2FA Enabled Successfully!', `
            <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--success); margin-bottom: 16px;"></i>
                <h3 style="color: var(--success); margin-bottom: 20px;">Two-Factor Authentication Enabled</h3>
                
                <div style="padding: 20px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); border-radius: var(--radius); margin-bottom: 20px; text-align: left;">
                    <div style="font-weight: 600; color: var(--danger); margin-bottom: 12px;">
                        <i class="fas fa-exclamation-triangle"></i> Save Your Backup Codes
                    </div>
                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                        Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; background: var(--bg-primary); border-radius: var(--radius); font-family: monospace;">
                        ${recoveryCodes.map(code => `<div style="padding: 8px; background: var(--bg-secondary); border-radius: 4px; text-align: center;">${code}</div>`).join('')}
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="closeModal(); load2FAStatus(); localStorage.removeItem('adminToken'); window.location.reload();">
                    <i class="fas fa-sign-out-alt"></i> Logout & Login with 2FA
                </button>
            </div>
        `, 'large');
    } catch (error) {
        showToast(error.message || 'Failed to enable 2FA', 'error');
    }
}

async function disable2FA() {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;
    
    if (!confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
        return;
    }
    
    try {
        await apiRequest('/admin/2fa/disable', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        
        showToast('2FA disabled successfully', 'success');
        load2FAStatus();
    } catch (error) {
        showToast(error.message || 'Failed to disable 2FA', 'error');
    }
}

async function regenerateBackupCodes() {
    const password = prompt('Enter your password to regenerate backup codes:');
    if (!password) return;
    
    try {
        const response = await apiRequest('/admin/2fa/regenerate-backup-codes', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        
        const recoveryCodes = response.data.recoveryCodes;
        
        showModal('New Backup Codes Generated', `
            <div style="text-align: center;">
                <div style="padding: 20px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); border-radius: var(--radius); margin-bottom: 20px; text-align: left;">
                    <div style="font-weight: 600; color: var(--danger); margin-bottom: 12px;">
                        <i class="fas fa-exclamation-triangle"></i> Save Your New Backup Codes
                    </div>
                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                        Your old backup codes are now invalid. Save these new codes in a safe place.
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px; background: var(--bg-primary); border-radius: var(--radius); font-family: monospace;">
                        ${recoveryCodes.map(code => `<div style="padding: 8px; background: var(--bg-secondary); border-radius: 4px; text-align: center;">${code}</div>`).join('')}
                    </div>
                </div>
                <button class="btn btn-primary" onclick="closeModal(); load2FAStatus();">
                    <i class="fas fa-check"></i> Done
                </button>
            </div>
        `, 'large');
    } catch (error) {
        showToast(error.message || 'Failed to regenerate backup codes', 'error');
    }
}

// ============================================
// ADMIN SESSION MANAGEMENT
// ============================================

async function loadAdminSessions() {
    try {
        const response = await apiRequest('/admin/sessions/my');
        
        // Normalize array from response
        let sessions = [];
        if (response.data && Array.isArray(response.data.sessions)) {
            sessions = response.data.sessions;
        } else if (response.data && Array.isArray(response.data)) {
            sessions = response.data;
        } else if (Array.isArray(response.sessions)) {
            sessions = response.sessions;
        } else if (Array.isArray(response)) {
            sessions = response;
        }
        
        const container = document.getElementById('adminSessionsContainer');
        
        if (!container) return;
        
        if (!Array.isArray(sessions) || sessions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-desktop" style="font-size: 48px; opacity: 0.5;"></i>
                    <p style="margin-top: 16px;">No active sessions</p>
                </div>
            `;
            return;
        }
        
        const sessionsHtml = sessions.map(session => `
            <div class="card" style="margin-bottom: 12px;">
                <div class="card-body" style="padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <i class="fas fa-${session.device_info === 'Mobile' ? 'mobile-alt' : session.device_info === 'Tablet' ? 'tablet-alt' : 'desktop'}" style="font-size: 20px; color: var(--primary);"></i>
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary);">${session.browser} on ${session.os}</div>
                                    <div style="font-size: 12px; color: var(--text-muted);">${session.device_info}</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 8px; font-size: 13px;">
                                <div>
                                    <div style="color: var(--text-muted); font-size: 11px;">IP Address</div>
                                    <div style="color: var(--text-secondary);">${session.ip_address || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-muted); font-size: 11px;">Last Activity</div>
                                    <div style="color: var(--text-secondary);">${formatDate(session.last_activity)}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-muted); font-size: 11px;">Created</div>
                                    <div style="color: var(--text-secondary);">${formatDate(session.created_at)}</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="kickAdminSession(${session.id})" title="Logout this device">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div style="margin-bottom: 16px; padding: 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--primary); border-radius: var(--radius);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: var(--primary);">${sessions.length} Active Session${sessions.length !== 1 ? 's' : ''}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Manage your logged-in devices</div>
                    </div>
                    <button class="btn btn-warning btn-sm" onclick="logoutAllOtherSessions()">
                        <i class="fas fa-sign-out-alt"></i> Logout All Others
                    </button>
                </div>
            </div>
            ${sessionsHtml}
        `;
    } catch (error) {
        console.error('Load admin sessions error:', error);
        const container = document.getElementById('adminSessionsContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load sessions
                </div>
            `;
        }
    }
}

async function kickAdminSession(sessionId) {
    if (!confirm('Logout this device? You will need to login again on that device.')) {
        return;
    }
    
    try {
        await apiRequest(`/admin/sessions/${sessionId}`, { method: 'DELETE' });
        showToast('Device logged out successfully', 'success');
        loadAdminSessions();
    } catch (error) {
        showToast(error.message || 'Failed to logout device', 'error');
    }
}

async function logoutAllOtherSessions() {
    if (!confirm('Logout all other devices? You will remain logged in on this device.')) {
        return;
    }
    
    try {
        const response = await apiRequest('/admin/sessions/logout-all-others', { method: 'POST' });
        showToast(`Logged out ${response.data.deleted_count} other session(s)`, 'success');
        loadAdminSessions();
    } catch (error) {
        showToast(error.message || 'Failed to logout other sessions', 'error');
    }
}

// Add spin animation for refresh button
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
