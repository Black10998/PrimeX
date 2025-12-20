/**
 * PrimeX IPTV - Role-Based Access Control (RBAC) Middleware
 * 
 * Manages permissions for different admin roles
 * 
 * Developer: PAX
 * Support: info@paxdes.com
 */

const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// Define role permissions
const PERMISSIONS = {
    super_admin: {
        dashboard: true,
        users: true,
        subscriptions: true,
        codes: true,
        channels: true,
        categories: true,
        servers: true,
        plans: true,
        settings: true,
        security: true,
        notifications: true,
        api_settings: true,
        activity_logs: true,
        admin_management: true
    },
    admin: {
        dashboard: true,
        users: true,
        subscriptions: true,
        codes: true,
        channels: true,
        categories: true,
        servers: true,
        plans: true,
        settings: false,
        security: false,
        notifications: true,
        api_settings: false,
        activity_logs: true,
        admin_management: false
    },
    moderator: {
        dashboard: true,
        users: true,
        subscriptions: true,
        codes: false,
        channels: true,
        categories: true,
        servers: false,
        plans: false,
        settings: false,
        security: false,
        notifications: true,
        api_settings: false,
        activity_logs: false,
        admin_management: false
    },
    codes_seller: {
        dashboard: true,
        users: false,
        subscriptions: false,
        codes: true,
        channels: false,
        categories: false,
        servers: false,
        plans: false,
        settings: false,
        security: false,
        notifications: false,
        api_settings: false,
        activity_logs: false,
        admin_management: false
    }
};

// Module to permission mapping
const MODULE_PERMISSIONS = {
    'dashboard': 'dashboard',
    'users': 'users',
    'subscriptions': 'subscriptions',
    'codes': 'codes',
    'channels': 'channels',
    'categories': 'categories',
    'servers': 'servers',
    'plans': 'plans',
    'settings': 'settings',
    'security': 'security',
    'notifications': 'notifications',
    'api-settings': 'api_settings',
    'activity-logs': 'activity_logs',
    'admin-management': 'admin_management'
};

/**
 * Check if user has permission for a specific module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - Has permission
 */
function hasPermission(role, module) {
    const permissions = PERMISSIONS[role];
    if (!permissions) {
        return false;
    }

    const permissionKey = MODULE_PERMISSIONS[module] || module;
    return permissions[permissionKey] === true;
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Object} - Permissions object
 */
function getRolePermissions(role) {
    return PERMISSIONS[role] || {};
}

/**
 * Middleware to check module access
 * @param {string} module - Module name to check
 * @returns {Function} - Express middleware
 */
function checkModuleAccess(module) {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role || 'moderator';

            if (!hasPermission(userRole, module)) {
                logger.warn('Access denied', {
                    user_id: req.user?.userId,
                    role: userRole,
                    module: module
                });

                return res.status(403).json(
                    formatResponse(false, null, 'Access denied: Insufficient permissions')
                );
            }

            next();
        } catch (error) {
            logger.error('RBAC middleware error:', { error: error.message });
            return res.status(500).json(
                formatResponse(false, null, 'Permission check failed')
            );
        }
    };
}

/**
 * Middleware to check if user is super admin
 */
function requireSuperAdmin(req, res, next) {
    const userRole = req.user?.role || 'moderator';

    if (userRole !== 'super_admin') {
        logger.warn('Super admin access denied', {
            user_id: req.user?.userId,
            role: userRole
        });

        return res.status(403).json(
            formatResponse(false, null, 'Access denied: Super admin only')
        );
    }

    next();
}

/**
 * Middleware to attach permissions to request
 */
function attachPermissions(req, res, next) {
    const userRole = req.user?.role || 'moderator';
    req.permissions = getRolePermissions(userRole);
    next();
}

module.exports = {
    PERMISSIONS,
    hasPermission,
    getRolePermissions,
    checkModuleAccess,
    requireSuperAdmin,
    attachPermissions
};
